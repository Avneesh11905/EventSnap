import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createEventSchema } from "@/lib/validations";

// GET — List organizer's events (with attendee info)
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ err: "Unauthorized" }, { status: 401 });
        }

        // Get user ID
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json({ err: "User not found" }, { status: 404 });
        }

        // Get events
        const events = await prisma.event.findMany({
            where: { owner_id: user.id },
            orderBy: { created_at: "desc" },
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

        // Map Prisma nested structure to expected output format
        const enrichedEvents = events.map(event => {
            const attendeesAccessed = event.attendees.map(ea => ({
                id: ea.attendee.id,
                name: ea.attendee.full_name || "Attendee",
                email: ea.attendee.email || "No email",
                downloaded: ea.downloaded,
                downloaded_at: ea.downloaded_at,
            }));

            // Remove attendees relation from root object to match original payload
            const { attendees, ...eventData } = event;
            return { ...eventData, attendeesAccessed };
        });

        return NextResponse.json({ events: enrichedEvents, success: true });
    } catch (err: any) {
        return NextResponse.json({ err: err.message }, { status: 500 });
    }
}

// POST — Create a new event
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ err: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const validation = createEventSchema.safeParse(body);
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

        // Generate unique 6-char code
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let code = "";
        let codeExists = true;
        while (codeExists) {
            code = "";
            for (let i = 0; i < 6; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            const existing = await prisma.event.findUnique({
                where: { code },
                select: { id: true },
            });
            codeExists = !!existing;
        }

        const event = await prisma.event.create({
            data: {
                name: validation.data.name,
                description: validation.data.description || "",
                date: validation.data.date ? new Date(validation.data.date) : null,
                code,
                owner_id: user.id,
                status: "active",
            },
        });

        return NextResponse.json(
            { event, success: true, msg: "Event created successfully" },
            { status: 201 }
        );
    } catch (err: any) {
        return NextResponse.json({ err: err.message }, { status: 500 });
    }
}
