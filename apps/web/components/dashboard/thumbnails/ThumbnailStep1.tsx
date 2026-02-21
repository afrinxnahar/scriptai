"use client"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"


/**
 * @todo later on we'll fetch and show popular prompt examples from other user from DB
 */
const PRESET_PROMPTS = [
  {
    label: "Tech Tutorial",
    prompt:
      "Eye-catching tech tutorial thumbnail with a laptop screen showing code, neon blue accents, bold title text overlay, dark gradient background",
  },
  {
    label: "Travel Vlog",
    prompt:
      "Stunning travel vlog thumbnail with a beautiful landscape, warm sunset tones, person looking at a scenic view, adventure vibes with bold text",
  },
  {
    label: "Cooking / Food",
    prompt:
      "Appetizing food thumbnail with a delicious dish in the center, steam rising, vibrant colors, rustic wooden table background, bold recipe title",
  },
]

interface ThumbnailStep1Props {
  prompt: string
  setPrompt: (v: string) => void
  context: string
  setContext: (v: string) => void
  promptError: string | null
  onUsePreset: (prompt: string) => void
}

export default function ThumbnailStep1({
  prompt,
  setPrompt,
  context,
  setContext,
  promptError,
  onUsePreset,
}: ThumbnailStep1Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Step 1: Describe your thumbnail</h3>

      <div className="space-y-2">
        <Label>Popular Templates</Label>
        <div className="flex flex-col gap-2">
          {PRESET_PROMPTS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => onUsePreset(p.prompt)}
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
          Thumbnail Prompt <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., A dramatic thumbnail showing a person reacting to a computer screen with bold red and blue gradient, text overlay saying 'SHOCKING RESULTS'"
          className="min-h-[120px] focus-visible:ring-purple-500"
        />
        {promptError && <p className="text-red-500 text-sm">{promptError}</p>}
        <p className="text-xs text-muted-foreground">
          Be specific about colors, composition, text overlays, and mood
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="context">Additional Context</Label>
        <Textarea
          id="context"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="e.g., The video is about productivity tips for developers. My channel has a dark/techy aesthetic."
          className="min-h-[100px] focus-visible:ring-purple-500"
        />
      </div>
    </div>
  )
}
