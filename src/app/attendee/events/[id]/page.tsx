"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import {
    Loader2,
    Download,
    ArrowLeft,
    Calendar,
    ImageIcon,
    CheckCircle,
    X,
    ScanFace,
} from "lucide-react";

interface Photo {
    url: string;
    filename: string;
    path: string;
}

interface EventData {
    id: string;
    name: string;
    code: string;
    date: string | null;
    status: string;
    photoCount: number;
}

export default function AttendeeEventDetail() {
    const { data: session, status: sessionStatus } = useSession();
    const router = useRouter();
    const params = useParams();
    const eventId = params.id as string;

    const [event, setEvent] = useState<EventData | null>(null);
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [matchCount, setMatchCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [zipStatus, setZipStatus] = useState<'idle' | 'checking' | 'missing' | 'generating' | 'ready'>('idle');
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [downloadProgress, setDownloadProgress] = useState("");
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (sessionStatus === "authenticated" && eventId) {
            fetchEventDetail();
            checkExistingZip();
        }
    }, [sessionStatus, eventId]);

    const checkExistingZip = async () => {
        setZipStatus('checking');
        try {
            const res = await fetch(`/api/attendee/check-zip?eventId=${eventId}`);
            const data = await res.json();
            if (data.exists) {
                setZipStatus('ready');
                setDownloadUrl(data.downloadUrl);
            } else {
                setZipStatus('missing');
            }
        } catch (err) {
            console.error("Check ZIP error:", err);
            setZipStatus('missing');
        }
    };

    const fetchEventDetail = async () => {
        try {
            const res = await fetch(`/api/attendee/events/${eventId}`);
            const data = await res.json();

            if (!res.ok) {
                setError(data.err || "Failed to load event");
                setLoading(false);
                return;
            }

            setEvent(data.event);
            setPhotos(data.photos || []);
            setMatchCount(data.matchCount || 0);
        } catch {
            setError("Network error loading event");
        } finally {
            setLoading(false);
        }
    };

    const handleImageLoad = useCallback((index: number) => {
        setLoadedImages((prev) => new Set(prev).add(index));
    }, []);

    const handleGenerateZip = async () => {
        if (!eventId || zipStatus === 'generating') return;
        setZipStatus('generating');
        setDownloadProgress("Starting...");

        try {
            const res = await fetch("/api/attendee/download-zip", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ eventId }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.err || "Failed to start generation");
                setZipStatus('missing');
                return;
            }

            const taskId = data.task_id;
            if (!taskId) {
                setError("Failed to retrieve task ID. Please try again.");
                setZipStatus('missing');
                return;
            }

            // Polling logic
            let pollInterval: NodeJS.Timeout;

            const pollStatus = async () => {
                try {
                    const statusRes = await fetch(`/api/tasks/${taskId}`);
                    const statusData = await statusRes.json();

                    if (statusData.status === "SUCCESS" || statusData.status === "COMPLETED") {
                        setDownloadProgress("Finalizing...");
                        if (statusData.download_url) {
                            setDownloadUrl(statusData.download_url);
                        }
                        setZipStatus('ready');
                        if (pollInterval) clearInterval(pollInterval);
                        return true;
                    } else if (statusData.status === "FAILURE" || statusData.status === "FAILED") {
                        setError(statusData.error || "ZIP generation failed");
                        setZipStatus('missing');
                        if (pollInterval) clearInterval(pollInterval);
                        return true;
                    } else {
                        const progress = statusData.progress || 0;
                        const statusMsg = statusData.status_msg || statusData.status || "Processing...";
                        setDownloadProgress(`${statusMsg} (${progress}%)`);
                        return false;
                    }
                } catch (err) {
                    console.error("Polling error:", err);
                    setDownloadProgress("");
                    return false;
                }
            };

            pollInterval = setInterval(pollStatus, 2000);

        } catch (err) {
            console.error("ZIP trigger error:", err);
            setError("Request failed. Please try again.");
            setZipStatus('missing');
        }
    };

    const handleDownload = () => {
        if (!downloadUrl) return;
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `${event?.name || "photos"}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    if (sessionStatus === "loading" || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center animate-pulse bg-[var(--background)]">
                <div className="w-12 h-12 rounded-md bg-[var(--card-hover)] border border-[var(--border)]" />
            </div>
        );
    }

    if (sessionStatus === "unauthenticated") {
        router.replace("/signin");
        return null;
    }

    if (error && !event) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[var(--background)]">
                <div className="glass-card rounded-xl p-10 text-center max-w-md">
                    <p className="text-red-400 font-medium mb-2">Error</p>
                    <p className="text-[14px] text-[var(--foreground-secondary)] mb-6">{error}</p>
                    <Link href="/attendee/dashboard" className="btn-primary inline-flex items-center gap-2">
                        <ArrowLeft size={16} /> Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen px-4 py-12 max-w-5xl mx-auto bg-[var(--background)]">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-10">
                <div>
                    <Link
                        href="/attendee/dashboard"
                        className="inline-flex items-center gap-1.5 text-[var(--foreground-secondary)] hover:text-[var(--foreground)] text-[13px] font-medium mb-6 transition-colors"
                    >
                        <ArrowLeft size={14} /> Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">{event?.name}</h1>
                    <div className="flex items-center gap-4 mt-3">
                        {event?.date && (
                            <span className="flex items-center gap-2 text-[14px] font-medium text-[var(--foreground-secondary)]">
                                <Calendar size={14} className="text-[var(--foreground-secondary)]" />
                                {new Date(event.date).toLocaleDateString()}
                            </span>
                        )}
                        <span className="flex items-center gap-1.5 text-[12px] font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-sm border border-emerald-500/20">
                            <ImageIcon size={14} />
                            {matchCount} photo{matchCount !== 1 ? "s" : ""} matched
                        </span>
                    </div>
                </div>

                {photos.length > 0 && (
                    <div className="flex items-center gap-2">
                        {zipStatus === 'checking' && (
                            <div className="flex items-center gap-2 text-[var(--foreground-secondary)] text-[13px]">
                                <Loader2 size={16} className="animate-spin" /> Verifying...
                            </div>
                        )}

                        {zipStatus === 'missing' && (
                            <button
                                onClick={handleGenerateZip}
                                className="btn-primary flex items-center gap-2 text-sm shrink-0"
                            >
                                <Download size={16} /> Prepare ZIP Archive
                            </button>
                        )}

                        {zipStatus === 'generating' && (
                            <div className="flex flex-col items-end gap-1.5 min-w-[140px]">
                                <div className="flex items-center gap-2 text-[var(--foreground-secondary)] text-sm">
                                    <Loader2 size={14} className="animate-spin" /> {downloadProgress || "Processing..."}
                                </div>
                                <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-zinc-100 transition-all duration-500"
                                        style={{ width: `${parseInt(downloadProgress?.match(/\d+/)?.[0] || '0')}%` }}
                                    />
                                </div>
                                <span className="text-[10px] text-[var(--foreground-secondary)]">Background task active</span>
                            </div>
                        )}

                        {zipStatus === 'ready' && (
                            <div className="flex flex-col items-end gap-2 group">
                                <span className="text-[11px] font-medium text-emerald-500 flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-sm border border-emerald-500/20">
                                    <CheckCircle size={12} /> ZIP archive is ready!
                                </span>
                                <button
                                    onClick={handleDownload}
                                    className="btn-primary flex items-center gap-2 text-[14px] shrink-0"
                                >
                                    <Download size={16} />
                                    Download Photos ZIP
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {error && (
                <div className="bg-red-950 border border-red-900 rounded-md px-4 py-3 text-red-400 text-sm mb-4 flex items-center justify-between">
                    {error}
                    <button onClick={() => setError("")}><X size={16} /></button>
                </div>
            )}

            {/* Photo Grid */}
            {photos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {photos.map((photo, i) => (
                        <div
                            key={i}
                            className="relative group rounded-md overflow-hidden aspect-square cursor-pointer ring-1 ring-zinc-800 hover:ring-zinc-600 transition-all bg-[var(--card-hover)]"
                            onClick={() => setLightboxIndex(i)}
                        >
                            {/* Skeleton placeholder */}
                            {!loadedImages.has(i) && (
                                <div className="absolute inset-0 bg-[var(--border)] animate-pulse flex items-center justify-center">
                                    <ImageIcon size={24} className="text-zinc-700" />
                                </div>
                            )}
                            <Image
                                src={photo.url}
                                alt={photo.filename}
                                fill
                                unoptimized
                                className={`object-cover transition-all duration-500 group-hover:scale-105 ${loadedImages.has(i) ? "opacity-100" : "opacity-0"}`}
                                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                                loading={i < 8 ? "eager" : "lazy"}
                                onLoad={() => handleImageLoad(i)}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                    <p className="text-[12px] font-medium text-[var(--foreground)] truncate">{photo.filename}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="glass-card rounded-xl p-16 text-center">
                    <div className="w-12 h-12 rounded-md bg-[var(--card-hover)] border border-[var(--border)] flex items-center justify-center mx-auto mb-6">
                        <ImageIcon size={24} className="text-[var(--foreground-secondary)]" />
                    </div>
                    <p className="text-xl font-bold mb-2 text-[var(--foreground)] tracking-tight">No photos cached</p>
                    <p className="text-[14px] text-[var(--foreground-secondary)] max-w-sm mx-auto">
                        The sort results may have expired or no faces matched. Try scanning the event again.
                    </p>
                    <Link href="/attendee/sort" className="btn-primary inline-flex items-center gap-2 mt-8">
                        <ScanFace size={16} /> Re-scan Event
                    </Link>
                </div>
            )}

            {/* Lightbox */}
            {lightboxIndex !== null && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setLightboxIndex(null)}
                >
                    <button
                        className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
                        onClick={() => setLightboxIndex(null)}
                    >
                        <X size={20} />
                    </button>

                    <div className="relative w-full max-w-5xl h-[80vh]">
                        <Image
                            src={photos[lightboxIndex].url}
                            alt={photos[lightboxIndex].filename}
                            fill
                            unoptimized
                            className="object-contain"
                            sizes="90vw"
                            priority
                        />
                    </div>

                    {/* Navigation */}
                    {photos.length > 1 && (
                        <>
                            <button
                                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setLightboxIndex((lightboxIndex - 1 + photos.length) % photos.length);
                                }}
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <button
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors rotate-180"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setLightboxIndex((lightboxIndex + 1) % photos.length);
                                }}
                            >
                                <ArrowLeft size={20} />
                            </button>
                        </>
                    )}

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[var(--card-hover)] border border-[var(--border)] rounded-md px-4 py-1.5 text-[11px] text-[var(--foreground-secondary)]">
                        {lightboxIndex + 1} / {photos.length} · {photos[lightboxIndex].filename}
                    </div>
                </div>
            )}
        </div>
    );
}
