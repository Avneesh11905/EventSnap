import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { s3, BUCKET } from "@/lib/s3";
import { DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/attendee/events/[id] — Get cached matched photos for a specific event
export async function GET(
    _req: NextRequest,
    context: RouteContext
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ err: "Not authenticated" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const { id: eventId } = await context.params;

        if (!eventId) {
            return NextResponse.json({ err: "Event ID required" }, { status: 400 });
        }

        // Get event info
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { id: true, name: true, code: true, date: true, status: true, photo_count: true },
        });

        if (!event) {
            return NextResponse.json({ err: "Event not found" }, { status: 404 });
        }

        // Get cached sort results
        const access = await prisma.eventAttendee.findUnique({
            where: {
                event_id_attendee_id: {
                    event_id: eventId,
                    attendee_id: userId
                }
            },
            select: { matched_photos: true, match_count: true, accessed_at: true, downloaded: true },
        });

        if (!access) {
            return NextResponse.json({ err: "No access record found for this event" }, { status: 404 });
        }

        let rawPhotos = access.matched_photos || [];
        
        // Generate pre-signed URLs since bucket is private
        const signedPhotos = await Promise.all(
            rawPhotos.map(async (photo: any) => {
                try {
                    let key = photo.file_key || photo.path; // fallback for backwards compatibility
                    if (!key) return photo;

                    // Optimization: The Python backend returns paths to the 20MB raw images. 
                    // We must swap this to the compressed thumbnails so the grid loads instantly!
                    const thumbKey = key.replace("/raw/", "/thumbs/");

                    const command = new GetObjectCommand({
                        Bucket: BUCKET,
                        Key: thumbKey,
                    });
                    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
                    
                    // We can also generate a high-res url for the lightbox if we want, 
                    // but serving the thumb URL as the primary image URL fixes the loading issue.
                    const filename = key.split("/").pop() || key;
                    return { ...photo, filename, url: signedUrl, thumb_url: signedUrl };
                } catch (e) {
                    console.error("Failed to sign URL for photo:", e);
                    return photo; 
                }
            })
        );

        return NextResponse.json({
            success: true,
            event: {
                id: event.id,
                name: event.name,
                code: event.code,
                date: event.date,
                status: event.status,
                photoCount: event.photo_count,
            },
            matchCount: access.match_count || 0,
            photos: signedPhotos,
            accessedAt: access.accessed_at,
            downloaded: access.downloaded,
        });
    } catch (err: unknown) {
        console.error("Event detail error:", err);
        const message = err instanceof Error ? err.message : "Failed to fetch event";
        return NextResponse.json({ err: message }, { status: 500 });
    }
}

// DELETE /api/attendee/events/[id] — Remove event access record and personal ZIP
export async function DELETE(
    _req: NextRequest,
    context: RouteContext
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ err: "Not authenticated" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const { id: eventId } = await context.params;

        if (!eventId) {
            return NextResponse.json({ err: "Event ID required" }, { status: 400 });
        }

        // ─── MinIO Cleanup: Personal ZIP ───
        try {
            const zipKey = `zip/${eventId}/${userId}.zip`;
            await s3.send(new DeleteObjectCommand({
                Bucket: BUCKET,
                Key: zipKey,
            }));
        } catch (s3Err) {
            console.error("Attendee ZIP cleanup failed (likely missing):", s3Err);
            // Non-blocking
        }

        // ─── DB Cleanup: Remove access ───
        await prisma.eventAttendee.delete({
            where: {
                event_id_attendee_id: {
                    event_id: eventId,
                    attendee_id: userId
                }
            }
        });

        return NextResponse.json({ success: true, msg: "Event removed and ZIP deleted" });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to delete";
        return NextResponse.json({ err: message }, { status: 500 });
    }
}
