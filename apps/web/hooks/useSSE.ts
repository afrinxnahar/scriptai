"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { BACKEND_URL } from "@/lib/constants";

export interface SSEEvent<T = unknown> {
  state: "waiting" | "active" | "completed" | "failed";
  progress: number;
  message: string;
  finished: boolean;
  error?: string;
  data?: T;
}

interface UseSSEOptions<TResult> {
  jobId: string | null;
  endpoint: string;
  getStatusMessages?: (progress: number, state: string) => string;
  extractResult?: (data: SSEEvent) => TResult | null;
  onComplete?: (result: TResult) => void;
  onFailed?: (error: string) => void;
  onFinished?: () => void;
}

interface UseSSEReturn<TResult> {
  isActive: boolean;
  progress: number;
  statusMessage: string;
  result: TResult | null;
  reset: () => void;
}

export function useSSE<TResult = unknown>(
  options: UseSSEOptions<TResult>,
): UseSSEReturn<TResult> {
  const {
    jobId,
    endpoint,
    getStatusMessages,
    extractResult,
    onComplete,
    onFailed,
    onFinished,
  } = options;

  const [isActive, setIsActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [result, setResult] = useState<TResult | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const reset = useCallback(() => {
    setIsActive(false);
    setProgress(0);
    setStatusMessage("");
    setResult(null);
  }, []);

  useEffect(() => {
    if (!jobId) return;
    setIsActive(true);

    const eventSource = new EventSource(`${BACKEND_URL}${endpoint}/${jobId}`);
    eventSourceRef.current = eventSource;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data: SSEEvent = JSON.parse(event.data);
        setProgress(data.progress);

        if (getStatusMessages) {
          setStatusMessage(getStatusMessages(data.progress, data.state));
        } else {
          setStatusMessage(data.message);
        }

        if (data.finished) {
          eventSource.close();
          eventSourceRef.current = null;

          if (data.state === "completed") {
            const extracted = extractResult ? extractResult(data) : null;
            if (extracted !== null) setResult(extracted);
            onComplete?.(extracted as TResult);
          } else if (data.state === "failed") {
            const errorMsg = data.error || "An unknown error occurred";
            toast.error("Generation Failed", { description: errorMsg });
            onFailed?.(errorMsg);
          }

          setIsActive(false);
          setProgress(0);
          onFinished?.();
        }
      } catch {
        // parse error
      }
    };

    const handleError = () => {
      eventSource.close();
      eventSourceRef.current = null;
      toast.error("Lost connection to updates");
      setIsActive(false);
      setProgress(0);
      setStatusMessage("");
      onFinished?.();
    };

    eventSource.addEventListener("message", handleMessage);
    eventSource.addEventListener("error", handleError);

    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, [jobId]);

  return { isActive, progress, statusMessage, result, reset };
}
