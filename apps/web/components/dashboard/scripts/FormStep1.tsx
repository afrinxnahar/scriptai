"use client"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const PRESET_PROMPTS = [
  {
    label: "Tech Tutorial",
    prompt:
      "A step-by-step tutorial on building a REST API with Node.js and Express, targeting beginner developers who want to learn backend development",
  },
  {
    label: "Product Review",
    prompt:
      "An honest, in-depth review of the latest MacBook Pro comparing it with the previous generation, covering performance, battery life, and value for money",
  },
  {
    label: "Top 10 List",
    prompt:
      "Top 10 productivity apps every student needs in 2026, with quick demos and tips for getting the most out of each one",
  },
]

interface FormStep1Props {
  prompt: string
  setPrompt: (value: string) => void
  context: string
  setContext: (value: string) => void
  promptError: string | null
}

export default function FormStep1({
  prompt,
  setPrompt,
  context,
  setContext,
  promptError,
}: FormStep1Props) {
  return (
    <div className="space-y-5">
      <h3 className="text-xl font-semibold">Step 1: What&apos;s the core idea?</h3>

      <div className="space-y-2">
        <Label>Quick Templates</Label>
        <div className="flex flex-col gap-2">
          {PRESET_PROMPTS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setPrompt(p.prompt)}
              className="text-left rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
            >
              <span className="font-medium text-slate-900 dark:text-slate-100">{p.label}</span>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{p.prompt}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="prompt">
          Prompt <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., A video about the Pomodoro Technique for improving focus and productivity"
          className="min-h-[120px] focus-visible:ring-purple-500"
        />
        {promptError && <p className="text-red-500 text-sm">{promptError}</p>}
        <p className="text-xs text-muted-foreground">
          Be specific about the topic, angle, and target audience
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="context">Additional Context</Label>
        <Textarea
          id="context"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="e.g., Mention benefits for students and developers"
          className="min-h-[100px] focus-visible:ring-purple-500"
        />
      </div>
    </div>
  )
}
