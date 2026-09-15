import { Navbar } from "@/components/Navbar";
import { PageMotion } from "./_components/PageMotion";
import { HeroSection } from "./_components/HeroSection";
import { HowItWorksSection } from "./_components/HowItWorksSection";
import { FeatureGridSection } from "./_components/FeatureGridSection";
import { LinkdoAiSection } from "./_components/LinkdoAiSection";
import { Footer } from "@/components/Footer";
import { ClosingCta } from "./_components/ClosingCta";
import { FaqSection } from "./_components/FaqSection";
import { MobileShowcase } from "./_components/MobileShowcase";
import { PricingSection } from "./_components/PricingSection";
import { ReportsSection } from "./_components/ReportsSection";
import { ReviewBadges } from "./_components/ReviewBadges";
import { RoadmapSection } from "./_components/RoadmapSection";
import { SessionsSection } from "./_components/SessionsSection";
import { SocialProofSection } from "./_components/SocialProofSection";
import { TestimonialsSection } from "./_components/TestimonialsSection";

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
