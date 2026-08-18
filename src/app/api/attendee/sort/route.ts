import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureBucketExists } from "@/lib/s3";

export const dynamic = "force-dynamic";

const MAIN_API_URL = process.env.NEXT_PUBLIC_INFERENCE_API_URL || "http://localhost:8000";

const STORAGE_ENDPOINT = process.env.STORAGE_ENDPOINT || "";
const STORAGE_BUCKET = process.env.STORAGE_BUCKET_NAME || "";

// POST /api/attendee/sort — Sort photos, cache results in event_attendees
export async function POST(req: NextRequest) {
    try {
        await ensureBucketExists();

        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ err: "Not authenticated" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        if (!userId) {
            return NextResponse.json({ err: "User not found" }, { status: 404 });
        }

        const body = await req.json();
        const { eventCode } = body as { eventCode?: string };

        if (!eventCode || eventCode.length !== 6) {
            return NextResponse.json(
                { err: "Event code must be 6 characters" },
                { status: 400 }
            );
        }

        // Fetch stored encodings from users table
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { face_encoding: true },
        });

        if (!user || !user.face_encoding) {
            return NextResponse.json(
                { err: "No face encoding found. Please complete face scan first." },
                { status: 400 }
            );
        }

        // Verify event exists and is active
        const event = await prisma.event.findUnique({
            where: { code: eventCode.toUpperCase() },
            select: { id: true, code: true, name: true, status: true },
        });

        if (!event) {
            return NextResponse.json({ err: "Invalid event code" }, { status: 404 });
        }

        if (event.status !== "active") {
            return NextResponse.json({ err: "This event is no longer active" }, { status: 400 });
        }

        // Call main_api sort-attendee
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };

        const sortRes = await fetch(`${MAIN_API_URL}/api/attendees/sort-attendee/`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                event_code: eventCode.toUpperCase(),
                attendee_encodings: user.face_encoding,
            }),
        });

        if (!sortRes.ok) {
            const errData = await sortRes.json().catch(() => ({}));
            return NextResponse.json(
                { err: errData.detail || "Sort failed" },
                { status: sortRes.status }
            );
        }

        const data = await sortRes.json();

        // Transform STORAGE paths to full URLs
        const photos = (data.photos || []).map((path: string) => ({
            url: `${STORAGE_ENDPOINT}/${STORAGE_BUCKET}/${path}`,
            filename: path.split("/").pop() || path,
            path,
        }));

        const matchCount = data.matches_found || 0;

        // Prisma has a known bug in this version where passing an Array to a Jsonb column 
        // causes "incorrect binary data format". Using raw SQL explicitly bypasses Prisma's 
        // buggy Rust parser and allows Postgres to safely cast the string to JSONB.
        const serializedPhotos = JSON.stringify(photos);

        await prisma.$executeRaw`
            INSERT INTO "event_attendees" ("id", "event_id", "attendee_id", "matched_photos", "match_count", "accessed_at")
            VALUES (${crypto.randomUUID()}, ${event.id}, ${userId}, ${serializedPhotos}::jsonb, ${matchCount}, NOW())
            ON CONFLICT ("event_id", "attendee_id") 
            DO UPDATE SET 
                "matched_photos" = ${serializedPhotos}::jsonb, 
                "match_count" = ${matchCount}, 
                "accessed_at" = NOW()
        `;

        return NextResponse.json({
            success: true,
            eventId: event.id,
            eventName: event.name,
            matchesFound: matchCount,
            photos,
        });
    } catch (err: unknown) {
        console.error("Sort error:", err);
        const message = err instanceof Error ? err.message : "Sort failed";
        return NextResponse.json({ err: message }, { status: 500 });
    }
}
