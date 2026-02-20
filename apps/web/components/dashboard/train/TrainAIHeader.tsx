"use client"
import { motion } from "motion/react"

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
}

export function TrainAIHeader() {
    return (
        <motion.div variants={itemVariants} className="mb-8 w-full">
            <h1 className="text-3xl font-bold tracking-tight">AI Studio</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
                Provide your content to train the AI on your unique style.
            </p>
        </motion.div>
    )
}