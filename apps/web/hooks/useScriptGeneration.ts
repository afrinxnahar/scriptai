"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"
import { useSupabase } from "@/components/supabase-provider"
import { api, ApiClientError } from "@/lib/api-client"
import { useSSE, type SSEEvent } from "./useSSE"

export interface ScriptFormData {
  prompt: string
  context: string
  tone: string
  language: string
  duration: string
  includeStorytelling: boolean
  includeTimestamps: boolean
  references: string[]
  files: File[]
}

interface GenerateResponse {
  id: string
  jobId: string
  status: string
  message: string
}

interface SSEResult {
  title: string
  script: string
  creditsConsumed: number
}

interface UseScriptGenerationOptions {
  onComplete?: (scriptId: string) => void
}

const STATUS_MESSAGES: Record<string, (p: number) => string> = {
  waiting: () => "Waiting in queue...",
  default: (p) =>
    p < 15 ? "Preparing generation..." :
    p < 30 ? "Loading creator profile..." :
    p < 75 ? `Writing your script... ${p}%` :
    p < 100 ? "Finalizing..." : "Done!",
}

const calculateDurationInSeconds = (duration: string, customDuration: string): string => {
  switch (duration) {
    case "1min": return "60"
    case "3min": return "180"
    case "5min": return "300"
    case "custom": {
      if (!customDuration || !customDuration.includes(":")) return "180"
      const [min, sec] = customDuration.split(":")
      return String((parseInt(min ?? "0", 10) || 0) * 60 + (parseInt(sec ?? "0", 10) || 0))
    }
    default: return "180"
  }
}

export function useScriptGeneration(options?: UseScriptGenerationOptions) {
  const { profile } = useSupabase()

  const [prompt, setPrompt] = useState("")
  const [context, setContext] = useState("")
  const [tone, setTone] = useState("conversational")
  const [language, setLanguage] = useState("english")
  const [duration, setDuration] = useState("3min")
  const [customDuration, setCustomDuration] = useState("")
  const [includeStorytelling, setIncludeStorytelling] = useState(false)
  const [includeTimestamps, setIncludeTimestamps] = useState(false)
  const [references, setReferences] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])

  const [isGenerating, setIsGenerating] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [scriptJobId, setScriptJobId] = useState<string | null>(null)

  const [generatedTitle, setGeneratedTitle] = useState("")
  const [generatedScript, setGeneratedScript] = useState("")
  const [creditsConsumed, setCreditsConsumed] = useState(0)

  const sse = useSSE<SSEResult>({
    jobId,
    endpoint: "/api/v1/script/status",
    getStatusMessages: (p, state) =>
      state === "waiting" ? STATUS_MESSAGES.waiting!(p) : STATUS_MESSAGES.default!(p),
    extractResult: (data: SSEEvent) => {
      const d = data as any
      return d.title && d.script ? { title: d.title, script: d.script, creditsConsumed: d.creditsConsumed ?? 0 } : null
    },
    onComplete: (result) => {
      if (result) {
        setGeneratedTitle(result.title)
        setGeneratedScript(result.script)
        setCreditsConsumed(result.creditsConsumed || 1)
        toast.success("Script generated!", { description: "Your script is ready for review." })
        if (scriptJobId && options?.onComplete) {
          options.onComplete(scriptJobId)
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
    setGeneratedScript("")
    setGeneratedTitle("")
    setCreditsConsumed(0)

    try {
      const durationInSeconds = calculateDurationInSeconds(duration, customDuration)
      const formData = new FormData()
      formData.append("prompt", prompt.trim())
      formData.append("context", context.trim())
      formData.append("tone", tone)
      formData.append("language", language)
      formData.append("duration", durationInSeconds)
      formData.append("includeStorytelling", String(includeStorytelling))
      formData.append("includeTimestamps", String(includeTimestamps))

      const filteredRefs = references.filter(r => r.trim())
      if (filteredRefs.length > 0) {
        formData.append("references", filteredRefs.join("\n"))
      }

      formData.append("personalized", String(profile?.ai_trained ?? false))

      for (const file of files) {
        formData.append("files", file, file.name)
      }

      const response = await api.upload<GenerateResponse>(
        "/api/v1/script/generate",
        formData,
        { requireAuth: true },
      )

      setScriptJobId(response.id)
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
    setGeneratedScript("")
    setGeneratedTitle("")
    handleGenerate()
  }

  const clearForm = useCallback(() => {
    setPrompt("")
    setContext("")
    setTone("conversational")
    setLanguage("english")
    setDuration("3min")
    setCustomDuration("")
    setIncludeStorytelling(false)
    setIncludeTimestamps(false)
    setReferences([])
    setFiles([])
    setGeneratedScript("")
    setGeneratedTitle("")
    setCreditsConsumed(0)
  }, [])

  const showOutput = isGenerating || !!generatedScript

  return {
    prompt, setPrompt,
    context, setContext,
    tone, setTone,
    language, setLanguage,
    duration, setDuration,
    customDuration, setCustomDuration,
    includeStorytelling, setIncludeStorytelling,
    includeTimestamps, setIncludeTimestamps,
    references, setReferences,
    files, setFiles,
    isGenerating,
    progress: sse.progress,
    statusMessage: sse.statusMessage,
    generatedTitle, setGeneratedTitle,
    generatedScript, setGeneratedScript,
    creditsConsumed,
    scriptJobId,
    showOutput,
    handleGenerate, handleRegenerate, clearForm,
  }
}
