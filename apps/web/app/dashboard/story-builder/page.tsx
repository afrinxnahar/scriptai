"use client"

import { useStoryBuilder } from "@/hooks/useStoryBuilder"
import { StoryBuilderForm } from "@/components/dashboard/story-builder/StoryBuilderForm"
import { StoryBuilderProgress } from "@/components/dashboard/story-builder/StoryBuilderProgress"
import { StoryBuilderResults } from "@/components/dashboard/story-builder/StoryBuilderResults"
import { StoryBuilderHistory } from "@/components/dashboard/story-builder/StoryBuilderHistory"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function StoryBuilderPage() {
  const {
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
    isGenerating,
    progress,
    statusMessage,
    generatedResult,
    pastJobs,
    isLoadingJobs,
    aiTrained,
    handleGenerate,
    handleRegenerate,
    handleViewJob,
    handleDeleteJob,
  } = useStoryBuilder()

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Story Builder</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Structure compelling video stories with AI-powered hooks, retention beats, and emotional arcs
        </p>
      </div>

      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left: Form */}
            <div className="lg:col-span-3">
              <StoryBuilderForm
                videoTopic={videoTopic}
                setVideoTopic={setVideoTopic}
                targetAudience={targetAudience}
                setTargetAudience={setTargetAudience}
                videoDuration={videoDuration}
                setVideoDuration={setVideoDuration}
                contentType={contentType}
                setContentType={setContentType}
                tone={tone}
                setTone={setTone}
                additionalContext={additionalContext}
                setAdditionalContext={setAdditionalContext}
                personalized={personalized}
                setPersonalized={setPersonalized}
                aiTrained={aiTrained}
                isGenerating={isGenerating}
                onGenerate={handleGenerate}
              />
            </div>

            {/* Right: Progress + Tips */}
            <div className="lg:col-span-2 space-y-6">
              {isGenerating && (
                <StoryBuilderProgress
                  progress={progress}
                  statusMessage={statusMessage}
                />
              )}

              <div className="rounded-lg border bg-slate-50 dark:bg-slate-800/50 p-5 space-y-3">
                <h3 className="font-semibold text-sm">What you&apos;ll get</h3>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-0.5">&#9889;</span>
                    Hook strategy for the crucial first 10 seconds
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">&#127919;</span>
                    Retention beats to keep viewers engaged
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">&#128260;</span>
                    Open loops that create anticipation
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">&#9889;</span>
                    Pattern interrupts to recapture attention
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-500 mt-0.5">&#10084;&#65039;</span>
                    Emotional arc for deeper connection
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500 mt-0.5">&#128227;</span>
                    Strategic CTA placement with scripts
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-500 mt-0.5">&#9201;</span>
                    Story pacing guide section by section
                  </li>
                </ul>
              </div>

              {aiTrained && (
                <div className="rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30 p-5 space-y-2">
                  <h3 className="font-semibold text-sm flex items-center gap-1.5 text-purple-700 dark:text-purple-400">
                    <span>&#10024;</span> Powered by your style
                  </h3>
                  <p className="text-xs text-purple-600 dark:text-purple-400">
                    Your AI is trained! Story structures will be personalized to match your channel&apos;s tone,
                    pacing, humor style, and audience engagement patterns.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          {generatedResult && (
            <StoryBuilderResults
              result={generatedResult}
              onRegenerate={handleRegenerate}
              isGenerating={isGenerating}
            />
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <StoryBuilderHistory
            jobs={pastJobs}
            isLoading={isLoadingJobs}
            onView={handleViewJob}
            onDelete={handleDeleteJob}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
