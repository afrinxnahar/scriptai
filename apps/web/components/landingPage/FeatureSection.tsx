"use client"

import { motion } from "motion/react"
import {
    Video,
    PenTool,
    Zap,
    Globe,
    BookOpen,
    Gift,
    ImageIcon,
    FileText,
} from "lucide-react"
import FeatureCard from "../feature-card"

export default function FeatureSection() {
    const features = [
        {
            title: "Personalized AI Training",
            icon: Video,
            description:
                "Upload your videos to train the AI on your unique style, tone, and content preferences.",
        },
        {
            title: "Script Generation",
            icon: PenTool,
            description:
                "Generate tailored scripts with simple prompts that match your personal style.",
        },
        {
            title: "Customizable Context",
            icon: Zap,
            description:
                "Add specific context to your scripts via text fields or dropdowns for more relevant content.",
        },
        {
            title: "Language Expansion",
            icon: Globe,
            description:
                "Generate scripts in multiple languages to reach a global audience.",
        },
        {
            title: "Course Builder",
            icon: BookOpen,
            description:
                "Break down complex topics into structured courses with suggested video counts and topics.",
        },
        {
            title: "Referral Program",
            icon: Gift,
            description:
                "Earn free credits for premium features by referring other creators to Script AI.",
        },
        {
            title: "AI Thumbnail Generator",
            icon: ImageIcon,
            description:
                "Create eye-catching thumbnails that drive clicks and views.",
        },
        {
            title: "Subtitle Generator",
            icon: FileText,
            description:
                "Automatically generate accurate subtitles for your videos to improve accessibility.",
        },
        {
            title: "Audio Dubbing",
            icon: FileText,
            description:
                "Generates audio in multiple languages using generative voice cloning for global reach.",
        },
    ]

    return (
        <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50">
                    Powerful Features for Content Creators
                </h2>
                <p className="max-w-[700px] text-slate-600 dark:text-slate-400 md:text-lg">
                    Everything you need to create engaging YouTube content faster and
                    easier than ever before.
                </p>
            </div>

            <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12"
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                transition={{ staggerChildren: 0.15 }}
            >
                {features.map((feature, index) => {
                    const Icon = feature.icon
                    return (
                        <motion.div
                            key={index}
                            variants={{
                                hidden: { opacity: 0, y: 30 },
                                show: { opacity: 1, y: 0 },
                            }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                        >
                            <FeatureCard
                                title={feature.title}
                                icon={<Icon className="h-6 w-6 text-slate-500" />}
                                description={feature.description}
                            />
                        </motion.div>
                    )
                })}
            </motion.div>
        </div>
    )
}
