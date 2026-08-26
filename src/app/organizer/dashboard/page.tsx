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
import { apiClient } from "@/lib/axios";
import { useUpload } from "@/components/providers/UploadProvider";
import { DatePicker } from "@/components/DatePicker";

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
    const isOrganizer = session?.user?.role === "organizer";
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
            const res = await apiClient.get("/api/events");
            const data = res.data;
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

    const handleCreate = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newEvent.name.trim()) return;
        setCreating(true);
        setError("");
        try {
            const res = await apiClient.post("/api/events", newEvent);
            const data = res.data;
            if (data.success) {
                setEvents((prev) => [data.event, ...prev]);
                setShowModal(false);
                setNewEvent({ name: "", description: "", date: "" });
                router.push(`/organizer/events/${data.event.id}`);
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
            const res = await apiClient.delete(`/api/events/${id}`);
            const data = res.data;
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
                {/* Welcome + New Event + Inline Stats */}
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-10">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)] mb-2">
                            Dashboard
                        </h1>
                        <p className="text-[15px] text-[var(--foreground-secondary)]">Manage your events and track attendee engagement.</p>
                        
                        {/* Inline Metrics Row */}
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 mt-5 text-[13px]">
                            <div className="flex items-center gap-1.5 text-[var(--foreground-secondary)]">
                                <Calendar size={14} />
                                <span className="font-medium text-[var(--foreground)]">{events.length}</span> Events
                            </div>
                            <div className="hidden sm:block w-1 h-1 rounded-full bg-[var(--border)]"></div>
                            
                            <div className="flex items-center gap-1.5 text-[var(--foreground-secondary)]">
                                <ImageIcon size={14} />
                                <span className="font-medium text-[var(--foreground)]">{totalPhotos.toLocaleString()}</span> Photos
                            </div>
                            <div className="hidden sm:block w-1 h-1 rounded-full bg-[var(--border)]"></div>
                            
                            <div className="flex items-center gap-1.5 text-[var(--foreground-secondary)]">
                                <Users size={14} />
                                <span className="font-medium text-[var(--foreground)]">{totalAttendees.toLocaleString()}</span> Guests
                            </div>
                            <div className="hidden sm:block w-1 h-1 rounded-full bg-[var(--border)]"></div>
                            
                            <div className="flex items-center gap-1.5 text-[var(--foreground-secondary)]">
                                <Download size={14} />
                                <span className="font-medium text-[var(--foreground)]">{totalDownloads.toLocaleString()}</span> Saves
                            </div>
                            <div className="hidden sm:block w-1 h-1 rounded-full bg-[var(--border)]"></div>
                            
                            <div className="flex items-center gap-1.5 text-[var(--foreground-secondary)]">
                                <HardDrive size={14} />
                                <span className="font-medium text-[var(--foreground)]">{totalSizeMB.toFixed(1)} MB</span> Storage
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            onClick={async () => { setRefreshing(true); await fetchEvents(); setRefreshing(false); }}
                            className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--card-hover)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--border)] transition-colors shadow-sm"
                            title="Refresh data"
                        >
                            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                        </button>
                        <button
                            onClick={() => setShowModal(true)}
                            className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm"
                        >
                            <Plus size={16} /> New Event
                        </button>
                    </div>
                </div>

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
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                        {events.map((event) => (
                            <div key={event.id} className="glass-card rounded-xl overflow-hidden flex flex-col group card-hover text-sm">
                                <Link href={`/organizer/events/${event.id}`} className="block p-4 pb-3">
                                    <div className="flex items-start justify-between mb-1.5">
                                        <div className="flex-1 min-w-0 pr-3">
                                            <h3 className="text-[15px] font-semibold tracking-tight truncate text-[var(--foreground)]">{event.name}</h3>
                                            {event.description && (
                                                <p className="text-[12px] text-[var(--foreground-secondary)] mt-0.5 line-clamp-1 leading-relaxed">{event.description}</p>
                                            )}
                                        </div>
                                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-sm border ${statusColors[event.status]} shrink-0 uppercase tracking-wider`}>
                                            {event.status}
                                        </span>
                                    </div>
                                </Link>

                                <div className="px-4 flex-1">
                                    <button 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            copyCode(event.code);
                                        }}
                                        className="w-full flex items-center gap-2 mb-4 bg-[var(--card-hover)] hover:bg-[var(--card-hover)]/80 border border-[var(--border)] p-1 rounded-md transition-colors group/copy cursor-pointer"
                                        title="Click to copy event code"
                                    >
                                        <span className="font-mono text-[12px] font-medium text-[var(--foreground-secondary)] group-hover/copy:text-[var(--foreground)] transition-colors flex-1 text-center tracking-widest uppercase">
                                            {event.code}
                                        </span>
                                        <div
                                            className="w-6 h-6 flex items-center justify-center rounded bg-[var(--border)] group-hover/copy:bg-zinc-700 transition-colors shrink-0"
                                        >
                                            {copiedCode === event.code ? (
                                                <Check size={12} className="text-emerald-500" />
                                            ) : (
                                                <Copy size={12} className="text-[var(--foreground-secondary)] group-hover/copy:text-[var(--foreground)] transition-colors" />
                                            )}
                                        </div>
                                    </button>

                                    <div className="flex items-center justify-between py-2 mt-2 mb-4">
                                        <div className="text-center flex-1">
                                            <p className="text-[17px] font-semibold text-[var(--foreground)]">
                                                {uploadingEventId === event.id && (phase === "uploading" || phase === "encoding") && imageCount > 0 ? imageCount : (event.photo_count || 0)}
                                            </p>
                                            <p className="text-[10px] font-medium text-[var(--foreground-secondary)] uppercase tracking-wider mt-1">Photos</p>
                                        </div>
                                        <div className="w-[1px] h-8 bg-[var(--border)]"></div>
                                        <div className="text-center flex-1">
                                            <p className="text-[17px] font-semibold text-[var(--foreground)]">{event.attendeesAccessed?.length || 0}</p>
                                            <p className="text-[10px] font-medium text-[var(--foreground-secondary)] uppercase tracking-wider mt-1">Guests</p>
                                        </div>
                                        <div className="w-[1px] h-8 bg-[var(--border)]"></div>
                                        <div className="text-center flex-1">
                                            <p className="text-[17px] font-semibold text-[var(--foreground)]">{event.download_count || 0}</p>
                                            <p className="text-[10px] font-medium text-[var(--foreground-secondary)] uppercase tracking-wider mt-1">Saves</p>
                                        </div>
                                    </div>

                                    {/* Active Upload/Encoding Progress */}
                                    {uploadingEventId === event.id && (phase === "uploading" || phase === "encoding" || phase === "extracting") && (
                                        <div className="mt-3 p-2.5 rounded-lg bg-[var(--card-hover)] border border-[var(--border)] animate-fade-in">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2 text-[11px] font-medium text-[var(--foreground)]">
                                                    {phase === "uploading" ? (
                                                        <Loader2 size={12} className="animate-spin text-sky-400" />
                                                    ) : phase === "extracting" ? (
                                                        <Loader2 size={12} className="animate-spin text-amber-500" />
                                                    ) : (
                                                        <Cpu size={12} className="text-sky-400 animate-pulse" />
                                                    )}
                                                    <span className="truncate max-w-[120px]">{statusMessage}</span>
                                                </div>
                                                <span className="text-[10px] font-medium text-[var(--foreground-secondary)]">
                                                    {phase === "extracting" ? "..." : `${phase === "uploading" ? progress : encodeProgress}%`}
                                                </span>
                                            </div>
                                            <div className="h-1 bg-black/40 rounded-full overflow-hidden">
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
                                    <div className="border-t border-[var(--border)] mt-4">
                                        <button
                                            onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                                            className="w-full px-4 py-2 text-left text-[12px] font-medium text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors flex items-center justify-between"
                                        >
                                            <span className="flex items-center gap-1.5">
                                                <BarChart3 size={12} />
                                                Attendee Activity
                                            </span>
                                            <ArrowUpRight
                                                size={12}
                                                className={`transition-transform duration-200 ${expandedEvent === event.id ? "rotate-90" : ""}`}
                                            />
                                        </button>
                                        {expandedEvent === event.id && (
                                            <div className="px-4 pb-3 space-y-1.5">
                                                {event.attendeesAccessed.map((attendee: AttendeeAccess) => (
                                                    <div key={attendee.id} className="flex items-center justify-between text-[11px] py-1.5 px-2.5 rounded-md bg-[var(--card-hover)] border border-[var(--border)]">
                                                        <div>
                                                            <p className="font-medium text-[var(--foreground)]">{attendee.name}</p>
                                                        </div>
                                                        {attendee.downloaded_at ? (
                                                            <span className="text-emerald-500 flex items-center gap-1 font-medium">
                                                                <Download size={10} /> Saved
                                                            </span>
                                                        ) : (
                                                            <span className="text-[var(--foreground-secondary)] font-medium">Viewed</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Card Footer */}
                                <div className="bg-[var(--card-hover)]/30 border-t border-[var(--border)] px-4 py-2 flex items-center justify-between mt-auto">
                                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--foreground-secondary)]">
                                        <Calendar size={11} className="shrink-0" />
                                        <span className="leading-none pt-[1px]">
                                            {event.date
                                                ? new Date(event.date).toLocaleDateString()
                                                : new Date(event.created_at).toLocaleDateString()}
                                        </span>
                                        {event.total_size_mb > 0 && (
                                            <>
                                                <span className="w-1 h-1 rounded-full bg-[var(--border)] shrink-0 mx-0.5"></span>
                                                <span className="leading-none pt-[1px]">{event.total_size_mb.toFixed(1)} MB</span>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex items-center shrink-0">
                                        <button
                                            onClick={() => handleDelete(event.id)}
                                            className="p-1.5 rounded-md text-[var(--foreground-secondary)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                            title="Delete event"
                                        >
                                            <Trash2 size={13} />
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
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-semibold text-[var(--foreground)]">Create Event</h2>
                            <button onClick={() => setShowModal(false)} className="p-1.5 rounded-md hover:bg-[var(--card-hover)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="text-[13px] font-medium text-[var(--foreground-secondary)] mb-1.5 block">Event Name <span className="text-red-400">*</span></label>
                                <input
                                    type="text"
                                    value={newEvent.name}
                                    onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                                    placeholder="e.g. Tech Conference 2026"
                                    className="w-full bg-[var(--card-hover)] border border-[var(--border)] rounded-lg px-3.5 py-2.5 text-[var(--foreground)] text-sm placeholder-[var(--foreground-secondary)] focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/50 transition-colors"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="text-[13px] font-medium text-[var(--foreground-secondary)] mb-1.5 block">Description</label>
                                <textarea
                                    value={newEvent.description}
                                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                                    placeholder="Brief description of your event..."
                                    rows={3}
                                    className="w-full bg-[var(--card-hover)] border border-[var(--border)] rounded-lg px-3.5 py-2.5 text-[var(--foreground)] text-sm placeholder-[var(--foreground-secondary)] focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/50 transition-colors resize-none"
                                />
                            </div>
                            <DatePicker
                                label="Date"
                                value={newEvent.date}
                                onChange={date => setNewEvent({ ...newEvent, date })}
                            />

                            <div className="flex gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--border)] text-sm font-medium text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating || !newEvent.name.trim()}
                                    className="flex-1 px-4 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                    {creating ? "Creating..." : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
