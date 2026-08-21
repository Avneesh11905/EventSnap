"use client";

import React, { useEffect, useState, useRef, useCallback, Suspense } from "react";
import Image from "next/image";
import { useSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Camera,
  Loader2,
  X,
  Search,
  CheckCircle,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Scan,
  LogIn,
} from "lucide-react";
import { apiClient } from "@/lib/axios";

type Angle = "front" | "left" | "right";

interface CapturedImage {
  blob: Blob;
  previewUrl: string;
  width: number;
  height: number;
}

const ANGLE_CONFIG: { key: Angle; label: string; instruction: string; icon: string }[] = [
  { key: "front", label: "Front", instruction: "Look straight at the camera", icon: "😐" },
  { key: "left", label: "Left Side", instruction: "Turn your head to the left", icon: "👈" },
  { key: "right", label: "Right Side", instruction: "Turn your head to the right", icon: "👉" },
];

function AttendeeSetupContent() {
  const { data: session, status: sessionStatus, update: updateSession } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasEncoding = session?.user?.hasEncoding ?? false;

  // Flow state
      const [error, setError] = useState("");
  const [multiFaceErrors, setMultiFaceErrors] = useState<{ image_index: number, bboxes: number[][], issue?: string }[]>([]);

  // Camera state
  const [currentAngle, setCurrentAngle] = useState(0);
  const [captures, setCaptures] = useState<(CapturedImage | null)[]>([null, null, null]);
  const [backupCapture, setBackupCapture] = useState<{ index: number, data: CapturedImage } | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [encodeStep, setEncodeStep] = useState<"capture" | "review" | "encoding">("capture");
  const [encodeLoading, setEncodeLoading] = useState(false);

  const allCaptured = captures.every((c) => c !== null);

  // Results state
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Redirect to dashboard if they already have an encoding and aren't rescanning
  useEffect(() => {
    if (sessionStatus === "authenticated") {
      const isRescan = searchParams?.get("rescan") === "true";
      if (hasEncoding && !isRescan) {
        router.replace("/attendee/dashboard");
      }
    }
  }, [sessionStatus, hasEncoding, searchParams, router]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) cameraStream.getTracks().forEach((t) => t.stop());
    };
  }, [cameraStream]);

  // Attach stream to video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  // ─── Camera ───────────────────────────────────────

  const startCamera = useCallback(async () => {
    setIsStartingCamera(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not available. Please ensure you are using HTTPS.");
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        });
      } catch (innerErr) {
        console.warn("Failed with constraints, falling back to basic video:", innerErr);
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      setCameraStream((prev) => {
        if (prev) prev.getTracks().forEach((t) => t.stop());
        return stream;
      });
      setCameraActive(true);
      setError("");
    } catch (err: any) {
      console.error("Camera access error:", err);
      const msg = err.name === "NotAllowedError"
        ? "Camera permission denied."
        : `Camera error: ${err.name} - ${err.message || "Unknown error"}`;
      setError(msg);
    } finally {
      setIsStartingCamera(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    setCameraStream((prev) => {
      if (prev) {
        prev.getTracks().forEach((t) => t.stop());
      }
      return null;
    });
    setCameraActive(false);
  }, []);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const previewUrl = URL.createObjectURL(blob);
          setCaptures((prev) => {
            const next = [...prev];
            if (next[currentAngle]?.previewUrl) {
              URL.revokeObjectURL(next[currentAngle]!.previewUrl);
            }
            next[currentAngle] = { 
              blob, 
              previewUrl, 
              width: canvas.width, 
              height: canvas.height 
            };
            return next;
          });
          if (backupCapture) {
            URL.revokeObjectURL(backupCapture.data.previewUrl);
            setBackupCapture(null);
          }
          stopCamera();
        }
      },
      "image/jpeg",
      0.9
    );
  }, [currentAngle, stopCamera, backupCapture]);

  const retakeCurrentAngle = useCallback(() => {
    setCaptures((prev) => {
      const next = [...prev];
      if (next[currentAngle]?.previewUrl) {
        URL.revokeObjectURL(next[currentAngle]!.previewUrl);
      }
      next[currentAngle] = null;
      return next;
    });
    startCamera();
  }, [currentAngle, startCamera]);

  const proceedToNextAngle = useCallback(() => {
    if (allCaptured) {
      setEncodeStep("review");
    } else {
      // Find the next missing photo starting from the current angle
      const nextMissing = captures.findIndex((c, i) => c === null && i > currentAngle);
      if (nextMissing !== -1) {
        setCurrentAngle(nextMissing);
        startCamera();
      } else {
        // Wrap around to find any missing photo
        const anyMissing = captures.findIndex((c) => c === null);
        if (anyMissing !== -1) {
          setCurrentAngle(anyMissing);
          startCamera();
        } else {
          setEncodeStep("review");
        }
      }
    }
  }, [allCaptured, captures, currentAngle, startCamera]);

  const startCapture = useCallback(() => {
    setEncodeStep("capture");
    setCurrentAngle(0);
    setCaptures([null, null, null]);
    setMultiFaceErrors([]);
    startCamera();
  }, [startCamera]);

  const retakeFromReview = useCallback((index: number) => {
    setCurrentAngle(index);
    setEncodeStep("capture");
    setMultiFaceErrors((prev) => prev.filter((err) => err.image_index !== index));
    setCaptures((prev) => {
      const next = [...prev];
      if (next[index]) {
        setBackupCapture({ index, data: next[index]! });
      }
      next[index] = null;
      return next;
    });
    startCamera();
  }, [startCamera]);

  const cancelRecapture = useCallback(() => {
    if (backupCapture) {
      setCaptures((prev) => {
        const next = [...prev];
        next[backupCapture.index] = backupCapture.data;
        return next;
      });
      setBackupCapture(null);
      stopCamera();
      setEncodeStep("review");
    }
  }, [backupCapture, stopCamera]);

  // ─── Encode ───────────────────────────────────────

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        resolve(dataUrl.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleEncode = async () => {
    if (captures.some((c) => !c)) return;
    setEncodeStep("encoding");
    setEncodeLoading(true);
    setError("");
    setMultiFaceErrors([]);

    try {
      const images = await Promise.all(captures.map((c) => blobToBase64(c!.blob)));

      const res = await apiClient.post("/api/attendee/encode", { images });
      const data = res.data;

      // Refresh the session to pick up the new has_encoding flag
      await updateSession();
      router.replace("/attendee/dashboard");
    } catch (err: any) {
      const errorType = err.response?.data?.type;
      if (
        errorType === "MultipleFacesDetectedError" || 
        errorType === "NoFacesDetectedError" || 
        errorType === "FaceValidationError"
      ) {
        setError(""); // Clear global error, let multiFaceErrors handle the UI
        setMultiFaceErrors(err.response.data.details || []);
      } else {
        setError(err.response?.data?.error || err.response?.data?.err || "Network error during encoding.");
      }
      setEncodeStep("review");
    } finally {
      setEncodeLoading(false);
    }
  };



  // ─── Sort/Scan ────────────────────────────────────

  const angleConfig = ANGLE_CONFIG[currentAngle];
  const currentCapture = captures[currentAngle];

  // ─── Loading State ────────────────────────────────
  if (sessionStatus === "loading") {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[var(--foreground-secondary)]" />
      </div>
    );
  }

  // ─── Not Authenticated ────────────────────────────
  if (sessionStatus === "unauthenticated") {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-4 py-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--card-hover)] border border-[var(--border)] flex items-center justify-center mx-auto mb-6">
            <Camera size={28} className="text-[var(--foreground-secondary)]" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-[var(--foreground)]">Face Scan Setup</h1>
          <p className="text-[var(--foreground-secondary)] text-[14px] mb-8">
            Sign in to set up your face scan for AI photo matching.
          </p>
          <button
            onClick={() => signIn(undefined, { callbackUrl: "/attendee/setup" })}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <LogIn size={16} /> Sign In to Continue
          </button>
        </div>
      </div>
    );
  }

  // ─── Authenticated ────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-4 py-6">
      <canvas ref={canvasRef} className="hidden" />

      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-4">
          <div className="relative flex items-center justify-center mb-1">
            <h1 className="text-xl font-bold text-[var(--foreground)]">
              {encodeStep === "capture" && `Step ${currentAngle + 1} of 3`}
              {encodeStep === "review" && "Review Photos"}
              {encodeStep === "encoding" && "Encoding Face..."}
            </h1>
          </div>
          <p className="text-center text-[var(--foreground-secondary)] text-[14px]">
            {encodeStep === "capture" && angleConfig.instruction}
            {encodeStep === "review" && "Tap any photo to retake it."}
            {encodeStep === "encoding" && "Processing your face data..."}
          </p>
        </div>

        {/* Progress dots for encode */}
        {(encodeStep === "capture" || encodeStep === "review") && (
          <div className="flex items-center justify-center gap-2 mb-4">
            {ANGLE_CONFIG.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${captures[i]
                  ? "w-8 bg-zinc-400"
                  : i === currentAngle && encodeStep === "capture"
                    ? "w-8 bg-zinc-100"
                    : "w-4 bg-[var(--border)]"
                  }`}
              />
            ))}
          </div>
        )}

        {/* ── ENCODE STEP — Camera Capture ── */}
        {encodeStep === "capture" && (
          <div className="space-y-3">
            {error && (
              <div className="bg-red-950 border border-red-900 rounded-md px-4 py-3 text-red-400 text-[14px] mb-4 flex items-center justify-between">
                <span className="break-all pr-2">{error}</span>
                <button type="button" onClick={() => { setError(""); startCapture(); }} className="shrink-0 bg-red-900/50 px-2 py-1 rounded text-[12px] hover:bg-red-900">
                  Try Again
                </button>
              </div>
            )}

            {!cameraActive && !currentCapture && !isStartingCamera && captures.every(c => c === null) && (
              <div className="bg-[var(--card-hover)] border border-[var(--border)] rounded-xl p-8 text-center">
                <div className="w-12 h-12 rounded-md bg-[var(--border)] flex items-center justify-center mx-auto mb-4">
                  <Camera size={20} className="text-[var(--foreground-secondary)]" />
                </div>
                <p className="font-semibold text-[var(--foreground)] mb-2">Face Scan Required</p>
                <p className="text-[14px] text-[var(--foreground-secondary)] mb-6">
                  We need 3 photos of your face to find you in event photos.
                </p>
                <div className="flex flex-col gap-3">
                  <button onClick={startCapture} className="btn-primary flex items-center justify-center gap-2 mx-auto w-full">
                    <Camera size={16} /> Start Face Scan
                  </button>
                    <button onClick={() => router.push("/attendee/dashboard")} className="btn-ghost flex items-center justify-center gap-2 mx-auto w-full text-[var(--foreground-secondary)]">
                      Cancel
                    </button>
                </div>
              </div>
            )}

            {!cameraActive && !currentCapture && (isStartingCamera || captures.some(c => c !== null)) && (
              <div className="bg-[var(--card-hover)] border border-[var(--border)] rounded-xl aspect-square flex flex-col items-center justify-center text-[var(--foreground-secondary)] ring-1 ring-zinc-800">
                <Loader2 size={32} className="animate-spin mb-4" />
                <p className="text-sm font-medium">Starting Camera...</p>
              </div>
            )}

            {cameraActive && !currentCapture && (
              <>
                <div className="bg-[var(--card-hover)] border border-[var(--border)] rounded-md px-4 py-2 flex items-center justify-center gap-3">
                  <span className="text-lg">{angleConfig.icon}</span>
                  <p className="font-medium text-[14px] text-[var(--foreground)]">{angleConfig.label}</p>
                </div>

                <div className="relative rounded-xl overflow-hidden aspect-square bg-[var(--card-hover)] ring-1 ring-zinc-800">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: "scaleX(-1)" }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 rounded-full border-2 border-zinc-100/20 border-dashed" />
                  </div>
                  <div className="absolute top-3 left-3 bg-[var(--card-hover)]/80 backdrop-blur-sm rounded-md px-2 py-1 text-[11px] text-[var(--foreground-secondary)] font-medium border border-[var(--border)]">
                    {currentAngle + 1} / 3
                  </div>
                </div>

                <div className="flex gap-3">
                  {backupCapture && (
                    <button onClick={cancelRecapture} className="btn-ghost flex-1 flex items-center justify-center gap-2 bg-[var(--card-hover)] border border-[var(--border)] text-[var(--foreground-secondary)]">
                      <X size={16} /> Cancel
                    </button>
                  )}
                  <button onClick={() => router.push("/attendee/dashboard")} className="btn-ghost w-full flex items-center justify-center gap-2 text-[var(--foreground-secondary)]">
                    Cancel 
                  </button>
                  <button onClick={capturePhoto} className="btn-primary flex items-center justify-center gap-2  w-full">
                    <Camera size={16} /> Capture
                  </button>
                </div>
              </>
            )}

            {currentCapture && (
              <div className="space-y-3">
                <div className="bg-[var(--card-hover)] border border-[var(--border)] rounded-md px-4 py-2 flex items-center justify-center gap-3">
                  <span className="text-lg">{angleConfig.icon}</span>
                  <p className="font-medium text-[14px] text-[var(--foreground)]">{angleConfig.label}</p>
                </div>

                <div className="relative rounded-xl overflow-hidden aspect-square ring-1 ring-zinc-800 bg-[var(--card-hover)]">
                  <Image src={currentCapture.previewUrl} alt={`${angleConfig.label} capture`} fill className="object-cover" />
                  <div className="absolute top-3 right-3">
                    <div className="bg-[var(--card-hover)] border border-[var(--border)] rounded-md p-1.5">
                      <CheckCircle size={16} className="text-[var(--foreground-secondary)]" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={retakeCurrentAngle} className="btn-ghost flex-1 flex items-center justify-center gap-2 bg-[var(--card-hover)] border border-[var(--border)]">
                    <RotateCcw size={16} /> Retake
                  </button>
                  <button onClick={proceedToNextAngle} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {!allCaptured ? (<>Next <ChevronRight size={16} /></>) : (<>Review All</>)}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ENCODE STEP — Review ── */}
        {encodeStep === "review" && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              {ANGLE_CONFIG.map((angle, i) => {
                const multiFaceError = multiFaceErrors.find((e) => e.image_index === i);
                return (
                  <div key={angle.key} className="space-y-2">
                    <div
                      className={`relative rounded-md overflow-hidden aspect-square ring-2 bg-[var(--card-hover)] group cursor-pointer ${
                        multiFaceError ? "ring-red-500" : "ring-zinc-800"
                      }`}
                      onClick={() => retakeFromReview(i)}
                    >
                      {captures[i] ? (
                        <>
                          <Image src={captures[i]!.previewUrl} alt={angle.label} fill className="object-cover" />
                          
                          {multiFaceError && captures[i]!.width && captures[i]!.height && (
                            <svg 
                              viewBox={`0 0 ${captures[i]!.width} ${captures[i]!.height}`} 
                              preserveAspectRatio="xMidYMid slice" 
                              className="absolute inset-0 w-full h-full pointer-events-none"
                            >
                              {multiFaceError.bboxes.map((bbox, boxIdx) => (
                                <rect 
                                  key={boxIdx}
                                  x={bbox[0]} 
                                  y={bbox[1]} 
                                  width={bbox[2] - bbox[0]} 
                                  height={bbox[3] - bbox[1]} 
                                  fill="none" 
                                  stroke="#ef4444" 
                                  strokeWidth={Math.max(4, captures[i]!.width * 0.01)}
                                />
                              ))}
                            </svg>
                          )}

                          <div className="absolute inset-0 bg-[var(--background)]/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="flex flex-col items-center gap-1 text-[var(--foreground-secondary)]">
                              <RotateCcw size={16} />
                              <span className="text-[10px] font-medium">Retake</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-[var(--card-hover)] flex items-center justify-center">
                          <X size={18} className="text-[var(--foreground-secondary)]" />
                        </div>
                      )}
                    </div>
                    <p className={`text-[11px] font-medium text-center uppercase tracking-wider ${multiFaceError ? "text-red-400" : "text-[var(--foreground-secondary)]"}`}>{angle.label}</p>
                    {multiFaceError && (
                      <p className="text-[10px] text-red-500 font-medium text-center leading-tight">
                        {multiFaceError.issue === "none" ? "No face detected" : "Multiple faces"}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {error && (
              <div className="bg-red-950 border border-red-900 rounded-md px-4 py-3 text-red-400 text-sm flex items-center justify-between">
                {error}
                <button onClick={() => setError("")}><X size={16} /></button>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <button
                  onClick={() => { startCapture(); }}
                  className="btn-ghost flex-1 flex items-center justify-center gap-2 bg-[var(--card-hover)] border border-[var(--border)]"
                >
                  <ChevronLeft size={16} /> Retake All
                </button>
                <button
                  onClick={handleEncode}
                  disabled={!allCaptured || encodeLoading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {encodeLoading ? (
                    <><Loader2 size={16} className="animate-spin" /> Encoding...</>
                  ) : (
                    <><Scan size={16} /> Encode Face</>
                  )}
                </button>
              </div>
              {searchParams?.get("rescan") === "true" && (
                <button onClick={() => router.push("/attendee/dashboard")} className="btn-ghost w-full flex items-center justify-center gap-2 text-[var(--foreground-secondary)]">
                  Cancel Rescan
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── ENCODE STEP — Encoding in progress ── */}
        {encodeStep === "encoding" && (
          <div className="bg-[var(--card-hover)] border border-[var(--border)] rounded-xl p-10 text-center">
            <Loader2 size={32} className="animate-spin text-[var(--foreground-secondary)] mx-auto mb-4" />
            <p className="font-semibold text-[var(--foreground)] mb-1">Encoding Your Face...</p>
            <p className="text-[14px] text-[var(--foreground-secondary)]">
              Our AI is processing your photos. This may take a moment.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

export default function AttendeeSetup() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-64px)] flex items-center justify-center"><Loader2 size={32} className="animate-spin text-[var(--foreground-secondary)]" /></div>}>
      <AttendeeSetupContent />
    </Suspense>
  );
}
