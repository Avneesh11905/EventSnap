import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { s3, BUCKET } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ err: "Unauthorized" }, { status: 401 });

        const userId = (session.user as any).id;
        const { searchParams } = new URL(req.url);
        const eventId = searchParams.get("eventId");

        if (!eventId) return NextResponse.json({ err: "Missing eventId" }, { status: 400 });

        // Check main_api
        const response = await fetch(`${process.env.NEXT_PUBLIC_MODEL_URL}/api/attendees/check-zip/${eventId}/${userId}`, {
            headers: { "X-API-Key": process.env.EVENTSNAP_API_KEY || "" }
        });

        const data = await response.json();

        if (data.exists) {
            // Generate presigned URL for existing ZIP
            const command = new GetObjectCommand({
                Bucket: BUCKET,
                Key: data.zip_path,
            });
            const downloadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
            return NextResponse.json({ exists: true, downloadUrl });
        }

        return NextResponse.json({ exists: false });
    } catch (err: any) {
        console.error("Check ZIP error:", err);
        return NextResponse.json({ err: err.message }, { status: 500 });
    }
}
