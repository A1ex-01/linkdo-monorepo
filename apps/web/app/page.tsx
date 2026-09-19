import { Navbar } from "@/components/navbar";
import { PageMotion } from "./_components/page-motion";
import { HeroSection } from "./_components/hero-section";
import { HowItWorksSection } from "./_components/how-it-works-section";
import { Footer } from "@/components/footer";
import { ClosingCta } from "./_components/closing-cta";
import { FaqSection } from "./_components/faq-section";
import { PricingSection } from "./_components/pricing-section";
import { RoadmapSection } from "./_components/roadmap-section";

export default function Home() {
  return (
    <>
      <PageMotion />
      <Navbar />
      <main className="relative overflow-x-clip bg-[#111111]">
        <HeroSection />
        <HowItWorksSection />
        {/* <FeatureGridSection /> */}
        {/* <LinkdoAiSection /> */}
        {/* <ReportsSection /> */}
        {/* <SessionsSection /> */}
        <PricingSection />
        {/* <TestimonialsSection /> */}
        <RoadmapSection />
        <ClosingCta />
        <FaqSection />
      </main>
      <Footer />
    </>
  );
}
