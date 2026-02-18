import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/attendee/events — List all events the current user has accessed
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ err: "Not authenticated" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        if (!userId) {
            return NextResponse.json({ err: "User not found" }, { status: 404 });
        }

        // Get all event_attendees records for this user, joined with event data
        const data = await prisma.eventAttendee.findMany({
            where: { attendee_id: userId },
            orderBy: { accessed_at: "desc" },
            include: {
                event: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        date: true,
                        status: true,
                        photo_count: true,
                    }
                }
            }
        });

        // Flatten the response
        const events = data.map(record => ({
            id: record.event.id,
            name: record.event.name,
            code: record.event.code,
            date: record.event.date,
            status: record.event.status,
            photoCount: record.event.photo_count,
            matchCount: record.match_count || 0,
            accessedAt: record.accessed_at,
            downloaded: record.downloaded,
            downloadedAt: record.downloaded_at,
        }));

        return NextResponse.json({ success: true, events });
    } catch (err: unknown) {
        console.error("Attendee events error:", err);
        const message = err instanceof Error ? err.message : "Failed to fetch events";
        return NextResponse.json({ err: message }, { status: 500 });
    }
}
