"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowRight, Check, PenTool, Search, Unlink } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

interface NewUserOnboardingProps {
    profile: {
        youtube_connected: boolean;
        ai_trained: boolean;
    } | null;
    connectYoutubeChannel: () => void;
    connectingYoutube: boolean;
    disconnectYoutubeChannel: () => void;
    disconnectingYoutube: boolean;
}

export function NewUserOnboarding({
    profile,
    connectYoutubeChannel,
    connectingYoutube,
    disconnectYoutubeChannel,
    disconnectingYoutube,
}: NewUserOnboardingProps) {
    const isYoutubeConnected = profile?.youtube_connected === true;
    const isAiTrained = profile?.ai_trained === true;
    const progressValue = isYoutubeConnected ? (isAiTrained ? 100 : 50) : 0;
    const searchParams = useSearchParams();

    useEffect(() => {
        const error = searchParams.get("error");
        if (error) {
            toast.error(
                <>
                    <div className="font-semibold text-red-600">Oops! We couldn’t connect your YouTube channel. Please try again.</div>
                </>,
                { className: "bg-red-50 border-red-600 text-red-900" }
            );
        }
    }, [searchParams]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
            },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1
        },
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div variants={itemVariants} transition={{
                duration: 0.6,
                ease: "easeInOut",
            }}>
                <Card className="mb-8">
                    <CardHeader>
                        <div className="flex justify-between items-center mb-2">
                            <CardTitle className="text-2xl">Let's Get Your AI Personalized</CardTitle>
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                {progressValue}% Complete
                            </span>
                        </div>
                        <Progress value={progressValue} className="w-full [&>div]:bg-purple-600" />
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="flex items-center justify-between py-4">
                            <div className="flex items-center space-x-4">
                                <div className={`flex items-center justify-center h-8 w-8 rounded-full font-bold text-sm ${isYoutubeConnected ? "bg-green-500 text-white" : "border-2 border-purple-600 text-purple-600"}`}>
                                    {isYoutubeConnected ? <Check className="h-5 w-5" /> : "1"}
                                </div>
                                <div>
                                    <p className="font-semibold">Connect YouTube Channel</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Why? To let our AI learn your unique voice and style.</p>
                                </div>
                            </div>
                            {isYoutubeConnected ? (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={disconnectYoutubeChannel}
                                    disabled={disconnectingYoutube}
                                >
                                    <Unlink className="h-4 w-4 mr-2" />
                                    {disconnectingYoutube ? "Disconnecting..." : "Disconnect"}
                                </Button>
                            ) : (
                                <Button
                                    onClick={connectYoutubeChannel}
                                    disabled={connectingYoutube}
                                >
                                    {connectingYoutube ? "Connecting..." : "Connect"}
                                </Button>
                            )}
                        </div>
                        <Separator />
                        <TooltipProvider delayDuration={0}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className={`py-4 ${!isYoutubeConnected ? "cursor-not-allowed" : ""}`}>
                                        <Link href={isYoutubeConnected ? "/dashboard/train" : "#"} className={`block ${!isYoutubeConnected ? "pointer-events-none opacity-50" : ""}`} aria-disabled={!isYoutubeConnected} tabIndex={!isYoutubeConnected ? -1 : undefined}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <div className={`flex items-center justify-center h-8 w-8 rounded-full font-bold text-sm ${isAiTrained ? "bg-green-500 text-white" : "border border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500"}`}>
                                                        {isAiTrained ? <Check className="h-5 w-5" /> : "2"}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold">AI Studio</p>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">Why? To create a personalized script generator.</p>
                                                    </div>
                                                </div>
                                                <ArrowRight className="h-5 w-5 text-slate-400" />
                                            </div>
                                        </Link>
                                    </div>
                                </TooltipTrigger>
                                {!isYoutubeConnected && (<TooltipContent><p>Complete Step 1 to unlock</p></TooltipContent>)}
                            </Tooltip>
                        </TooltipProvider>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div variants={itemVariants} transition={{
                duration: 0.6,
                ease: "easeInOut",
            }}>
                <h2 className="text-xl font-semibold mb-4">Or, jump right in</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <TooltipProvider delayDuration={0}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className={`${!isAiTrained ? "cursor-not-allowed" : ""}`}>
                                    <Link
                                        href={isAiTrained ? "/dashboard/scripts/new" : "#"}
                                        className={`block ${!isAiTrained ? "pointer-events-none" : ""}`}
                                        aria-disabled={!isAiTrained}
                                        tabIndex={!isAiTrained ? -1 : undefined}
                                    >
                                        <Card className={`hover:shadow-md transition-shadow h-full ${!isAiTrained ? "opacity-50" : ""}`}>
                                            <CardContent className="p-6 flex flex-col items-center text-center">
                                                <PenTool className="h-10 w-10 text-zinc-900 dark:text-zinc-100 mb-4" />
                                                <CardTitle className="text-lg mb-1">Create Script</CardTitle>
                                                <CardDescription>Generate a new script for your video</CardDescription>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                </div>
                            </TooltipTrigger>
                            {!isAiTrained && (
                                <TooltipContent>
                                    <p>Please complete AI training to unlock this feature.</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider delayDuration={0}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className={`${!isAiTrained ? "cursor-not-allowed" : ""}`}>
                                    <Link
                                        href={isAiTrained ? "/dashboard/thumbnails" : "#"}
                                        className={`block ${!isAiTrained ? "pointer-events-none" : ""}`}
                                        aria-disabled={!isAiTrained}
                                        tabIndex={!isAiTrained ? -1 : undefined}
                                    >
                                        <Card className={`hover:shadow-md transition-shadow h-full ${!isAiTrained ? "opacity-50" : ""}`}>
                                            <CardContent className="p-6 flex flex-col items-center text-center">
                                                <Search className="h-10 w-10 text-zinc-900 dark:text-zinc-100 mb-4" />
                                                <CardTitle className="text-lg mb-1">Research a Topic</CardTitle>
                                                <CardDescription>Research topics using your trained AI</CardDescription>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                </div>
                            </TooltipTrigger>
                            {!isAiTrained && (
                                <TooltipContent>
                                    <p>Please complete AI training to unlock this feature.</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </motion.div>
        </motion.div>
    );
}