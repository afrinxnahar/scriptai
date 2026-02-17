import { cn } from "@/lib/utils"
import Link from "next/link"
import { Button } from "../ui/button"
import { WobbleCard } from "../ui/wobble-card"

export default function PricingSection() {
    const baseFeatures = {
        starter: [
            "500 free credits/month",
            "Connect YouTube channel",
            "AI model training",
            "New idea research",
            "Script generation",
            "Thumbnail generation",
            "Subtitle generation",
            "Course module creation",
        ],
        proExtras: [
            "Everything in Starter",
            "5k credits/month",
            "Unlimited feature usage",
            "Audio dubbing",
        ],
        enterpriseExtras: [
            "Everything in Pro",
            "100k credits/month",
            "Advanced analytics",
            "Team collaboration",
            "Custom fine-tuned model",
            "Priority support",
        ],
    }

    const newPlans = [
        {
            id: "starter",
            name: "Starter",
            price_monthly: 0,
            credits_monthly: 500,
            features: baseFeatures.starter.map((f) => ({ feature: f, limit: "limited" })),
        },
        {
            id: "pro",
            name: "Pro",
            price_monthly: 20,
            credits_monthly: 5000,
            features: [
                ...baseFeatures.proExtras,
            ].map((f) => ({ feature: f, limit: "unlimited" })),
        },
        {
            id: "enterprise",
            name: "Enterprise",
            price_monthly: 499,
            credits_monthly: 100000,
            features: [
                ...baseFeatures.enterpriseExtras,
            ].map((f) => ({ feature: f, limit: "unlimited" })),
        },
    ]


    return (
        <div className="container px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center space-y-4 sm:space-y-6 mb-8 sm:mb-12 lg:mb-16">
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-slate-50">
                    Pricing
                </h2>
                <p className="max-w-xs sm:max-w-md md:max-w-lg lg:max-w-prose text-sm sm:text-base md:text-lg lg:text-xl text-slate-600 dark:text-slate-400">
                    Choose the plan that works best for your content creation needs.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mt-8 sm:mt-12">
                {newPlans.map((plan) => {
                    const isPopular = plan.name === "Pro"
                    const buttonLabel =
                        plan.name === "Enterprise" ? "Contact Sales" : "Get Started"

                    return (
                        <WobbleCard
                            key={plan.id}
                            className={cn(
                                "flex flex-col p-6 sm:p-8 md:p-10 relative",
                                isPopular
                                    ? "bg-slate-50 dark:bg-slate-700"
                                    : "bg-white dark:bg-slate-800",
                                "border border-slate-200 dark:border-slate-700 rounded-lg shadow-md"
                            )}
                        >
                            {isPopular && (
                                <div className="absolute top-0 right-0 mr-3 sm:mr-4 bg-slate-700 text-white text-xs sm:text-sm font-semibold px-2 sm:px-3 py-1 rounded-full">
                                    POPULAR
                                </div>
                            )}

                            <h3 className="text-lg sm:text-xl md:text-2xl font-semibold mb-2 text-slate-900 dark:text-slate-50">
                                {plan.name}
                            </h3>

                            <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-slate-900 dark:text-slate-50">
                                ${plan.price_monthly}
                                <span className="text-sm sm:text-base font-normal text-slate-600 dark:text-slate-400">
                                    /mo
                                </span>
                            </div>

                            <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 mb-4 sm:mb-6">
                                {plan.name === "Enterprise"
                                    ? "For professional YouTubers and teams."
                                    : plan.name === "Pro"
                                        ? "For serious content creators."
                                        : "Perfect for trying out Script AI."}
                            </p>

                            <ul className="space-y-2 mb-4 sm:mb-6 flex-1">
                                {plan.features.map((f, i) => (
                                    <li
                                        key={i}
                                        className="flex items-start text-sm sm:text-base text-slate-600 dark:text-slate-400"
                                    >
                                        <svg
                                            className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-500 flex-shrink-0 mt-0.5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                        {f.feature}
                                        {f.limit !== "unlimited" && (
                                            <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">
                                                ({f.limit})
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>

                            <Button
                                asChild
                                className={cn(
                                    "w-full text-sm sm:text-base",
                                    isPopular
                                        ? "bg-slate-900 hover:bg-slate-800 text-white"
                                        : "border-slate-300 dark:border-slate-600"
                                )}
                                variant={isPopular ? "default" : "outline"}
                            >
                                <Link href={plan.name === "Enterprise" ? "/contact" : "/signup"}>
                                    {buttonLabel}
                                </Link>
                            </Button>
                        </WobbleCard>
                    )
                })}
            </div>
        </div>
    )
}
