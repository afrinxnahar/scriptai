"use client"
import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import LandingPageNavbar from "@/components/landingPage/LandingPageNavbar"
import Footer from "@/components/footer"
import { SparklesCore } from "@/components/ui/sparkles"
import { MButton } from "@/components/ui/moving-border"
import { motion } from "motion/react"
import ProblemSection from "@/components/landingPage/ProblemSection"
import SolutionCard from "@/components/landingPage/SolutionSection"
import { BackgroundBeams } from "@/components/ui/background-beams"
import HowItWorks from "@/components/landingPage/HowItWorks"
import PricingSection from "@/components/landingPage/PricingSection"
import FeatureSection from "@/components/landingPage/FeatureSection"
import { FlipWords } from "@/components/ui/flip-words"
import dynamic from 'next/dynamic'
import { useEffect } from "react"
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { ShinyButton } from "@/components/magicui/shiny-button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// DYNAMIC IMPORT
const LandingPageSVG = dynamic(
    () => import('@/components/landingPage/LandingPageSVG'),
    { ssr: false }
)

export default function Home() {

  useEffect(() => {
    const lenis = new Lenis({ autoRaf: true });

    return () => lenis.destroy();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 12,
      },
    },
  }

  const words = ["Scripts", "Thumbnails", "Subtitles", "Ideas"]

  return (
      <div className="flex flex-col min-h-screen">
        <LandingPageNavbar />
        <main className="flex-1">
          <section className="relative w-full h-screen flex items-center justify-center bg-gradient-to-b from-white to-slate-50 overflow-hidden pt-12 md:pt-0">
            <div aria-hidden="true" className="absolute inset-0 -z-0">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50rem] h-[50rem] bg-purple-100/40 rounded-full blur-3xl" />
              <SparklesCore
                  background="transparent"
                  minSize={0.2}
                  maxSize={0.8}
                  className="absolute inset-0 w-full h-full z-0"
                  particleColor="#a855f7"
                  particleDensity={35}
              />
            </div>

            <div className="container mx-12 px-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative z-10">
              <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col items-center md:items-start text-center md:text-left"
              >
                <motion.div
                    variants={itemVariants}
                    className="inline-flex items-center gap-2 px-4 py-1 mb-4 rounded-full text-sm font-medium bg-white/60 ring-1 ring-slate-900/10 backdrop-blur-md"
                >
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Built for Creators</span>
                </motion.div>

                <motion.h1
                    variants={itemVariants}
                    className="text-4xl md:text-5xl font-semibold text-slate-900 tracking-tight"
                >
                  Personalized
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">
                  {" "} Creator Tool {" "}
                </span>
                  for Youtubers
                </motion.h1>

                <motion.div
                    variants={itemVariants}
                    className="mt-4 text-lg md:text-xl text-slate-700"
                >
                  Generate AI-powered <FlipWords words={words} className="text-purple-600" /> that sound like you.
                </motion.div>

                <motion.div
                    variants={itemVariants}
                    className="mt-6 flex flex-col sm:flex-row items-center gap-4"
                >
                  <Link href="/signup">
                    <MButton
                        className="bg-zinc-900 text-white hover:bg-zinc-800 shadow-md"
                        borderClassName="border border-purple-500/60"
                    >
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </MButton>
                  </Link>
                  <Dialog>
                    <DialogTrigger asChild>
                      <ShinyButton>Watch Demo</ShinyButton>
                    </DialogTrigger>
                    <DialogContent className="p-0 border-none max-w-[90vw] md:max-w-4xl bg-transparent shadow-none object-cover">
                      <DialogTitle></DialogTitle>
                      <iframe
                          src="https://drive.google.com/file/d/1CPbW40HmE2Xh8WumJeCs0PvKcpa4U1Yo/preview"
                          className="rounded-lg overflow-hidden w-full max-w-full aspect-video"
                          allow="autoplay"
                      ></iframe>
                    </DialogContent>
                  </Dialog>
                </motion.div>

                <motion.p
                    variants={itemVariants}
                    className="mt-4 text-sm text-slate-600"
                >
                  Already have an account?{" "}
                  <Link href="/login" className="text-purple-600 hover:underline">
                    Log in
                  </Link>
                </motion.p>
              </motion.div>

              <div className="hidden md:flex w-full h-full items-center justify-center">
                <LandingPageSVG />
              </div>
            </div>
          </section>

          <section className="bg-white py-24">
            <ProblemSection />
          </section>

          <section id="solutions" className="py-20 bg-slate-50 dark:bg-slate-900">
            <SolutionCard />
          </section>

          <section id="features" className="py-20 bg-white dark:bg-slate-800">
            <FeatureSection />
          </section>

          <section id="how-it-works" className="relative py-16 sm:py-20 lg:py-24 bg-slate-50 dark:bg-slate-900 overflow-hidden">
            <HowItWorks />
          </section>

          <section id="pricing" className="py-16 sm:py-20 lg:py-24 bg-white dark:bg-slate-800">
            <PricingSection />
          </section>

          <section className="relative py-20 bg-slate-900 text-white overflow-hidden">
            <BackgroundBeams className="absolute inset-0 z-0" />
            <div className="relative z-10 container px-4 md:px-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold text-white">
                  Ready to Transform Your Content Creation?
                </h2>
                <p className="max-w-[700px] text-slate-300 md:text-lg">
                  Join thousands of YouTubers who are saving time and creating better content with Creator AI.
                </p>
                <Link href="/signup" className="z-50">
                  <MButton
                      size="lg"
                      className="bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500 hover:brightness-110 text-white shadow-md transition-all"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </MButton>
                </Link>
              </div>
              <svg className="absolute bottom-0 left-0 w-full " viewBox="0 0 1440 120" xmlns="http://www.w3.org/2000/svg">
                <path fill="#fff" fillOpacity="0.05" d="M0,0 C480,120 960,0 1440,120 L1440,0 L0,0 Z" />
              </svg>
            </div>
          </section>
        </main>
        <Footer />
      </div>
  )
}