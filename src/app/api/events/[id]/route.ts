import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateEventSchema } from "@/lib/validations";
import { s3, BUCKET } from "@/lib/s3";
import { ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";

type RouteContext = { params: Promise<{ id: string }> };

// GET — Single event details
export async function GET(_request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ err: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json({ err: "User not found" }, { status: 404 });
        }

        const event = await prisma.event.findUnique({
            where: { id },
            include: {
                attendees: {
                    include: {
                        attendee: {
                            select: {
                                id: true,
                                full_name: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });

        if (!event) {
            return NextResponse.json({ err: "Event not found" }, { status: 404 });
        }

        if (event.owner_id !== user.id) {
            return NextResponse.json({ err: "Not authorized" }, { status: 403 });
        }

        const attendeesAccessed = event.attendees.map(ea => ({
            id: ea.attendee.id,
            name: ea.attendee.full_name || "Attendee",
            email: ea.attendee.email || "No email",
            downloaded: ea.downloaded,
            downloadedAt: ea.downloaded_at,
        }));

        const { attendees, ...eventData } = event;

        return NextResponse.json({
            event: { ...eventData, attendeesAccessed },
            success: true,
        });
    } catch (err: any) {
        return NextResponse.json({ err: err.message }, { status: 500 });
    }
}

// PUT — Update event
export async function PUT(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ err: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const validation = updateEventSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { err: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json({ err: "User not found" }, { status: 404 });
        }

        // Verify ownership
        const event = await prisma.event.findUnique({
            where: { id },
            select: { owner_id: true },
        });

        if (!event) {
            return NextResponse.json({ err: "Event not found" }, { status: 404 });
        }
        if (event.owner_id !== user.id) {
            return NextResponse.json({ err: "Not authorized" }, { status: 403 });
        }

        const updated = await prisma.event.update({
            where: { id },
            data: validation.data,
        });

        return NextResponse.json({
            event: updated,
            success: true,
            msg: "Event updated successfully",
        });
    } catch (err: any) {
        return NextResponse.json({ err: err.message }, { status: 500 });
    }
}

// PATCH — Partial update event (e.g., photo counts after S3 upload)
export async function PATCH(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ err: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { photo_count, total_size_mb } = body;

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json({ err: "User not found" }, { status: 404 });
        }

        const event = await prisma.event.findUnique({
            where: { id },
            select: { id: true, photo_count: true, total_size_mb: true, owner_id: true },
        });

        if (!event) {
            return NextResponse.json({ err: "Event not found" }, { status: 404 });
        }
        if (event.owner_id !== user.id) {
            return NextResponse.json({ err: "Not authorized" }, { status: 403 });
        }

        const newPhotoCount = (event.photo_count || 0) + (photo_count || 0);
        const newTotalSize = (event.total_size_mb || 0) + (total_size_mb || 0);

        await prisma.event.update({
            where: { id },
            data: {
                photo_count: newPhotoCount,
                total_size_mb: newTotalSize
            },
        });

        return NextResponse.json({
            success: true,
            photo_count: newPhotoCount,
            total_size_mb: newTotalSize
        });
    } catch (err: any) {
        return NextResponse.json({ err: err.message }, { status: 500 });
    }
}

// DELETE — Delete event
export async function DELETE(_request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ err: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json({ err: "User not found" }, { status: 404 });
        }

        const event = await prisma.event.findUnique({
            where: { id },
            select: { owner_id: true, code: true },
        });

        if (!event) {
            return NextResponse.json({ err: "Event not found" }, { status: 404 });
        }
        if (event.owner_id !== user.id) {
            return NextResponse.json({ err: "Not authorized" }, { status: 403 });
        }

        // Helper to delete all objects with a prefix
        async function deleteS3Folder(prefix: string) {
            let isTruncated = true;
            let continuationToken: string | undefined = undefined;

            while (isTruncated) {
                const listRes: any = await s3.send(new ListObjectsV2Command({
                    Bucket: BUCKET,
                    Prefix: prefix,
                    ContinuationToken: continuationToken,
                }));

                const objects = listRes.Contents;
                if (objects && objects.length > 0) {
                    await s3.send(new DeleteObjectsCommand({
                        Bucket: BUCKET,
                        Delete: {
                            Objects: objects.map((obj: any) => ({ Key: obj.Key })),
                            Quiet: true,
                        },
                    }));
                }

                isTruncated = !!listRes.IsTruncated;
                continuationToken = listRes.NextContinuationToken;
            }
        }

        // ─── MinIO Cleanup: Photos ───
        try {
            await deleteS3Folder(`${event.code}/`);
        } catch (s3Err) {
            console.error("Failed to cleanup Photos folder:", s3Err);
        }

        // ─── MinIO Cleanup: ZIPs ───
        try {
            await deleteS3Folder(`zips/${id}/`);
        } catch (s3Err) {
            console.error("Failed to cleanup ZIPs folder:", s3Err);
        }

        // ─── ML Backend Table Cleanup ───
        try {
            const modelUrl = process.env.NEXT_PUBLIC_MODEL_URL || 'http://localhost:8000';
            // Use standardized prefix /api/events/
            await fetch(`${modelUrl}/api/events/delete-event-table/${event.code}`, {
                method: "DELETE",
                headers: {
                    "X-API-Key": process.env.EVENTSNAP_API_KEY || ''
                }
            });
        } catch (mlErr) {
            console.error("Failed to cleanup ML database table:", mlErr);
        }

        // CASCADE will handle event_attendees cleanup
        await prisma.event.delete({
            where: { id },
        });

        return NextResponse.json({
            success: true,
            msg: "Event deleted successfully",
        });
    } catch (err: any) {
        return NextResponse.json({ err: err.message }, { status: 500 });
    }
}
