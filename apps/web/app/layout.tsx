import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { SupabaseProvider } from "@/components/supabase-provider"
import { Analytics } from "@vercel/analytics/next"
import { IconBugFilled } from "@tabler/icons-react"

const inter = Inter({ subsets: ["latin"] })

export async function generateMetadata() {
  const fullUrl = process.env.NEXT_PUBLIC_BASE_URL || "https:///tryscriptai.com"

  return {
    title: "Script AI - Personalized AI Assistant for YouTubers",
    description: "Generate personalized scripts, titles, thumbnails for your YouTube videos",
    alternates: {
      canonical: fullUrl,
    },
    category: 'technology',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <SupabaseProvider>
            <main>{children}</main>
            <Toaster closeButton={true} richColors />
          </SupabaseProvider>
        </ThemeProvider>
        <SpeedInsights />
        <Analytics />

      </body>
    </html>
  )
}
