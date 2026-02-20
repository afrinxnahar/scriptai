"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Sparkles, BookOpen, Users, Clock, Film, Palette, Wand2, ArrowRight } from "lucide-react"
import {
  VIDEO_DURATIONS,
  VIDEO_DURATION_LABELS,
  CONTENT_TYPES,
  CONTENT_TYPE_LABELS,
  type VideoDuration,
  type ContentType,
} from "@repo/validation"

const PRESET_TOPICS = [
  {
    label: "Tech Review",
    topic: "In-depth review of the latest smartphone with real-world tests and comparisons",
    audience: "Tech enthusiasts aged 18-35",
    contentType: "review" as ContentType,
    duration: "medium" as VideoDuration,
  },
  {
    label: "Tutorial",
    topic: "Step-by-step guide to building a personal website from scratch",
    audience: "Beginners learning web development",
    contentType: "tutorial" as ContentType,
    duration: "long" as VideoDuration,
  },
  {
    label: "Story Time",
    topic: "The incredible journey of how I quit my job and built a business from nothing",
    audience: "Aspiring entrepreneurs and career changers",
    contentType: "story" as ContentType,
    duration: "medium" as VideoDuration,
  },
]

interface StoryBuilderFormProps {
  videoTopic: string
  setVideoTopic: (v: string) => void
  targetAudience: string
  setTargetAudience: (v: string) => void
  videoDuration: VideoDuration
  setVideoDuration: (v: VideoDuration) => void
  contentType: ContentType
  setContentType: (v: ContentType) => void
  tone: string
  setTone: (v: string) => void
  additionalContext: string
  setAdditionalContext: (v: string) => void
  personalized: boolean
  setPersonalized: (v: boolean) => void
  aiTrained: boolean
  isGenerating: boolean
  onGenerate: () => void
}

export function StoryBuilderForm({
  videoTopic,
  setVideoTopic,
  targetAudience,
  setTargetAudience,
  videoDuration,
  setVideoDuration,
  contentType,
  setContentType,
  tone,
  setTone,
  additionalContext,
  setAdditionalContext,
  personalized,
  setPersonalized,
  aiTrained,
  isGenerating,
  onGenerate,
}: StoryBuilderFormProps) {
  const handleUsePreset = (preset: (typeof PRESET_TOPICS)[number]) => {
    setVideoTopic(preset.topic)
    setTargetAudience(preset.audience)
    setContentType(preset.contentType)
    setVideoDuration(preset.duration)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-purple-500" />
          Story Builder
        </CardTitle>
        <CardDescription>
          Describe your video and our AI will craft a complete story structure
          with hooks, retention beats, open loops, and more
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Personalization Toggle */}
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-purple-500" />
              <Label htmlFor="personalized" className="font-medium cursor-pointer">
                Personalize to my style
              </Label>
            </div>
            <Switch
              id="personalized"
              checked={personalized && aiTrained}
              onCheckedChange={setPersonalized}
              disabled={!aiTrained || isGenerating}
            />
          </div>
          {aiTrained ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {personalized
                ? "Story structure will be tailored to your channel's tone, pacing, and audience engagement style"
                : "Toggle on to use your trained AI style profile for personalized results"}
            </p>
          ) : (
            <div className="flex items-center justify-between gap-2 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-2.5">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Train your AI in the AI Studio to unlock personalized story structures based on your content style
              </p>
              <Link href="/dashboard/train">
                <Button variant="outline" size="sm" className="shrink-0 text-xs gap-1 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40">
                  AI Studio
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Preset Suggestions */}
        <div className="space-y-2">
          <Label className="text-sm text-slate-500 dark:text-slate-400">
            Quick start with a preset
          </Label>
          <div className="flex flex-wrap gap-2">
            {PRESET_TOPICS.map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                onClick={() => handleUsePreset(preset)}
                disabled={isGenerating}
                className="text-xs"
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Video Topic */}
        <div className="space-y-2">
          <Label htmlFor="videoTopic">Video Topic *</Label>
          <Textarea
            id="videoTopic"
            placeholder="e.g., How I grew from 0 to 100K subscribers in 6 months using only Shorts"
            value={videoTopic}
            onChange={(e) => setVideoTopic(e.target.value)}
            disabled={isGenerating}
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Be specific about your video&apos;s topic, angle, and key message
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Content Type */}
          <div className="space-y-2">
            <Label htmlFor="contentType" className="flex items-center gap-1.5">
              <Film className="h-4 w-4" />
              Content Type
            </Label>
            <Select
              value={contentType}
              onValueChange={(v) => setContentType(v as ContentType)}
              disabled={isGenerating}
            >
              <SelectTrigger id="contentType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_TYPES.map((ct) => (
                  <SelectItem key={ct} value={ct}>
                    {CONTENT_TYPE_LABELS[ct]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Video Duration */}
          <div className="space-y-2">
            <Label htmlFor="videoDuration" className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              Video Duration
            </Label>
            <Select
              value={videoDuration}
              onValueChange={(v) => setVideoDuration(v as VideoDuration)}
              disabled={isGenerating}
            >
              <SelectTrigger id="videoDuration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VIDEO_DURATIONS.map((vd) => (
                  <SelectItem key={vd} value={vd}>
                    {VIDEO_DURATION_LABELS[vd]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Target Audience */}
        <div className="space-y-2">
          <Label htmlFor="targetAudience" className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            Target Audience
            <span className="text-slate-400 font-normal">(optional)</span>
          </Label>
          <Input
            id="targetAudience"
            placeholder="e.g., Beginner content creators aged 18-30"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            disabled={isGenerating}
          />
        </div>

        {/* Tone — hint from profile if trained */}
        <div className="space-y-2">
          <Label htmlFor="tone" className="flex items-center gap-1.5">
            <Palette className="h-4 w-4" />
            Tone / Mood
            <span className="text-slate-400 font-normal">
              {personalized && aiTrained ? "(auto-filled from your style if left empty)" : "(optional)"}
            </span>
          </Label>
          <Input
            id="tone"
            placeholder={personalized && aiTrained
              ? "Leave empty to use your trained tone, or override here"
              : "e.g., Energetic and motivational, casual and conversational"}
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            disabled={isGenerating}
          />
        </div>

        {/* Additional Context */}
        <div className="space-y-2">
          <Label htmlFor="additionalContext">
            Additional Context
            <span className="text-slate-400 font-normal ml-1">(optional)</span>
          </Label>
          <Textarea
            id="additionalContext"
            placeholder="Any specific points you want to cover, your filming style, brand guidelines, etc."
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
            disabled={isGenerating}
            rows={2}
            className="resize-none"
          />
        </div>
      </CardContent>

      <CardFooter>
        <Button
          onClick={onGenerate}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          disabled={isGenerating || !videoTopic.trim()}
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Story Structure...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              {personalized && aiTrained ? "Generate Personalized Blueprint" : "Generate Story Blueprint"}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
