"use client"

import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CheckCircle2, type LucideIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import confetti from "canvas-confetti"

interface NextStep {
  title: string
  description: string
  icon: LucideIcon
  href: string
}

interface SuccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  nextSteps: NextStep[]
}

function fireConfetti() {
  const duration = 2500
  const end = Date.now() + duration

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ["#a855f7", "#7c3aed", "#6366f1", "#22c55e", "#eab308"],
    })
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ["#a855f7", "#7c3aed", "#6366f1", "#22c55e", "#eab308"],
    })
    if (Date.now() < end) requestAnimationFrame(frame)
  }
  frame()
}

export function SuccessDialog({
  open,
  onOpenChange,
  title,
  description,
  nextSteps,
}: SuccessDialogProps) {
  const router = useRouter()

  useEffect(() => {
    if (open) fireConfetti()
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md lg:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center items-center gap-3">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {title}
          </DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
            Explore Features
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {nextSteps.map((step) => (
              <Card
                key={step.href}
                className="group hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer"
                onClick={() => {
                  onOpenChange(false)
                  router.push(step.href)
                }}
              >
                <CardContent className="p-3 flex flex-col items-center text-center gap-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium">{step.title}</CardTitle>
                    <CardDescription className="text-xs mt-0.5">{step.description}</CardDescription>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
