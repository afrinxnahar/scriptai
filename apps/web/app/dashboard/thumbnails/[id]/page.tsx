"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ArrowLeft, Download, Loader2, ImageIcon, Clock, Ratio, Sparkles, AlertCircle, ExternalLink, Trash2, Coins, Link as LinkIcon } from "lucide-react"
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
import { Skeleton } from "@/components/ui/skeleton"
import { getThumbnail, deleteThumbnail, type ThumbnailJob } from "@/lib/api/getThumbnails"

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    queued: { label: "Queued", variant: "outline" },
    processing: { label: "Processing", variant: "secondary" },
    completed: { label: "Completed", variant: "default" },
    failed: { label: "Failed", variant: "destructive" },
}

export default function ThumbnailPage() {
    const router = useRouter()
    const params = useParams()
    const [job, setJob] = useState<ThumbnailJob | null>(null)
    const [loading, setLoading] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [deletingImage, setDeletingImage] = useState<number | null>(null)

    const jobId = params.id as string

    useEffect(() => {
        const fetchJob = async () => {
            if (!jobId) return
            setIsLoading(true)
            const data = await getThumbnail(jobId)
            if (!data) {
                toast.error("Thumbnail not found")
                router.push("/dashboard/thumbnails")
                return
            }
            setJob(data)
            setIsLoading(false)
        }
        fetchJob()
    }, [jobId, router])

    const handleDelete = async () => {
        setLoading(true)
        const success = await deleteThumbnail(jobId)
        if (success) {
            toast.success("Thumbnail deleted!")
            router.push("/dashboard/thumbnails")
        } else {
            toast.error("Failed to delete thumbnail")
        }
        setLoading(false)
    }

    const handleDownload = useCallback(async (imageUrl: string, index: number) => {
        try {
            const response = await fetch(imageUrl)
            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
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

    const handleDeleteImage = (index: number) => {
        if (!job) return
        setDeletingImage(index)
        const updatedUrls = job.image_urls.filter((_, i) => i !== index)
        setJob({ ...job, image_urls: updatedUrls })
        setDeletingImage(null)
        toast.success("Image removed from view")
    }

    if (isLoading) {
        return (
            <div className="container py-8 space-y-4">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-6 w-96" />
                <Skeleton className="h-[140px] rounded-lg mt-8" />
                <Skeleton className="h-[400px] rounded-lg" />
            </div>
        )
    }

    if (!job) return null

    const config = statusConfig[job.status] ?? { label: "Unknown", variant: "outline" as const }

    return (
        <div className="container py-8">
            <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:justify-between sm:items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Thumbnail Details</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">View your generated thumbnail</p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => router.push("/dashboard/thumbnails")}
                    className="flex items-center gap-2 rounded-xl px-4 py-2 shadow-sm hover:bg-muted hover:text-foreground transition"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Thumbnails
                </Button>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                            <li className="flex items-start gap-3">
                                <Sparkles className="h-4 w-4 mt-0.5 text-slate-400 shrink-0" />
                                <div className="text-sm min-w-0">
                                    <strong className="font-medium text-slate-800 dark:text-slate-200">Prompt:</strong>{" "}
                                    <span className="text-slate-700 dark:text-slate-300">{job.prompt}</span>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <Ratio className="h-4 w-4 mt-0.5 text-slate-400 shrink-0" />
                                <div className="text-sm">
                                    <strong className="font-medium text-slate-800 dark:text-slate-200">Aspect Ratio:</strong>{" "}
                                    <span className="text-slate-700 dark:text-slate-300">{job.ratio}</span>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <ImageIcon className="h-4 w-4 mt-0.5 text-slate-400 shrink-0" />
                                <div className="text-sm">
                                    <strong className="font-medium text-slate-800 dark:text-slate-200">Status:</strong>{" "}
                                    <Badge variant={config.variant} className="ml-1">{config.label}</Badge>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <Clock className="h-4 w-4 mt-0.5 text-slate-400 shrink-0" />
                                <div className="text-sm">
                                    <strong className="font-medium text-slate-800 dark:text-slate-200">Created:</strong>{" "}
                                    <span className="text-slate-700 dark:text-slate-300">{new Date(job.created_at).toLocaleString()}</span>
                                </div>
                            </li>
                            {job.video_link && (
                                <li className="flex items-start gap-3">
                                    <LinkIcon className="h-4 w-4 mt-0.5 text-slate-400 shrink-0" />
                                    <div className="text-sm min-w-0">
                                        <strong className="font-medium text-slate-800 dark:text-slate-200">Video:</strong>{" "}
                                        <a
                                            href={job.video_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-purple-600 hover:underline truncate inline-block max-w-[200px] align-bottom"
                                        >
                                            {job.video_link}
                                        </a>
                                    </div>
                                </li>
                            )}
                            <li className="flex items-start gap-3">
                                <Coins className="h-4 w-4 mt-0.5 text-slate-400 shrink-0" />
                                <div className="text-sm">
                                    <strong className="font-medium text-slate-800 dark:text-slate-200">Credits:</strong>{" "}
                                    <span className="text-slate-700 dark:text-slate-300">
                                        {job.credits_consumed > 0 ? `${job.credits_consumed} credit${job.credits_consumed > 1 ? "s" : ""}` : "Pending"}
                                    </span>
                                </div>
                            </li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Generated Images</CardTitle>
                        <CardDescription>
                            {job.image_urls?.length
                                ? `${job.image_urls.length} thumbnail${job.image_urls.length > 1 ? "s" : ""} generated`
                                : "No images generated yet"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {job.status === "failed" && job.error_message && (
                            <div className="flex items-start gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg mb-4">
                                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                <span>{job.error_message}</span>
                            </div>
                        )}

                        {job.image_urls?.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {job.image_urls.map((url, i) => (
                                    <div key={url} className="relative group rounded-lg overflow-hidden border bg-slate-50 dark:bg-slate-800/50">
                                        <img
                                            src={url}
                                            alt={`Thumbnail ${i + 1}`}
                                            className="w-full h-auto object-cover"
                                            loading="lazy"
                                        />
                                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                className="h-8 w-8 rounded-full bg-white/90 dark:bg-slate-900/90 shadow-sm hover:bg-white dark:hover:bg-slate-900"
                                                onClick={() => handleDownload(url, i)}
                                                title="Download"
                                            >
                                                <Download className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                className="h-8 w-8 rounded-full bg-white/90 dark:bg-slate-900/90 shadow-sm hover:bg-white dark:hover:bg-slate-900"
                                                onClick={() => window.open(url, "_blank")}
                                                title="Open in new tab"
                                            >
                                                <ExternalLink className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                className="h-8 w-8 rounded-full bg-white/90 dark:bg-slate-900/90 shadow-sm hover:bg-red-100 dark:hover:bg-red-900/40 text-red-500"
                                                onClick={() => handleDeleteImage(i)}
                                                disabled={deletingImage === i}
                                                title="Remove image"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                                <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-40" />
                                <p>
                                    {job.status === "queued" || job.status === "processing"
                                        ? "Thumbnails are being generated..."
                                        : "No images available"}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="flex justify-start">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="outline"
                                className="text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/30 hover:border-red-500/50 transition-all"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    "Delete Thumbnail"
                                )}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete this thumbnail job and all generated images.
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
                </div>
            </div>
        </div>
    )
}
