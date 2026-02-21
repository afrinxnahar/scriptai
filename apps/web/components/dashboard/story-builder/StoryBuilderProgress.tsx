"use client"

import { motion } from "motion/react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Loader2, Sparkles, BookOpen, PenTool, CheckCircle2, BarChart3 } from "lucide-react"

interface StoryBuilderProgressProps {
  progress: number
  statusMessage: string
}

const steps = [
  { label: "Queued", icon: Loader2, threshold: 0 },
  { label: "Profile", icon: Sparkles, threshold: 10 },
  { label: "Blueprint", icon: BookOpen, threshold: 20 },
  { label: "Scoring", icon: BarChart3, threshold: 75 },
  { label: "Saving", icon: PenTool, threshold: 85 },
  { label: "Done", icon: CheckCircle2, threshold: 100 },
]

export function StoryBuilderProgress({ progress, statusMessage }: StoryBuilderProgressProps) {
  const currentStepIndex = steps.reduce(
    (acc, step, idx) => (progress >= step.threshold ? idx : acc),
    0,
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/30 dark:to-slate-900">
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">{statusMessage}</span>
              <span className="font-medium text-purple-600 dark:text-purple-400">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="flex items-center justify-between">
            {steps.map((step, idx) => {
              const Icon = step.icon
              const isActive = idx === currentStepIndex
              const isCompleted = idx < currentStepIndex

              return (
                <div key={step.label} className="flex flex-col items-center gap-1.5">
                  <div
                    className={`
                      flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300
                      ${isActive
                        ? "bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 ring-2 ring-purple-300 dark:ring-purple-700"
                        : isCompleted
                          ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600"
                      }
                    `}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? "animate-pulse" : ""}`} />
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      isActive
                        ? "text-purple-600 dark:text-purple-400"
                        : isCompleted
                          ? "text-green-600 dark:text-green-400"
                          : "text-slate-400 dark:text-slate-600"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-purple-400"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
