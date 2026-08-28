"use client";

import React, { useState, useEffect, useCallback, use, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
    ArrowLeft,
    Cpu,
    Loader2,
    ImageOff,
    CheckCircle2,
    AlertCircle,
    Upload,
    Image as ImageIcon,
    HardDrive,
    Copy,
    Check,
    Pencil,
    X
} from "lucide-react";
import { useInView } from "react-intersection-observer";
import { apiClient } from "@/lib/axios";
import { useUpload } from "@/components/providers/UploadProvider";
import { useGallery } from "@/hooks/useGallery";
import { ImageLightbox } from "@/components/ImageLightbox";
import { DatePicker } from "@/components/DatePicker";

interface EventData {
    id: string;
    name: string;
    code: string;
    description?: string;
    date?: string;
    photo_count: number;
    total_size_mb: number;
    attendeesAccessed: any[];
}

export default function EventDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { data: session } = useSession();
    const router = useRouter();
    const { id: eventId } = use(params);

    const [event, setEvent] = useState<EventData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [encodedCount, setEncodedCount] = useState<number | null>(null);

    // Global Upload State
    const { phase, uploadingEventId, imageCount, queueUpload, startEncodingPoll } = useUpload();

    // Gallery State
    const {
        images,
        isLoading: isGalleryLoading,
        isError: isGalleryError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch: refetchGallery,
        selectedKeys,
        toggleSelection,
        selectAll,
        clearSelection,
        deleteSelected,
        isDeleting,
        deleteProgress,
    } = useGallery(eventId);

    const { ref, inView } = useInView();

    const [filter, setFilter] = useState<"all" | "no_faces">("all");
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ name: "", description: "", date: "" });
    const [editSaving, setEditSaving] = useState(false);
    
    

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const openEditModal = () => {
        if (!event) return;
        const today = new Date().toISOString().split("T")[0];
        setEditForm({
            name: event.name || "",
            description: event.description || "",
            date: event.date ? new Date(event.date).toISOString().split("T")[0] : today,
        });
        setShowEditModal(true);
    };

    const handleEditEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!event || !editForm.name.trim()) return;
        setEditSaving(true);
        try {
            const res = await apiClient.put(`/api/events/${event.id}`, {
                name: editForm.name.trim(),
                description: editForm.description.trim() || undefined,
                date: editForm.date || undefined,
            });
            if (res.data.success) {
                setEvent(prev => prev ? {
                    ...prev,
                    name: editForm.name.trim(),
                    description: editForm.description.trim(),
                    date: editForm.date || undefined,
                } : null);
                setShowEditModal(false);
            }
        } catch {
            // silently fail — user can retry
        } finally {
            setEditSaving(false);
        }
    };

    // Clear selection when changing tabs to prevent deleting hidden selected images
    useEffect(() => {
        clearSelection();
    }, [filter, clearSelection]);

    // Lightbox & Interaction State
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const pressTimer = useRef<NodeJS.Timeout | null>(null);
    const isLongPress = useRef<boolean>(false);

    const handlePointerDown = (e: React.PointerEvent, image: {key: string, url: string}) => {
        // Only trigger on main mouse button or touch
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        
        isLongPress.current = false;
        
        if (pressTimer.current) clearTimeout(pressTimer.current);
        
        pressTimer.current = setTimeout(() => {
            isLongPress.current = true;
            // Long Press Action
            if (selectedKeys.size === 0) {
                toggleSelection(image.key); // Select it
            } else {
                setLightboxImage(image.url); // Open lightbox
            }
            pressTimer.current = null;
            // Reset after a brief delay so pointerUp sees it, then clear for next interaction
            setTimeout(() => { isLongPress.current = false; }, 50);
        }, 500); // 500ms for long press
    };

    const handlePointerUp = (e: React.PointerEvent, image: {key: string, url: string}) => {
        if (pressTimer.current) {
            clearTimeout(pressTimer.current);
            pressTimer.current = null;
        }
        
        if (!isLongPress.current) {
            // Click Action
            if (e.metaKey || e.ctrlKey || e.shiftKey) {
                toggleSelection(image.key);
                return;
            }
            if (selectedKeys.size === 0) {
                setLightboxImage(image.url); // Open lightbox
            } else {
                toggleSelection(image.key); // Toggle selection
            }
        }
    };

    const handlePointerLeave = () => {
        if (pressTimer.current) {
            clearTimeout(pressTimer.current);
            pressTimer.current = null;
        }
        isLongPress.current = false;
    };

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

    const fetchEvent = useCallback(async () => {
        try {
            const res = await apiClient.get(`/api/events/${eventId}`);
            const data = res.data;
            if (data.success) {
                setEvent(data.event);
                try {
                    const countRes = await apiClient.get(`/api/encode/count?eventId=${data.event.id}`);
                    const countData = countRes.data;
                    if (countData.success) setEncodedCount(countData.encoded_count);
                } catch { }
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
        } catch (err) { }
    }, [eventId]);

    useEffect(() => {
        if (phase === "done" && uploadingEventId === eventId) {
            apiClient.get(`/api/encode/count?eventId=${eventId}`)
                .then(res => res.data)
                .then(data => { if (data.success) setEncodedCount(data.encoded_count); })
                .catch(() => { });
        }
    }, [eventId, phase, uploadingEventId]);

    useEffect(() => {
        if (session) {
            fetchEvent();
            reconcileStorage();
        }
    }, [session, fetchEvent, reconcileStorage]);

    const triggerBackendEncoding = async () => {
        if (!event) return;
        if (phase !== "idle" && phase !== "done" && phase !== "error") {
            setError("An upload or encoding process is already running. Please wait for it to finish before starting a new one.");
            return;
        }
        try {
            const res = await apiClient.post("/api/encode", { eventId: event.id });
            const data = res.data;

            if (data.success && data.task_id) {
                startEncodingPoll(data.task_id, event.id);
            } else {
                setError(data.err || "Failed to trigger encoding.");
            }
        } catch (e: any) {
            setError(e.message || "Failed to contact encoding server.");
        }
    };

    useEffect(() => {
        if (phase === "done" && uploadingEventId === eventId) {
            fetchEvent();
            refetchGallery();
        }
    }, [phase, uploadingEventId, eventId, fetchEvent, refetchGallery]);

    const filteredImages = images.filter(img => filter === "all" || img.status === filter);

    const [wantsSelectAll, setWantsSelectAll] = useState(false);
    const fetchCountRef = useRef(0);

    const getKeysToSelect = () => {
        return filter === "all"
            ? filteredImages.filter(img => img.status !== "no_faces").map((img) => img.key)
            : filteredImages.map((img) => img.key);
    };

    const handleSelectAll = () => {
        if (!hasNextPage) {
            selectAll(getKeysToSelect());
        } else {
            fetchCountRef.current = 0;
            setWantsSelectAll(true);
        }
    };

    useEffect(() => {
        if (wantsSelectAll) {
            if (isGalleryError) {
                setWantsSelectAll(false);
                return;
            }
            if (hasNextPage && !isFetchingNextPage) {
                // Safeguard: Cap auto-fetching to 10 pages (max ~500 images) per click
                // to prevent browser crashes on massive events.
                if (fetchCountRef.current >= 10) {
                    selectAll(getKeysToSelect());
                    setWantsSelectAll(false);
                } else {
                    fetchCountRef.current += 1;
                    fetchNextPage();
                }
            } else if (!hasNextPage && !isFetchingNextPage) {
                selectAll(getKeysToSelect());
                setWantsSelectAll(false);
            }
        }
    }, [wantsSelectAll, hasNextPage, isFetchingNextPage, fetchNextPage, filteredImages, selectAll, isGalleryError]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0 && event) {
            const validFiles = Array.from(e.target.files).filter(f =>
                !f.name.startsWith("._") && !f.name.startsWith("__MACOSX") &&
                (f.type.startsWith("image/") || f.name.match(/\.(jpg|jpeg|png|webp|bmp|tiff)$/i))
            );
            if (validFiles.length > 0) {
                queueUpload(validFiles, event);
            }
        }
        // Reset input so the same files can be selected again if needed
        e.target.value = '';
    };

    // Removed filteredImages from here
    useEffect(() => {
        if (filter !== "all" && filteredImages.length < 10 && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [filter, filteredImages.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (!event) return;

        const files: File[] = [];
        
        // Helper to recursively get files from a directory entry
        const getFilesFromEntry = async (entry: any): Promise<void> => {
            if (entry.isFile) {
                return new Promise((resolve) => {
                    entry.file((file: File) => {
                        if (!file.name.startsWith("._") && !file.name.startsWith("__MACOSX") && (file.type.startsWith("image/") || file.name.match(/\.(jpg|jpeg|png|webp|bmp|tiff)$/i))) {
                            files.push(file);
                        }
                        resolve();
                    });
                });
            } else if (entry.isDirectory) {
                const dirReader = entry.createReader();
                const entries = await new Promise<any[]>((resolve) => {
                    dirReader.readEntries(resolve);
                });
                for (const childEntry of entries) {
                    await getFilesFromEntry(childEntry);
                }
            }
        };

        const items = Array.from(e.dataTransfer.items);
        for (const item of items) {
            const entry = item.webkitGetAsEntry?.();
            if (entry) {
                await getFilesFromEntry(entry);
            } else if (item.kind === 'file') {
                const file = item.getAsFile();
                if (file && !file.name.startsWith("._") && !file.name.startsWith("__MACOSX") && (file.type.startsWith("image/") || file.name.match(/\.(jpg|jpeg|png|webp|bmp|tiff)$/i))) {
                    files.push(file);
                }
            }
        }

        if (files.length > 0) {
            queueUpload(files, event);
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
                    <p className="text-red-400 mb-6">{error}</p>
                    <Link href="/organizer/events" className="btn-primary inline-flex">Go Back</Link>
                </div>
            </div>
        );
    }

    const photoCount = uploadingEventId === event?.id && (phase === "uploading" || phase === "encoding") && imageCount > 0
        ? imageCount
        : (event?.photo_count || 0);

    return (
        <>
        <div 
            className="flex flex-col min-h-[calc(100vh-4rem)] bg-[var(--background)] relative w-full mx-auto"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {isDragging && (
                <div className="fixed inset-0 z-[100] bg-[var(--foreground)]/5 backdrop-blur-sm border-2 border-dashed border-[var(--foreground)]/30 flex items-center justify-center pointer-events-none">
                    <div className="bg-[var(--card-bg)] border border-[var(--border)] text-[var(--foreground)] px-8 py-6 rounded-2xl shadow-2xl flex flex-col items-center">
                        <Upload size={48} className="text-[var(--foreground-secondary)] mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Drop Folder or Files Here</h2>
                        <p className="text-[var(--foreground-secondary)]">Drop to instantly add them to the queue</p>
                    </div>
                </div>
            )}

            {/* Permanent Sticky Top Navbar */}
            <div className="sticky top-16 md:top-0 z-[40] bg-[var(--background-secondary)]/95 backdrop-blur-md border-b border-[var(--border)] px-6 md:px-8 h-14 flex items-center shadow-sm w-full mb-6">
                <div className="flex-1 flex items-center gap-4 min-w-0 max-w-[1400px] mx-auto w-full">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Link href="/organizer/events" className="p-1.5 -ml-1.5 rounded-md hover:bg-[var(--card-hover)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
                            <ArrowLeft size={16} />
                        </Link>
                        <span className="text-[15px] font-semibold text-[var(--foreground)] truncate">{event?.name}</span>
                        <button
                            onClick={() => event && copyCode(event.code)}
                            className="shrink-0 flex items-center gap-1 font-mono text-[11px] font-semibold bg-[var(--card-hover)] text-[var(--foreground)] px-2 py-0.5 rounded border border-[var(--border)] hover:border-[var(--foreground-secondary)] transition-colors tracking-wider"
                        >
                            {event?.code}
                            {copiedCode === event?.code ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} className="opacity-60" />}
                        </button>
                        <button
                            onClick={openEditModal}
                            className="shrink-0 p-1.5 rounded-md text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] border border-transparent hover:border-[var(--border)] transition-colors hidden sm:flex"
                            title="Edit event details"
                        >
                            <Pencil size={14} />
                        </button>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        {/* Tab switcher */}
                        <div className="hidden sm:flex items-center bg-[var(--card-hover)] p-0.5 rounded-lg border border-[var(--border)] shrink-0">
                            <button type="button" onPointerDown={e => e.stopPropagation()} onClick={() => setFilter("all")}
                                className={`text-[12px] font-medium px-3 py-1 rounded-md transition-all ${filter === "all" ? "bg-[var(--foreground)] text-[var(--background)] shadow-sm" : "text-[var(--foreground-secondary)] hover:text-[var(--foreground)]"}`}>
                                All Photos
                            </button>
                            <button type="button" onPointerDown={e => e.stopPropagation()} onClick={() => setFilter("no_faces")}
                                className={`text-[12px] font-medium px-3 py-1 rounded-md transition-all ${filter === "no_faces" ? "bg-red-500 text-white shadow-sm" : "text-[var(--foreground-secondary)] hover:text-[var(--foreground)]"}`}>
                                No-Face
                            </button>
                        </div>

                        {/* Select all / Clear */}
                        <div className="hidden md:flex items-center gap-1.5 shrink-0">
                            <button type="button" onPointerDown={e => e.stopPropagation()} onClick={handleSelectAll} disabled={wantsSelectAll}
                                className="text-[12px] font-medium px-2.5 py-1 rounded-md border border-[var(--border)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-all flex items-center gap-1 disabled:opacity-40">
                                {wantsSelectAll ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                                Select All
                            </button>
                            <button type="button" onPointerDown={e => e.stopPropagation()} onClick={clearSelection} disabled={selectedKeys.size === 0}
                                className="text-[12px] font-medium px-2.5 py-1 rounded-md border border-[var(--border)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-all disabled:opacity-40">
                                Clear
                            </button>
                        </div>

                        <div className="h-6 w-px bg-[var(--border)] hidden sm:block mx-1"></div>

                        {/* Action buttons */}
                        {(event?.photo_count || 0) > 0 && typeof encodedCount === 'number' && encodedCount < (event?.photo_count || 0) && (phase === "idle" || phase === "done" || phase === "error") && (
                            <button
                                onClick={triggerBackendEncoding}
                                className="px-3 py-1.5 rounded-lg font-medium text-[12px] transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm bg-[var(--card-hover)] hover:bg-[var(--border)] text-[var(--foreground)] border border-[var(--border)]"
                            >
                                <Cpu size={14} className="text-[var(--foreground-secondary)]" /> <span className="hidden lg:inline">Process</span>
                            </button>
                        )}
                        <input id="upload-input" type="file" multiple accept="image/jpeg, image/png, image/webp" className="hidden" onChange={handleFileChange} />
                        <button
                            onClick={async () => {
                                if ('showDirectoryPicker' in window) {
                                    try {
                                        // @ts-ignore
                                        const dirHandle = await window.showDirectoryPicker();
                                        const files: File[] = [];
                                        const getFiles = async (dh: any) => {
                                            for await (const entry of dh.values()) {
                                                if (entry.kind === 'file') {
                                                    const file = await entry.getFile();
                                                    if (!file.name.startsWith("._") && !file.name.startsWith("__MACOSX") && (file.type.startsWith("image/") || file.name.match(/\.(jpg|jpeg|png|webp|bmp|tiff)$/i))) {
                                                        files.push(file);
                                                    }
                                                } else if (entry.kind === 'directory') {
                                                    await getFiles(entry);
                                                }
                                            }
                                        };
                                        await getFiles(dirHandle);
                                        if (files.length > 0 && event) {
                                            queueUpload(files, event);
                                        }
                                    } catch (err: any) {
                                        if (err.name !== 'AbortError') {
                                            console.error(err);
                                            document.getElementById("upload-input")?.click();
                                        }
                                    }
                                } else {
                                    document.getElementById("upload-input")?.click();
                                }
                            }}
                            disabled={phase === "uploading" || phase === "extracting"}
                            className={`shrink-0 px-3.5 py-1 rounded-md text-[12px] font-medium flex items-center gap-1.5 transition-all ${(phase === "uploading" || phase === "extracting") ? "bg-[var(--card-hover)] text-[var(--foreground-secondary)] opacity-50 cursor-not-allowed border border-[var(--border)]" : "btn-primary"}`}
                        >
                            <Upload size={12} /> Upload
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 w-full max-w-[1400px] mx-auto relative mb-12 px-6 md:px-8">
                {/* Minimal Header Metrics Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <p className="text-[14px] text-[var(--foreground-secondary)] max-w-2xl leading-relaxed">
                        {event?.description || "No description provided."}
                        {event?.date && <span className="ml-2 text-[12px] opacity-70">· {new Date(event.date).toLocaleDateString()}</span>}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px]">
                        <div className="flex items-center gap-1.5 text-[var(--foreground-secondary)] bg-[var(--card-bg)] px-2.5 py-1 rounded-md border border-[var(--border)] shadow-sm">
                            <ImageIcon size={13} />
                            <span className="font-medium text-[var(--foreground)]">{photoCount.toLocaleString()}</span> Photos
                        </div>
                        <div className="flex items-center gap-1.5 text-[var(--foreground-secondary)] bg-[var(--card-bg)] px-2.5 py-1 rounded-md border border-[var(--border)] shadow-sm">
                            <Cpu size={13} />
                            <span className="font-medium text-[var(--foreground)]">{typeof encodedCount === 'number' ? encodedCount.toLocaleString() : "..."}</span> Encoded
                        </div>
                        <div className="flex items-center gap-1.5 text-[var(--foreground-secondary)] bg-[var(--card-bg)] px-2.5 py-1 rounded-md border border-[var(--border)] shadow-sm">
                            <HardDrive size={13} />
                            <span className="font-medium text-[var(--foreground)]">{(event?.total_size_mb || 0).toFixed(1)} MB</span>
                        </div>
                    </div>
                </div>

                {/* Mobile-only tools */}
                <div className="flex sm:hidden flex-wrap items-center gap-2 mb-4">
                    <div className="flex items-center bg-[var(--card-hover)] p-0.5 rounded-lg border border-[var(--border)]">
                        <button type="button" onClick={() => setFilter("all")} className={`text-[12px] font-medium px-3 py-1 rounded-md ${filter === "all" ? "bg-[var(--foreground)] text-[var(--background)]" : ""}`}>All</button>
                        <button type="button" onClick={() => setFilter("no_faces")} className={`text-[12px] font-medium px-3 py-1 rounded-md ${filter === "no_faces" ? "bg-red-500 text-white" : ""}`}>No-Face</button>
                    </div>
                    <button type="button" onClick={handleSelectAll} disabled={wantsSelectAll} className="text-[12px] font-medium px-2.5 py-1 rounded-md border border-[var(--border)] bg-[var(--card-bg)] flex items-center gap-1">
                        {wantsSelectAll ? <Loader2 size={10} className="animate-spin" /> : null} Select All
                    </button>
                    <button type="button" onClick={clearSelection} disabled={selectedKeys.size === 0} className="text-[12px] font-medium px-2.5 py-1 rounded-md border border-[var(--border)] bg-[var(--card-bg)]">Clear</button>
                </div>
                {/* Gallery Grid */}
                {isGalleryError ? (
                    <div className="flex h-64 items-center justify-center text-red-500">
                        Failed to load gallery.
                    </div>
                ) : filteredImages.length === 0 && !isGalleryLoading ? (
                    <div className="flex flex-col items-center justify-center py-32 rounded-xl border border-dashed border-[var(--border)] bg-[var(--card-hover)]/30 mt-8">
                        <div className="w-16 h-16 rounded-2xl bg-[var(--card-hover)] border border-[var(--border)] flex items-center justify-center mb-4">
                            <ImageOff className="h-8 w-8 text-[var(--foreground-secondary)]" />
                        </div>
                        <p className="text-lg font-medium text-[var(--foreground)]">No images found</p>
                        <p className="text-sm text-[var(--foreground-secondary)] mt-1">Images uploaded to this event will appear here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 xl:grid-cols-10 gap-3 pb-32 pt-6 px-1 md:px-2">
                        {filteredImages.map((image) => (
                            <div
                                key={image.key}
                                onPointerDown={(e) => handlePointerDown(e, image)}
                                onPointerUp={(e) => handlePointerUp(e, image)}
                                onPointerCancel={handlePointerLeave}
                                onPointerLeave={handlePointerLeave}
                                onContextMenu={(e) => e.preventDefault()}
                                className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-200 select-none touch-callout-none touch-action-none ${
                                    selectedKeys.has(image.key)
                                        ? "ring-2 ring-[var(--foreground)] ring-offset-2 ring-offset-[var(--background)] scale-[0.96] shadow-xl"
                                        : "hover:ring-1 hover:ring-[var(--border)]"
                                }`}
                                style={{ WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
                            >
                                <Image
                                    src={image.url}
                                    alt="Gallery thumbnail"
                                    fill
                                    unoptimized
                                    className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                                />

                                {/* Dark Gradient Overlay for contrast */}
                                <div className={`absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent transition-opacity duration-300 pointer-events-none ${selectedKeys.has(image.key) ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}></div>

                                {/* Checkbox Overlay */}
                                <div
                                    onPointerDown={(e) => {
                                        e.stopPropagation();
                                        toggleSelection(image.key);
                                    }}
                                    onPointerUp={(e) => e.stopPropagation()}
                                    className={`absolute top-3 left-3 z-10 transition-all duration-200 cursor-pointer ${
                                        selectedKeys.has(image.key) 
                                        ? "opacity-100 scale-100" 
                                        : "opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100"
                                    }`}
                                >
                                    {selectedKeys.has(image.key) ? (
                                        <div className="bg-[var(--foreground)] rounded-full shadow-lg ring-2 ring-[var(--background)]">
                                            <CheckCircle2 className="h-6 w-6 text-[var(--background)]" />
                                        </div>
                                    ) : (
                                        <div className="rounded-full shadow-sm bg-black/20 border-[1.5px] border-white/70 backdrop-blur-sm h-6 w-6 hover:bg-black/40 hover:border-white transition-colors"></div>
                                    )}
                                </div>

                                {/* Status Badge */}
                                {image.status === "no_faces" && (
                                    <div className="absolute top-2 right-2 z-10 bg-yellow-500/90 text-white rounded-full p-1 backdrop-blur-sm shadow-sm" title="No faces detected by AI">
                                        <AlertCircle className="h-4 w-4" />
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Intersection Observer Target */}
                        {hasNextPage && (
                            <div
                                ref={ref}
                                className="col-span-full h-32 flex items-center justify-center"
                            >
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        )}
                    </div>
                )}

                {/* Floating Bulk Action Bar */}
                {selectedKeys.size > 0 && (
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[var(--background)]/95 backdrop-blur border border-[var(--border)] shadow-2xl rounded-full px-6 py-4 flex items-center gap-6 z-50 animate-in slide-in-from-bottom-10 text-[var(--foreground)]">
                        <span className="font-medium whitespace-nowrap">
                            {selectedKeys.size} image{selectedKeys.size !== 1 ? "s" : ""} selected
                        </span>

                        <button
                            className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-md transition-colors flex items-center disabled:opacity-50"
                            disabled={isDeleting}
                            onClick={deleteSelected}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting ({deleteProgress}%)
                                </>
                            ) : (
                                "Delete Selected"
                            )}
                        </button>
                    </div>
                )}
                
                <ImageLightbox 
                    imageUrl={lightboxImage} 
                    onClose={() => setLightboxImage(null)} 
                />
            </div>
        </div>

        {/* Edit Event Modal */}
        {showEditModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
                <div className="relative w-full max-w-md glass-card rounded-xl p-6 shadow-2xl">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-semibold text-[var(--foreground)]">Edit Event</h2>
                        <button
                            onClick={() => setShowEditModal(false)}
                            className="p-1.5 rounded-md text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                    <form onSubmit={handleEditEvent} className="space-y-4">
                        <div>
                            <label className="block text-[13px] font-medium text-[var(--foreground-secondary)] mb-1.5">
                                Event Name <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={editForm.name}
                                onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-3.5 py-2.5 text-[var(--foreground)] text-sm placeholder-[var(--foreground-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/20 focus:border-[var(--foreground)]/50 transition-colors"
                                placeholder="Event name"
                                required
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-[13px] font-medium text-[var(--foreground-secondary)] mb-1.5">
                                Description
                            </label>
                            <textarea
                                value={editForm.description}
                                onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                                onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleEditEvent(e as any); } }}
                                rows={3}
                                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-3.5 py-2.5 text-[var(--foreground)] text-sm placeholder-[var(--foreground-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/20 focus:border-[var(--foreground)]/50 transition-colors resize-none"
                                placeholder="Optional description... (Ctrl+Enter to save)"
                            />
                        </div>
                        <DatePicker
                            label="Event Date"
                            value={editForm.date}
                            onChange={date => setEditForm(p => ({ ...p, date }))}
                        />
                        <div className="flex gap-3 pt-1">
                            <button
                                type="button"
                                onClick={() => setShowEditModal(false)}
                                className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--border)] text-sm font-medium text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={editSaving || !editForm.name.trim()}
                                className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {editSaving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : "Save Changes"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
        </>
    );
}
