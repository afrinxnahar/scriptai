"use client"

import { Loader2, Sparkles, ImageIcon, Upload, CheckCircle2 } from "lucide-react"
import { GenerationProgress, type GenerationProgressStep } from "@/components/dashboard/common/GenerationProgress"

const THUMBNAIL_STEPS: GenerationProgressStep[] = [
  { label: "Queued", icon: Loader2, threshold: 0 },
  { label: "Preparing", icon: Sparkles, threshold: 10 },
  { label: "Generating", icon: ImageIcon, threshold: 20 },
  { label: "Uploading", icon: Upload, threshold: 85 },
  { label: "Done", icon: CheckCircle2, threshold: 100 },
]

interface ThumbnailProgressProps {
  progress: number
  statusMessage: string
}

export function ThumbnailProgress({ progress, statusMessage }: ThumbnailProgressProps) {
  return (
    <GenerationProgress
      progress={progress}
      statusMessage={statusMessage}
      steps={THUMBNAIL_STEPS}
      compact
    />
  )
}
