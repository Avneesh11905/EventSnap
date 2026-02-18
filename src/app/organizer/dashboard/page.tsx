"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
    Plus,
    Calendar,
    Users,
    ImageIcon,
    Copy,
    Check,
    Trash2,
    Upload,
    Loader2,
    HardDrive,
    Download,
    BarChart3,
    ArrowUpRight,
    X,
    LogOut,
    Home,
    Cpu,
    RefreshCw,
} from "lucide-react";
import { useUpload } from "@/components/providers/UploadProvider";

interface AttendeeAccess {
    id: string;
    name: string;
    email: string;
    downloaded_at?: string;
}

interface EventData {
    id: string;
    name: string;
    code: string;
    description?: string;
    date?: string;
    status: "draft" | "active" | "archived";
    photo_count: number;
    total_size_mb: number;
    download_count: number;
    attendeesAccessed: AttendeeAccess[];
    created_at: string;
}

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const isOrganizer = (session?.user as any)?.role === "organizer";
    const [events, setEvents] = useState<EventData[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [creating, setCreating] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
    const [newEvent, setNewEvent] = useState({ name: "", description: "", date: "" });
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [error, setError] = useState("");

    const {
        isUploading,
        phase,
        progress,
        encodeProgress,
        statusMessage,
        imageCount,
        uploadingEventId,
    } = useUpload();

    const fetchEvents = async () => {
        try {
            const res = await fetch("/api/events");
            const data = await res.json();
            if (data.success) setEvents(data.events);
        } catch {
            setError("Failed to load events");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (status === "authenticated" && !isOrganizer) {
            router.replace("/attendee/sort");
            return;
        }
        if (status === "authenticated") {
            fetchEvents();
        }
    }, [status, isOrganizer]);

    // Re-fetch events when a background upload finishes to update photo counts
    useEffect(() => {
        if (phase === "done") {
            fetchEvents();
        }
    }, [phase]);

    // Poll Database every 10s while an upload is active so dashboard numbers update live
    useEffect(() => {
        if (!isUploading) return;
        const interval = setInterval(() => {
            fetchEvents();
        }, 2000);
        return () => clearInterval(interval);
    }, [isUploading]);

    const handleCreate = async () => {
        if (!newEvent.name.trim()) return;
        setCreating(true);
        setError("");
        try {
            const res = await fetch("/api/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newEvent),
            });
            const data = await res.json();
            if (data.success) {
                setEvents((prev) => [data.event, ...prev]);
                setShowModal(false);
                setNewEvent({ name: "", description: "", date: "" });
            } else {
                setError(data.err);
            }
        } catch {
            setError("Failed to create event");
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this event? This cannot be undone.")) return;
        try {
            const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                setEvents((prev) => prev.filter((e) => e.id !== id));
            }
        } catch {
            setError("Failed to delete event");
        }
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    // Dynamic total photo count calculation
    const totalPhotos = events.reduce((sum, e) => {
        // If this specific event is actively uploading, use the live counter instead of the stale DB value
        if (uploadingEventId === e.id && (phase === "uploading" || phase === "encoding") && imageCount > 0) {
            return sum + imageCount;
        }
        return sum + (e.photo_count || 0);
    }, 0);

    const totalAttendees = events.reduce((sum, e) => sum + (e.attendeesAccessed?.length || 0), 0);
    const totalDownloads = events.reduce((sum, e) => sum + (e.download_count || 0), 0);
    const totalSizeMB = events.reduce((sum, e) => sum + (e.total_size_mb || 0), 0);

    const statusColors: Record<string, string> = {
        active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        draft: "bg-[var(--border)] text-[var(--foreground-secondary)] border-[var(--border)]",
        archived: "bg-[var(--card-hover)] text-[var(--foreground-secondary)] border-[var(--border)]",
    };

    if (!session || loading) {
        return (
            <div className="py-8">
                <div className="max-w-6xl mx-auto px-6 animate-pulse">
                    {/* Welcome header skeleton */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                        <div className="space-y-3">
                            <div className="h-7 w-56 bg-[var(--border)] rounded-md" />
                            <div className="h-4 w-72 bg-[var(--card-hover)] rounded-md" />
                        </div>
                        <div className="h-10 w-32 bg-[var(--border)] rounded-md" />
                    </div>

                    {/* Stats row skeleton */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="glass-card rounded-xl p-6 space-y-4">
                                <div className="h-6 w-6 bg-[var(--border)] rounded-md" />
                                <div className="h-8 w-16 bg-[var(--border)] rounded-md" />
                            </div>
                        ))}
                    </div>

                    {/* Event cards skeleton */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="glass-card rounded-xl p-6 space-y-4">
                                <div className="h-5 w-32 bg-[var(--border)] rounded-md" />
                                <div className="h-4 w-20 bg-[var(--card-hover)] rounded-md" />
                                <div className="h-24 bg-[var(--card-hover)] rounded-md mt-4" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="py-6">

            <div className="max-w-6xl mx-auto px-6">
                {/* Welcome + New Event */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
                            Dashboard
                        </h1>
                        <p className="text-[var(--foreground-secondary)] text-[14px] mt-1">Manage your events and track attendee engagement</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={async () => { setRefreshing(true); await fetchEvents(); setRefreshing(false); }}
                            className="p-2 rounded-md border border-[var(--border)] bg-[var(--card-hover)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--border)] transition-colors"
                            title="Refresh data"
                        >
                            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                        </button>
                        <button
                            onClick={() => setShowModal(true)}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Plus size={16} />
                            New Event
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: "Total Events", value: events.length, icon: Calendar },
                        { label: "Total Photos", value: totalPhotos, icon: ImageIcon },
                        { label: "Total Attendees", value: totalAttendees, icon: Users },
                        { label: "Total Downloads", value: totalDownloads, icon: Download },
                    ].map((stat) => (
                        <div key={stat.label} className="glass-card rounded-xl p-6 relative overflow-hidden">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-10 h-10 rounded-md bg-[var(--card-hover)] border border-[var(--border)] flex items-center justify-center">
                                    <stat.icon size={18} className="text-[var(--foreground-secondary)]" />
                                </div>
                            </div>
                            <p className="text-3xl font-bold tracking-tight mb-1 text-[var(--foreground)]">{stat.value}</p>
                            <span className="text-[13px] font-medium text-[var(--foreground-secondary)]">{stat.label}</span>
                        </div>
                    ))}
                </div>

                {/* Storage */}
                {totalSizeMB > 0 && (
                    <div className="glass-card rounded-md p-3 mb-6 flex items-center gap-3 text-sm text-[var(--foreground-secondary)]">
                        <div className="w-6 h-6 rounded-md bg-[var(--card-hover)] border border-[var(--border)] flex items-center justify-center">
                            <HardDrive size={14} className="text-[var(--foreground-secondary)]" />
                        </div>
                        <div>
                            Storage: <span className="text-[var(--foreground)] font-medium">{totalSizeMB.toFixed(1)} MB</span> used across {events.length} events
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="bg-red-950 border border-red-900 rounded-md px-4 py-3 mb-6 text-red-400 text-sm flex items-center justify-between">
                        {error}
                        <button onClick={() => setError("")}><X size={16} /></button>
                    </div>
                )}

                {/* Events */}
                {events.length === 0 ? (
                    <div className="glass-card rounded-xl p-12 text-center flex flex-col items-center justify-center min-h-[250px]">
                        <div className="w-12 h-12 rounded-md bg-[var(--card-hover)] border border-[var(--border)] flex items-center justify-center mb-6">
                            <Calendar size={24} className="text-[var(--foreground-secondary)]" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2 text-[var(--foreground)]">No events yet</h3>
                        <p className="text-[var(--foreground-secondary)] mb-6 text-[14px]">
                            Create your first event to start uploading and sharing photos.
                        </p>
                        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
                            <Plus size={16} /> Create Event
                        </button>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {events.map((event) => (
                            <div key={event.id} className="glass-card rounded-xl overflow-hidden flex flex-col group card-hover">
                                <Link href={`/organizer/events/${event.id}`} className="block p-5 pb-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1 min-w-0 pr-4">
                                            <h3 className="text-[16px] font-semibold tracking-tight truncate text-[var(--foreground)]">{event.name}</h3>
                                            {event.description && (
                                                <p className="text-[13px] text-[var(--foreground-secondary)] mt-1 line-clamp-2 leading-relaxed">{event.description}</p>
                                            )}
                                        </div>
                                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-sm border ${statusColors[event.status]} shrink-0 uppercase tracking-wider`}>
                                            {event.status}
                                        </span>
                                    </div>
                                </Link>

                                <div className="px-5 flex-1">
                                    <div className="flex items-center gap-2 mb-5 bg-[var(--card-hover)] border border-[var(--border)] p-1.5 rounded-md">
                                        <span className="font-mono text-[13px] font-medium text-[var(--foreground-secondary)] flex-1 text-center tracking-widest uppercase">
                                            {event.code}
                                        </span>
                                        <button
                                            onClick={() => copyCode(event.code)}
                                            className="w-7 h-7 flex items-center justify-center rounded bg-[var(--border)] hover:bg-zinc-700 transition-colors"
                                            title="Copy event code"
                                        >
                                            {copiedCode === event.code ? (
                                                <Check size={14} className="text-emerald-500" />
                                            ) : (
                                                <Copy size={14} className="text-[var(--foreground-secondary)]" />
                                            )}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-[var(--card-hover)] border border-[var(--border)] rounded-md p-3 text-center">
                                            <p className="text-[18px] font-semibold text-[var(--foreground)]">
                                                {uploadingEventId === event.id && (phase === "uploading" || phase === "encoding") && imageCount > 0 ? imageCount : (event.photo_count || 0)}
                                            </p>
                                            <p className="text-[11px] font-medium text-[var(--foreground-secondary)] uppercase tracking-wider mt-0.5">Photos</p>
                                        </div>
                                        <div className="bg-[var(--card-hover)] border border-[var(--border)] rounded-md p-3 text-center">
                                            <p className="text-[18px] font-semibold text-[var(--foreground)]">{event.attendeesAccessed?.length || 0}</p>
                                            <p className="text-[11px] font-medium text-[var(--foreground-secondary)] uppercase tracking-wider mt-0.5">Guests</p>
                                        </div>
                                        <div className="bg-[var(--card-hover)] border border-[var(--border)] rounded-md p-3 text-center">
                                            <p className="text-[18px] font-semibold text-[var(--foreground)]">{event.download_count || 0}</p>
                                            <p className="text-[11px] font-medium text-[var(--foreground-secondary)] uppercase tracking-wider mt-0.5">Saves</p>
                                        </div>
                                    </div>

                                    {/* Active Upload/Encoding Progress */}
                                    {uploadingEventId === event.id && (phase === "uploading" || phase === "encoding" || phase === "extracting") && (
                                        <div className="mt-4 p-3 rounded-xl bg-black/20 border border-white/5 animate-fade-in">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2 text-xs font-medium text-[var(--foreground)]/70">
                                                    {phase === "uploading" ? (
                                                        <Loader2 size={14} className="animate-spin text-sky-400" />
                                                    ) : phase === "extracting" ? (
                                                        <Loader2 size={14} className="animate-spin text-amber-500" />
                                                    ) : (
                                                        <Cpu size={14} className="text-sky-400 animate-pulse" />
                                                    )}
                                                    <span className="truncate max-w-[150px]">{statusMessage}</span>
                                                </div>
                                                <span className="text-xs text-[var(--foreground)]/50">
                                                    {phase === "extracting" ? "..." : `${phase === "uploading" ? progress : encodeProgress}%`}
                                                </span>
                                            </div>
                                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-300 ${phase === "uploading" ? "bg-sky-500" :
                                                        phase === "extracting" ? "bg-amber-500 w-full animate-[pulse_2s_ease-in-out_infinite]" :
                                                            "bg-gradient-to-r from-sky-500 to-blue-500"
                                                        }`}
                                                    style={{ width: phase === "extracting" ? "100%" : `${phase === "uploading" ? progress : encodeProgress}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Attendee Accordion */}
                                {event.attendeesAccessed?.length > 0 && (
                                    <div className="border-t border-[var(--border)] mt-5">
                                        <button
                                            onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                                            className="w-full px-5 py-3 text-left text-sm text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors flex items-center justify-between"
                                        >
                                            <span className="flex items-center gap-2">
                                                <BarChart3 size={14} />
                                                Attendee Activity
                                            </span>
                                            <ArrowUpRight
                                                size={14}
                                                className={`transition-transform duration-200 ${expandedEvent === event.id ? "rotate-90" : ""}`}
                                            />
                                        </button>
                                        {expandedEvent === event.id && (
                                            <div className="px-5 pb-4 space-y-2">
                                                {event.attendeesAccessed.map((attendee: AttendeeAccess) => (
                                                    <div key={attendee.id} className="flex items-center justify-between text-[13px] py-1.5 px-3 rounded-md bg-[var(--card-hover)] border border-[var(--border)]">
                                                        <div>
                                                            <p className="font-medium text-[var(--foreground)]">{attendee.name}</p>
                                                            <p className="text-[11px] text-[var(--foreground-secondary)]">{attendee.email}</p>
                                                        </div>
                                                        {attendee.downloaded_at ? (
                                                            <span className="text-[11px] text-emerald-500 flex items-center gap-1">
                                                                <Download size={12} /> Downloaded
                                                            </span>
                                                        ) : (
                                                            <span className="text-[11px] text-[var(--foreground-secondary)]">Viewed</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Card Footer */}
                                <div className="border-t border-[var(--border)] px-5 py-3 flex items-center justify-between mt-auto">
                                    <div className="flex items-center gap-2 text-xs text-[var(--foreground-secondary)]">
                                        <Calendar size={12} />
                                        {event.date
                                            ? new Date(event.date).toLocaleDateString()
                                            : new Date(event.created_at).toLocaleDateString()}
                                        {event.total_size_mb > 0 && (
                                            <span className="ml-2">· {event.total_size_mb.toFixed(1)} MB</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 z-10 relative">
                                        <button
                                            onClick={() => handleDelete(event.id)}
                                            className="p-1.5 rounded-md text-[var(--foreground-secondary)] hover:text-red-400 hover:bg-[var(--card-hover)] transition-colors"
                                            title="Delete event"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Event Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative w-full max-w-md glass-card rounded-xl p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-[var(--foreground)]">Create Event</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 rounded-md hover:bg-[var(--card-hover)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[13px] font-medium text-[var(--foreground-secondary)] mb-1.5 block">Event Name *</label>
                                <input
                                    type="text"
                                    value={newEvent.name}
                                    onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                                    placeholder="e.g. Tech Conference 2026"
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="text-[13px] font-medium text-[var(--foreground-secondary)] mb-1.5 block">Description</label>
                                <textarea
                                    value={newEvent.description}
                                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                                    placeholder="Brief description of your event..."
                                    rows={3}
                                    className="input-field resize-none"
                                />
                            </div>
                            <div>
                                <label className="text-[13px] font-medium text-[var(--foreground-secondary)] mb-1.5 block">Date</label>
                                <input
                                    type="date"
                                    value={newEvent.date}
                                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                                    className="input-field"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button onClick={() => setShowModal(false)} className="btn-ghost flex-1">
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={creating || !newEvent.name.trim()}
                                className="btn-primary flex-1 flex items-center justify-center gap-2"
                            >
                                {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                {creating ? "Creating..." : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
