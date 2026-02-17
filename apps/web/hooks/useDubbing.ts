"use client";

import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { DubbedResult, DubbingProgress } from "@repo/validation";
import { api, ApiClientError } from "@/lib/api-client";
import { useSupabase } from "@/components/supabase-provider";
import { supportedLanguages } from "@repo/validation";

// export const supportedLanguages = [
//   { value: "en", label: "English" },
//   { value: "es", label: "Spanish" },
//   { value: "fr", label: "French" },
//   { value: "de", label: "German" },
//   { value: "it", label: "Italian" },
//   { value: "hi", label: "Hindi" },
//   { value: "zh", label: "Chinese" },
//   { value: "ja", label: "Japanese" },
//   { value: "ko", label: "Korean" },
//   { value: "pt", label: "Portuguese" },
//   { value: "pl", label: "Polish" },
//   { value: "ru", label: "Russian" },
//   { value: "nl", label: "Dutch" },
//   { value: "tr", label: "Turkish" },
//   { value: "sv", label: "Swedish" },
//   { value: "id", label: "Indonesian" },
//   { value: "fil", label: "Filipino" },
//   { value: "uk", label: "Ukrainian" },
//   { value: "el", label: "Greek" },
//   { value: "cs", label: "Czech" },
//   { value: "fi", label: "Finnish" },
//   { value: "ro", label: "Romanian" },
//   { value: "da", label: "Danish" },
//   { value: "bg", label: "Bulgarian" },
//   { value: "ms", label: "Malay" },
//   { value: "sk", label: "Slovak" },
//   { value: "hr", label: "Croatian" },
//   { value: "ar", label: "Arabic" },
//   { value: "ta", label: "Tamil" },
// ] as const;

export function useDubbing() {
  const { supabase, session } = useSupabase();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState("");
  const [mediaName, setMediaName] = useState("");
  const [dubbedResult, setDubbedResult] = useState<DubbedResult | null>(null);

  const [progress, setProgress] = useState<DubbingProgress>({
    state: "idle",
    progress: 0,
    message: "",
  });

  const updateProgress = useCallback(
    (state: DubbingProgress["state"], progress: number, message: string) => {
      setProgress({ state, progress, message });
    },
    []
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 500 * 1024 * 1024) {
        toast.error("File too large", {
          description: "Please upload a file smaller than 500MB.",
        });
        return;
      }

      setIsVideo(file.type.startsWith("video/"));
      setMediaFile(file);
      setDubbedResult(null);
      setProgress({ state: "idle", progress: 0, message: "" });
    },
    []
  );

  const resetForm = useCallback(() => {
    setMediaFile(null);
    setTargetLanguage("");
    setMediaName("");
    setDubbedResult(null);
    setProgress({ state: "idle", progress: 0, message: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleDubMedia = useCallback(async () => {
    if (!mediaFile || !targetLanguage || !mediaName.trim()) {
      if (!mediaFile) toast.error("No file uploaded");
      if (!targetLanguage) toast.error("No target language selected");
      if (!mediaName.trim()) toast.error("Please enter a name for your media");
      return;
    }

    let eventSource: EventSource | null = null;

    try {
      updateProgress("uploading", 5, "Uploading media...");

      const filePath = `${crypto.randomUUID()}-${mediaFile.name}`;

      const { error: uploadError } = await supabase.storage
        .from("dubbing_media")
        .upload(filePath, mediaFile, { upsert: true });

      if (uploadError) throw new Error(uploadError.message);

      const { data } = supabase.storage
        .from("dubbing_media")
        .getPublicUrl(filePath);

      if (!data.publicUrl) throw new Error("Failed to generate media URL");

      updateProgress("uploading", 10, "Upload complete. Starting dubbing...");

      // Create dubbing job
      const response = await api.post<{ projectId: string }>(
        "/api/v1/dubbing",
        {
          mediaUrl: data.publicUrl,
          targetLanguage,
          isVideo,
          mediaName: mediaName.trim(),
        },
        {
          requireAuth: true,
          accessToken: session?.access_token,
        }
      );

      const { projectId } = response;

      // Connect to SSE for status updates
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
      eventSource = new EventSource(
        `${baseUrl}/api/v1/dubbing/status/${projectId}`
      );

      eventSource.onmessage = (event) => {
        const data: DubbingProgress = JSON.parse(event.data);
        setProgress(data);

        if (data.finished) {
          eventSource?.close();

          if (data.state === "completed") {
            // Fetch the final result with dubbed URL
            api.get<DubbedResult>(`/api/v1/dubbing/${projectId}`, {
              requireAuth: true,
              accessToken: session?.access_token,
            }).then((result) => {
              setDubbedResult({
                projectId: result.projectId,
                dubbedUrl: result.dubbedUrl,
                targetLanguage,
              });
            });

            toast.success("Dubbing complete 🎉", {
              description: `Dubbed into ${supportedLanguages.find((l) => l.value === targetLanguage)?.label
                }${data.creditsUsed ? ` (${data.creditsUsed} credits used)` : ""}`,
            });
          } else if (data.state === "failed") {
            toast.error("Dubbing failed", { description: data.message });
          }
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
        updateProgress("failed", 0, "Connection lost");
        toast.error("Connection lost", { description: "Please try again" });
      };
    } catch (error: any) {
      eventSource?.close();
      let message = "Dubbing failed";

      if (error instanceof ApiClientError) {
        message = error.message;
        if (error.statusCode === 401) message = "Please sign in again.";
      }

      updateProgress("failed", 0, message);
      toast.error("Error dubbing media", { description: message });
    }
  }, [mediaFile, targetLanguage, isVideo, mediaName, supabase, session, updateProgress]);

  const isLoading =
    progress.state === "uploading" || progress.state === "processing";

  return {
    fileInputRef,
    mediaFile,
    isVideo,
    targetLanguage,
    setTargetLanguage,
    mediaName,
    setMediaName,
    dubbedResult,
    progress,
    isLoading,
    handleFileChange,
    resetForm,
    handleDubMedia,
  };
}
