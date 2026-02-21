"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useSupabase } from "@/components/supabase-provider"
import ScriptGenerationForm, {
  type ScriptFormData,
} from "@/components/dashboard/scripts/ScriptGenerationForm"
import ScriptOutputPanel from "@/components/dashboard/scripts/ScriptOutputPanel"
import { AITrainingRequired } from "@/components/dashboard/common/AITrainingRequired"
import { updateScript } from "@/lib/api/getScripts"
import { api } from "@/lib/api-client"
import { ScriptLoaderSkeleton } from "@/components/dashboard/scripts/skeleton/scriptLoaderSkeleton"

const calculateDurationInSeconds = (duration: string, customDuration: string) => {
  switch (duration) {
    case "1min":
      return "60"
    case "3min":
      return "180"
    case "5min":
      return "300"
    case "custom":
      if (!customDuration || !customDuration.includes(":")) {
        return "0"
      }
      const parts = customDuration.split(":")
      const minutes = parseInt(parts[0] ?? "0", 10) || 0
      const seconds = parseInt(parts[1] ?? "0", 10) || 0
      return (minutes * 60 + seconds).toString()
    default:
      return "0"
  }
}

export default function NewScriptPage() {
  const router = useRouter()
  const { profile, profileLoading } = useSupabase()
  const [loadingSave, setLoadingSave] = useState(false)
  const [loadingGenerate, setLoadingGenerate] = useState(false)
  const [generatedScript, setGeneratedScript] = useState("")
  const [scriptTitle, setScriptTitle] = useState("")
  const [scriptId, setScriptId] = useState<string | null>(null)

  const [latestFormData, setLatestFormData] = useState<ScriptFormData | null>(null)

  const handleGenerateScript = async (formData: ScriptFormData) => {
    if (!formData.prompt) {
      toast.error("Prompt required", {
        description: "Please enter a prompt to generate a script.",
      })
      return
    }

    const durationInSeconds = calculateDurationInSeconds(
        formData.duration,
        formData.customDuration || ""
    )
    formData.duration = durationInSeconds || "300"
    delete formData.customDuration
    formData.personalized = profile?.ai_trained

    const multipartData = new FormData()
    for (const [key, value] of Object.entries(formData)) {
      if (key === "files" && Array.isArray(value)) {
        for (const file of value) {
          multipartData.append("files", file, file.name)
        }
      } else if (typeof value === "boolean") {
        multipartData.append(key, String(value))
      } else if (value !== undefined && value !== null) {
        multipartData.append(key, value as string)
      }
    }

    setLoadingGenerate(true)
    setGeneratedScript("")
    setLatestFormData(formData)

    try {
      const data = await api.upload<{ id: string; title: string; script: string }>(
        "/api/v1/script/generate",
        multipartData,
        { requireAuth: true },
      )

      setGeneratedScript(data.script)
      setScriptTitle(data.title)
      setScriptId(data.id)

      toast.success("Script generated!", {
        description: "Your script is ready for review.",
      })
    } catch (error: any) {
      toast.error("Error generating script", { description: error.message })
    } finally {
      setLoadingGenerate(false)
    }
  }

  const handleRegenerateScript = () => {
    if (latestFormData) {
      handleGenerateScript(latestFormData)
    } else {
      toast.error("No data to regenerate", {
        description: "Please generate a script first.",
      })
    }
  }

  const handleSaveScript = async () => {
    if (!generatedScript || !scriptTitle || !scriptId) {
      toast.error("Missing information", {
        description: "Please generate a script before saving.",
      })
      return
    }

    setLoadingSave(true)

    try {
      const result = await updateScript(scriptId, {
        title: scriptTitle,
        content: generatedScript,
      })

      if (!result) {
        throw new Error("Failed to save the script. Please try again.")
      }

      toast.success("Script saved!", {
        description: "Your script has been saved successfully.",
      })

      router.push(`/dashboard/scripts`)
    } catch (error: any) {
      toast.error("Error saving script", { description: error.message })
    } finally {
      setLoadingSave(false)
    }
  }

  if (profileLoading) {
    return <ScriptLoaderSkeleton />
  }

  if (!profile?.ai_trained || !profile?.youtube_connected) {
    return <AITrainingRequired />
  }

  return (
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Create New Script</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Generate your script step-by-step
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <ScriptGenerationForm
              loading={loadingGenerate}
              onGenerate={handleGenerateScript}
          />

          <ScriptOutputPanel
              loading={loadingSave}
              loadingGenerate={loadingGenerate}
              generatedScript={generatedScript}
              setGeneratedScript={setGeneratedScript}
              scriptTitle={scriptTitle}
              setScriptTitle={setScriptTitle}
              onSave={handleSaveScript}
              onRegenerate={handleRegenerateScript}
          />
        </div>
      </div>
  )
}