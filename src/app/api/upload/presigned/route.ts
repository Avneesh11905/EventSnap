import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { s3, BUCKET } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ err: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { eventId, files } = body;

        if (!eventId || !files || !Array.isArray(files)) {
            return NextResponse.json({ err: "Missing eventId or valid files array" }, { status: 400 });
        }

        // Verify event ownership
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json({ err: "User not found" }, { status: 404 });
        }

        const event = await prisma.event.findFirst({
            where: { id: eventId, owner_id: user.id },
            select: { id: true, code: true },
        });

        if (!event) {
            return NextResponse.json({ err: "Event not found or unauthorized" }, { status: 404 });
        }

        // Generate pre-signed URLs
        const folderName = `event/${event.code}`;
        
        // Ensure consistent UUIDs across raw and thumbs for the same file
        const uuidMap = new Map<string, string>();

        const urls = await Promise.all(
            files.map(async (file: { name: string; type: string; folder?: string; size?: number }) => {
                // Strip any nested directory paths from the filename (e.g., "folder/image.jpg" -> "image.jpg")
                const basename = file.name.split("/").pop() || file.name;
                const folderPath = file.folder ? `${folderName}/${file.folder}` : folderName;
                
                // Generate a deterministic UUID based on eventId, basename, and size to ensure idempotency
                // This prevents duplicates if a user cancels an upload and retries it.
                if (!uuidMap.has(basename)) {
                    const hash = require('crypto').createHash('md5').update(`${eventId}-${basename}-${file.size || 0}`).digest('hex');
                    const deterministicUuid = `${hash.slice(0,8)}-${hash.slice(8,12)}-${hash.slice(12,16)}-${hash.slice(16,20)}-${hash.slice(20,32)}`;
                    uuidMap.set(basename, deterministicUuid);
                }
                const fileUuid = uuidMap.get(basename);

                // Prepend UUID to prevent overwrites
                const key = `${folderPath}/${fileUuid}-${basename}`;
                const command = new PutObjectCommand({
                    Bucket: BUCKET,
                    Key: key,
                    ContentType: file.type || "application/octet-stream",
                });

                // Allow up to 1 hour for the upload
                const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
                return { name: file.name, url, key };
            })
        );

        return NextResponse.json({ success: true, urls });
    } catch (error) {
        console.error("Presigned URL error:", error);
        return NextResponse.json({ err: "Failed to generate upload URLs" }, { status: 500 });
    }
}
