"use client";

import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

export function MobileShowcase() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !sectionRef.current
    )
      return;
    const context = gsap.context(() => {
      const stage = sectionRef.current!.querySelector<HTMLElement>(
        "[data-mobile-stage]",
      );
      const layers = sectionRef.current!.querySelectorAll<HTMLElement>(
        "[data-mobile-layer]",
      );
      if (!stage) return;
      gsap
        .timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 82%",
            end: "top 30%",
            scrub: 0.75,
          },
        })
        .fromTo(stage, { y: 72, scale: 0.92 }, { y: 0, scale: 1, ease: "none" })
        .fromTo(
          layers,
          { y: 38, opacity: 0.2 },
          {
            y: (index) => (index % 2 ? -16 : 10),
            opacity: 1,
            stagger: 0.04,
            ease: "none",
          },
          0,
        );
    }, sectionRef);
    return () => context.revert();
  }, []);

  return (
    <section ref={sectionRef} className="overflow-hidden px-5 py-[72px]">
      <div className="mx-auto max-w-[1080px] text-center">
        <span className="inline-flex rounded-full bg-[#262626] px-3 py-1 text-[12px] leading-[16.8px] text-[#bfbfbf]">
          📱 Mobile app BETA
        </span>
        <h2 className="mt-7 font-heading text-[44px] font-medium leading-[52.8px]">
          Stay in flow{" "}
          <span className="bg-gradient-to-r from-[#b5d982] to-[#55d9c6] bg-clip-text text-transparent">
            on the go
          </span>
        </h2>
        <p className="mt-8 text-[18px] leading-[25.2px] text-[#858585]">
          Add, manage and plan tasks on the go!
        </p>

        <div
          data-mobile-stage
          className="relative mx-auto mt-10 h-[610px] w-[834px] max-[809px]:mt-5 max-[809px]:h-[520px] max-[809px]:w-[350px]"
        >
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(85,217,198,.12),rgba(111,152,232,.06)_38%,transparent_68%)]" />
          <Image
            src="/images/2c1LUka49Zi8DugRMY8Sfr9Od8.png"
            alt=""
            width={2048}
            height={2048}
            className="absolute inset-0 size-full object-contain opacity-40"
          />
          <Image
            data-mobile-layer
            src="/images/mDTuItFnKWeNRM28TFR1lW0S69g.png"
            alt="Linkdo mobile app on a phone"
            width={1500}
            height={1500}
            className="absolute left-1/2 top-4 w-[500px] -translate-x-1/2 object-contain max-[809px]:top-16 max-[809px]:w-[365px]"
          />
          <Image
            data-mobile-layer
            src="/images/F7dBFZ1t8kBH3Ofsz6OdpiicALQ.png"
            alt="Linkdo mobile focus mode"
            width={472}
            height={1024}
            className="absolute left-[294px] top-[90px] w-[238px] rotate-[8deg] rounded-[34px] object-cover opacity-90 max-[809px]:left-[101px] max-[809px]:top-[125px] max-[809px]:w-[164px] max-[809px]:rounded-[24px]"
          />
          <Image
            data-mobile-layer
            src="/images/juRgSRLTMWP7EKe2fGw1xG7uWA.png"
            alt="Task reminder"
            width={1126}
            height={216}
            className="absolute right-[68px] top-[90px] w-[320px] rotate-3 opacity-85 max-[809px]:right-[-35px] max-[809px]:top-[132px] max-[809px]:w-[235px]"
          />
          <Image
            src="/images/RZB6yx0TK2Esgyme2ji8u4CXNOM.png"
            alt="Task notes editor"
            width={1728}
            height={2160}
            className="absolute bottom-[36px] right-[92px] w-[220px] -rotate-2 opacity-85 max-[809px]:bottom-[40px] max-[809px]:right-[-12px] max-[809px]:w-[155px]"
          />
        </div>
      </div>
    </section>
  );
}
