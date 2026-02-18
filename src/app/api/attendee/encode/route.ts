import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const MAIN_API_URL = process.env.NEXT_PUBLIC_MODEL_URL || "http://localhost:8000";
const API_KEY = process.env.EVENTSNAP_API_KEY || "";

// POST /api/attendee/encode — Send 3 face images to backend, store encodings
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ err: "Not authenticated" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        if (!userId) {
            return NextResponse.json({ err: "User not found" }, { status: 404 });
        }

        const body = await req.json();
        const { images } = body as { images?: string[] };

        if (!images || images.length !== 3) {
            return NextResponse.json(
                { err: "Must provide exactly 3 face images" },
                { status: 400 }
            );
        }

        // Call backend encode-attendee endpoint
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        if (API_KEY) {
            headers["X-API-Key"] = API_KEY;
        }

        const encodeRes = await fetch(`${MAIN_API_URL}/api/attendees/encode-attendee/`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                attendee_images_base64: images,
            }),
        });

        if (!encodeRes.ok) {
            const errData = await encodeRes.json().catch(() => ({}));
            return NextResponse.json(
                { err: errData.detail || "Face encoding failed" },
                { status: encodeRes.status }
            );
        }

        const encodeData = await encodeRes.json();
        const encodings = encodeData.encodings as number[][];

        if (!encodings || encodings.length === 0) {
            return NextResponse.json(
                { err: "No face encodings could be generated" },
                { status: 400 }
            );
        }

        // Store encodings in users table
        await prisma.user.update({
            where: { id: userId },
            data: { face_encoding: encodings, has_encoding: true },
        });

        return NextResponse.json({
            success: true,
            encodingCount: encodings.length,
            message: `Generated ${encodings.length} face encodings from 3 reference images`,
        });
    } catch (err: unknown) {
        console.error("Encode error:", err);
        const message = err instanceof Error ? err.message : "Encoding failed";
        return NextResponse.json({ err: message }, { status: 500 });
    }
}

// DELETE /api/attendee/encode — Clear face encoding
export async function DELETE() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ err: "Not authenticated" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        if (!userId) {
            return NextResponse.json({ err: "User not found" }, { status: 404 });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { face_encoding: Prisma.DbNull, has_encoding: false },
        });

        return NextResponse.json({ success: true, message: "Face encoding cleared" });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to clear encoding";
        return NextResponse.json({ err: message }, { status: 500 });
    }
}
