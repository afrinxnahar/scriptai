"use client";

import { useState, useCallback } from "react";
import { api, ApiClientError } from "@/lib/api-client";
import { toast } from "sonner";

export interface ChannelVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  viewCount: number;
}

interface ChannelVideosResponse {
  videos: ChannelVideo[];
  nextPageToken?: string;
}

export function useChannelVideos() {
  const [videos, setVideos] = useState<ChannelVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = useCallback(async (pageToken?: string) => {
    const isLoadMore = !!pageToken;
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      setError(null);
      const params = new URLSearchParams();
      if (pageToken) params.set("pageToken", pageToken);
      params.set("maxResults", "6");

      const data = await api.get<ChannelVideosResponse>(
        `/api/v1/youtube/channel-videos?${params.toString()}`,
        { requireAuth: true },
      );

      setVideos((prev) => (isLoadMore ? [...prev, ...data.videos] : data.videos));
      setNextPageToken(data.nextPageToken);
      setHasMore(!!data.nextPageToken);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : "Failed to load videos";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (nextPageToken && !loadingMore) {
      fetchVideos(nextPageToken);
    }
  }, [nextPageToken, loadingMore, fetchVideos]);

  return { videos, loading, loadingMore, hasMore, error, fetchVideos, loadMore };
}
