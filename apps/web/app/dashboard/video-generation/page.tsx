"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, Video, Wand2, Music, Type, Layers, Sparkles } from "lucide-react"

const FEATURES = [
  { icon: Wand2, title: "AI Scene Generation", desc: "Auto-generate scenes from your script with intelligent visual matching" },
  { icon: Music, title: "Background Music", desc: "AI-selected royalty-free tracks that match your video's mood" },
  { icon: Type, title: "Auto Captions", desc: "Perfectly timed captions with customizable styles" },
  { icon: Layers, title: "B-Roll Integration", desc: "Smart stock footage suggestions placed at the right moments" },
  { icon: Video, title: "Multiple Formats", desc: "Export in YouTube, Shorts, Reels, and TikTok formats" },
  { icon: Sparkles, title: "Style Transfer", desc: "Match your existing video style for brand consistency" },
]

export default function VideoGenerationPage() {
  const router = useRouter()

  return (
    <div className="container py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Video Generation
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Turn your scripts into fully produced videos with AI
        </p>
      </div>

      <Card className="relative overflow-hidden">
        <CardContent className="p-8 md:p-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex items-start gap-3 rounded-lg border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800/50"
              >
                <div className="flex-shrink-0 rounded-md bg-purple-50 dark:bg-purple-900/20 p-2">
                  <Icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100">{title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>

        <div className="absolute inset-0 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center space-y-4">
            <Clock className="h-12 w-12 mx-auto text-slate-500 dark:text-slate-400" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Coming Soon
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-md">
              We&apos;re building an AI-powered video generator that turns your scripts into fully produced videos. Stay tuned!
            </p>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard")}
              className="bg-slate-950 hover:bg-slate-900 text-white"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
