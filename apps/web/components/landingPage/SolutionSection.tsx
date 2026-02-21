
"use client";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { Video, Zap, CheckCircle, Target } from "lucide-react";

export default function SolutionCard() {
    const solutions = [
        {
            title: "AI Learns Your Voice",
            description: "Upload 3-5 videos and watch our AI master your unique style, tone, vocabulary, and pacing patterns.",
            icon: <Video className="h-6 w-6 text-slate-600" />,
            background: "bg-white",
        },
        {
            title: "Instant Script Generation",
            description: "Generate personalized scripts in minutes, not hours. Focus on what you do best - creating amazing content.",
            icon: <Zap className="h-6 w-6 text-slate-600" />,
            background: "bg-slate-50",
        },
        {
            title: "Consistent Quality",
            description: "Every script maintains your brand voice and quality standards, ensuring consistent audience engagement.",
            icon: <CheckCircle className="h-6 w-6 text-slate-600" />,
            background: "bg-white",
        },
        {
            title: "Complete Workflow",
            description: "From scripts to thumbnails to subtitles - everything you need in one powerful, integrated platform.",
            icon: <Target className="h-6 w-6 text-slate-600" />,
            background: "bg-slate-50",
        },
    ];

    return (
        <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50">
                    Solutions for Your Content Creation Challenges
                </h2>
                <p className="max-w-[700px] text-slate-600 dark:text-slate-400 md:text-lg">
                    Creator AI addresses your pain points with powerful, tailored solutions to streamline your workflow.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mt-16">
                {solutions.map((solution, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                        <CardSpotlight
                            className={cn(
                                "relative overflow-hidden min-h-[250px] w-full",
                                solution.background,
                                "border border-slate-100 dark:border-slate-700 shadow-sm rounded-xl"
                            )}
                            color="#b4cae0" // Light slate white for subtle hover
                            // radius={50}
                            role="article"
                        // aria-label={`Solution: ${solution.title}`}
                        >
                            <div className="relative z-10 flex flex-col items-start h-full p-6">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-200 text-slate-600 dark:text-slate-600 mb-4">
                                    {solution.icon}
                                </div>
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
                                    {solution.title}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {solution.description}
                                </p>
                            </div>
                        </CardSpotlight>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}