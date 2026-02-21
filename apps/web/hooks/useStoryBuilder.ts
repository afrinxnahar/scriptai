"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { api, ApiClientError } from "@/lib/api-client"
import { useSSE, type SSEEvent } from "./useSSE"
import type {
  VideoDuration,
  ContentType,
  StoryBuilderResult,
} from "@repo/validation"

export interface StoryBuilderJob {
  id: string
  user_id: string
  video_topic: string
  target_audience?: string
  video_duration: VideoDuration
  content_type: ContentType
  tone?: string
  additional_context?: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  result?: StoryBuilderResult
  error_message?: string
  credits_consumed: number
  job_id?: string
  created_at: string
}

interface GenerateResponse {
  id: string
  jobId: string
  status: string
  personalized: boolean
  message: string
}

interface ProfileStatus {
  aiTrained: boolean
  credits: number
}

const STATUS_MESSAGES = (p: number, state: string): string => {
  if (state === "waiting") return "Waiting in queue..."
  if (p < 15) return "Loading your creator profile..."
  if (p < 20) return "Preparing analysis..."
  if (p < 70) return "AI is structuring your story..."
  if (p < 100) return "Finalizing story blueprint..."
  return "Done!"
}

export function useStoryBuilder() {
  const [videoTopic, setVideoTopic] = useState("")
  const [targetAudience, setTargetAudience] = useState("")
  const [videoDuration, setVideoDuration] = useState<VideoDuration>("medium")
  const [contentType, setContentType] = useState<ContentType>("tutorial")
  const [tone, setTone] = useState("")
  const [additionalContext, setAdditionalContext] = useState("")
  const [personalized, setPersonalized] = useState(true)

  const [isGenerating, setIsGenerating] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)

  const [generatedResult, setGeneratedResult] = useState<StoryBuilderResult | null>(null)
  const [pastJobs, setPastJobs] = useState<StoryBuilderJob[]>([])
  const [isLoadingJobs, setIsLoadingJobs] = useState(true)

  const [aiTrained, setAiTrained] = useState(false)
  const [credits, setCredits] = useState(0)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  const fetchProfileStatus = async () => {
    setIsLoadingProfile(true)
    try {
      const data = await api.get<ProfileStatus>('/api/v1/story-builder/profile-status', { requireAuth: true })
      setAiTrained(data.aiTrained)
      setCredits(data.credits)
    } catch (error) {
      console.error("Failed to load profile status:", error)
    } finally {
      setIsLoadingProfile(false)
    }
  }

  const fetchPastJobs = async () => {
    setIsLoadingJobs(true)
    try {
      const data = await api.get<StoryBuilderJob[]>('/api/v1/story-builder', { requireAuth: true })
      setPastJobs(data)
    } catch (error) {
      console.error("Failed to load story builder jobs:", error)
    } finally {
      setIsLoadingJobs(false)
    }
  }

  useEffect(() => {
    fetchPastJobs()
    fetchProfileStatus()
  }, [])

  const sse = useSSE<StoryBuilderResult>({
    jobId,
    endpoint: "/api/v1/story-builder/status",
    getStatusMessages: STATUS_MESSAGES,
    extractResult: (data: SSEEvent) => (data as any).result ?? null,
    onComplete: (result) => {
      if (result) {
        setGeneratedResult(result)
        toast.success("Story structure generated!", {
          description: "Your story blueprint is ready",
        })
        fetchPastJobs()
      }
    },
    onFinished: () => {
      setIsGenerating(false)
      setJobId(null)
    },
  })

  const handleGenerate = async () => {
    if (!videoTopic.trim() || videoTopic.trim().length < 3) {
      toast.error("Video topic must be at least 3 characters")
      return
    }

    setIsGenerating(true)
    setGeneratedResult(null)

    try {
      const response = await api.post<GenerateResponse>(
        '/api/v1/story-builder/generate',
        {
          videoTopic: videoTopic.trim(),
          targetAudience: targetAudience.trim() || undefined,
          videoDuration,
          contentType,
          tone: tone.trim() || undefined,
          additionalContext: additionalContext.trim() || undefined,
          personalized: personalized && aiTrained,
        },
        { requireAuth: true },
      )

      setJobId(response.jobId)
      toast.success(response.personalized
        ? "Generating personalized story structure!"
        : "Generation started!")
    } catch (error: any) {
      let message = "Failed to start generation"
      if (error instanceof ApiClientError) {
        message = error.message
        if (error.statusCode === 403) message = "Insufficient credits. Please upgrade your plan."
      }
      toast.error("Generation Failed", { description: message })
      setIsGenerating(false)
      setJobId(null)
    }
  }

  const handleRegenerate = () => {
    setGeneratedResult(null)
    handleGenerate()
  }

  const handleViewJob = useCallback((job: StoryBuilderJob) => {
    if (job.result) {
      setGeneratedResult(job.result)
      setVideoTopic(job.video_topic)
      setTargetAudience(job.target_audience || "")
      setVideoDuration(job.video_duration)
      setContentType(job.content_type)
      setTone(job.tone || "")
      setAdditionalContext(job.additional_context || "")
    }
  }, [])

  const handleDeleteJob = useCallback(async (jobId: string) => {
    try {
      await api.delete(`/api/v1/story-builder/${jobId}`, { requireAuth: true })
      setPastJobs((prev) => prev.filter((j) => j.id !== jobId))
      toast.success("Job deleted")
    } catch {
      toast.error("Failed to delete job")
    }
  }, [])

  const clearForm = () => {
    setVideoTopic("")
    setTargetAudience("")
    setVideoDuration("medium")
    setContentType("tutorial")
    setTone("")
    setAdditionalContext("")
    setGeneratedResult(null)
  }

  return {
    videoTopic, setVideoTopic,
    targetAudience, setTargetAudience,
    videoDuration, setVideoDuration,
    contentType, setContentType,
    tone, setTone,
    additionalContext, setAdditionalContext,
    personalized, setPersonalized,
    isGenerating,
    progress: sse.progress,
    statusMessage: sse.statusMessage,
    generatedResult,
    pastJobs, isLoadingJobs,
    aiTrained, credits, isLoadingProfile,
    handleGenerate, handleRegenerate,
    handleViewJob, handleDeleteJob,
    clearForm,
  }
}
