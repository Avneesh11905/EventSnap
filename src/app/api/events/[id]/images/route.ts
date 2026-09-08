import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { s3, BUCKET } from "@/lib/s3";
import { ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

async function verifyEventOwnership(id: string, session: any) {
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
    });

    if (!user) {
        throw new Error("User not found");
    }

    const event = await prisma.event.findUnique({
        where: { id },
        select: { id: true, owner_id: true, code: true },
    });

    if (!event) {
        throw new Error("Event not found");
    }

    if (event.owner_id !== user.id) {
        throw new Error("Forbidden");
    }

    return event;
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
        return NextResponse.json({ err: "Unauthorized" }, { status: 401 });
    }

    const cursor = req.nextUrl.searchParams.get("cursor");

    try {
        const event = await verifyEventOwnership(id, session);
        
        const prefix = `event/${event.code}/thumbs/`;

        const listRes = await s3.send(new ListObjectsV2Command({
            Bucket: BUCKET,
            Prefix: prefix,
            MaxKeys: 50,
            ContinuationToken: cursor || undefined,
        }));

        const pythonBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        let statusMap: { no_faces: string[], has_faces: string[] } = { no_faces: [], has_faces: [] };
        
        try {
            const statusRes = await fetch(`${pythonBackendUrl}/api/images/status/${event.code}`);
            if (statusRes.ok) {
                statusMap = await statusRes.json();
            }
        } catch (e) {
            console.error("Failed to fetch image status from Python backend:", e);
        }

        const noFacesSet = new Set(statusMap.no_faces);
        const hasFacesSet = new Set(statusMap.has_faces);

        const images = [];

        if (listRes.Contents) {
            const promises = listRes.Contents
                .filter(obj => obj.Key && obj.Key !== prefix && !obj.Key.includes("/.system/"))
                .map(async (obj) => {
                    const key = obj.Key!;
                    const rawKey = key.replace("/thumbs/", "/raw/");
                    
                    let status = "pending";
                    if (noFacesSet.has(rawKey)) {
                        status = "no_faces";
                    } else if (hasFacesSet.has(rawKey)) {
                        status = "has_faces";
                    }

                    const command = new GetObjectCommand({
                        Bucket: BUCKET,
                        Key: key,
                    });
                    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
                    
                    return {
                        key,
                        url,
                        status
                    };
                });
            
            const resolvedImages = await Promise.all(promises);
            images.push(...resolvedImages);
        }

        return NextResponse.json({
            images,
            nextCursor: listRes.IsTruncated ? listRes.NextContinuationToken : null
        });

    } catch (error: any) {
        if (error.message === "Forbidden") return NextResponse.json({ err: "Forbidden" }, { status: 403 });
        if (error.message === "Event not found") return NextResponse.json({ err: "Event not found" }, { status: 404 });
        if (error.message === "User not found") return NextResponse.json({ err: "User not found" }, { status: 404 });
        
        console.error("Gallery list failed:", error);
        return NextResponse.json({
            success: false,
            err: error.message || "Failed to retrieve images."
        }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
        return NextResponse.json({ err: "Unauthorized" }, { status: 401 });
    }

    try {
        const event = await verifyEventOwnership(id, session);
        
        const body = await req.json();
        const { keys } = body;
        
        if (!keys || !Array.isArray(keys) || keys.length === 0) {
            return NextResponse.json({ err: "No keys provided for deletion." }, { status: 400 });
        }

        const pythonBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        const deleteRes = await fetch(`${pythonBackendUrl}/api/images/delete-bulk`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                event_code: event.code,
                keys: keys
            })
        });

        if (!deleteRes.ok) {
            const err = await deleteRes.text();
            throw new Error(`Python backend failed: ${err}`);
        }

        const { task_id } = await deleteRes.json();

        return NextResponse.json({
            success: true,
            task_id
        });

    } catch (error: any) {
        if (error.message === "Forbidden") return NextResponse.json({ err: "Forbidden" }, { status: 403 });
        if (error.message === "Event not found") return NextResponse.json({ err: "Event not found" }, { status: 404 });
        if (error.message === "User not found") return NextResponse.json({ err: "User not found" }, { status: 404 });
        
        console.error("Bulk delete proxy failed:", error);
        return NextResponse.json({
            success: false,
            err: error.message || "Failed to initiate bulk deletion."
        }, { status: 500 });
    }
}
