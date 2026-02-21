"use client"

import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { useScriptGeneration } from "@/hooks/useScriptGeneration"
import { useSupabase } from "@/components/supabase-provider"
import ScriptGenerationForm from "@/components/dashboard/scripts/ScriptGenerationForm"
import ScriptOutputPanel from "@/components/dashboard/scripts/ScriptOutputPanel"
import { ScriptHowItWorksGuide } from "@/components/dashboard/scripts/ScriptHowItWorksGuide"
import { AITrainingRequired } from "@/components/dashboard/common/AITrainingRequired"
import { Skeleton } from "@/components/ui/skeleton"

export default function NewScriptPage() {
  const router = useRouter()
  const { profile, profileLoading } = useSupabase()
  const hook = useScriptGeneration({
    onComplete: (id) => router.push(`/dashboard/scripts/${id}`),
  })

  if (profileLoading) {
    return (
      <div className="container py-8 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-96" />
        <Skeleton className="h-[600px] rounded-lg mt-8" />
      </div>
    )
  }

  const showTrainingOverlay = !profile?.youtube_connected || !profile?.ai_trained

  return (
    <motion.div
      className="container py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create New Script</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Generate AI-powered scripts personalized to your channel style
        </p>
      </div>

      {showTrainingOverlay ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <AITrainingRequired />
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          {hook.showOutput ? (
            <motion.div
              key="output"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
            >
              <ScriptOutputPanel
                isGenerating={hook.isGenerating}
                progress={hook.progress}
                statusMessage={hook.statusMessage}
                generatedScript={hook.generatedScript}
                setGeneratedScript={hook.setGeneratedScript}
                generatedTitle={hook.generatedTitle}
                setGeneratedTitle={hook.setGeneratedTitle}
                creditsConsumed={hook.creditsConsumed}
                scriptId={hook.scriptJobId}
                onRegenerate={hook.handleRegenerate}
                onNewGeneration={hook.clearForm}
              />
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
            >
              <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-8">
                <ScriptHowItWorksGuide />
              </div>
              <div className="lg:col-span-2">
                <ScriptGenerationForm
                  prompt={hook.prompt} setPrompt={hook.setPrompt}
                  context={hook.context} setContext={hook.setContext}
                  tone={hook.tone} setTone={hook.setTone}
                  language={hook.language} setLanguage={hook.setLanguage}
                  duration={hook.duration} setDuration={hook.setDuration}
                  customDuration={hook.customDuration} setCustomDuration={hook.setCustomDuration}
                  includeStorytelling={hook.includeStorytelling} setIncludeStorytelling={hook.setIncludeStorytelling}
                  includeTimestamps={hook.includeTimestamps} setIncludeTimestamps={hook.setIncludeTimestamps}
                  references={hook.references} setReferences={hook.setReferences}
                  files={hook.files} setFiles={hook.setFiles}
                  isGenerating={hook.isGenerating}
                  onGenerate={hook.handleGenerate}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  )
}
