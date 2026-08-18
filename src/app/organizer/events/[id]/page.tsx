"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import {
    ArrowLeft,
    Users,
    ImageIcon,
    HardDrive,
    Upload,
    Loader2,
    CheckCircle,
    X,
    Cpu,
    FolderUp
} from "lucide-react";
import { apiClient } from "@/lib/axios";
import Link from "next/link";
import { useUpload } from "@/components/providers/UploadProvider";

interface EventData {
    id: string;
    name: string;
    code: string;
    photo_count: number;
    total_size_mb: number;
    attendeesAccessed: any[];
}

export default function EventDetailsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const params = useParams();
    const eventId = params.id as string;

    const [event, setEvent] = useState<EventData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [files, setFiles] = useState<File[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const [encodedCount, setEncodedCount] = useState<number | null>(null);

    // Global Direct S3 Upload State
    const { isUploading, phase, progress, encodeProgress, statusMessage, startUpload, startEncodingPoll, uploadingEventId, imageCount, cancelUpload } = useUpload();

    const fetchEvent = useCallback(async () => {
        try {
            const res = await apiClient.get(`/api/events/${eventId}`);
            const data = res.data;
            if (data.success) {
                setEvent(data.event);

                // Also fetch encoding count in the same load cycle
                try {
                    const countRes = await apiClient.get(`/api/encode/count?eventId=${data.event.id}`);
                    const countData = countRes.data;
                    if (countData.success) setEncodedCount(countData.encoded_count);
                } catch { /* encoding count is optional */ }
            } else {
                setError(data.err || "Failed to load event");
            }
        } catch {
            setError("Failed to load event");
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    const reconcileStorage = useCallback(async () => {
        if (!eventId) return;
        try {
            const res = await apiClient.post(`/api/events/${eventId}/reconcile`);
            const data = res.data;
            if (data.success) {
                setEvent(prev => prev ? {
                    ...prev,
                    photo_count: data.photo_count,
                    total_size_mb: data.total_size_mb
                } : null);
            }
        } catch (err) {
            console.error("Auto-reconciliation failed", err);
        }
    }, [eventId]);

    // Re-fetch encoding count when encoding phase changes
    useEffect(() => {
        const isActiveUpload = uploadingEventId === event?.id && phase === "uploading";
        if (!event?.id || isActiveUpload) return;
        if (phase === "done") {
            apiClient.get(`/api/encode/count?eventId=${event.id}`)
                .then(res => res.data)
                .then(data => { if (data.success) setEncodedCount(data.encoded_count); })
                .catch(() => { });
        }
    }, [event?.id, phase]);

    useEffect(() => {
        if (session) {
            fetchEvent();
            reconcileStorage();
        }
    }, [session, fetchEvent, reconcileStorage]);

    // Poll Database every 10s while uploading to this event so stats update live
    useEffect(() => {
        if (!isUploading || uploadingEventId !== eventId) return;
        const interval = setInterval(() => {
            fetchEvent();
        }, 2000);
        return () => clearInterval(interval);
    }, [isUploading, uploadingEventId, eventId, fetchEvent]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            // Filter only true images matching our Python backend list
            const validFiles = Array.from(e.target.files).filter(f =>
                !f.name.startsWith("._") && !f.name.startsWith("__MACOSX") &&
                (f.type.startsWith("image/") || f.name.match(/\.(jpg|jpeg|png|webp|bmp|tiff)$/i))
            );
            setFiles(prev => [...prev, ...validFiles]);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const validFiles = Array.from(e.dataTransfer.files).filter(f =>
                !f.name.startsWith("._") && !f.name.startsWith("__MACOSX") &&
                (f.type.startsWith("image/") || f.name.match(/\.(jpg|jpeg|png|webp|bmp|tiff)$/i))
            );
            setFiles(prev => [...prev, ...validFiles]);
        }
    };

    // startS3Upload has been moved to UploadProvider so it persists globally

    const triggerBackendEncoding = async () => {
        if (!event) return;
        try {
            const res = await apiClient.post("/api/encode", { eventId: event.id });
            const data = res.data;

            if (data.success && data.task_id) {
                // Start tracking the Celery task in the global upload widget
                startEncodingPoll(data.task_id, event.id);
            } else {
                setError(data.err || "Failed to trigger encoding.");
            }
        } catch (e: any) {
            setError(e.message || "Failed to contact encoding server.");
        }
    };

    if (!session || loading) {
        return (
            <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center animate-pulse">
                <div className="w-16 h-16 rounded-2xl bg-white/5" />
            </div>
        );
    }

    if (error && !event) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-5 bg-[var(--background)]">
                <div className="max-w-sm w-full rounded-xl bg-[var(--card-hover)] border border-[var(--border)] p-8 text-center">
                    <p className="text-red-400 mb-6">{typeof error === 'string' ? error : JSON.stringify(error)}</p>
                    <Link href="/organizer/dashboard" className="btn-primary inline-flex">Go Back</Link>
                </div>
            </div>
        );
    }

    const photoCount = uploadingEventId === event?.id && (phase === "uploading" || phase === "encoding") && imageCount > 0
        ? imageCount
        : (event?.photo_count || 0);

    return (
        <div className="min-h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] bg-[var(--background)] relative pt-12 pb-6">
            <div className="relative max-w-5xl mx-auto px-6 h-full flex flex-col">
                {/* Back link */}
                <Link
                    href="/organizer/dashboard"
                    className="inline-flex items-center gap-1.5 text-[13px] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] mb-6 transition-colors w-fit font-medium"
                >
                    <ArrowLeft size={14} /> Back to Dashboard
                </Link>

                {error && (
                    <div className="bg-red-950 border border-red-900 rounded-md px-4 py-3 mb-4 text-red-400 text-sm flex items-center justify-between">
                        <span className="truncate mr-2">{typeof error === 'string' ? error : JSON.stringify(error)}</span>
                        <button onClick={() => setError("")} className="hover:text-red-300 transition shrink-0"><X size={14} /></button>
                    </div>
                )}

                {/* Header: Event info + Stats */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)] truncate">{event?.name}</h1>
                            <span className="shrink-0 font-mono text-[12px] font-medium bg-[var(--card-hover)] text-[var(--foreground-secondary)] px-2 py-1 rounded-md border border-[var(--border)] select-all tracking-wider" title="Click to copy event code">
                                {event?.code}
                            </span>
                        </div>
                        <p className="text-[14px] text-[var(--foreground-secondary)] truncate">Upload pipeline & face recognition</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {/* Stat pills */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                                { label: "Photos", value: photoCount.toLocaleString() },
                                { label: "Encoded", value: typeof encodedCount === 'number' ? encodedCount.toLocaleString() : "..." },
                                { label: "Attendees", value: event?.attendeesAccessed?.length || 0 },
                                { label: "Storage", value: `${(event?.total_size_mb || 0).toFixed(1)} MB` }
                            ].map((stat, i) => (
                                <div key={i} className="glass-card rounded-md px-4 py-2 text-center min-w-[80px]">
                                    <p className="text-[11px] uppercase tracking-wider text-[var(--foreground-secondary)] mb-0.5 font-medium">{stat.label}</p>
                                    <p className="text-[15px] font-semibold tabular-nums text-[var(--foreground)]">{stat.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Pipeline Cards */}
                <div className="grid md:grid-cols-2 gap-6 flex-1 min-h-0 pb-12">

                    {/* ── Card 1: Upload ── */}
                    <div className="glass-card rounded-xl p-6 flex flex-col relative overflow-hidden group">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-6 h-6 rounded-md bg-[var(--border)] flex items-center justify-center text-[11px] font-bold text-[var(--foreground-secondary)]">1</div>
                            <h2 className="text-[16px] font-semibold tracking-tight text-[var(--foreground)]">Upload Photos</h2>
                        </div>
                        <p className="text-[13px] text-[var(--foreground-secondary)] mb-5 ml-9">Drop photos from your hard drive to cloud storage</p>

                        {/* Dropzone */}
                        <div
                            onDragEnter={handleDrag}
                            onDragOver={handleDrag}
                            onDragLeave={handleDrag}
                            onDrop={handleDrop}
                            className={`flex-1 rounded-md flex flex-col items-center justify-center text-center transition-all duration-300 border border-dashed ${(phase === "uploading" && uploadingEventId === event?.id) ? "border-sky-500 bg-sky-950/20"
                                : (phase === "encoding" && uploadingEventId === event?.id) ? "opacity-40 border-[var(--border)] bg-[var(--card-hover)]/50"
                                    : dragActive ? "border-sky-500 bg-[var(--card-hover)] scale-[1.01]"
                                        : files.length ? "border-sky-500 bg-[var(--card-hover)] cursor-pointer"
                                            : "border-[var(--border)] bg-[var(--card-hover)]/50 hover:border-zinc-500 hover:bg-[var(--card-hover)] cursor-pointer"
                                }`}
                            onClick={() => phase !== "uploading" && phase !== "encoding" && document.getElementById("folderInput")?.click()}
                        >
                            <input
                                id="folderInput"
                                type="file"
                                multiple
                                accept="image/jpeg, image/png, image/webp"
                                // @ts-ignore
                                webkitdirectory="true"
                                directory="true"
                                className="hidden"
                                onChange={handleFileChange}
                            />

                            {phase === "uploading" && uploadingEventId === event?.id ? (
                                <div className="w-full px-6 space-y-5">
                                    <div className="flex justify-between items-end">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xl font-bold tabular-nums text-[var(--foreground)]">{progress}</span>
                                            <span className="text-[11px] font-bold text-[var(--foreground-secondary)] uppercase tracking-widest">%</span>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); cancelUpload(); }}
                                            className="px-2 py-1 rounded-md bg-red-950 hover:bg-red-900 text-red-400 text-[10px] font-medium uppercase tracking-wider transition-colors border border-red-900"
                                        >
                                            Cancel Upload
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-sky-500 rounded-full transition-all duration-500 ease-out"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-center gap-1.5">
                                            <span className="relative flex h-1.5 w-1.5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-sky-500"></span>
                                            </span>
                                        <p className="text-[11px] text-[var(--foreground-secondary)] font-medium tracking-tight truncate max-w-[200px]">
                                                {statusMessage}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : !files.length ? (
                                <div className="space-y-2 text-center">
                                    <div className="w-10 h-10 rounded-md bg-[var(--border)] flex items-center justify-center mx-auto mb-2">
                                        <FolderUp size={18} className="text-[var(--foreground-secondary)]" />
                                    </div>
                                    <p className="text-[13px] font-medium text-[var(--foreground-secondary)]">
                                        {dragActive ? "Drop here" : "Select folder"}
                                    </p>
                                    <p className="text-[11px] text-[var(--foreground-secondary)]">or drag & drop images • JPG, PNG, WebP</p>
                                </div>
                            ) : (
                                <div className="space-y-2 text-center">
                                    <div className="w-10 h-10 rounded-md bg-[var(--border)] flex items-center justify-center mx-auto mb-2">
                                        <ImageIcon size={18} className="text-[var(--foreground-secondary)]" />
                                    </div>
                                    <p className="text-[13px] font-medium text-[var(--foreground)]">{files.length.toLocaleString()} images queued</p>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setFiles([]); }}
                                        className="text-[11px] text-[var(--foreground-secondary)] hover:text-red-400 transition"
                                    >
                                        Clear
                                    </button>
                                </div>
                            )}
                        </div>

                        {files.length > 0 && phase !== "uploading" && phase !== "encoding" && (
                            <button
                                onClick={() => startUpload(files, event!)}
                                className="mt-4 w-full btn-premium py-2.5 justify-center"
                            >
                                <Upload size={14} className="text-[var(--foreground)]/60" />
                                <span>Start Upload</span>
                            </button>
                        )}
                    </div>

                    {/* ── Card 2: AI Encoding ── */}
                    <div className="glass-card rounded-xl p-6 flex flex-col relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-6 h-6 rounded-md bg-[var(--border)] flex items-center justify-center text-[11px] font-bold text-[var(--foreground-secondary)]">2</div>
                            <h2 className="text-[16px] font-semibold tracking-tight text-[var(--foreground)]">AI Face Recognition</h2>
                        </div>
                        <p className="text-[13px] text-[var(--foreground-secondary)] mb-5 ml-9">Analyze uploaded photos with GPU-powered face detection</p>

                        <div className="flex-1 rounded-md bg-[var(--card-hover)] border border-[var(--border)] flex flex-col items-center justify-center p-6">
                            {phase === "encoding" && uploadingEventId === event?.id ? (
                                <div className="w-full space-y-4">
                                    <div className="w-12 h-12 rounded-md bg-[var(--border)] flex items-center justify-center mx-auto relative">
                                        <Cpu size={20} className="text-[var(--foreground-secondary)] animate-pulse" />
                                        <div className="absolute inset-0 rounded-md border border-dashed border-sky-500/50 animate-[spin_3s_linear_infinite]" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[13px] font-medium text-[var(--foreground)]">Processing</p>
                                        <p className="text-[11px] text-[var(--foreground-secondary)] mt-0.5">{statusMessage}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-[11px]">
                                            <span className="text-[var(--foreground-secondary)]">Encoding</span>
                                            <span className="text-[var(--foreground-secondary)] tabular-nums">{encodeProgress}%</span>
                                        </div>
                                        <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                                            <div className="h-full bg-sky-500 rounded-full transition-all duration-500" style={{ width: `${encodeProgress}%` }} />
                                        </div>
                                    </div>
                                </div>
                            ) : (event?.photo_count || 0) === 0 || (uploadingEventId === event?.id && phase === "uploading") ? (
                                <div className="text-center space-y-2">
                                    <div className="w-10 h-10 rounded-md bg-[var(--border)] flex items-center justify-center mx-auto">
                                        <Cpu size={18} className="text-[var(--foreground-secondary)]" />
                                    </div>
                                    <p className="text-[13px] text-[var(--foreground-secondary)]">
                                        {uploadingEventId === event?.id && phase === "uploading" ? "Upload in progress..." : "Upload photos first"}
                                    </p>
                                </div>
                            ) : typeof encodedCount === 'number' && encodedCount >= (event?.photo_count || 0) && (event?.photo_count || 0) > 0 ? (
                                <div className="text-center space-y-2">
                                    <div className="w-10 h-10 rounded-md bg-[var(--border)] flex items-center justify-center mx-auto">
                                        <CheckCircle size={18} className="text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-medium text-[var(--foreground)]">All {encodedCount.toLocaleString()} images encoded</p>
                                        <p className="text-[11px] text-[var(--foreground-secondary)] mt-0.5">Face recognition ready</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center w-full space-y-4">
                                    <div className="w-10 h-10 rounded-md bg-[var(--border)] flex items-center justify-center mx-auto relative">
                                        <Cpu size={18} className="text-[var(--foreground-secondary)]" />
                                    </div>
                                    {typeof encodedCount === 'number' && encodedCount > 0 && (
                                        <p className="text-[11px] text-[var(--foreground-secondary)]">{encodedCount}/{event?.photo_count || 0} encoded</p>
                                    )}
                                    <button
                                        onClick={triggerBackendEncoding}
                                        className="w-full btn-premium justify-center"
                                    >
                                        <Cpu size={14} className="text-[var(--foreground-secondary)]" />
                                        <span>Start Recognition</span>
                                    </button>
                                    <p className="text-[10px] text-[var(--foreground-secondary)]">~1 min per 500 photos</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

