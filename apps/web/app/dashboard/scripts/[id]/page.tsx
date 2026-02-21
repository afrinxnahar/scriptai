"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { ArrowLeft, BookText, CheckCircle, Clock, Hash, Languages, LinkIcon, Loader2, Smile, Sparkles, XCircle } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogFooter } from "@/components/ui/alert-dialog"
import ScriptEditor from "@/components/dashboard/scripts/ScriptEditor"
import { ScriptLoaderSkeleton } from "@/components/dashboard/scripts/skeleton/scriptLoaderSkeleton"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import Script from "next/script"
import { ScriptMetadata } from "@/components/dashboard/scripts/ScriptMetadata"
import { api, ApiClientError } from "@/lib/api-client"

interface Script {
  id: string
  title: string
  content: string
  prompt: string | null
  context: string | null
  tone: string | null
  include_storytelling: boolean
  reference_links: string | null
  language: string
  created_at: string
  updated_at: string
  include_timestamps: boolean
  duration: string
}

export default function ScriptPage() {
  const router = useRouter()
  const params = useParams()
  const [script, setScript] = useState<Script | null>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [isLoadingScript, setIsLoadingScript] = useState(true)

  const limit = 90; // character limit before truncation

  const [expandedContext, setExpandedContext] = useState(false);
  const [expandedPrompt, setExpandedPrompt] = useState(false);



  const scriptId = params.id as string

  useEffect(() => {
    const fetchScript = async () => {
      if (!scriptId) return

      setIsLoadingScript(true)
      try {
        const data = await api.get<Script>(`/api/v1/script/${scriptId}`, { requireAuth: true })
        setScript(data)
        setTitle(data.title)
        setContent(data.content)
      } catch (error: any) {
        toast.error("Error loading script", {
          description: error.message || "Failed to fetch script details.",
        })
        router.push("/dashboard/scripts")
      } finally {
        setIsLoadingScript(false)
      }
    }

    fetchScript()
  }, [scriptId, router])

  const handleUpdateScript = async () => {
    if (!title || !content) {
      toast.error("Missing information", {
        description: "Please provide a title and content for the script.",
      })
      return
    }

    setLoading(true)
    try {
      await api.patch(`/api/v1/script/${scriptId}`, { title, content }, { requireAuth: true })
      toast.success("Script updated!", {
        description: "Your script changes have been saved successfully.",
      })
    } catch (error: any) {
      toast.error("Error updating script", {
        description: error.message || "Failed to update script.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteScript = async () => {
    setLoading(true)
    try {
      await api.delete(`/api/v1/script/${scriptId}`, { requireAuth: true })
      toast.success("Script deleted!", {
        description: "The script has been successfully deleted.",
      })
      router.push("/dashboard/scripts")
    } catch (error: any) {
      toast.error("Error deleting script", {
        description: error.message || "Failed to delete script.",
      })
    } finally {
      setLoading(false)
    }
  }

  if (isLoadingScript) {
    return (
      <ScriptLoaderSkeleton />
    )
  }

  if (!script) {
    return null
  }

  return (
    <div className="container py-8">
      <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Script Details</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">View and edit your YouTube video script</p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/scripts")}
          className="flex items-center gap-2 rounded-xl px-4 py-2 shadow-sm hover:bg-muted hover:text-foreground transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Scripts
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Script Content</CardTitle>
              <CardDescription>Modify the title and the main content of your script.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ScriptEditor
                script={content}
                setScript={setContent}
                title={title}
                size="400"
                setTitle={setTitle}
                animation={false}
              />
            </CardContent>
            <CardFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/30 hover:border-red-500/50 transition-all focus-visible:ring-2 focus-visible:ring-red-500"
                    disabled={loading}
                  >
                    Delete Script
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the script "{script.title}".
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteScript} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                onClick={handleUpdateScript}
                className="w-full sm:w-auto sm:max-w-[200px] bg-slate-900 hover:bg-slate-800 text-white transition-all hover:shadow-lg hover:shadow-purple-500/10 dark:hover:shadow-purple-400/10 focus-visible:ring-2 focus-visible:ring-purple-500/80"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <ScriptMetadata script={script} />
        </div>

      </div>
    </div>
  )
}