import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { s3, BUCKET } from "@/lib/s3";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ err: "Unauthorized" }, { status: 401 });
    }

    try {
        // 1. Verify ownership and get event code
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json({ err: "User not found" }, { status: 404 });
        }

        const event = await prisma.event.findUnique({
            where: { id },
            select: { id: true, owner_id: true, code: true },
        });

        if (!event) {
            return NextResponse.json({ err: "Event not found" }, { status: 404 });
        }

        if (event.owner_id !== user.id) {
            return NextResponse.json({ err: "Forbidden" }, { status: 403 });
        }

        // 2. Scan MinIO for ground truth
        const prefix = `event/${event.code}/`;
        let totalCount = 0;
        let totalSizeBytes = 0;
        let isTruncated = true;
        let continuationToken: string | undefined = undefined;

        while (isTruncated) {
            const listRes: any = await s3.send(new ListObjectsV2Command({
                Bucket: BUCKET,
                Prefix: prefix,
                ContinuationToken: continuationToken,
            }));

            if (listRes.Contents) {
                const validPhotos = listRes.Contents.filter((obj: any) =>
                    obj.Key &&
                    !obj.Key.includes("/.system/") &&
                    obj.Key !== prefix
                );

                totalCount += validPhotos.length;
                totalSizeBytes += validPhotos.reduce((acc: number, obj: any) => acc + (obj.Size || 0), 0);
            }

            isTruncated = listRes.IsTruncated || false;
            continuationToken = listRes.NextContinuationToken;
        }

        const totalSizeMB = totalSizeBytes / (1024 * 1024);

        // 3. Update DB with the ground truth
        await prisma.event.update({
            where: { id },
            data: {
                photo_count: totalCount,
                total_size_mb: totalSizeMB
            },
        });

        return NextResponse.json({
            success: true,
            photo_count: totalCount,
            total_size_mb: totalSizeMB
        });

    } catch (error: any) {
        console.error("Reconciliation failed:", error);
        return NextResponse.json({
            success: false,
            err: error.message || "Failed to reconcile storage."
        }, { status: 500 });
    }
}
