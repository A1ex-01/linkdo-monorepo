import { Navbar } from "@/components/navbar";
import { PageMotion } from "./_components/page-motion";
import { HeroSection } from "./_components/hero-section";
import { HowItWorksSection } from "./_components/how-it-works-section";
import { FeatureGridSection } from "./_components/feature-grid-section";
import { LinkdoAiSection } from "./_components/linkdo-ai-section";
import { Footer } from "@/components/footer";
import { ClosingCta } from "./_components/closing-cta";
import { FaqSection } from "./_components/faq-section";
import { MobileShowcase } from "./_components/mobile-showcase";
import { PricingSection } from "./_components/pricing-section";
import { ReportsSection } from "./_components/reports-section";
import { ReviewBadges } from "./_components/review-badges";
import { RoadmapSection } from "./_components/roadmap-section";
import { SessionsSection } from "./_components/sessions-section";
import { SocialProofSection } from "./_components/social-proof-section";
import { TestimonialsSection } from "./_components/testimonials-section";

export default function Home() {
  return (
    <>
      <PageMotion />
      <Navbar />
      <main className="relative overflow-x-clip bg-[#111111]">
        <HeroSection />
        <HowItWorksSection />
        <FeatureGridSection />
        <LinkdoAiSection />
        <SocialProofSection />
        <ReportsSection />
        <SessionsSection />
        <PricingSection />
        <TestimonialsSection />
        <RoadmapSection />
        <MobileShowcase />
        <ClosingCta />
        <FaqSection />
        <ReviewBadges />
      </main>
      <Footer />
    </>
  );
}
