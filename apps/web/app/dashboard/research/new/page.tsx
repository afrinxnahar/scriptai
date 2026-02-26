"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sparkles, Loader2, ArrowLeft, TrendingUp, Brain, Lightbulb, Shield, Search } from "lucide-react";
import { AITrainingRequired } from "@/components/dashboard/common/AITrainingRequired";
import IdeationProgress from "@/components/dashboard/research/IdeationProgress";
import { useIdeation } from "@/hooks/useIdeation";
import Link from "next/link";

const NICHE_EXAMPLES = [
  "AI tools for small business owners",
  "Budget travel hacks for solo travelers",
  "Home workouts for busy professionals",
];

const HOW_IT_WORKS_STEPS = [
  { title: "Channel Intelligence", desc: "We analyze your top videos, title patterns, and audience engagement to build your Creator DNA.", icon: Brain },
  { title: "Trend Signals", desc: "Real-time data from YouTube trending, Google Trends, Reddit, and Twitter/X to find rising opportunities.", icon: TrendingUp },
  { title: "Idea Synthesis", desc: "AI combines your style with niche gaps and under-served subtopics to generate unique video ideas.", icon: Lightbulb },
  { title: "Differentiation", desc: "Each idea is checked against competitors and your past content to ensure originality.", icon: Shield },
];

export default function NewIdeationPage() {
  const router = useRouter();
  const {
    context, setContext,
    nicheFocus, setNicheFocus,
    ideaCount, setIdeaCount,
    autoMode, setAutoMode,
    isGenerating,
    progress,
    statusMessage,
    generatedResult,
    activeJobDbId,
    aiTrained, credits, isLoadingProfile,
    handleGenerate,
  } = useIdeation();

  if (isLoadingProfile) {
    return (
      <div className="container py-8 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-96" />
        <Skeleton className="h-[500px] rounded-lg mt-8" />
      </div>
    );
  }

  if (!aiTrained) {
    return <AITrainingRequired />;
  }

  useEffect(() => {
    if (generatedResult && activeJobDbId) {
      router.push(`/dashboard/research/${activeJobDbId}`);
    }
  }, [generatedResult, activeJobDbId, router]);

  if (generatedResult && activeJobDbId) return null;

  return (
    <motion.div
      className="container py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-8">
        <Link href="/dashboard/research" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Ideation
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Generate Ideas</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          AI analyzes trends, your channel DNA, and niche gaps to generate high-potential video ideas
        </p>
      </div>

      <AnimatePresence mode="wait">
        {isGenerating ? (
          <motion.div
            key="progress"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <IdeationProgress progress={progress} statusMessage={statusMessage} />
          </motion.div>
        ) : (
          <motion.div
            key="form"
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="lg:col-span-4 lg:sticky lg:top-8">
              <Accordion type="single" collapsible defaultValue="how-it-works" className="w-full">
                <AccordionItem value="how-it-works">
                  <AccordionTrigger className="font-semibold">How does ideation work?</AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <div className="space-y-6">
                      {HOW_IT_WORKS_STEPS.map(({ title, desc, icon: Icon }) => (
                        <div key={title} className="flex items-start gap-4">
                          <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 shrink-0">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="pt-0.5">
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <div className="lg:col-span-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-purple-500" />
                    Configure Your Search
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between py-3 px-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div>
                      <Label className="text-sm font-medium">Auto Mode</Label>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        AI picks the best topics based on your channel intelligence and trends
                      </p>
                    </div>
                    <Switch checked={autoMode} onCheckedChange={setAutoMode} />
                  </div>

                  {!autoMode && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      <div>
                        <Label htmlFor="nicheFocus">Niche Focus</Label>
                        <Input
                          id="nicheFocus"
                          placeholder="e.g., AI tools for developers, personal finance for millennials..."
                          value={nicheFocus}
                          onChange={(e) => setNicheFocus(e.target.value)}
                          maxLength={200}
                          className="mt-1.5"
                        />
                        <p className="text-xs text-slate-400 mt-1">{nicheFocus.length}/200</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {NICHE_EXAMPLES.map((example) => (
                            <button
                              key={example}
                              type="button"
                              onClick={() => setNicheFocus(example)}
                              className="text-xs px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                            >
                              {example}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div>
                    <Label htmlFor="context">Additional Context (optional)</Label>
                    <Textarea
                      id="context"
                      placeholder="Any specific direction, audience segment, or constraints..."
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      maxLength={1000}
                      rows={3}
                      className="mt-1.5"
                    />
                    <p className="text-xs text-slate-400 mt-1">{context.length}/1000</p>
                  </div>

                  <div>
                    <Label>Number of Ideas</Label>
                    <div className="flex gap-2 mt-1.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          onClick={() => setIdeaCount(n)}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                            ideaCount === n
                              ? "bg-purple-600 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t dark:border-slate-800 flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                      Credits: <span className="font-medium text-slate-700 dark:text-slate-200">{credits}</span>
                      <span className="text-xs ml-1">(min. 2 per run)</span>
                    </p>
                    <Button
                      onClick={handleGenerate}
                      disabled={isGenerating || credits < 2 || (!autoMode && !nicheFocus.trim())}
                      className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-50 dark:hover:bg-slate-200 dark:text-slate-900"
                    >
                      {isGenerating ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                      ) : (
                        <><Sparkles className="mr-2 h-4 w-4" /> Generate Ideas</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
