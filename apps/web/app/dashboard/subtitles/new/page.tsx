"use client";

import { SubtitleUploader } from "@/components/dashboard/subtitles/subtitleUploader";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Gem, ArrowUpRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewSubtitlePage() {
    return (
        <div className="min-h-screen bg-[#f8fafc]">
            <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 lg:py-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <Link href="/dashboard/subtitles">
                            <Button variant="ghost" size="sm" className="mb-2 -ml-2 text-slate-500 hover:text-slate-900">
                                <ArrowLeft className="mr-1 h-4 w-4" />
                                Back to Subtitles
                            </Button>
                        </Link>
                        <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">
                            Subtitle Generator
                        </h1>
                        <p className="text-lg text-slate-500 max-w-2xl">
                            Transform your videos with studio-quality AI subtitles in minutes.
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
                        >
                            <SubtitleUploader onUploadSuccess={() => {}} />
                        </motion.div>
                    </div>

                    <div className="lg:col-span-4 space-y-6">
                        <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                                    How It Works
                                    <Sparkles className="h-4 w-4 text-violet-500" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm text-slate-600">
                                <div className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-bold flex items-center justify-center">1</span>
                                    <p>Upload your video file (MP4, MOV, etc.)</p>
                                </div>
                                <div className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-bold flex items-center justify-center">2</span>
                                    <p>AI transcribes and generates timed subtitles</p>
                                </div>
                                <div className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-bold flex items-center justify-center">3</span>
                                    <p>Edit, style, and export in SRT or VTT format</p>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="group relative bg-slate-900 rounded-3xl p-8 text-white overflow-hidden shadow-xl shadow-slate-200">
                            <div className="absolute -top-12 -right-12 w-40 h-40 bg-violet-600/30 rounded-full blur-3xl group-hover:bg-violet-500/40 transition-colors duration-500"></div>
                            <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl"></div>
                            <div className="relative z-10">
                                <div className="inline-flex p-3 rounded-2xl bg-white/10 backdrop-blur-md mb-6">
                                    <Gem className="h-6 w-6 text-violet-300" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3">Go Unlimited</h3>
                                <p className="text-slate-400 text-sm leading-relaxed mb-8">
                                    Unlock 4K exports, custom brand fonts, and priority AI processing.
                                </p>
                                <button className="w-full flex items-center justify-center gap-2 bg-white text-slate-900 font-bold py-4 rounded-2xl hover:bg-slate-50 transition-all transform active:scale-[0.98]">
                                    Upgrade Now
                                    <ArrowUpRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
