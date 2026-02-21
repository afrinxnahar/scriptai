"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { useThumbnailGeneration } from "@/hooks/useThumbnailGeneration"
import { useSupabase } from "@/components/supabase-provider"
import { ThumbnailForm } from "@/components/dashboard/thumbnails/ThumbnailForm"
import { ThumbnailOutputPanel } from "@/components/dashboard/thumbnails/ThumbnailOutputPanel"
import { VideoFrameModal } from "@/components/dashboard/thumbnails/VideoFrameModal"
import { AITrainingRequired } from "@/components/dashboard/common/AITrainingRequired"
import { Skeleton } from "@/components/ui/skeleton"

export default function NewThumbnailPage() {
  const router = useRouter()
  const { profile, profileLoading } = useSupabase()
  const {
    prompt, setPrompt,
    context, setContext,
    ratio, setRatio,
    videoLink, setVideoLink,
    referenceImage, setReferenceImage,
    faceImage, setFaceImage,
    isGenerating, progress, statusMessage,
    generatedImages, creditsConsumed,
    showOutput,
    handleGenerate, handleRegenerate,
    handleDownload, handleUsePreset, clearForm,
  } = useThumbnailGeneration({
    onComplete: (id) => router.push(`/dashboard/thumbnails/${id}`),
  })

  const [showFrameModal, setShowFrameModal] = useState(false)

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
        <h1 className="text-3xl font-bold tracking-tight">Create New Thumbnail</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Generate AI-powered thumbnails personalized to your channel style
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
        <div className="max-w-full mx-auto">
          <AnimatePresence mode="wait">
            {showOutput ? (
              <motion.div
                key="output"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3 }}
              >
                <ThumbnailOutputPanel
                  isGenerating={isGenerating}
                  progress={progress}
                  statusMessage={statusMessage}
                  generatedImages={generatedImages}
                  creditsConsumed={creditsConsumed}
                  onRegenerate={handleRegenerate}
                  onDownload={handleDownload}
                  onNewGeneration={clearForm}
                />
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.3 }}
              >
                <ThumbnailForm
                  prompt={prompt}
                  setPrompt={setPrompt}
                  context={context}
                  setContext={setContext}
                  ratio={ratio}
                  setRatio={setRatio}
                  videoLink={videoLink}
                  setVideoLink={setVideoLink}
                  referenceImage={referenceImage}
                  setReferenceImage={setReferenceImage}
                  faceImage={faceImage}
                  setFaceImage={setFaceImage}
                  isGenerating={isGenerating}
                  onGenerate={handleGenerate}
                  onUsePreset={handleUsePreset}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <VideoFrameModal
        open={showFrameModal}
        onOpenChange={setShowFrameModal}
        videoUrl={videoLink}
        onFrameCapture={(file) => setReferenceImage(file)}
      />
    </motion.div>
  )
}
