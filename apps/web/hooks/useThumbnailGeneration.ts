"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { useSupabase } from "@/components/supabase-provider"
import { api, ApiClientError } from "@/lib/api-client"
import { downloadFile } from "@/lib/download"
import { useSSE, type SSEEvent } from "./useSSE"

export type ThumbnailRatio = '16:9' | '9:16' | '1:1' | '4:3'

export interface ThumbnailJob {
  id: string
  user_id: string
  prompt: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  ratio: ThumbnailRatio
  generate_count: number
  image_urls: string[]
  reference_image_url: string | null
  face_image_url: string | null
  video_link: string | null
  video_frame_url: string | null
  error_message: string | null
  credits_consumed: number
  job_id: string | null
  created_at: string
  updated_at: string
}

interface GenerateResponse {
  id: string
  jobId: string
  status: string
  message: string
}

interface UseThumbnailGenerationOptions {
  onComplete?: (thumbnailJobId: string) => void
}

const STATUS_MESSAGES: Record<string, (p: number) => string> = {
  waiting: () => "Waiting in queue...",
  default: (p) =>
    p < 20 ? "Preparing generation..." :
    p < 80 ? `Generating thumbnails... ${p}%` :
    p < 100 ? "Finalizing..." : "Done!",
}

export function useThumbnailGeneration(options?: UseThumbnailGenerationOptions) {
  const { profile } = useSupabase()

  const [prompt, setPrompt] = useState("")
  const [context, setContext] = useState("")
  const [ratio, setRatio] = useState<ThumbnailRatio>("16:9")
  const [generateCount] = useState(3)
  const [videoLink, setVideoLink] = useState("")
  const [referenceImage, setReferenceImage] = useState<File | null>(null)
  const [faceImage, setFaceImage] = useState<File | null>(null)

  const [isGenerating, setIsGenerating] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [thumbnailJobId, setThumbnailJobId] = useState<string | null>(null)

  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [creditsConsumed, setCreditsConsumed] = useState(0)
  const [pastJobs, setPastJobs] = useState<ThumbnailJob[]>([])
  const [isLoadingJobs, setIsLoadingJobs] = useState(true)

  const fetchPastJobs = async () => {
    setIsLoadingJobs(true)
    try {
      const data = await api.get<ThumbnailJob[]>('/api/v1/thumbnail', { requireAuth: true })
      setPastJobs(data)
    } catch {
      toast.error("Failed to load thumbnail jobs")
    } finally {
      setIsLoadingJobs(false)
    }
  }

  useEffect(() => { fetchPastJobs() }, [])

  const sse = useSSE<string[]>({
    jobId,
    endpoint: "/api/v1/thumbnail/status",
    getStatusMessages: (p, state) =>
      state === "waiting" ? STATUS_MESSAGES.waiting!(p) : STATUS_MESSAGES.default!(p),
    extractResult: (data: SSEEvent) => (data as any).imageUrls ?? null,
    onComplete: (imageUrls) => {
      if (imageUrls) {
        setGeneratedImages(imageUrls)
        setCreditsConsumed(imageUrls.length)
        toast.success("Thumbnails generated!", {
          description: `${imageUrls.length} thumbnail${imageUrls.length > 1 ? 's' : ''} ready`,
        })
        fetchPastJobs()
        if (thumbnailJobId && options?.onComplete) {
          options.onComplete(thumbnailJobId)
        }
      }
    },
    onFinished: () => {
      setIsGenerating(false)
      setJobId(null)
    },
  })

  const handleGenerate = async () => {
    if (!prompt.trim() || prompt.trim().length < 3) {
      toast.error("Prompt must be at least 3 characters")
      return
    }

    setIsGenerating(true)
    setGeneratedImages([])
    setCreditsConsumed(0)

    try {
      const formData = new FormData()
      formData.append('prompt', prompt.trim())
      formData.append('ratio', ratio)
      formData.append('generateCount', String(generateCount))
      formData.append('personalized', String(profile?.ai_trained ?? false))

      if (videoLink.trim()) formData.append('videoLink', videoLink.trim())
      if (referenceImage) formData.append('referenceImage', referenceImage)
      if (faceImage) formData.append('faceImage', faceImage)

      const response = await api.upload<GenerateResponse>(
        '/api/v1/thumbnail/generate',
        formData,
        { requireAuth: true },
      )

      setThumbnailJobId(response.id)
      setJobId(response.jobId)
      toast.success("Generation started!")
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
    setGeneratedImages([])
    handleGenerate()
  }

  const handleDownload = useCallback(
    (imageUrl: string, index: number) => downloadFile(imageUrl, `thumbnail_${index + 1}.png`),
    [],
  )

  const handleUsePreset = (presetPrompt: string) => setPrompt(presetPrompt)

  const clearForm = () => {
    setPrompt("")
    setContext("")
    setVideoLink("")
    setReferenceImage(null)
    setFaceImage(null)
    setRatio("16:9")
    setGeneratedImages([])
  }

  const showOutput = isGenerating || generatedImages.length > 0

  return {
    prompt, setPrompt,
    context, setContext,
    ratio, setRatio,
    generateCount,
    videoLink, setVideoLink,
    referenceImage, setReferenceImage,
    faceImage, setFaceImage,
    isGenerating,
    progress: sse.progress, statusMessage: sse.statusMessage,
    generatedImages, creditsConsumed,
    showOutput,
    pastJobs, isLoadingJobs,
    handleGenerate, handleRegenerate,
    handleDownload, handleUsePreset, clearForm,
  }
}
