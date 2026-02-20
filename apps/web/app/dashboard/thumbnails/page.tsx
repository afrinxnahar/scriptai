"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { useThumbnailGeneration } from "@/hooks/useThumbnailGeneration"
import { useSupabase } from "@/components/supabase-provider"
import { ThumbnailForm } from "@/components/dashboard/thumbnails/ThumbnailForm"
import { ThumbnailOutputPanel } from "@/components/dashboard/thumbnails/ThumbnailOutputPanel"
import { ThumbnailHistory } from "@/components/dashboard/thumbnails/ThumbnailHistory"
import { VideoFrameModal } from "@/components/dashboard/thumbnails/VideoFrameModal"
import { AITrainingRequired } from "@/components/dashboard/common/AITrainingRequired"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

export default function ThumbnailGenerator() {
  const { profile, profileLoading } = useSupabase()
  const {
    prompt, setPrompt,
    context, setContext,
    ratio, setRatio,
    videoLink, setVideoLink,
    referenceImage, setReferenceImage,
    faceImage, setFaceImage,
    isGenerating, progress, statusMessage,
    generatedImages,
    pastJobs, isLoadingJobs,
    handleGenerate, handleRegenerate,
    handleDownload, handleUsePreset,
  } = useThumbnailGeneration()

  const [showFrameModal, setShowFrameModal] = useState(false)

  if (profileLoading) {
    return (
      <div className="container py-8 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-96" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <Skeleton className="h-[600px] rounded-lg" />
          <Skeleton className="h-[600px] rounded-lg" />
        </div>
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
        <h1 className="text-3xl font-bold tracking-tight">Thumbnail Generator</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Create AI-generated thumbnails personalized to your channel style
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
        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
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

              <ThumbnailOutputPanel
                isGenerating={isGenerating}
                progress={progress}
                statusMessage={statusMessage}
                generatedImages={generatedImages}
                onRegenerate={handleRegenerate}
                onDownload={handleDownload}
              />
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <ThumbnailHistory
              jobs={pastJobs}
              isLoading={isLoadingJobs}
              onDownload={handleDownload}
            />
          </TabsContent>
        </Tabs>
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
