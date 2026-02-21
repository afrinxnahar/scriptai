"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { api, ApiClientError } from "@/lib/api-client"
import { useSSE, type SSEEvent } from "./useSSE"
import type {
  VideoDuration,
  ContentType,
  StoryMode,
  AudienceLevel,
  StoryBuilderResult,
} from "@repo/validation"
import type { IdeationJob } from "@repo/validation"

export interface StoryBuilderJob {
  id: string
  user_id: string
  video_topic: string
  target_audience?: string
  audience_level: AudienceLevel
  video_duration: VideoDuration
  content_type: ContentType
  story_mode: StoryMode
  tone?: string
  additional_context?: string
  ideation_id?: string
  idea_index?: number
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

interface IdeationListResponse {
  data: IdeationJob[]
  total: number
  page: number
  limit: number
}

const STATUS_MESSAGES = (p: number, state: string): string => {
  if (state === "waiting") return "Waiting in queue..."
  if (p < 15) return "Loading your creator profile..."
  if (p < 20) return "Preparing blueprint analysis..."
  if (p < 75) return "AI is structuring your story blueprint..."
  if (p < 85) return "Calculating tension mapping & scores..."
  if (p < 100) return "Finalizing story blueprint..."
  return "Done!"
}

export function useStoryBuilder() {
  const [videoTopic, setVideoTopic] = useState("")
  const [targetAudience, setTargetAudience] = useState("")
  const [audienceLevel, setAudienceLevel] = useState<AudienceLevel>("general")
  const [videoDuration, setVideoDuration] = useState<VideoDuration>("medium")
  const [contentType, setContentType] = useState<ContentType>("tutorial")
  const [storyMode, setStoryMode] = useState<StoryMode>("conversational")
  const [tone, setTone] = useState("")
  const [additionalContext, setAdditionalContext] = useState("")
  const [personalized, setPersonalized] = useState(true)

  const [selectedIdeationId, setSelectedIdeationId] = useState<string | undefined>()
  const [selectedIdeaIndex, setSelectedIdeaIndex] = useState<number | undefined>()

  const [isGenerating, setIsGenerating] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)

  const [generatedResult, setGeneratedResult] = useState<StoryBuilderResult | null>(null)
  const [pastJobs, setPastJobs] = useState<StoryBuilderJob[]>([])
  const [isLoadingJobs, setIsLoadingJobs] = useState(true)

  const [ideationJobs, setIdeationJobs] = useState<IdeationJob[]>([])
  const [isLoadingIdeations, setIsLoadingIdeations] = useState(true)

  const [aiTrained, setAiTrained] = useState(false)
  const [credits, setCredits] = useState(0)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  const fetchProfileStatus = async () => {
    setIsLoadingProfile(true)
    try {
      const data = await api.get<ProfileStatus>('/api/v1/story-builder/profile-status', { requireAuth: true })
      setAiTrained(data.aiTrained)
      setCredits(data.credits)
    } catch {
      toast.error("Failed to load profile status")
    } finally {
      setIsLoadingProfile(false)
    }
  }

  const fetchPastJobs = async () => {
    setIsLoadingJobs(true)
    try {
      const data = await api.get<StoryBuilderJob[]>('/api/v1/story-builder', { requireAuth: true })
      setPastJobs(data)
    } catch {
      toast.error("Failed to load story builder jobs")
    } finally {
      setIsLoadingJobs(false)
    }
  }

  const fetchIdeationJobs = async () => {
    setIsLoadingIdeations(true)
    try {
      const res = await api.get<IdeationListResponse>('/api/v1/ideation?limit=50', { requireAuth: true })
      setIdeationJobs((res.data || []).filter(j => j.status === 'completed' && j.result?.ideas?.length))
    } catch {
      toast.error("Failed to load ideation jobs")
    } finally {
      setIsLoadingIdeations(false)
    }
  }

  useEffect(() => {
    fetchPastJobs()
    fetchProfileStatus()
    fetchIdeationJobs()
  }, [])

  const sse = useSSE<StoryBuilderResult>({
    jobId,
    endpoint: "/api/v1/story-builder/status",
    getStatusMessages: STATUS_MESSAGES,
    extractResult: (data: SSEEvent) => (data as any).result ?? null,
    onComplete: (result) => {
      if (result) {
        setGeneratedResult(result)
        toast.success("Story blueprint generated!", { description: "Your modular blueprint is ready" })
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
          ideationId: selectedIdeationId || undefined,
          ideaIndex: selectedIdeaIndex ?? undefined,
          targetAudience: targetAudience.trim() || undefined,
          audienceLevel,
          videoDuration,
          contentType,
          storyMode,
          tone: tone.trim() || undefined,
          additionalContext: additionalContext.trim() || undefined,
          personalized: personalized && aiTrained,
        },
        { requireAuth: true },
      )

      setJobId(response.jobId)
      toast.success(response.personalized
        ? "Generating personalized story blueprint!"
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
      setAudienceLevel(job.audience_level || "general")
      setVideoDuration(job.video_duration)
      setContentType(job.content_type)
      setStoryMode(job.story_mode || "conversational")
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

  const handleSelectIdea = useCallback((ideationId: string, ideaIndex: number, ideaTitle: string) => {
    setSelectedIdeationId(ideationId)
    setSelectedIdeaIndex(ideaIndex)
    setVideoTopic(ideaTitle)
  }, [])

  const clearForm = () => {
    setVideoTopic("")
    setTargetAudience("")
    setAudienceLevel("general")
    setVideoDuration("medium")
    setContentType("tutorial")
    setStoryMode("conversational")
    setTone("")
    setAdditionalContext("")
    setSelectedIdeationId(undefined)
    setSelectedIdeaIndex(undefined)
    setGeneratedResult(null)
  }

  return {
    videoTopic, setVideoTopic,
    targetAudience, setTargetAudience,
    audienceLevel, setAudienceLevel,
    videoDuration, setVideoDuration,
    contentType, setContentType,
    storyMode, setStoryMode,
    tone, setTone,
    additionalContext, setAdditionalContext,
    personalized, setPersonalized,
    selectedIdeationId, selectedIdeaIndex,
    ideationJobs, isLoadingIdeations,
    isGenerating,
    progress: sse.progress,
    statusMessage: sse.statusMessage,
    generatedResult,
    pastJobs, isLoadingJobs,
    aiTrained, credits, isLoadingProfile,
    handleGenerate, handleRegenerate,
    handleViewJob, handleDeleteJob,
    handleSelectIdea,
    clearForm,
  }
}
