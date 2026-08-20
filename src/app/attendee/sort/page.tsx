"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
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
type Step = "encode" | "scan" | "loading" | "results";

interface CapturedImage {
  blob: Blob;
  previewUrl: string;
}

interface MatchedPhoto {
  url: string;
  filename: string;
  path: string;
}

const ANGLE_CONFIG: { key: Angle; label: string; instruction: string; icon: string }[] = [
  { key: "front", label: "Front", instruction: "Look straight at the camera", icon: "😐" },
  { key: "left", label: "Left Side", instruction: "Turn your head to the left", icon: "👈" },
  { key: "right", label: "Right Side", instruction: "Turn your head to the right", icon: "👉" },
];

export default function AttendeeSort() {
  const { data: session, status: sessionStatus, update: updateSession } = useSession();
  const router = useRouter();
  const hasEncoding = session?.user?.hasEncoding ?? false;

  // Flow state
  const [step, setStep] = useState<Step>("encode");
  const [eventCode, setEventCode] = useState("");
  const [error, setError] = useState("");

  // Camera state
  const [currentAngle, setCurrentAngle] = useState(0);
  const [captures, setCaptures] = useState<(CapturedImage | null)[]>([null, null, null]);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [encodeStep, setEncodeStep] = useState<"capture" | "review" | "encoding">("capture");
  const [encodeLoading, setEncodeLoading] = useState(false);

  // Results state
  const [matchedPhotos, setMatchedPhotos] = useState<MatchedPhoto[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Set initial step based on encoding status
  useEffect(() => {
    if (sessionStatus === "authenticated") {
      if (hasEncoding) {
        setStep("scan");
      } else {
        setStep("encode");
      }
    }
  }, [sessionStatus, hasEncoding]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) cameraStream.getTracks().forEach((t) => t.stop());
    };
  }, [cameraStream]);

  // Attach stream to video element
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, cameraActive]);

  // ─── Camera ───────────────────────────────────────

  const startCamera = useCallback(async () => {
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

      setCameraStream(stream);
      setCameraActive(true);
      setError("");
    } catch (err: any) {
      console.error("Camera access error:", err);
      const msg = err.name === "NotAllowedError"
        ? "Camera permission denied."
        : `Camera error: ${err.name} - ${err.message || "Unknown error"}`;
      setError(msg);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
  }, [cameraStream]);

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
            next[currentAngle] = { blob, previewUrl };
            return next;
          });
          stopCamera();
        }
      },
      "image/jpeg",
      0.9
    );
  }, [currentAngle, stopCamera]);

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
    if (currentAngle < 2) {
      setCurrentAngle(currentAngle + 1);
      startCamera();
    } else {
      setEncodeStep("review");
    }
  }, [currentAngle, startCamera]);

  const startCapture = useCallback(() => {
    setEncodeStep("capture");
    setCurrentAngle(0);
    setCaptures([null, null, null]);
    startCamera();
  }, [startCamera]);

  const retakeFromReview = useCallback((index: number) => {
    setCurrentAngle(index);
    setEncodeStep("capture");
    setCaptures((prev) => {
      const next = [...prev];
      if (next[index]?.previewUrl) URL.revokeObjectURL(next[index]!.previewUrl);
      next[index] = null;
      return next;
    });
    startCamera();
  }, [startCamera]);

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

    try {
      const images = await Promise.all(captures.map((c) => blobToBase64(c!.blob)));

      const res = await apiClient.post("/api/attendee/encode", { images });
      const data = res.data;

      // Refresh the session to pick up the new has_encoding flag
      await updateSession();
      setStep("scan");
    } catch {
      setError("Network error during encoding.");
      setEncodeStep("review");
    } finally {
      setEncodeLoading(false);
    }
  };



  // ─── Sort/Scan ────────────────────────────────────

  const handleScan = async () => {
    if (!eventCode || eventCode.length !== 6) return;
    setStep("loading");
    setError("");

    try {
      const res = await apiClient.post("/api/attendee/sort", { eventCode: eventCode.toUpperCase() });
      const data = res.data;

      if (data.matchesFound > 0 && data.eventId) {
        // Redirect to the event detail page with cached results
        router.push(`/attendee/events/${data.eventId}`);
      } else {
        setError("No matching photos found for this event.");
        setStep("scan");
      }
    } catch {
      setError("Network error during scan.");
      setStep("scan");
    }
  };

  const angleConfig = ANGLE_CONFIG[currentAngle];
  const currentCapture = captures[currentAngle];
  const allCaptured = captures.every((c) => c !== null);

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
          <h1 className="text-2xl font-bold mb-2 text-[var(--foreground)]">Find Your Photos</h1>
          <p className="text-[var(--foreground-secondary)] text-[14px] mb-8">
            Sign in to find your event photos using AI face recognition.
          </p>
          <button
            onClick={() => signIn(undefined, { callbackUrl: "/attendee/sort" })}
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

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold mb-1 text-[var(--foreground)]">
            {step === "encode" && encodeStep === "capture" && `Step ${currentAngle + 1} of 3`}
            {step === "encode" && encodeStep === "review" && "Review Photos"}
            {step === "encode" && encodeStep === "encoding" && "Encoding Face..."}
            {step === "scan" && "Find Your Photos"}
            {step === "loading" && "Scanning..."}
            {step === "results" && `${matchedPhotos.length} Photo${matchedPhotos.length !== 1 ? "s" : ""} Found`}
          </h1>
          <p className="text-[var(--foreground-secondary)] text-[14px]">
            {step === "encode" && encodeStep === "capture" && angleConfig.instruction}
            {step === "encode" && encodeStep === "review" && "Tap any photo to retake it."}
            {step === "encode" && encodeStep === "encoding" && "Processing your face data..."}
            {step === "scan" && "Enter an event code to search."}
            {step === "loading" && "Matching against event photos..."}
            {step === "results" && ""}
          </p>
        </div>

        {/* Progress dots for encode */}
        {step === "encode" && (encodeStep === "capture" || encodeStep === "review") && (
          <div className="flex items-center justify-center gap-2 mb-6">
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
        {step === "encode" && encodeStep === "capture" && (
          <div className="space-y-4">
            {error && (
              <div className="bg-red-950 border border-red-900 rounded-md px-4 py-3 text-red-400 text-[14px] mb-4 flex items-center justify-between">
                <span className="break-all pr-2">{error}</span>
                <button type="button" onClick={() => { setError(""); startCapture(); }} className="shrink-0 bg-red-900/50 px-2 py-1 rounded text-[12px] hover:bg-red-900">
                  Try Again
                </button>
              </div>
            )}

            {!cameraActive && !currentCapture && (
              <div className="bg-[var(--card-hover)] border border-[var(--border)] rounded-xl p-8 text-center">
                <div className="w-12 h-12 rounded-md bg-[var(--border)] flex items-center justify-center mx-auto mb-4">
                  <Camera size={20} className="text-[var(--foreground-secondary)]" />
                </div>
                <p className="font-semibold text-[var(--foreground)] mb-2">Face Scan Required</p>
                <p className="text-[14px] text-[var(--foreground-secondary)] mb-6">
                  We need 3 photos of your face to find you in event photos.
                </p>
                <button onClick={startCapture} className="btn-primary flex items-center justify-center gap-2 mx-auto">
                  <Camera size={16} /> Start Face Scan
                </button>
              </div>
            )}

            {cameraActive && !currentCapture && (
              <>
                <div className="bg-[var(--card-hover)] border border-[var(--border)] rounded-md px-4 py-2 flex items-center justify-center gap-3">
                  <span className="text-lg">{angleConfig.icon}</span>
                  <p className="font-medium text-[14px] text-[var(--foreground)]">{angleConfig.label}</p>
                </div>

                <div className="relative rounded-xl overflow-hidden aspect-[4/5] bg-[var(--card-hover)] ring-1 ring-zinc-800">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: "scaleX(-1)" }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-40 h-48 rounded-[100px] border-2 border-zinc-100/20 border-dashed" />
                  </div>
                  <div className="absolute top-3 left-3 bg-[var(--card-hover)]/80 backdrop-blur-sm rounded-md px-2 py-1 text-[11px] text-[var(--foreground-secondary)] font-medium border border-[var(--border)]">
                    {currentAngle + 1} / 3
                  </div>
                </div>

                <button onClick={capturePhoto} className="btn-primary w-full flex items-center justify-center gap-2">
                  <Camera size={16} /> Capture
                </button>
              </>
            )}

            {currentCapture && (
              <div className="space-y-4">
                <div className="bg-[var(--card-hover)] border border-[var(--border)] rounded-md px-4 py-2 flex items-center justify-center gap-3">
                  <span className="text-lg">{angleConfig.icon}</span>
                  <p className="font-medium text-[14px] text-[var(--foreground)]">{angleConfig.label}</p>
                </div>

                <div className="relative rounded-xl overflow-hidden aspect-[4/5] ring-1 ring-zinc-800 bg-[var(--card-hover)]">
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
                    {currentAngle < 2 ? (<>Next <ChevronRight size={16} /></>) : (<>Review All</>)}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ENCODE STEP — Review ── */}
        {step === "encode" && encodeStep === "review" && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              {ANGLE_CONFIG.map((angle, i) => (
                <div key={angle.key} className="space-y-2">
                  <div
                    className="relative rounded-md overflow-hidden aspect-[3/4] ring-1 ring-zinc-800 bg-[var(--card-hover)] group cursor-pointer"
                    onClick={() => retakeFromReview(i)}
                  >
                    {captures[i] ? (
                      <>
                        <Image src={captures[i]!.previewUrl} alt={angle.label} fill className="object-cover" />
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
                  <p className="text-[11px] font-medium text-[var(--foreground-secondary)] text-center uppercase tracking-wider">{angle.label}</p>
                </div>
              ))}
            </div>

            {error && (
              <div className="bg-red-950 border border-red-900 rounded-md px-4 py-3 text-red-400 text-sm flex items-center justify-between">
                {error}
                <button onClick={() => setError("")}><X size={16} /></button>
              </div>
            )}

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
          </div>
        )}

        {/* ── ENCODE STEP — Encoding in progress ── */}
        {step === "encode" && encodeStep === "encoding" && (
          <div className="bg-[var(--card-hover)] border border-[var(--border)] rounded-xl p-10 text-center">
            <Loader2 size={32} className="animate-spin text-[var(--foreground-secondary)] mx-auto mb-4" />
            <p className="font-semibold text-[var(--foreground)] mb-1">Encoding Your Face...</p>
            <p className="text-[14px] text-[var(--foreground-secondary)]">
              Our AI is processing your photos. This may take a moment.
            </p>
          </div>
        )}

        {/* ── SCAN STEP ── */}
        {step === "scan" && (
          <div className="space-y-6">
            <div className="bg-[var(--card-hover)] border border-[var(--border)] rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <CheckCircle size={16} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-[var(--foreground)]">Face Encoded</p>
                  <p className="text-[13px] text-[var(--foreground-secondary)]">Your face data is ready for matching.</p>
                </div>
              </div>

              <label className="text-[13px] font-medium text-[var(--foreground-secondary)] mb-2 block">Event Code</label>
              <input
                type="text"
                value={eventCode}
                onChange={(e) => setEventCode(e.target.value.toUpperCase())}
                placeholder="ENTER 6 CHARACTERS"
                maxLength={6}
                className="input-field text-center text-lg font-mono tracking-[0.2em] uppercase h-12 placeholder:tracking-normal placeholder:font-sans"
              />
            </div>

            {error && (
              <div className="bg-red-950 border border-red-900 rounded-md px-4 py-3 text-red-400 text-sm flex items-center justify-between">
                {error}
                <button onClick={() => setError("")}><X size={16} /></button>
              </div>
            )}

            <button
              onClick={handleScan}
              disabled={eventCode.length !== 6}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Search size={16} /> Find My Photos
            </button>
          </div>
        )}

        {/* ── LOADING ── */}
        {step === "loading" && (
          <div className="bg-[var(--card-hover)] border border-[var(--border)] rounded-xl p-10 text-center">
            <Loader2 size={32} className="animate-spin text-[var(--foreground-secondary)] mx-auto mb-4" />
            <p className="font-semibold text-[var(--foreground)] mb-1">Scanning event photos...</p>
            <p className="text-[14px] text-[var(--foreground-secondary)]">Matching your face against the event album</p>
          </div>
        )}

        {/* ── RESULTS ── */}
        {step === "results" && (
          <div className="space-y-6">
            {matchedPhotos.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-[var(--foreground)]">
                    <CheckCircle size={18} className="text-emerald-500" />
                    {matchedPhotos.length} photo{matchedPhotos.length !== 1 ? "s" : ""} found
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {matchedPhotos.map((photo, i) => (
                    <div key={i} className="relative group rounded-md overflow-hidden aspect-square bg-[var(--card-hover)] ring-1 ring-zinc-800">
                      <Image src={photo.url} alt={photo.filename} fill className="object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="text-xs text-[var(--foreground)] truncate">{photo.filename}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="bg-[var(--card-hover)] border border-[var(--border)] rounded-xl p-10 text-center">
                <p className="text-lg font-semibold mb-2 text-[var(--foreground)]">No photos found</p>
                <p className="text-[14px] text-[var(--foreground-secondary)] mb-4">
                  We couldn&apos;t find any matching photos. Try a different event code.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setStep("scan"); setMatchedPhotos([]); setEventCode(""); }}
                className="btn-ghost flex-1 flex items-center justify-center gap-2"
              >
                <Search size={16} /> New Search
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
