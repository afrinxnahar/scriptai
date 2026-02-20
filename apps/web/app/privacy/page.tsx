"use client"

import React, { useEffect, useRef, useState } from "react"
import Lenis from 'lenis'
import { cn } from "@/lib/utils"
import Footer from "@/components/footer"
import { ArrowLeft } from "lucide-react"
import { useRouter } from 'next/navigation'

// Define sections for the Table of Contents
const sections = [
  { id: "overview", title: "1. Overview" },
  { id: "data-collection", title: "2. Data We Collect" },
  { id: "data-usage", title: "3. How We Use Your Data" },
  { id: "human-access", title: "4. Human Access to Data" },
  { id: "storage-security", title: "5. Data Storage & Security" },
  { id: "user-responsibilities", title: "6. User Responsibilities" },
  { id: "limited-use", title: "7. Limited Use & Consent" },
  { id: "third-party-ai", title: "8. Third-Party AI/ML Integrations" },
  { id: "ai-model-usage", title: "9. AI Model Usage" },
  { id: "google-api-disclosure", title: "10. Google API Disclosure" },
  { id: "user-rights", title: "11. User Rights & Controls" },
  { id: "policy-changes", title: "12. Changes to Policy" },
  { id: "contact", title: "13. Contact" },
];

const PrivacyAndTerms = () => {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<string>("overview");

  const rafIdRef = useRef<number>(0);

  useEffect(() => {
    const lenis = new Lenis();

    function raf(time: number) {
      lenis.raf(time);
      rafIdRef.current = requestAnimationFrame(raf);
    }

    rafIdRef.current = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafIdRef.current);
      lenis.destroy();
    }
  }, []);

  // Effect for tracking active section for the ToC
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight / 3;
      let currentSection = "";

      sections.forEach(section => {
        const element = document.getElementById(section.id);
        if (element && element.offsetTop <= scrollPosition) {
          currentSection = section.id;
        }
      });

      setActiveSection(currentSection);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="bg-gradient-to-b from-purple-50 to-white text-slate-800 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-purple-600 transition-colors font-medium mb-8 group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back
        </button>

        <h1 className="text-4xl md:text-5xl font-bold text-center mb-16 text-slate-900">
          Privacy Policy & Terms of Use
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-x-12">
          {/* Table of Contents - Sticky */}
          <aside className="hidden lg:block">
            <nav className="sticky top-24">
              <ul className="space-y-3">
                {sections.map(section => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className={cn(
                        "block text-sm transition-colors duration-300",
                        activeSection === section.id
                          ? "text-purple-600 font-semibold"
                          : "text-slate-500 hover:text-slate-900"
                      )}
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3 space-y-12">
            <PolicySection id="overview" title="1. Overview">
              <p>
                Script AI is an AI-powered assistant that helps content creators generate high-quality
                YouTube scripts, titles, thumbnails, and courses. By using our service, you agree
                to the following privacy and usage terms.
              </p>
            </PolicySection>

            <PolicySection id="data-collection" title="2. Data We Collect">
              <p>We may access the following to deliver core features:</p>
              <ul className="list-disc pl-5 space-y-2 mt-4 marker:text-purple-500">
                <li>Your email and basic YouTube profile information.</li>
                <li>Channel and video metadata (titles, descriptions, tags).</li>
                <li>Videos or links you provide for training.</li>
                <li>Content you generate with Script AI.</li>
                <li>Basic usage metrics to improve our service.</li>
              </ul>
            </PolicySection>

            <PolicySection id="data-usage" title="3. How We Use Your Data">
              <p>We use your data strictly to:</p>
              <ul className="list-disc pl-5 space-y-2 mt-4 marker:text-purple-500">
                <li>Personalize your AI assistant.</li>
                <li>Improve the quality of generated content.</li>
                <li>Provide relevant research and references.</li>
                <li>Maintain your account and session.</li>
              </ul>
              <p className="mt-4">
                Your data is never sold, transferred, or used for advertising.
              </p>
            </PolicySection>

            <PolicySection id="human-access" title="4. Human Access to Data">
              <p>
                Our systems are automated. No human will access your data unless you request support, or it's required for security or legal compliance.
              </p>
            </PolicySection>

            <PolicySection id="storage-security" title="5. Data Storage & Security">
              <p>
                Your data is encrypted in transit and at rest. We take all reasonable measures to protect it, and you can request data deletion at any time.
              </p>
            </PolicySection>

            <PolicySection id="user-responsibilities" title="6. User Responsibilities">
              <ul className="list-disc pl-5 space-y-2 marker:text-purple-500">
                <li>Do not upload copyrighted content you don’t own.</li>
                <li>Do not use our service to spread misinformation.</li>
                <li>Our service is not for children under 13.</li>
              </ul>
            </PolicySection>

            <PolicySection id="limited-use" title="7. Limited Use & Consent">
              <p>
                We affirm that the use and transfer of raw or derived user data received from Google Workspace APIs strictly adhere to the Google User Data Policy, including the Limited Use requirements.
              </p>
              <p>
                We do not use this data to train or improve generalized AI or machine learning models beyond the personalized user's context.
              </p>
            </PolicySection>

            <PolicySection id="third-party-ai" title="8. Third-Party AI/ML Integrations">
              <p>
                We do not share user data obtained from Google APIs with any third-party AI/ML services for generalized training or model improvement.
              </p>
              <p>
                Any AI/ML processing by third parties occurs only with your explicit consent and solely for your personalized use case.
              </p>
              <p>
                Our app does not currently feature integrations that use user data to train generalized AI or machine learning models.
              </p>
            </PolicySection>

            <PolicySection id="ai-model-usage" title="9. AI Model Usage">
              <p>
                AI-generated content should always be reviewed before publishing. We do not guarantee the accuracy of any output.
              </p>
            </PolicySection>

            <PolicySection id="google-api-disclosure" title="10. Google API Disclosure">
              <p>
                Script AI’s use and transfer of information received from Google APIs will adhere to the{" "}
                <PolicyLink href="https://developers.google.com/terms/api-services-user-data-policy">
                  Google API Services User Data Policy
                </PolicyLink>, including the Limited Use requirements.
              </p>
              <p>
                We request only the minimum necessary scopes required for app functionality.
              </p>
            </PolicySection>

            <PolicySection id="user-rights" title="11. User Rights & Controls">
              <p>
                You can revoke access to your Google account at any time through your Google Account settings.
              </p>
              <p>
                You may request deletion of your data by contacting us at the email below; we will promptly process such requests in compliance with applicable policies.
              </p>
            </PolicySection>

            <PolicySection id="policy-changes" title="12. Changes to Policy">
              <p>
                We may update this policy as our service evolves. Major changes will be communicated via email or in-app notifications.
              </p>
            </PolicySection>

            <PolicySection id="contact" title="13. Contact">
              <p>
                For questions or data requests, please contact us at{" "}
                <PolicyLink href="mailto:support@tryscriptai.com">
                  support@tryscriptai.com
                </PolicyLink>.
              </p>
            </PolicySection>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  )
}

// Helper component for consistent section styling
const PolicySection = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
  <section id={id} className="scroll-mt-20">
    <h2 className="text-2xl font-bold text-slate-900 mb-4">{title}</h2>
    <div className="text-slate-600 leading-relaxed space-y-4">
      {children}
    </div>
  </section>
);

// Helper component for consistent link styling
const PolicyLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="font-medium text-purple-600 hover:text-purple-800 underline underline-offset-4 transition-colors"
  >
    {children}
  </a>
);

export default PrivacyAndTerms;
