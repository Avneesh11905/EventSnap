import { useState, useCallback } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

interface GalleryImage {
  key: string;
  url: string;
  status: "pending" | "no_faces" | "has_faces";
}

interface GalleryResponse {
  images: GalleryImage[];
  nextCursor: string | null;
}

export function useGallery(eventId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["gallery", eventId];

  // 1. Data Fetching via React Query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery<GalleryResponse>({
    queryKey,
    queryFn: async ({ pageParam = "" }) => {
      const cursorParam = pageParam ? `?cursor=${encodeURIComponent(pageParam as string)}` : "";
      const res = await fetch(`/api/events/${eventId}/images${cursorParam}`);
      if (!res.ok) throw new Error("Failed to fetch gallery");
      return res.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    initialPageParam: "",
  });

  // 2. Selection State
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const toggleSelection = useCallback((key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((keysToSelect: string[]) => {
    setSelectedKeys(new Set(keysToSelect));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedKeys(new Set());
  }, []);

  // 3. Bulk Deletion & SSE
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);

  const deleteSelected = useCallback(async () => {
    if (selectedKeys.size === 0) return;
    
    setIsDeleting(true);
    setDeleteProgress(0);

    const keysArray = Array.from(selectedKeys);

    try {
      // Step A: Trigger bulk delete proxy
      const res = await fetch(`/api/events/${eventId}/images`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys: keysArray }),
      });

      if (!res.ok) throw new Error("Failed to initiate deletion");
      
      const { task_id } = await res.json();
      
      // Step B: Listen to SSE stream
      const backendUrl = process.env.NEXT_PUBLIC_INFERENCE_BACKEND_URL || "http://localhost:8000";
      const eventSource = new EventSource(`${backendUrl}/api/tasks/stream?taskId=${task_id}`);

      eventSource.addEventListener("message", (e) => {
        const data = JSON.parse(e.data);
        if (data.info?.progress) {
          setDeleteProgress(data.info.progress);
        }
      });

      eventSource.addEventListener("done", async () => {
        eventSource.close();
        
        // Step C: Optimistically remove from cache
        queryClient.setQueryData(queryKey, (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              images: page.images.filter((img: GalleryImage) => !selectedKeys.has(img.key))
            }))
          };
        });

        clearSelection();

        // Step D: Reconcile counts
        try {
          await fetch(`/api/events/${eventId}/reconcile`, { method: "POST" });
        } catch (err) {
          console.error("Reconciliation failed after deletion:", err);
        }

        setIsDeleting(false);
        setDeleteProgress(100);
      });

      eventSource.onerror = (err) => {
        console.error("SSE Error:", err);
        eventSource.close();
        setIsDeleting(false);
      };

    } catch (error) {
      console.error("Deletion process failed:", error);
      setIsDeleting(false);
    }
  }, [eventId, selectedKeys, queryClient, queryKey, clearSelection]);

  const allImages = data?.pages.flatMap((page) => page.images) || [];

  return {
    // Data
    images: allImages,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,

    // Selection
    selectedKeys,
    toggleSelection,
    selectAll,
    clearSelection,

    // Actions
    deleteSelected,
    isDeleting,
    deleteProgress,
  };
}
