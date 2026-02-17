"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { ArrowLeft, Download, Loader2, Trash2, CheckCircle2, Languages, Video, Music } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog"
import { useSupabase } from "@/components/supabase-provider"
import { getDubbing, deleteDubbing } from "@/lib/api/getDubbings"
import { DubResponse, supportedLanguages } from "@repo/validation"

async function downloadFile(url: string, filename: string) {
  const response = await fetch(url)
  const blob = await response.blob()
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = blobUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(blobUrl)
}

function getLanguageLabel(code: string): string {
  return supportedLanguages.find((l) => l.value === code)?.label ?? code
}

export default function DubbingDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { session } = useSupabase()
  const projectId = params.id as string

  const [dubbing, setDubbing] = useState<DubResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    const fetchDubbing = async () => {
      if (!projectId || !session?.access_token) return

      setLoading(true)
      try {
        const data = await getDubbing(projectId, session.access_token)
        if (!data) {
          toast.error("Dubbing not found")
          router.push("/dashboard/dubbing")
          return
        }
        console.log('data', data);
        setDubbing(data);
      } catch (error: any) {
        toast.error("Error loading dubbing", {
          description: error.message || "Failed to fetch dubbing details.",
        })
        router.push("/dashboard/dubbing")
      } finally {
        setLoading(false)
      }
    }

    fetchDubbing()
  }, [projectId, session?.access_token, router])

  const handleDelete = async () => {
    if (!projectId) return

    setIsDeleting(true)
    try {
      const success = await deleteDubbing(projectId, session?.access_token)
      if (success) {
        toast.success("Dubbing deleted!", {
          description: "The dubbed media has been successfully deleted.",
        })
        router.push("/dashboard/dubbing")
      } else {
        throw new Error("Failed to delete")
      }
    } catch (error: any) {
      toast.error("Error deleting dubbing", {
        description: error.message || "Failed to delete dubbing.",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDownload = useCallback(async () => {
    if (!dubbing?.dubbedUrl) return
    setIsDownloading(true)
    try {
      const ext = dubbing.isVideo ? "mp4" : "mp3"
      const baseName = dubbing.mediaName || `dubbed_${dubbing.isVideo ? "video" : "audio"}_${dubbing.targetLanguage}`
      const filename = `${baseName}.${ext}`
      await downloadFile(dubbing.dubbedUrl, filename)
      toast.success("Download started")
    } catch {
      toast.error("Download failed", { description: "Please try again" })
    } finally {
      setIsDownloading(false)
    }
  }, [dubbing])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    )
  }

  if (!dubbing) {
    return null
  }

  const languageLabel = getLanguageLabel(dubbing.targetLanguage)
  const isCompleted = dubbing.status === "dubbed" && dubbing.dubbedUrl

  return (
    <div className="container py-8">
      <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dubbing Details</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Preview and download your dubbed media
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/dubbing")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dubbings
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Preview Card */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Loader2 className="h-5 w-5 animate-spin" />
                )}
                {dubbing.mediaName || (isCompleted ? "Dubbing Complete" : "Processing...")}
              </CardTitle>
              <CardDescription>
                {isCompleted
                  ? `Your media has been dubbed into ${languageLabel}. Preview and download below.`
                  : "Your dubbing is still being processed. Please check back later."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isCompleted && dubbing.dubbedUrl ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {dubbing.originalMediaUrl && (
                    <div className="space-y-4">
                      <Label>Original Media</Label>
                      <div className="rounded-lg border bg-slate-50 dark:bg-slate-900/40 p-4">
                        {dubbing.isVideo ? (
                          <video
                            controls
                            src={dubbing.originalMediaUrl}
                            className="w-full max-h-[300px] rounded-lg"
                          >
                            Your browser does not support the video element.
                          </video>
                        ) : (
                          <audio controls src={dubbing.originalMediaUrl} className="w-full">
                            Your browser does not support the audio element.
                          </audio>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="space-y-4">
                    <Label>Dubbed Media ({languageLabel})</Label>
                    <div className="rounded-lg border bg-slate-50 dark:bg-slate-900/40 p-4">
                      {dubbing.isVideo ? (
                        <video
                          controls
                          src={dubbing.dubbedUrl}
                          className="w-full max-h-[300px] rounded-lg"
                        >
                          Your browser does not support the video element.
                        </video>
                      ) : (
                        <audio controls src={dubbing.dubbedUrl} className="w-full">
                          Your browser does not support the audio element.
                        </audio>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
                  <p>Your dubbing is still being processed...</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/30 hover:border-red-500/50"
                    disabled={isDeleting}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Dubbing
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete this dubbed media.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {isCompleted && (
                <Button
                  onClick={handleDownload}
                  className="w-full sm:w-auto bg-slate-950 hover:bg-slate-900 text-white"
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  {isDownloading ? "Downloading..." : `Download ${dubbing.isVideo ? "Video" : "Audio"}`}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        {/* Metadata Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg">
                  {dubbing.isVideo ? (
                    <Video className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  ) : (
                    <Music className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Media Type</p>
                  <p className="font-medium">{dubbing.isVideo ? "Video" : "Audio"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg">
                  <Languages className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Target Language</p>
                  <p className="font-medium">{languageLabel}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Status</p>
                  <p className="font-medium capitalize">{dubbing.status}</p>
                </div>
              </div>

              {dubbing.creditsConsumed !== undefined && dubbing.creditsConsumed > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Credits Used</p>
                  <p className="font-medium">{dubbing.creditsConsumed} credits</p>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-sm text-slate-500 dark:text-slate-400">Created</p>
                <p className="font-medium">
                  {new Date(dubbing.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
