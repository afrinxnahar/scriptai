"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Camera, Play, Pause } from "lucide-react"

interface VideoFrameModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  videoUrl: string
  onFrameCapture: (file: File) => void
}

export function VideoFrameModal({
  open,
  onOpenChange,
  videoUrl,
  onFrameCapture,
}: VideoFrameModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setIsLoaded(false)
      setError(null)
      setCurrentTime(0)
      setDuration(0)
      setIsPlaying(false)
    }
  }, [open])

  const handleLoadedMetadata = () => {
    const video = videoRef.current
    if (!video) return
    setDuration(video.duration)
    setIsLoaded(true)
    setError(null)
  }

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video) return
    setCurrentTime(video.currentTime)
  }

  const handleSeek = useCallback((value: number[]) => {
    const video = videoRef.current
    if (!video || !value[0]) return
    video.currentTime = value[0]
    setCurrentTime(value[0])
  }, [])

  const togglePlayPause = () => {
    const video = videoRef.current
    if (!video) return
    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
    setIsPlaying(!isPlaying)
  }

  const captureFrame = async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const file = new File([blob], `video_frame_${Math.round(currentTime)}s.png`, {
          type: "image/png",
        })
        onFrameCapture(file)
        onOpenChange(false)
      },
      "image/png",
      1,
    )
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select Video Frame</DialogTitle>
          <DialogDescription>
            Navigate through the video and capture a frame to use as reference
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="relative rounded-lg overflow-hidden bg-black">
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full max-h-[400px]"
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onError={() => setError("Failed to load video. It may be private or in an unsupported format.")}
              crossOrigin="anonymous"
              preload="metadata"
            />
          </div>

          {isLoaded && (
            <>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={togglePlayPause}>
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>

                <div className="flex-1">
                  <Slider
                    value={[currentTime]}
                    min={0}
                    max={duration}
                    step={0.1}
                    onValueChange={handleSeek}
                  />
                </div>

                <span className="text-sm text-slate-500 whitespace-nowrap min-w-[80px] text-right">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={captureFrame}
            disabled={!isLoaded}
            className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
          >
            <Camera className="h-4 w-4" />
            Capture Frame
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
