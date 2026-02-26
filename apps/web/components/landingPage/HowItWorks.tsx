import { motion } from "motion/react"; // Corrected import path
import { TracingBeam } from "../ui/tracing-beam";

export default function HowItWorks() {

    const chapters = [
        { title: "Train Your AI", description: "Upload 3-5 of your videos to train the AI on your unique style, vocabulary, and pacing." },
        { title: "Generate Scripts", description: "Input a simple prompt, select your tone, and add context to generate a personalized script." },
        { title: "Create & Share", description: "Use additional tools to generate thumbnails, titles, and subtitles, then export and create your video." },
    ]



    return (
        // No changes needed for the TracingBeam wrapper
        <TracingBeam className="px-4 sm:px-6 lg:px-8">
            <div className="max-w-xs sm:max-w-md md:max-w-lg lg:max-w-3xl xl:max-w-4xl mx-auto flex flex-col items-center text-center space-y-4 sm:space-y-6 mb-8 sm:mb-12 lg:mb-16">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white"
                >
                    How Creator AI Works
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-600 dark:text-slate-400 max-w-prose"
                >
                    A simple process to create personalized content for your YouTube channel.
                </motion.p>
            </div>

            <div className="flex flex-col space-y-6 sm:space-y-8 lg:space-y-10 max-w-xs sm:max-w-md md:max-w-lg lg:max-w-3xl xl:max-w-4xl mx-auto">
                {chapters.map((chapter, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.2 }}
                        // --- KEY CHANGES START HERE ---
                        // On large screens (lg), we switch to a row layout, align items to the start, and align text to the left.
                        className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6 sm:p-8 md:p-10 lg:p-12 
                                   flex flex-col items-center text-center 
                                   lg:flex-row lg:items-start lg:text-left lg:gap-8"
                    // --- KEY CHANGES END HERE ---
                    >
                        {/* The number circle remains largely the same, but we add flex-shrink-0 */}
                        <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white text-xl sm:text-2xl font-bold flex items-center justify-center mb-6 lg:mb-0">
                            {index + 1}
                        </div>

                        {/* We wrap the text content in a div to group it together */}
                        <div className="flex-grow">
                            <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white mb-2 sm:mb-4">
                                {chapter.title}
                            </h3>
                            <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400">
                                {chapter.description}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </TracingBeam>
    )
}