"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  RefreshCw,
  Zap,
  Target,
  Repeat,
  Shuffle,
  Heart,
  Megaphone,
  Timer,
  FileText,
  Copy,
  Check,
} from "lucide-react"
import { toast } from "sonner"
import type { StoryBuilderResult } from "@repo/validation"

interface StoryBuilderResultsProps {
  result: StoryBuilderResult
  onRegenerate: () => void
  isGenerating: boolean
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleCopy}>
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  )
}

export function StoryBuilderResults({
  result,
  onRegenerate,
  isGenerating,
}: StoryBuilderResultsProps) {
  const copyFullBlueprint = async () => {
    const text = formatFullBlueprint(result)
    await navigator.clipboard.writeText(text)
    toast.success("Full blueprint copied to clipboard")
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5 text-purple-500" />
          Story Blueprint
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyFullBlueprint} className="gap-1.5">
            <Copy className="h-3.5 w-3.5" />
            Copy All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRegenerate}
            disabled={isGenerating}
            className="gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Regenerate
          </Button>
        </div>
      </div>

      <Accordion type="multiple" defaultValue={["hook", "retention", "loops", "interrupts", "arc", "cta", "pacing", "outline"]} className="space-y-3">
        {/* Hook Strategy */}
        <AccordionItem value="hook" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="font-semibold">Hook Strategy</span>
              <Badge variant="secondary" className="text-xs">First 10 sec</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="grid gap-3">
              <InfoBlock label="Approach" value={result.hookStrategy.approach} />
              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400 mb-1">Opening Line</p>
                    <p className="text-sm font-medium italic">&ldquo;{result.hookStrategy.openingLine}&rdquo;</p>
                  </div>
                  <CopyButton text={result.hookStrategy.openingLine} />
                </div>
              </div>
              <InfoBlock label="Visual Suggestion" value={result.hookStrategy.visualSuggestion} />
              <InfoBlock label="Emotional Trigger" value={result.hookStrategy.emotionalTrigger} />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Retention Beats */}
        <AccordionItem value="retention" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              <span className="font-semibold">Retention Beats</span>
              <Badge variant="secondary" className="text-xs">{result.retentionBeats.length} beats</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="space-y-3">
              {result.retentionBeats.map((beat, i) => (
                <div key={i} className="flex gap-3 items-start rounded-lg border p-3">
                  <Badge variant="outline" className="shrink-0 mt-0.5 font-mono text-xs">
                    {beat.timestamp}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <Badge className="text-xs mb-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100">
                      {beat.type.replace(/_/g, ' ')}
                    </Badge>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{beat.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Open Loops */}
        <AccordionItem value="loops" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Repeat className="h-4 w-4 text-green-500" />
              <span className="font-semibold">Open Loops</span>
              <Badge variant="secondary" className="text-xs">{result.openLoops.length} loops</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="space-y-3">
              {result.openLoops.map((loop, i) => (
                <div key={i} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{loop.setup}</p>
                    <Badge variant="outline" className="shrink-0 font-mono text-xs">
                      Payoff @ {loop.payoffTimestamp}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{loop.description}</p>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Pattern Interrupts */}
        <AccordionItem value="interrupts" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Shuffle className="h-4 w-4 text-orange-500" />
              <span className="font-semibold">Pattern Interrupts</span>
              <Badge variant="secondary" className="text-xs">{result.patternInterrupts.length} interrupts</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="space-y-3">
              {result.patternInterrupts.map((interrupt, i) => (
                <div key={i} className="flex gap-3 items-start rounded-lg border p-3">
                  <Badge variant="outline" className="shrink-0 mt-0.5 font-mono text-xs">
                    {interrupt.timestamp}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <Badge className="text-xs mb-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 hover:bg-orange-100">
                      {interrupt.type.replace(/_/g, ' ')}
                    </Badge>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{interrupt.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Emotional Arc */}
        <AccordionItem value="arc" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-pink-500" />
              <span className="font-semibold">Emotional Arc</span>
              <Badge variant="secondary" className="text-xs">{result.emotionalArc.beats.length} phases</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="rounded-lg bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 p-3">
              <p className="text-xs font-medium text-pink-700 dark:text-pink-400 mb-1">Arc Structure</p>
              <p className="text-sm font-medium">{result.emotionalArc.structure}</p>
            </div>
            <div className="space-y-3">
              {result.emotionalArc.beats.map((beat, i) => (
                <div key={i} className="flex gap-3 items-start rounded-lg border p-3">
                  <Badge variant="outline" className="shrink-0 mt-0.5 font-mono text-xs">
                    {beat.timestamp}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{beat.phase}</span>
                      <Badge className="text-xs bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400 hover:bg-pink-100">
                        {beat.emotion}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{beat.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* CTA Placement */}
        <AccordionItem value="cta" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-indigo-500" />
              <span className="font-semibold">CTA Placement</span>
              <Badge variant="secondary" className="text-xs">{result.ctaPlacement.length} CTAs</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="space-y-3">
              {result.ctaPlacement.map((cta, i) => (
                <div key={i} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">{cta.timestamp}</Badge>
                    <Badge className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 hover:bg-indigo-100">
                      {cta.type}
                    </Badge>
                  </div>
                  <div className="rounded bg-indigo-50 dark:bg-indigo-900/20 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm italic">&ldquo;{cta.script}&rdquo;</p>
                      <CopyButton text={cta.script} />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{cta.rationale}</p>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Story Pacing */}
        <AccordionItem value="pacing" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-teal-500" />
              <span className="font-semibold">Story Pacing</span>
              <Badge variant="secondary" className="text-xs">{result.storyPacing.sections.length} sections</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">{result.storyPacing.overview}</p>
            <div className="space-y-2">
              {result.storyPacing.sections.map((section, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
                  <div className="shrink-0 text-center">
                    <p className="text-xs text-slate-500">{section.duration}</p>
                    <Badge
                      className={`text-xs mt-1 ${
                        section.pace === 'fast' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100'
                          : section.pace === 'peak' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 hover:bg-orange-100'
                          : section.pace === 'building' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-100'
                          : section.pace === 'slow' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {section.pace}
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{section.name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{section.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Full Outline */}
        <AccordionItem value="outline" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-500" />
              <span className="font-semibold">Full Production Outline</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4">
              <div className="flex justify-end mb-2">
                <CopyButton text={result.fullOutline} />
              </div>
              <p className="text-sm whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300">
                {result.fullOutline}
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </motion.div>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  )
}

function formatFullBlueprint(result: StoryBuilderResult): string {
  let text = "=== STORY BLUEPRINT ===\n\n"

  text += "## HOOK STRATEGY (First 10 Seconds)\n"
  text += `Approach: ${result.hookStrategy.approach}\n`
  text += `Opening Line: "${result.hookStrategy.openingLine}"\n`
  text += `Visual: ${result.hookStrategy.visualSuggestion}\n`
  text += `Emotional Trigger: ${result.hookStrategy.emotionalTrigger}\n\n`

  text += "## RETENTION BEATS\n"
  result.retentionBeats.forEach((b, i) => {
    text += `${i + 1}. [${b.timestamp}] ${b.type.replace(/_/g, ' ')} — ${b.description}\n`
  })
  text += "\n"

  text += "## OPEN LOOPS\n"
  result.openLoops.forEach((l, i) => {
    text += `${i + 1}. Setup: ${l.setup} (Payoff @ ${l.payoffTimestamp})\n   ${l.description}\n`
  })
  text += "\n"

  text += "## PATTERN INTERRUPTS\n"
  result.patternInterrupts.forEach((p, i) => {
    text += `${i + 1}. [${p.timestamp}] ${p.type.replace(/_/g, ' ')} — ${p.description}\n`
  })
  text += "\n"

  text += "## EMOTIONAL ARC\n"
  text += `Structure: ${result.emotionalArc.structure}\n`
  result.emotionalArc.beats.forEach((b, i) => {
    text += `${i + 1}. [${b.timestamp}] ${b.phase} (${b.emotion}) — ${b.description}\n`
  })
  text += "\n"

  text += "## CTA PLACEMENT\n"
  result.ctaPlacement.forEach((c, i) => {
    text += `${i + 1}. [${c.timestamp}] ${c.type}: "${c.script}"\n   Rationale: ${c.rationale}\n`
  })
  text += "\n"

  text += "## STORY PACING\n"
  text += `Overview: ${result.storyPacing.overview}\n`
  result.storyPacing.sections.forEach((s, i) => {
    text += `${i + 1}. ${s.name} (${s.duration}, ${s.pace}) — ${s.description}\n`
  })
  text += "\n"

  text += "## FULL PRODUCTION OUTLINE\n"
  text += result.fullOutline

  return text
}
