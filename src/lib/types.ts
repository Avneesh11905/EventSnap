// ─── Database Types ──────────────────────────────────────

export interface DbUser {
    id: string;
    full_name: string;
    username: string;
    email: string;
    image: string;
    provider: "google" | "github";
    role: "attendee" | "organizer";
    face_encoding: number[][] | null;
    has_encoding: boolean;
    created_at: string;
}

export interface DbEvent {
    id: string;
    name: string;
    code: string;
    description: string;
    date: string | null;
    status: "draft" | "active" | "archived";
    photo_count: number;
    total_size_mb: number;
    download_count: number;
    owner_id: string;
    created_at: string;
}

export interface DbEventAttendee {
    id: string;
    event_id: string;
    attendee_id: string;
    accessed_at: string;
    downloaded: boolean;
    downloaded_at: string | null;
}

// ─── Joined / Enriched Types ─────────────────────────────

export interface EventWithAttendees extends DbEvent {
    attendees: {
        id: string;
        name: string;
        email: string;
        downloaded: boolean;
        downloaded_at: string | null;
    }[];
}
