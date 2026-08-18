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
        const prefix = `event/${event.code.endsWith('/') ? event.code : event.code + '/'}`;
        const rawPrefix = `${prefix}raw/`;
        
        let totalSizeBytes = 0;
        let isTruncated = true;
        let continuationToken: string | undefined = undefined;

        // Track unique photos based on basename + size
        const uniqueRawFiles = new Map<string, Set<number>>();

        while (isTruncated) {
            const listRes: any = await s3.send(new ListObjectsV2Command({
                Bucket: BUCKET,
                Prefix: prefix,
                ContinuationToken: continuationToken,
            }));

            if (listRes.Contents) {
                for (const obj of listRes.Contents) {
                    if (!obj.Key || obj.Key.includes("/.system/") || obj.Key === prefix) continue;

                    // All files contribute to total storage size
                    totalSizeBytes += (obj.Size || 0);

                    // Only count raw files for photo_count
                    if (obj.Key.startsWith(rawPrefix) && obj.Key !== rawPrefix) {
                        const basename = obj.Key.substring(rawPrefix.length);
                        // Strip UUID if it exists to get the original filename
                        const originalBasename = basename.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i, '');
                        
                        if (!uniqueRawFiles.has(originalBasename)) {
                            uniqueRawFiles.set(originalBasename, new Set());
                        }
                        uniqueRawFiles.get(originalBasename)!.add(obj.Size || 0);
                    }
                }
            }

            isTruncated = listRes.IsTruncated || false;
            continuationToken = listRes.NextContinuationToken;
        }

        // Calculate true total count based on unique (basename + size) combinations
        let totalCount = 0;
        for (const sizes of uniqueRawFiles.values()) {
            totalCount += sizes.size;
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
