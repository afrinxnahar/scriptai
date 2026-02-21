"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useStoryBuilder } from "@/hooks/useStoryBuilder"
import { StoryBuilderForm } from "@/components/dashboard/story-builder/StoryBuilderForm"
import { StoryBuilderProgress } from "@/components/dashboard/story-builder/StoryBuilderProgress"
import { StoryBuilderResults } from "@/components/dashboard/story-builder/StoryBuilderResults"
import { StoryBuilderHistory } from "@/components/dashboard/story-builder/StoryBuilderHistory"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function StoryBuilderPage() {
  const searchParams = useSearchParams()
  const {
    videoTopic, setVideoTopic,
    targetAudience, setTargetAudience,
    audienceLevel, setAudienceLevel,
    videoDuration, setVideoDuration,
    contentType, setContentType,
    storyMode, setStoryMode,
    tone, setTone,
    additionalContext, setAdditionalContext,
    personalized, setPersonalized,
    selectedIdeationId, selectedIdeaIndex,
    ideationJobs, isLoadingIdeations,
    isGenerating, progress, statusMessage,
    generatedResult,
    pastJobs, isLoadingJobs,
    aiTrained,
    handleGenerate, handleRegenerate,
    handleViewJob, handleDeleteJob,
    handleSelectIdea,
  } = useStoryBuilder()

  useEffect(() => {
    const topic = searchParams.get("topic")
    if (topic && !videoTopic) setVideoTopic(topic)
  }, [searchParams])

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Story Builder</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Build modular story blueprints with structured hooks, escalation segments, tension mapping, and retention scoring
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
                audienceLevel={audienceLevel}
                setAudienceLevel={setAudienceLevel}
                videoDuration={videoDuration}
                setVideoDuration={setVideoDuration}
                contentType={contentType}
                setContentType={setContentType}
                storyMode={storyMode}
                setStoryMode={setStoryMode}
                tone={tone}
                setTone={setTone}
                additionalContext={additionalContext}
                setAdditionalContext={setAdditionalContext}
                personalized={personalized}
                setPersonalized={setPersonalized}
                aiTrained={aiTrained}
                isGenerating={isGenerating}
                onGenerate={handleGenerate}
                ideationJobs={ideationJobs}
                isLoadingIdeations={isLoadingIdeations}
                onSelectIdea={handleSelectIdea}
                selectedIdeationId={selectedIdeationId}
                selectedIdeaIndex={selectedIdeaIndex}
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
                    <span className="text-green-500 mt-0.5">&#9679;</span>
                    Structured hook with curiosity, promise &amp; stakes
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-0.5">&#9679;</span>
                    Context setup with problem &amp; why it matters
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">&#9679;</span>
                    Escalation segments with micro-hooks &amp; transitions
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">&#9679;</span>
                    Climax with insights, twists &amp; value moments
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 mt-0.5">&#9679;</span>
                    Resolution + callback with soft CTA
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500 mt-0.5">&#128202;</span>
                    Tension mapping: retention score, curiosity loops, drop risk
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-500 mt-0.5">&#10084;&#65039;</span>
                    Emotional arc, retention beats &amp; pattern interrupts
                  </li>
                </ul>
              </div>

              {aiTrained && (
                <div className="rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30 p-5 space-y-2">
                  <h3 className="font-semibold text-sm flex items-center gap-1.5 text-purple-700 dark:text-purple-400">
                    <span>&#10024;</span> Powered by your style
                  </h3>
                  <p className="text-xs text-purple-600 dark:text-purple-400">
                    Your AI is trained! Blueprints adapt to your channel&apos;s pacing, humor frequency,
                    direct address style, stats usage, and emotional tone patterns.
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
