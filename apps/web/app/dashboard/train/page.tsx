"use client"

import { motion } from "motion/react"
import { SuccessDialog } from "@/components/success-dialog"
import { PenTool, Search, Volume2 } from "lucide-react"

import { useAITraining } from "@/hooks/useAITraining"
import { VideoUrlForm } from "@/components/dashboard/train/VideoUrlForm"
import { HowItWorksGuide } from "@/components/dashboard/train/HowItWorksGuide"
import { TrainAIHeader } from "@/components/dashboard/train/TrainAIHeader"
import { TrainingStatus } from "@/components/dashboard/train/TrainingStatus"
import { TrainAIPageSkeleton } from "@/components/dashboard/train/skeleton/TrainAIPageSkeleton"

export default function TrainAIPage() {
  const {
    profile,
    videos,
    pageLoading,
    isTraining,
    progress,
    statusMessage,
    uploading,
    showModal,
    isConnectingYoutube,
    setShowModal,
    handleAddVideoUrl,
    handleRemoveVideoUrl,
    handleVideoUrlChange,
    handleUrlBlur,
    handleStartTraining,
    handleConnectYoutube,
  } = useAITraining();

  const nextSteps = [
    { title: "Create Scripts", description: "Generate scripts tailored to your style", icon: PenTool, href: "/dashboard/scripts" },
    { title: "Research Topics", description: "Explore topics aligned with your content", icon: Search, href: "/dashboard/research" },
    { title: "Audio Dubbing", description: "Create dubbed audio in multiple languages", icon: Volume2, href: "/dashboard/audio-dubbing" },
  ];

  if (!profile) {
    return <TrainAIPageSkeleton />;
  }

  return (
    <div className="container py-8 h-full">
      <TrainAIHeader />

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full items-start"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="lg:col-span-4 lg:sticky lg:top-8 space-y-6">
          <HowItWorksGuide />
          <TrainingStatus
            profile={profile}
            isConnectingYoutube={isConnectingYoutube}
            onConnectYoutube={handleConnectYoutube}
          />
        </div>

        <div className="lg:col-span-8">
          <VideoUrlForm
            videos={videos}
            uploading={uploading}
            isAiTrained={profile?.ai_trained}
            isYtConnected={profile?.youtube_connected}
            isTraining={isTraining}
            progress={progress}
            statusMessage={statusMessage}
            onUrlChange={handleVideoUrlChange}
            onUrlBlur={handleUrlBlur}
            onAddUrl={handleAddVideoUrl}
            onRemoveUrl={handleRemoveVideoUrl}
            onStartTraining={handleStartTraining}
          />
        </div>
      </motion.div>

      <SuccessDialog
        open={showModal}
        onOpenChange={setShowModal}
        title="AI Training Complete!"
        description="Your AI has been successfully trained..."
        nextSteps={nextSteps}
      />
    </div>
  );
}