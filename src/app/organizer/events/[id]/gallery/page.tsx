"use client";

import React, { useEffect, use } from "react";
import Image from "next/image";
import { useGallery } from "@/hooks/useGallery";
import { useInView } from "react-intersection-observer";
import { AlertCircle, CheckCircle2, Loader2, ImageOff, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function GalleryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: eventId } = use(params);

  const {
    images,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    selectedKeys,
    toggleSelection,
    selectAll,
    clearSelection,
    deleteSelected,
    isDeleting,
    deleteProgress,
  } = useGallery(eventId);

  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isError) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center text-red-500">
        Failed to load gallery.
      </div>
    );
  }

  const handleSelectAll = () => {
    const allKeys = images.map((img) => img.key);
    selectAll(allKeys);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[var(--background)]">
      <div className="container mx-auto px-6 py-10 relative">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href={`/organizer/dashboard`}
              className="inline-flex items-center gap-1.5 text-[13px] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors w-fit font-medium"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </Link>
            <Link
              href={`/organizer/events/${eventId}`}
              className="inline-flex items-center gap-1.5 text-[13px] text-sky-400 hover:text-sky-300 transition-colors w-fit font-medium ml-auto"
            >
              Upload More Photos
            </Link>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--border)]">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Event Gallery</h1>
              <p className="text-sm text-[var(--foreground-secondary)] mt-1">Manage and moderate uploaded images.</p>
            </div>
          <div className="space-x-4">
            <button
              className="bg-[var(--card-hover)] border border-[var(--border)] hover:border-zinc-500 text-[var(--foreground)] px-4 py-2 rounded-md font-medium text-sm transition-colors"
              onClick={handleSelectAll}
            >
              Select All Loaded
            </button>
            <button
              className="bg-[var(--card-hover)] border border-[var(--border)] hover:border-zinc-500 text-[var(--foreground)] px-4 py-2 rounded-md font-medium text-sm transition-colors disabled:opacity-50 disabled:hover:border-[var(--border)]"
              onClick={clearSelection}
              disabled={selectedKeys.size === 0}
            >
              Clear Selection
            </button>
          </div>
        </div>
        </div>

        {images.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-32 rounded-xl border border-dashed border-[var(--border)] bg-[var(--card-hover)]/30 mt-8">
            <div className="w-16 h-16 rounded-2xl bg-[var(--card-hover)] border border-[var(--border)] flex items-center justify-center mb-4">
              <ImageOff className="h-8 w-8 text-[var(--foreground-secondary)]" />
            </div>
            <p className="text-lg font-medium text-[var(--foreground)]">No images found</p>
            <p className="text-sm text-[var(--foreground-secondary)] mt-1">Images uploaded to this event will appear here.</p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 pb-32 pt-8">
          {images.map((image) => (
            <div
              key={image.key}
              onClick={() => toggleSelection(image.key)}
              className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                selectedKeys.has(image.key)
                  ? "border-primary shadow-lg scale-95"
                  : "border-transparent hover:border-muted"
              }`}
            >
              <Image
                src={image.url}
                alt="Gallery thumbnail"
                fill
                unoptimized
                className="object-cover"
              />
              
              {/* Checkbox Overlay */}
              <div
                className={`absolute top-2 left-2 z-10 transition-opacity ${
                  selectedKeys.has(image.key) ? "opacity-100" : "opacity-0"
                }`}
              >
                <CheckCircle2 className="h-6 w-6 text-primary fill-background" />
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

        {/* Floating Bulk Action Bar */}
        {selectedKeys.size > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-zinc-900/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/60 border border-zinc-800 shadow-2xl rounded-full px-6 py-4 flex items-center gap-6 z-50 animate-in slide-in-from-bottom-10 text-white">
            <span className="font-medium whitespace-nowrap">
              {selectedKeys.size} image{selectedKeys.size !== 1 ? "s" : ""} selected
            </span>

            <button
              className="bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded-md transition-colors flex items-center disabled:opacity-50"
              disabled={isDeleting}
              onClick={() => {
                if (window.confirm(`Are you absolutely sure you want to delete ${selectedKeys.size} image${selectedKeys.size !== 1 ? "s" : ""}? This cannot be undone.`)) {
                  deleteSelected();
                }
              }}
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
      </div>
    </div>
  );
}
