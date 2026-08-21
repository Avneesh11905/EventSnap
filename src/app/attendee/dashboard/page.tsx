"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
    Camera,
    Loader2,
    X,
    Calendar,
    ImageIcon,
    ChevronRight,
    Search,
    CheckCircle,
    RefreshCw,
    ScanFace,
    Trash2,
    LogOut,
    User,
} from "lucide-react";
import { apiClient } from "@/lib/axios";

interface AttendedEvent {
    id: string;
    name: string;
    code: string;
    date: string | null;
    status: string;
    photoCount: number;
    matchCount: number;
    accessedAt: string;
    downloaded: boolean;
}

export default function AttendeeDashboard() {
    const { data: session, status: sessionStatus, update: updateSession } = useSession();
    const router = useRouter();
    const hasEncoding = session?.user?.hasEncoding ?? false;
    const isOrganizer = session?.user?.role === "organizer";

    const [events, setEvents] = useState<AttendedEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeletingEncoding, setIsDeletingEncoding] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [showScanModal, setShowScanModal] = useState(false);
    const [scanCode, setScanCode] = useState("");
    const [isScanning, setIsScanning] = useState(false);
    const [scanError, setScanError] = useState("");

    useEffect(() => {
        if (sessionStatus === "authenticated") {
            fetchEvents();
        }
    }, [sessionStatus]);

    const fetchEvents = async () => {
        try {
            const res = await apiClient.get("/api/attendee/events");
            const data = res.data;
            if (data.success) {
                setEvents(data.events || []);
            }
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    };

    const handleScanEvent = async () => {
        if (!scanCode || scanCode.length !== 6) return;
        setIsScanning(true);
        setScanError("");
        try {
            const res = await apiClient.post("/api/attendee/sort", { eventCode: scanCode.toUpperCase() });
            const data = res.data;
            if (data.matchesFound > 0 && data.eventId) {
                router.push("/attendee/events/" + data.eventId);
            } else {
                setScanError("No matching photos found for this event.");
            }
        } catch {
            setScanError("Network error during scan. Ensure code is valid.");
        } finally {
            setIsScanning(false);
        }
    };

    const handleClearEncoding = () => {
        router.push("/attendee/setup?rescan=true");
    };

    const handleDeleteEncoding = async () => {
        setIsDeletingEncoding(true);
        try {
            const res = await apiClient.delete("/api/attendee/encode");
            if (res.data.success) {
                await updateSession();
                setShowDeleteModal(false);
            }
        } catch (error) {
            console.error("Failed to delete encoding:", error);
        } finally {
            setIsDeletingEncoding(false);
        }
    };

    const handleDeleteEvent = async (eventId: string) => {
        if (confirmDeleteId !== eventId) {
            setConfirmDeleteId(eventId);
            return;
        }

        setDeletingId(eventId);
        try {
            const res = await apiClient.delete(`/api/attendee/events/${eventId}`);
            const data = res.data;
            if (data.success) {
                setEvents((prev) => prev.filter((e) => e.id !== eventId));
            }
        } catch {
            // silently fail
        } finally {
            setDeletingId(null);
            setConfirmDeleteId(null);
        }
    };

    if (sessionStatus === "loading") {
        return (
            <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-[var(--foreground)]/30" />
            </div>
        );
    }

    if (sessionStatus === "unauthenticated") {
        router.replace("/signin");
        return null;
    }

    return (
        <div className="px-4 py-8 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">My Photos</h1>
                    <p className="text-[var(--foreground-secondary)] text-[14px] mt-1">
                        Your events and matched photos
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {isOrganizer && (
                        <Link
                            href="/organizer/dashboard"
                            className="btn-ghost flex items-center gap-2 text-sm text-[var(--foreground-secondary)] hover:text-[var(--foreground)]"
                        >
                            <Calendar size={16} /> Organizer Dashboard
                        </Link>
                    )}
                    <button onClick={() => setShowScanModal(true)} className="btn-primary flex items-center gap-2 text-sm"><Search size={16} /> Scan Event</button>
                </div>
            </div>

            {/* User & Encoding Card */}
            <div className="glass-card rounded-xl p-6 mb-8 space-y-5">
                


                {/* Face encoding status */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-md flex items-center justify-center border ${hasEncoding ? "bg-emerald-500/10 border-emerald-500/20" : "bg-amber-500/10 border-amber-500/20"}`}>
                            {hasEncoding ? (
                                <CheckCircle size={18} className="text-emerald-500" />
                            ) : (
                                <ScanFace size={18} className="text-amber-500" />
                            )}
                        </div>
                        <div>
                            <p className="text-[15px] font-semibold tracking-tight text-[var(--foreground)]">
                                {hasEncoding ? "Face Scan Active" : "No Face Scan"}
                            </p>
                            <p className="text-[13px] text-[var(--foreground-secondary)]">
                                {hasEncoding
                                    ? "Your face data is ready for photo matching."
                                    : "Set up a face scan to find your photos."}
                            </p>
                        </div>
                    </div>
                    {hasEncoding ? (
                        <div className="flex gap-2">
                            <button
                                onClick={handleClearEncoding}
                                className="btn-ghost flex items-center gap-2"
                            >
                                <RefreshCw size={16} />
                                Re-scan
                            </button>
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="btn-ghost flex items-center gap-2 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ) : (
                        <Link href="/attendee/setup" className="btn-primary flex items-center gap-2">
                            <Camera size={16} /> Set Up
                        </Link>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between mb-5">
                <h2 className="text-[12px] font-bold text-[var(--foreground-secondary)] uppercase tracking-wider">
                    My Events
                </h2>
                <span className="text-[13px] font-medium text-[var(--foreground-secondary)]">{events.length} event{events.length !== 1 ? "s" : ""}</span>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 animate-pulse">
                    <div className="w-10 h-10 rounded-md bg-[var(--border)]" />
                </div>
            ) : events.length === 0 ? (
                <div className="glass-card rounded-xl p-12 text-center">
                    <div className="w-12 h-12 rounded-md bg-[var(--card-hover)] border border-[var(--border)] flex items-center justify-center mx-auto mb-6">
                        <Camera size={24} className="text-[var(--foreground-secondary)]" />
                    </div>
                    <p className="text-xl font-bold mb-2 text-[var(--foreground)]">No Events Yet</p>
                    <p className="text-[14px] text-[var(--foreground-secondary)] mb-6 max-w-sm mx-auto">
                        Enter an event code to find your photos instantly.
                    </p>
                    <button onClick={() => setShowScanModal(true)} className="btn-primary inline-flex items-center gap-2"><Search size={16} /> Scan Your First Event</button>
                </div>
            ) : (
                <div className="space-y-4">
                    {events.map((event) => (
                        <div
                            key={event.id}
                            className="glass-card rounded-xl overflow-hidden group"
                        >
                            <div className="flex items-stretch">
                                {/* Main content — navigates */}
                                <Link
                                    href={`/attendee/events/${event.id}`}
                                    className="flex-1 flex items-center gap-5 p-5 hover:bg-[var(--card-hover)] transition-colors cursor-pointer"
                                >
                                    <div className="w-12 h-12 rounded-md bg-[var(--card-hover)] border border-[var(--border)] flex items-center justify-center shrink-0">
                                        <ImageIcon size={20} className="text-[var(--foreground-secondary)]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[16px] font-semibold text-[var(--foreground)] truncate tracking-tight">
                                            {event.name}
                                        </p>
                                        <div className="flex items-center gap-4 mt-1.5">
                                            <span className="text-[11px] font-mono font-medium bg-[var(--card-hover)] border border-[var(--border)] px-2 py-0.5 rounded text-[var(--foreground-secondary)] tracking-wider">
                                                {event.code}
                                            </span>
                                            {event.date && (
                                                <span className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--foreground-secondary)]">
                                                    <Calendar size={12} />
                                                    {new Date(event.date).toLocaleDateString()}
                                                </span>
                                            )}
                                            <span className="text-[11px] font-medium text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-sm">
                                                {event.matchCount} match{event.matchCount !== 1 ? "es" : ""}
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronRight size={18} className="text-[var(--foreground-secondary)] group-hover:text-[var(--foreground-secondary)] transition-colors shrink-0 mr-2" />
                                </Link>

                                {/* Delete button */}
                                <button
                                    onClick={() => handleDeleteEvent(event.id)}
                                    disabled={deletingId === event.id}
                                    className={`shrink-0 w-16 border-l border-[var(--border)] transition-colors cursor-pointer flex items-center justify-center ${confirmDeleteId === event.id
                                        ? "bg-red-950 text-red-400"
                                        : "text-[var(--foreground-secondary)] hover:text-red-400 hover:bg-[var(--card-hover)]"
                                        }`}
                                    title={confirmDeleteId === event.id ? "Click again to confirm" : "Remove event"}
                                >
                                    {deletingId === event.id ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <Trash2 size={16} className={confirmDeleteId === event.id ? "animate-pulse" : ""} />
                                    )}
                                </button>
                            </div>

                            {/* Confirm banner */}
                            {confirmDeleteId === event.id && deletingId !== event.id && (
                                <div className="flex items-center justify-between px-4 py-2 bg-red-950 border-t border-red-900 text-xs">
                                    <span className="text-red-400">Remove this event and its cached photos?</span>
                                    <button
                                        onClick={() => setConfirmDeleteId(null)}
                                        className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] text-xs cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Delete Encoding Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="glass-card rounded-xl p-6 w-full max-w-sm shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                <Trash2 size={18} className="text-red-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-[var(--foreground)]">Delete Face Scan?</h3>
                        </div>
                        <p className="text-[14px] text-[var(--foreground-secondary)] mb-6">
                            This will permanently remove your face data from our systems. You will need to set up a new scan to find your photos in future events.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isDeletingEncoding}
                                className="btn-ghost flex-1 text-[var(--foreground-secondary)] hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteEncoding}
                                disabled={isDeletingEncoding}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold h-11 px-4 rounded-md flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                            >
                                {isDeletingEncoding ? (
                                    <><Loader2 size={16} className="animate-spin" /> Deleting...</>
                                ) : (
                                    "Yes, Delete"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Scan Event Modal */}
            {showScanModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="glass-card rounded-xl p-6 w-full max-w-sm shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-[var(--foreground)]">Scan Event</h3>
                            <button onClick={() => { setShowScanModal(false); setScanError(""); setScanCode(""); }} className="text-[var(--foreground-secondary)] hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-[14px] text-[var(--foreground-secondary)] mb-4">
                            Enter the 6-character event code to find your photos.
                        </p>
                        <input
                            type="text"
                            value={scanCode}
                            onChange={(e) => setScanCode(e.target.value.toUpperCase())}
                            placeholder="ENTER 6 CHARACTERS"
                            maxLength={6}
                            className="input-field text-center text-lg font-mono tracking-[0.2em] uppercase h-12 mb-4 placeholder:tracking-normal placeholder:font-sans w-full"
                        />
                        {scanError && (
                            <div className="bg-red-950 border border-red-900 rounded-md px-4 py-3 text-red-400 text-sm mb-4">
                                {scanError}
                            </div>
                        )}
                        <button
                            onClick={handleScanEvent}
                            disabled={scanCode.length !== 6 || isScanning}
                            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isScanning ? <><Loader2 size={16} className="animate-spin" /> Scanning...</> : <><Search size={16} /> Find My Photos</>}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
