"use client"

import { useState, useEffect, useRef } from "react"
import { useSupabase } from "@/components/supabase-provider"
import { toast } from "sonner"
import { connectYoutubeChannel } from "@/lib/connectYT"
import { api, ApiClientError } from "@/lib/api-client"

type Video = {
  id: number;
  url: string;
  title?: string;
  thumbnail?: string;
  status: 'empty' | 'loading' | 'loaded' | 'error';
  error?: string;
};

const initialVideos: Video[] = [
  { id: 1, url: "", status: 'empty' },
  { id: 2, url: "", status: 'empty' },
  { id: 3, url: "", status: 'empty' },
];

interface TrainAiResponse {
  message: string;
  jobId: string;
}

interface JobEvent {
  state: 'waiting' | 'active' | 'completed' | 'failed';
  progress: number;
  message: string;
  logs?: string[];
  error?: string;
  finished: boolean;
}

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export function useAITraining() {
  const { profile, user, session, supabase, profileLoading: pageLoading, fetchUserProfile } = useSupabase()

  const [videos, setVideos] = useState<Video[]>(initialVideos);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isConnectingYoutube, setIsConnectingYoutube] = useState(false);

  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [isTraining, setIsTraining] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;

  const handleAddVideoUrl = () => {
    if (videos.length < 5) {
      setVideos([...videos, { id: Date.now(), url: "", status: 'empty' }]);
    }
  };

  const handleRemoveVideoUrl = (indexToRemove: number) => {
    setVideos(videos.filter((_, index) => index !== indexToRemove));
  };

  const handleVideoUrlChange = (index: number, value: string) => {
    const newVideos = [...videos];
    if (!newVideos[index]) return;

    newVideos[index].url = value;
    if (newVideos[index].status !== 'empty') {
      newVideos[index].status = 'empty';
      delete newVideos[index].title;
      delete newVideos[index].thumbnail;
    }
    setVideos(newVideos);
  };

  const handleUrlBlur = async (index: number) => {
    const video = videos[index];
    if (!video?.url || video.status === 'loaded') return;

    if (!youtubeRegex.test(video.url)) {
      video.status = 'error';
      video.error = "Invalid YouTube URL.";
      setVideos([...videos]);
      return;
    }

    const newVideos = [...videos];
    if (!newVideos[index]) return;
    try {
      newVideos[index].status = 'loading';
      setVideos([...newVideos]);

      const response = await fetch(`/api/get-video-metadata?videoUrl=${encodeURIComponent(video.url)}`);
      if (!response.ok) {
        throw new Error("Video could not be found. It may be private or not present.");
      }

      const data = await response.json();
      newVideos[index] = { ...newVideos[index], ...data, status: 'loaded' };
      setVideos(newVideos);
    } catch (error: any) {
      if (!newVideos[index]) return;
      newVideos[index].status = 'error';
      setVideos([...newVideos]);
      toast.error(error.message || "Invalid YouTube URL.");
    }
  };

  const validateYouTubeUrls = () => {
    if (!profile?.youtube_connected) {
      toast.error("Please connect your YouTube channel first.");
      return false;
    }

    const filledVideos = videos.filter((video) => video.url.trim() !== "");
    if (filledVideos.length < 3) {
      toast.error("Please provide at least 3 YouTube video URLs.");
      return false;
    }

    if (filledVideos.some((video) => !youtubeRegex.test(video.url))) {
      toast.error("Please provide valid YouTube video or Shorts URLs.");
      return false;
    }
    return true;
  };

  const handleStartTraining = async () => {
    if (!validateYouTubeUrls()) return;

    setUploading(true);
    setIsTraining(true);
    setProgress(0);
    setStatusMessage("Queuing your training job...");

    try {
      const validUrls = videos
        .filter((video) => video.url.trim() !== "")
        .map((video) => video.url);

      const payload = {
        videoUrls: validUrls,
        isRetraining: profile?.ai_trained ?? false,
      };

      const { jobId } = await api.post<TrainAiResponse>('/api/v1/train-ai', payload, {
        requireAuth: true,
        accessToken: session?.access_token,
      });

      setJobId(jobId);
      toast.success("Training started! Analyzing your videos...");
    } catch (error: any) {
      let message = "Failed to start training";
      if (error instanceof ApiClientError) {
        message = error.message;
        if (error.statusCode === 401) message = "Please sign in again.";
      }

      toast.error("Training Failed to Start", { description: message });
      setIsTraining(false);
      setUploading(false);
      setProgress(0);
      setStatusMessage("");
    }
  };

  // Polling for real-time updates
  useEffect(() => {
    if (!jobId) return;

    const eventSource = new EventSource(
      `${backendUrl}/api/v1/train-ai/status/${jobId}`
    );

    eventSourceRef.current = eventSource;

    const handleMessage = (event: MessageEvent) => {
      try {
        const response: JobEvent = JSON.parse(event.data);

        console.log("response", response);

        console.log("progress", response.progress);

        console.log(progress);

        setProgress(response.progress);

        // Dynamic status based on state/progress
        let currentMessage = response.message;
        if (response.state === "waiting" && response.progress === 0) {
          currentMessage = "Preparing your training job...";
        } else if (response.progress > 0 && response.progress < 30) {
          currentMessage = "Analyzing your videos...";
        } else if (response.progress >= 30 && response.progress < 70) {
          currentMessage = "Processing content and training AI...";
        } else if (response.progress >= 70 && response.progress < 100) {
          currentMessage = "Finalizing your AI model...";
        }
        setStatusMessage(currentMessage);

        if (response.finished) {
          eventSource.close();
          eventSourceRef.current = null;

          if (response.state === "completed") {
            toast.success("AI Training Complete! 🎉", { description: response.message });
            setShowModal(true);
            fetchUserProfile(user?.id || "");
          } else if (response.state === "failed") {
            let errorMessage = response.error || response.message || "Training failed";
            try {
              const parsedError = JSON.parse(errorMessage);
              errorMessage = parsedError.error?.message || parsedError.message || errorMessage;
            } catch { }
            toast.error("Training Failed", { description: errorMessage });
          }

          // Reset state
          setIsTraining(false);
          setUploading(false);
          setJobId(null);
          setProgress(0);
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
        toast.error("Training Status Error", { description: "Failed to parse status update" });
      }
    };

    const handleError = (event: Event) => {
      console.error('SSE connection error:', event);
      eventSource.close();
      eventSourceRef.current = null;

      let message = "Lost connection to training updates";
      toast.error("Training Status Error", { description: message });

      setIsTraining(false);
      setUploading(false);
      setJobId(null);
      setProgress(0);
    };

    eventSource.addEventListener('message', handleMessage);
    eventSource.addEventListener('error', handleError);

    // Cleanup function
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [jobId]);

  // Reset form after training ends
  useEffect(() => {
    if (!isTraining && !uploading) {
      setVideos(initialVideos.map(v => ({ ...v, url: "", status: 'empty' })));
    }
  }, [isTraining, uploading]);

  const handleConnectYoutube = () => {
    connectYoutubeChannel({ supabase, user, setIsConnectingYoutube });
  };

  return {
    profile,
    videos,
    pageLoading,
    uploading,
    showModal,
    isConnectingYoutube,
    isTraining,
    progress,
    statusMessage,
    setShowModal,
    handleAddVideoUrl,
    handleRemoveVideoUrl,
    handleVideoUrlChange,
    handleUrlBlur,
    handleStartTraining,
    handleConnectYoutube,
  };
}