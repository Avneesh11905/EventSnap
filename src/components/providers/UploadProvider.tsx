"use client";

import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Loader2, CheckCircle, X, Cpu, Minus, XCircle } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { apiClient } from "@/lib/axios";

type UploadPhase = "idle" | "uploading" | "extracting" | "encoding" | "done" | "error";

interface UploadState {
    isUploading: boolean;
    phase: UploadPhase;
    progress: number; // 0-100 for network upload
    encodeProgress: number; // 0-100 for backend encoding
    statusMessage: string;
    errorMessage: string;
    imageCount: number;
    uploadingEventId: string | null;
}

interface UploadContextType extends UploadState {
    startUpload: (files: File[], event: { id: string; code: string; name: string }) => void;
    startEncodingPoll: (taskId: string, eventId: string) => void;
    dismissWidget: () => void;
    cancelUpload: () => void;
    cleanupUploadState: () => void;
    minimizeWidget: () => void;
    maximizeWidget: () => void;
    isWidgetMinimized: boolean;
    isWidgetDismissed: boolean;
}

const resizeImage = (file: File, maxWidth = 1920, maxHeight = 1920): Promise<File> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(img.src);
            let width = img.width;
            let height = img.height;

            if (width > maxWidth || height > maxHeight) {
                if (width > height) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                } else {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");
            if (!ctx) return reject("Canvas ctx not found");
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (!blob) return reject("Canvas is empty");
                    const resizedFile = new File([blob], file.name, {
                        type: "image/jpeg",
                        lastModified: Date.now(),
                    });
                    resolve(resizedFile);
                },
                "image/jpeg",
                0.6
            );
        };
        img.onerror = () => {
            URL.revokeObjectURL(img.src);
            reject("Image load error");
        };
    });
};

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({ children }: { children: React.ReactNode }) {
    const [phase, setPhase] = useState<UploadPhase>("idle");
    const [progress, setProgress] = useState(0);
    const [encodeProgress, setEncodeProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [imageCount, setImageCount] = useState(0);
    const [uploadingEventId, setUploadingEventId] = useState<string | null>(null);
    const [isWidgetMinimized, setIsWidgetMinimized] = useState(false);

    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const [hasRestored, setHasRestored] = useState(false);

    const cleanupUploadState = () => {
        // 1. Cancel any active network requests
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        // 2. Stop polling
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }

        // 3. Clear reactive state
        setPhase("idle");
        setErrorMessage("");
        setStatusMessage("");
        setProgress(0);
        setEncodeProgress(0);
        setImageCount(0);
        setUploadingEventId(null);
        setIsWidgetDismissed(false);

        // 4. Wipe persistence
        localStorage.removeItem("eventsnap_active_upload");
        localStorage.removeItem("eventsnap_live_s3_upload");
    };

    const { status: sessionStatus } = useSession();

    // Session-aware state management (Restore & Cleanup)
    useEffect(() => {
        if (sessionStatus === "loading") return;

        // 1. If logged out, blow everything away immediately
        if (sessionStatus === "unauthenticated") {
            cleanupUploadState();
            setHasRestored(false); // Reset so it can restore next time we login
            return;
        }

        // 2. If logged in and haven't tried to restore persistent state yet
        if (sessionStatus === "authenticated" && !hasRestored) {
            setHasRestored(true);

            // Check for active AI background task
            const storedEncoding = localStorage.getItem("eventsnap_active_upload");
            if (storedEncoding) {
                try {
                    const { taskId, eventId } = JSON.parse(storedEncoding);
                    if (taskId && eventId) {
                        setUploadingEventId(eventId);
                        setIsWidgetMinimized(false);
                        // No timeout needed, just run it
                        pollEncodingStatus(taskId, eventId);
                    }
                } catch (e) {
                    localStorage.removeItem("eventsnap_active_upload");
                }
            }

            // Check if the user wandered off during a live S3 upload
            const storedS3 = localStorage.getItem("eventsnap_live_s3_upload");
            if (storedS3) {
                try {
                    const { eventId, phase, progress, imageCount, statusMessage } = JSON.parse(storedS3);
                    if (eventId) {
                        if (phase === "uploading") {
                            localStorage.removeItem("eventsnap_live_s3_upload");
                        } else {
                            setUploadingEventId(eventId);
                            setPhase(phase);
                            setProgress(progress);
                            setImageCount(imageCount);
                            setStatusMessage(statusMessage);
                            setIsWidgetMinimized(true);
                        }
                    }
                } catch (e) {
                    localStorage.removeItem("eventsnap_live_s3_upload");
                }
            }
        }
    }, [sessionStatus, hasRestored]);

    useEffect(() => {
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, []);

    const pollEncodingStatus = (taskId: string, eventId: string) => {
        if (sessionStatus !== "authenticated") return;
        setUploadingEventId(eventId);
        setPhase("encoding");
        setEncodeProgress(0);
        setStatusMessage("Queued for processing...");
        setIsWidgetDismissed(false);
        setIsWidgetMinimized(false);

        localStorage.setItem("eventsnap_active_upload", JSON.stringify({ taskId, eventId }));

        pollRef.current = setInterval(async () => {
            try {
                const res = await apiClient.get(`/api/upload/status?taskId=${taskId}`);
                const data = res.data;

                if (data.status === "PROCESSING" || data.status === "INITIALIZING") {
                    // Python backends sends: progress: "45%", we must strip the % before parseInt
                    const rawProgress = String(data.progress || "0").replace("%", "");
                    const pct = parseInt(rawProgress) || 0;
                    setEncodeProgress(pct);
                    setStatusMessage(
                        data.status === "INITIALIZING"
                            ? "Initializing model..."
                            : `Processing ${data.images_processed || 0}/${data.total_images || "?"} images`
                    );
                } else if (data.status === "SUCCESS") {
                    setEncodeProgress(100);
                    setStatusMessage("Encoding complete!");
                    setPhase("done");
                    localStorage.removeItem("eventsnap_active_upload");
                    if (pollRef.current) clearInterval(pollRef.current);
                } else if (data.status === "FAILURE") {
                    setErrorMessage("Encoding failed on backend.");
                    setPhase("error");
                    localStorage.removeItem("eventsnap_active_upload");
                    if (pollRef.current) clearInterval(pollRef.current);
                }
            } catch {
                // Silently retry on network hiccups
            }
        }, 2000);
    };

    const startUpload = async (files: File[], event: { id: string; code: string; name: string }) => {
        if (sessionStatus !== "authenticated") return;
        if (!files.length || !event) return;

        setPhase("uploading");
        setProgress(0);
        setEncodeProgress(0);
        setErrorMessage("");
        setImageCount(0);
        setUploadingEventId(event.id);
        setStatusMessage(`Preparing ${files.length} photos...`);
        setIsWidgetDismissed(false);
        setIsWidgetMinimized(false);

        if (pollRef.current) clearInterval(pollRef.current);
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        // --- Helper for Retrying Fetches ---
        const axiosUploadWithRetry = async (url: string, file: File, options: any, onProgress: (loaded: number, total: number) => void, maxRetries = 3, delay = 1000) => {
            for (let i = 0; i < maxRetries; i++) {
                try {
                    const res = await axios.put(url, file, {
                        ...options,
                        headers: { "Content-Type": file.type || "application/octet-stream" },
                        onUploadProgress: (progressEvent) => {
                            if (progressEvent.loaded !== undefined && progressEvent.total !== undefined) {
                                onProgress(progressEvent.loaded, progressEvent.total);
                            }
                        }
                    });
                    if (res.status >= 200 && res.status < 300) return res;
                } catch (err: any) {
                    if (axios.isCancel(err) || options.signal?.aborted) throw err;
                }
                await new Promise(r => setTimeout(r, delay));
                if (abortController.signal.aborted) throw new Error("Upload canceled by user.");
            }
            return null;
        };

        let unsyncedCount = 0;
        let unsyncedMB = 0;

        const commitPendingSync = async () => {
            if (unsyncedCount <= 0) return;
            try {
                const countToSync = unsyncedCount;
                const mbToSync = unsyncedMB;
                unsyncedCount = 0;
                unsyncedMB = 0;

                await apiClient.patch(`/api/events/${event.id}`, {
                    photo_count: countToSync,
                    total_size_mb: mbToSync
                }, { signal: abortController.signal });
            } catch (err) {
                console.error("Incremental DB sync failed", err);
            }
        };

        try {
            // --- SMART RESUME: Check existing files in Storage ---
            setStatusMessage("Checking existing uploads...");
            const checkRes = await apiClient.post("/api/upload/check", {
                eventId: event.id,
                files: files.map(f => ({ name: f.name, size: f.size }))
            }, { signal: abortController.signal });
            const checkData = checkRes.data;

            let filesToUpload = files;
            let skippedCount = 0;
            let successCount = 0; // Tracks total processed (skipped + newly uploaded)
            let totalMB = 0;

            if (checkData.success && checkData.existingFiles?.length > 0) {
                const existingSet = new Set(checkData.existingFiles);
                filesToUpload = files.filter(f => !existingSet.has(f.name));
                skippedCount = files.length - filesToUpload.length;
                successCount = skippedCount; // Assume already uploaded ones are successes 

                // We don't tally MB for skipped files to avoid duplicate DB increments,
                // the original upload already patched the DB with their sizes.

                if (filesToUpload.length === 0) {
                    setProgress(100);
                    setImageCount(successCount);
                    setPhase("done");
                    setStatusMessage(`Smart Resume: All ${skippedCount} photos already exist!`);
                    return;
                }
                setStatusMessage(`Smart Resume: Skipping ${skippedCount} existing files. Preparing ${filesToUpload.length} new photos...`);
            } else {
                setStatusMessage(`Preparing ${files.length} photos...`);
            }

            // 1. Get Presigned URLs for new files (raw and thumbs)
            const reqBody = {
                eventId: event.id,
                files: filesToUpload.flatMap(f => [
                    { name: f.name, type: f.type, folder: 'raw', size: f.size },
                    { name: f.name, type: "image/jpeg", folder: 'thumbs', size: f.size }
                ])
            };

            const presignRes = await apiClient.post("/api/upload/presigned", reqBody, {
                signal: abortController.signal,
            });

            const presignData = presignRes.data;
            if (!presignData.success) {
                throw new Error(presignData.err || "Failed to generate security tokens for upload.");
            }

            // Setup Byte-Level Progress Tracking
            const uploadStateMap: Record<string, { loaded: number, total: number }> = {};
            filesToUpload.forEach(f => {
                uploadStateMap[f.name + "_raw"] = { loaded: 0, total: f.size };
                uploadStateMap[f.name + "_proxy"] = { loaded: 0, total: f.size * 0.1 }; // 10% estimate
            });

            const updateOverallProgress = () => {
                let loaded = 0;
                let total = 0;
                Object.values(uploadStateMap).forEach(state => {
                    loaded += state.loaded;
                    total += state.total;
                });
                const uploadPct = Math.min(100, Math.round((loaded / (total || 1)) * 100));
                
                // Account for skipped files in the overall percentage calculation
                const adjustedPct = Math.round((skippedCount / files.length) * 100) + Math.round((uploadPct * (filesToUpload.length / files.length)));

                setProgress(adjustedPct);
                setStatusMessage(`Uploading: ${adjustedPct}% (${successCount}/${files.length})`);
            };

            // 2. Upload files in concurrent batches to S3
            const BATCH_SIZE = process.env.NEXT_PUBLIC_UPLOAD_BATCH_SIZE ? parseInt(process.env.NEXT_PUBLIC_UPLOAD_BATCH_SIZE) : 5;

            for (let i = 0; i < filesToUpload.length; i += BATCH_SIZE) {
                // Check if user canceled mid-batch
                if (abortController.signal.aborted) {
                    throw new Error("Upload canceled by user.");
                }

                const batchFiles = filesToUpload.slice(i, i + BATCH_SIZE);
                const startIndex = i * 2;
                const batchUrls = presignData.urls.slice(startIndex, startIndex + (BATCH_SIZE * 2));

                let batchSuccessCount = 0;
                let batchTotalMB = 0;

                await Promise.all(batchFiles.map(async (f, idx) => {
                    const rawUrlObj = batchUrls[idx * 2];
                    const thumbUrlObj = batchUrls[(idx * 2) + 1];

                    try {
                        // 1. Resize on the fly (AI Processing Proxy)
                        const proxyFile = await resizeImage(f, 1920, 1920);
                        // Update total estimate now that we know actual proxy size
                        uploadStateMap[f.name + "_proxy"].total = proxyFile.size;

                        // 2. Upload both concurrently
                        const [rawRes, proxyRes] = await Promise.all([
                            axiosUploadWithRetry(rawUrlObj.url, f, {
                                signal: abortController.signal,
                            }, (loaded, total) => {
                                uploadStateMap[f.name + "_raw"] = { loaded, total };
                                updateOverallProgress();
                            }),
                            axiosUploadWithRetry(thumbUrlObj.url, proxyFile, {
                                signal: abortController.signal,
                            }, (loaded, total) => {
                                uploadStateMap[f.name + "_proxy"] = { loaded, total };
                                updateOverallProgress();
                            })
                        ]);

                        if (!rawRes || !proxyRes) {
                            console.error(`Failed to upload ${f.name} after retries.`);
                        } else {
                            successCount++;
                            totalMB += (f.size / (1024 * 1024));
                            batchSuccessCount++;
                            batchTotalMB += (f.size / (1024 * 1024));
                            updateOverallProgress(); // Force update with new successCount
                        }
                    } catch (err: any) {
                        if (err.name === "AbortError" || abortController.signal.aborted) {
                            throw err;
                        }
                        console.error(`Fatal error uploading ${f.name}:`, err);
                    }
                }));

                // Persist state to survive hard refreshes during large queues
                const currentBatchProgress = Math.round((successCount / files.length) * 100);
                localStorage.setItem("eventsnap_live_s3_upload", JSON.stringify({
                    eventId: event.id,
                    phase: "uploading",
                    progress: currentBatchProgress,
                    imageCount: successCount,
                    statusMessage: `Uploading: ${currentBatchProgress}% (${successCount}/${files.length})`
                }));

                // --- Incremental Database Sync ---
                unsyncedCount += batchSuccessCount;
                unsyncedMB += batchTotalMB;

                // Sync DB every batch (5 photos)
                await commitPendingSync();
            }

            // All done. We do NOT auto-trigger encoding anymore! The user triggers it manually.
            const newlyUploadedCount = successCount - skippedCount;
            setProgress(100);
            setImageCount(successCount);
            setPhase("done");
            setStatusMessage(skippedCount > 0 ? `Complete! Uploaded ${newlyUploadedCount} new, skipped ${skippedCount} existing.` : `Upload Complete! Processed ${successCount} photos.`);
            localStorage.removeItem("eventsnap_live_s3_upload");

        } catch (error: any) {
            // Ensure any partial progress from the current batch is committed before failing
            await commitPendingSync();

            const isAborted = error.name === "AbortError" ||
                error.message === "Upload canceled by user." ||
                abortController.signal.aborted ||
                sessionStatus !== "authenticated";

            if (isAborted) {
                console.log("Upload aborted gracefully (likely logout or user cancel).");
                return;
            }

            console.error("Upload error:", error);
            setPhase("error");
            setErrorMessage(error.message || "Network error occurred during upload. Please check your connection.");
            localStorage.removeItem("eventsnap_live_s3_upload");
        } finally {
            // Final safety catch-all
            await commitPendingSync();
            abortControllerRef.current = null;
        }
    };

    const cancelUpload = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setPhase("idle");
            setStatusMessage("Upload canceled.");
            localStorage.removeItem("eventsnap_live_s3_upload");
        }
    };

    const [isWidgetDismissed, setIsWidgetDismissed] = useState(false);

    const dismissWidget = () => {
        setIsWidgetDismissed(true);
    };


    const minimizeWidget = () => setIsWidgetMinimized(true);
    const maximizeWidget = () => setIsWidgetMinimized(false);

    const value = {
        isUploading: phase !== "idle" && phase !== "done" && phase !== "error",
        phase,
        progress,
        encodeProgress,
        statusMessage,
        errorMessage,
        imageCount,
        uploadingEventId,
        startUpload,
        startEncodingPoll: pollEncodingStatus,
        dismissWidget,
        cancelUpload,
        cleanupUploadState,
        minimizeWidget,
        maximizeWidget,
        isWidgetMinimized,
        isWidgetDismissed,
    };

    return (
        <UploadContext.Provider value={value}>
            {children}
            {phase !== "idle" && !isWidgetDismissed && <UploadWidget />}
        </UploadContext.Provider>
    );
}

function UploadWidget() {
    const {
        phase,
        progress,
        encodeProgress,
        statusMessage,
        errorMessage,
        isWidgetMinimized,
        dismissWidget,
        cancelUpload,
        cleanupUploadState,
        minimizeWidget,
        maximizeWidget,
    } = useUpload();

    if (isWidgetMinimized) {
        return (
            <div
                onClick={maximizeWidget}
                className="fixed bottom-6 right-6 z-50 glass rounded-full px-4 py-2 cursor-pointer shadow-xl hover:bg-white/5 transition flex items-center gap-3 animate-slide-up"
            >
                {phase === "uploading" ? (
                    <Loader2 size={16} className="animate-spin text-sky-400" />
                ) : phase === "extracting" ? (
                    <Loader2 size={16} className="animate-spin text-amber-500" />
                ) : phase === "encoding" ? (
                    <Cpu size={16} className="text-sky-400 animate-pulse" />
                ) : phase === "error" ? (
                    <X size={16} className="text-red-400" />
                ) : (
                    <CheckCircle size={16} className="text-emerald-400" />
                )}
                <span className="text-sm font-medium">
                    {phase === "done" ? "Done" : phase === "extracting" ? "Extracting..." : `${phase === "uploading" ? progress : encodeProgress}%`}
                </span>
            </div>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 w-[340px] glass-card rounded-2xl shadow-2xl border border-white/10 overflow-hidden animate-slide-up">
            <div className="p-4 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
                <div className="flex-1 min-w-0 pr-4">
                    <h4 className="font-semibold text-[13px] text-white/90 truncate">
                        {phase === "uploading" ? "Uploading Photos" : "AI Face Recognition"}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-sky-500"></span>
                        </span>
                        <p className="text-[10px] text-white/40 truncate font-medium tracking-tight">{statusMessage}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={minimizeWidget}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors"
                        aria-label="Minimize"
                    >
                        <Minus size={14} />
                    </button>
                    <button
                        onClick={dismissWidget}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors"
                        aria-label="Dismiss"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            <div className="p-5">
                {phase === "error" ? (
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                        <XCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-semibold text-red-400">Error</p>
                            <p className="text-[11px] text-red-400/80 leading-relaxed mt-1">{errorMessage}</p>
                        </div>
                    </div>
                ) : phase === "done" ? (
                    <div className="flex items-center gap-3 py-1">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <CheckCircle size={20} className="text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-emerald-400">All tasks complete!</p>
                            <p className="text-[11px] text-white/30">Your photos are ready.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-between items-end mb-1">
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-lg font-bold tabular-nums text-white/90">
                                    {phase === "uploading" ? progress : encodeProgress}
                                </span>
                                <span className="text-[11px] font-medium text-white/30 uppercase tracking-wider">%</span>
                            </div>
                            {phase === "uploading" && (
                                <button
                                    onClick={cancelUpload}
                                    className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider transition-colors border border-red-500/20"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>

                        <div className="h-2 bg-white/[0.03] rounded-full overflow-hidden border border-white/5 p-[1px]">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(0,0,0,0.5)] ${phase === "uploading" ? "bg-gradient-to-r from-sky-600 to-sky-400" :
                                    phase === "extracting" ? "bg-amber-500 w-full animate-pulse" :
                                        "bg-gradient-to-r from-sky-500 to-blue-500"
                                    }`}
                                style={{ width: phase === "extracting" ? "100%" : `${phase === "uploading" ? progress : encodeProgress}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {phase === "done" && (
                <div className="px-4 pb-4 pt-1 flex justify-end">
                    <Link href="/organizer/dashboard" onClick={dismissWidget} className="btn-ghost text-xs py-1.5 px-3">
                        Go to Event
                    </Link>
                </div>
            )}
        </div>
    );
}

export function useUpload() {
    const context = useContext(UploadContext);
    if (context === undefined) {
        throw new Error("useUpload must be used within an UploadProvider");
    }
    return context;
}
