"use client"

import React, { useEffect, useRef, useState } from "react"
import Lenis from 'lenis'
import { cn } from "@/lib/utils"
import Footer from "@/components/footer"
import { ArrowLeft } from "lucide-react"
import { useRouter } from 'next/navigation'
import Link from "next/link"
import LandingPageNavbar from "@/components/landingPage/LandingPageNavbar"

const sections = [
  { id: "overview", title: "1. Overview & Acceptance of Terms" },
  { id: "eligibility", title: "2. Eligibility" },
  { id: "prohibited-uses", title: "3. Prohibited Uses & Content Restrictions" },
  { id: "user-responsibilities", title: "4. User Responsibilities" },
  { id: "subscriptions-refunds", title: "5. Subscriptions, Billing & Refund Policy" },
  { id: "disputes-chargebacks", title: "6. Disputes & Chargebacks" },
  { id: "intellectual-property", title: "7. Intellectual Property & Ownership" },
  { id: "ai-disclaimer", title: "8. AI Output Disclaimer" },
  { id: "limitation-liability", title: "9. Limitation of Liability" },
  { id: "indemnification", title: "10. Indemnification" },
  { id: "data-collection", title: "11. Data We Collect" },
  { id: "data-usage", title: "12. How We Use Your Data" },
  { id: "storage-security", title: "13. Data Storage & Third-Party Processors" },
  { id: "data-retention", title: "14. Data Retention" },
  { id: "user-rights", title: "15. Your Rights" },
  { id: "governing-law", title: "16. Governing Law" },
  { id: "policy-changes", title: "17. Changes to These Terms" },
  { id: "contact", title: "18. Contact & Support" },
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
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="bg-gradient-to-b from-purple-50 to-white text-slate-800 min-h-screen">
<LandingPageNavbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">

        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-purple-600 transition-colors font-medium mb-16 group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back
          </button>

          <h1 className="text-4xl md:text-5xl font-bold text-center mb-16 text-slate-900 w-full">
            Privacy Policy & Terms of Use
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-x-12">

          <aside className="hidden lg:block">
            <nav className="sticky top-20 mb-8">
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

          <main className="lg:col-span-3 space-y-12">

            <PolicySection id="overview" title="1. Overview & Acceptance of Terms">
              <p>
                Creator AI (formerly Script AI) is a subscription-based AI SaaS platform
                that provides automated content generation tools for creators.
                By accessing or using our service, you agree to be bound by these Terms
                and our Privacy Policy.
              </p>
              <p>
                If you do not agree, you must discontinue use immediately.
              </p>
            </PolicySection>

            <PolicySection id="eligibility" title="2. Eligibility">
              <p>
                You must be at least 13 years old (or the minimum age required in your jurisdiction).
                By using the service, you represent that you meet these requirements.
              </p>
            </PolicySection>

            <PolicySection id="prohibited-uses" title="3. Prohibited Uses & Content Restrictions">
              <p>You may NOT use Creator AI to generate or distribute content that:</p>
              <ul className="list-disc pl-5 space-y-2 marker:text-purple-500">
                <li>Is sexually explicit, pornographic, or NSFW.</li>
                <li>Promotes violence, hate speech, or harassment.</li>
                <li>Is illegal or promotes illegal activity.</li>
                <li>Infringes intellectual property rights.</li>
                <li>Impersonates individuals or entities.</li>
                <li>Spreads misinformation or fraud.</li>
              </ul>
              <p>
                Violation may result in immediate suspension or permanent termination.
              </p>
            </PolicySection>

            <PolicySection id="user-responsibilities" title="4. User Responsibilities">
              <p>
                You are solely responsible for reviewing and editing AI-generated content
                before publishing.
              </p>
              <p>
                You agree not to misuse the platform or attempt to bypass rate limits,
                subscription tiers, or safeguards.
              </p>
            </PolicySection>

            <PolicySection id="subscriptions-refunds" title="5. Subscriptions, Billing & Refund Policy">
              <p>
                Creator AI operates on a recurring subscription model.
                Payments are processed via third-party providers.
              </p>
              <p>
                Subscription fees are non-refundable except where required by law.
                Cancellation stops future billing but does not trigger retroactive refunds.
              </p>
            </PolicySection>

            <PolicySection id="disputes-chargebacks" title="6. Disputes & Chargebacks">
              <p>
                If you experience a billing issue, you must contact us before initiating
                a chargeback.
              </p>
              <p>
                Fraudulent chargebacks may result in account suspension and recovery actions.
              </p>
            </PolicySection>

            <PolicySection id="intellectual-property" title="7. Intellectual Property & Ownership">
              <p>
                You retain ownership of your inputs and generated outputs,
                subject to compliance with these Terms.
              </p>
              <p>
                Creator AI retains ownership of all platform technology,
                algorithms, branding, and infrastructure.
              </p>
            </PolicySection>

            <PolicySection id="ai-disclaimer" title="8. AI Output Disclaimer">
              <p>
                AI outputs may contain inaccuracies.
                We do not guarantee originality, factual correctness,
                or suitability for any purpose.
              </p>
              <p>
                You assume full responsibility for how generated content is used.
              </p>
            </PolicySection>

            <PolicySection id="limitation-liability" title="9. Limitation of Liability">
              <p>
                To the maximum extent permitted by law,
                Creator AI shall not be liable for indirect,
                incidental, consequential, or special damages.
              </p>
              <p>
                Total liability shall not exceed the amount paid
                by you in the previous 3 months.
              </p>
            </PolicySection>

            <PolicySection id="indemnification" title="10. Indemnification">
              <p>
                You agree to indemnify and hold harmless Creator AI
                from claims arising out of your use of the service,
                violation of these Terms, or infringement of third-party rights.
              </p>
            </PolicySection>

            <PolicySection id="data-collection" title="11. Data We Collect">
              <ul className="list-disc pl-5 space-y-2 marker:text-purple-500">
                <li>Email and account information</li>
                <li>Usage logs and analytics</li>
                <li>Content inputs and outputs</li>
                <li>Billing metadata (processed by payment provider)</li>
              </ul>
            </PolicySection>

            <PolicySection id="data-usage" title="12. How We Use Your Data">
              <p>
                Data is used to operate the platform,
                improve performance, prevent abuse,
                and provide support.
              </p>
              <p>
                We do not sell personal data.
              </p>
            </PolicySection>

            <PolicySection id="storage-security" title="13. Data Storage & Third-Party Processors">
              <p>
                Data is encrypted in transit and at rest.
                We rely on secure cloud providers and AI APIs
                under contractual data protection obligations.
              </p>
            </PolicySection>

            <PolicySection id="data-retention" title="14. Data Retention">
              <p>
                Data is retained only as long as necessary
                for service delivery and legal compliance.
              </p>
            </PolicySection>

            <PolicySection id="user-rights" title="15. Your Rights">
              <p>
                You may request access, correction, or deletion
                of your data by contacting support.
              </p>
            </PolicySection>

            <PolicySection id="governing-law" title="16. Governing Law">
              <p>
                These Terms are governed by applicable international laws.
                Any disputes shall be resolved in the appropriate jurisdiction.
              </p>
            </PolicySection>

            <PolicySection id="policy-changes" title="17. Changes to These Terms">
              <p>
                We may update these Terms periodically.
                Continued use after changes constitutes acceptance.
              </p>
            </PolicySection>

            <PolicySection id="contact" title="18. Contact & Support">
              <p>
              For questions, data requests, or support, visit our{" "}
                <Link href="/contact-us" className="font-medium text-purple-600 hover:text-purple-800 underline underline-offset-4 transition-colors">
                  Contact Us
                </Link>{" "}
                page or email us at{" "}
                <Link href="mailto:support@tryscriptai.com" className="font-medium text-purple-600 hover:text-purple-800 underline underline-offset-4 transition-colors">
                  support@tryscriptai.com
                </Link>
              </p>
            </PolicySection>

          </main>
        </div>
      </div>
      <Footer />
    </div>
  )
}

const PolicySection = ({ id, title, children }: any) => (
  <section id={id} className="scroll-mt-20">
    <h2 className="text-2xl font-bold text-slate-900 mb-4">{title}</h2>
    <div className="text-slate-600 leading-relaxed space-y-4">
      {children}
    </div>
  </section>
);

export default PrivacyAndTerms;