"use client";

import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const testimonials = [
  { poster: "/images/Zfe4DxLwxku2hmN3pFUj4D9GkQ.png", avatar: "/images/8LbVciKowhP7nuThVovcZPEpaM.jpeg", quote: "Linkdo helps me stay organized and actually get things done!", name: "Christina 🎀 astronuggie", role: "Designer & gamer", handle: "@astronuggie" },
  { poster: "/images/DVNXSksOLqy4IPAynSvsBvOEtT0.jpg", avatar: "/images/A4tBLzywlEZyxxhmivkFDSvPZhw.jpeg", quote: "I love how Linkdo lets me see all my tasks in one place and plan my day with ease!", name: "Adam Powell", role: "Fullstack engineer", handle: "@developerdam" },
  { poster: "/images/AQymPxUYZOzbL9IAjw8wkl4KYio.jpg", avatar: "/images/A3VzWclBCipT6dxwLxXs8xI3EWs.jpeg", quote: "Flow mode keeps me focused and helps me crush tasks throughout the day!", name: "Asher Mitilinakis", role: "Frontend engineer", handle: "@asherintech" },
  { poster: "/images/3BVgBvvvvdKcWKGYxTEkCumrHs.jpg", avatar: "/images/PZcrCrgDcPStq08diVdPnv0xaI.jpeg", quote: "Linkdo is the ultimate productivity tool to organize tasks and stay focused!", name: "Justin | Desk Setup", role: "Content creator", handle: "@avrgtech" },
];

export function SocialProofSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.matchMedia("(max-width: 809px), (prefers-reduced-motion: reduce)").matches || !sectionRef.current) return;
    const context = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-proof-card]");
      gsap.timeline({ scrollTrigger: { trigger: sectionRef.current, start: "top 80%", end: "bottom 45%", scrub: 0.8 } })
        .fromTo(cards, { y: 72, opacity: 0.35 }, { y: (index) => index % 2 === 0 ? -14 : -44, opacity: 1, stagger: 0.08, ease: "none" });
    }, sectionRef);
    return () => context.revert();
  }, []);

  return (
    <section ref={sectionRef} className="h-[921px] overflow-hidden bg-[#111] px-[10px] py-[72px] text-white max-[809px]:h-[1306px]">
      <h2 className="mx-auto max-w-[530px] text-center font-heading text-[28px] font-medium leading-[33.6px]">The most productive professionals<br />use Linkdo to <span className="linkdo-gradient-text">crush their day</span></h2>
      <div className="mx-auto mt-[86px] grid w-[1080px] grid-cols-4 gap-6 max-[809px]:hidden">
        {testimonials.map((item, index) => (
          <article data-proof-card key={item.name} className={index % 2 === 0 ? "translate-y-[147px]" : ""}>
            <div className="relative h-[448px] overflow-hidden rounded-2xl border border-white/10">
              <Image className="h-full w-full object-cover brightness-[.58]" src={item.poster} alt="" width={540} height={960} />
              <span className="absolute left-6 top-6 grid size-10 place-items-center rounded-full bg-gradient-to-br from-[#ef82ef] via-[#6f98e8] to-[#b5d982] text-black">▶</span>
              <blockquote className="absolute left-6 right-6 top-1/2 -translate-y-1/2 rounded-xl bg-[#111]/95 p-3 text-center text-[17px] italic leading-7 text-[#dedede]">&ldquo;{item.quote}&rdquo;</blockquote>
            </div>
            <div className="mt-4 flex gap-3">
              <Image className="size-10 rounded-full object-cover" src={item.avatar} alt="" width={225} height={225} />
              <div><h3 className="text-base text-[#bfbfbf]">{item.name}</h3><p className="text-xs leading-5 text-[#666]">{item.role}<br />{item.handle}</p></div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
