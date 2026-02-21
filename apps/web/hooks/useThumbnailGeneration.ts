"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { toast } from "sonner"
import { useSupabase } from "@/components/supabase-provider"
import { api, ApiClientError } from "@/lib/api-client"

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

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

interface JobEvent {
  state: 'waiting' | 'active' | 'completed' | 'failed'
  progress: number
  message: string
  imageUrls?: string[]
  error?: string
  finished: boolean
}

interface UseThumbnailGenerationOptions {
  onComplete?: (thumbnailJobId: string) => void
}

export function useThumbnailGeneration(options?: UseThumbnailGenerationOptions) {
  const { profile } = useSupabase()

  // Form state
  const [prompt, setPrompt] = useState("")
  const [context, setContext] = useState("")
  const [ratio, setRatio] = useState<ThumbnailRatio>("16:9")
  const [generateCount] = useState(3)
  const [videoLink, setVideoLink] = useState("")
  const [referenceImage, setReferenceImage] = useState<File | null>(null)
  const [faceImage, setFaceImage] = useState<File | null>(null)

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState("")
  const [jobId, setJobId] = useState<string | null>(null)
  const [thumbnailJobId, setThumbnailJobId] = useState<string | null>(null)

  // Results
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [creditsConsumed, setCreditsConsumed] = useState(0)
  const [pastJobs, setPastJobs] = useState<ThumbnailJob[]>([])
  const [isLoadingJobs, setIsLoadingJobs] = useState(true)

  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    fetchPastJobs()
  }, [])

  const fetchPastJobs = async () => {
    setIsLoadingJobs(true)
    try {
      const data = await api.get<ThumbnailJob[]>('/api/v1/thumbnail', { requireAuth: true })
      setPastJobs(data)
    } catch {
      // silent
    } finally {
      setIsLoadingJobs(false)
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim() || prompt.trim().length < 3) {
      toast.error("Prompt must be at least 3 characters")
      return
    }

    setIsGenerating(true)
    setProgress(0)
    setStatusMessage("Queuing generation...")
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
      resetState()
    }
  }

  // SSE polling
  useEffect(() => {
    if (!jobId) return

    const eventSource = new EventSource(`${backendUrl}/api/v1/thumbnail/status/${jobId}`)
    eventSourceRef.current = eventSource

    const handleMessage = (event: MessageEvent) => {
      try {
        const data: JobEvent = JSON.parse(event.data)
        setProgress(data.progress)

        if (data.state === 'waiting') setStatusMessage("Waiting in queue...")
        else if (data.progress < 20) setStatusMessage("Preparing generation...")
        else if (data.progress < 80) setStatusMessage(`Generating thumbnails... ${data.progress}%`)
        else if (data.progress < 100) setStatusMessage("Finalizing...")

        if (data.finished) {
          eventSource.close()
          eventSourceRef.current = null

          if (data.state === 'completed' && data.imageUrls) {
            setGeneratedImages(data.imageUrls)
            setCreditsConsumed(data.imageUrls.length)
            setStatusMessage("Done!")
            toast.success("Thumbnails generated!", {
              description: `${data.imageUrls.length} thumbnail${data.imageUrls.length > 1 ? 's' : ''} ready`,
            })
            fetchPastJobs()
            if (thumbnailJobId && options?.onComplete) {
              options.onComplete(thumbnailJobId)
            }
          } else if (data.state === 'failed') {
            toast.error("Generation Failed", {
              description: data.error || "An unknown error occurred",
            })
          }

          setIsGenerating(false)
          setJobId(null)
          setProgress(0)
        }
      } catch {
        // parse error
      }
    }

    const handleError = () => {
      eventSource.close()
      eventSourceRef.current = null
      toast.error("Lost connection to generation updates")
      resetState()
    }

    eventSource.addEventListener('message', handleMessage)
    eventSource.addEventListener('error', handleError)

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [jobId])

  const resetState = () => {
    setIsGenerating(false)
    setJobId(null)
    setProgress(0)
    setStatusMessage("")
  }

  const handleRegenerate = () => {
    setGeneratedImages([])
    handleGenerate()
  }

  const handleDownload = useCallback(async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `thumbnail_${index + 1}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      toast.error("Failed to download thumbnail")
    }
  }, [])

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
    progress, statusMessage,
    generatedImages, creditsConsumed,
    showOutput,
    pastJobs, isLoadingJobs,
    handleGenerate, handleRegenerate,
    handleDownload, handleUsePreset, clearForm,
  }
}
