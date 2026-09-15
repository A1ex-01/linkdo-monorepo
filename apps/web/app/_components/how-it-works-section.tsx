"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState } from "react";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    label: "第 1 步：规划每周 / 每天",
    title: "规划一个切实可行的日程",
    text: "把合适的任务安排到今天，确定顺序，并预估所需时间。",
  },
  {
    label: "第 2 步：进入专注模式",
    title: "只留下眼前的任务",
    text: "心流模式会保留当前任务与计时器，让干扰自动淡出视野。",
  },
  {
    label: "第 3 步：建立节奏",
    title: "让每次小胜利带你进入心流",
    text: "记录时间，完成任务，然后直接投入下一个有意义的行动。",
  },
  {
    label: "第 4 步：完成当天工作，好好放松",
    title: "清楚知道重要工作已经完成",
    text: "用一次令人满足的回顾收尾，下班时不再带着纷乱的思绪。",
  },
];

const companies = [
  "Amazon",
  "Heygen",
  "Salesforce",
  "Framer",
  "Miro",
  "Stanford",
  "Google",
  "Shopify",
  "AirBnB",
  "Columbia",
  "Meta",
  "Semrush",
];

export function HowItWorksSection() {
  const storyRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {}, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 810px)");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!mediaQuery.matches || reduceMotion.matches || !storyRef.current)
      return;

    const context = gsap.context(() => {
      ScrollTrigger.create({
        id: "linkdo-steps",
        trigger: storyRef.current,
        start: "top top+=72",
        end: () => `+=${window.innerHeight * steps.length}`,
        pin: true,
        scrub: 0.7,
        anticipatePin: 1,
        onUpdate: (self) =>
          setActive(
            Math.min(
              steps.length - 1,
              Math.floor(self.progress * steps.length),
            ),
          ),
      });
    }, storyRef);

    return () => context.revert();
  }, []);

  function selectStep(index: number) {
    const trigger = ScrollTrigger.getById("linkdo-steps");
    if (trigger) {
      window.scrollTo({
        top:
          trigger.start +
          (trigger.end - trigger.start) * Math.min(0.999, index / steps.length),
        behavior: "smooth",
      });
      return;
    }
    setActive(index);
  }

  return (
    <section className="bg-[#111] px-[10px] py-20 max-[809px]:py-[72px]">
      <div
        ref={storyRef}
        data-step-story
        className="mx-auto mt-[72px] flex min-h-[calc(100svh-72px)] max-w-[1080px] flex-col justify-center max-[809px]:mt-12 max-[809px]:min-h-0"
      >
        <h2 className="text-center font-heading text-[28px] font-medium leading-[33.6px]">
          它是如何工作的？
        </h2>
        <div className="mt-12 overflow-x-auto pb-3">
          <div className="mx-auto flex min-w-[880px] justify-center gap-6 max-[809px]:justify-start">
            {steps.map((step, index) => (
              <button
                key={step.label}
                type="button"
                onClick={() => selectStep(index)}
                aria-current={active === index ? "step" : undefined}
                className={`relative h-[38px] px-4 text-sm transition-colors ${active === index ? "text-white" : "text-[#858585] hover:text-white"}`}
              >
                {step.label}
                <span
                  className={`absolute inset-x-0 bottom-0 h-[3px] origin-left rounded-full bg-gradient-to-r from-[#ef82ef] to-[#b5d982] transition-transform duration-300 ${active === index ? "scale-x-100" : "scale-x-0"}`}
                />
              </button>
            ))}
          </div>
        </div>
        <div className="relative mt-6 h-[min(58svh,650px)] min-h-[500px] overflow-hidden rounded-[24px] border border-white/10 bg-[#161616] max-[809px]:h-[520px] max-[809px]:min-h-0">
          <video
            className="absolute inset-0 size-full object-cover opacity-55"
            src="/videos/BRdBhmS99N6kMuQfQUtw1jPMdM.mp4"
            autoPlay
            muted
            loop
            playsInline
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-[#111]/20" />
          <div
            key={active}
            className="absolute bottom-8 left-8 max-w-[430px] animate-[linkdo-fade-up_.45s_ease_both] rounded-2xl border border-white/10 bg-[#111]/90 p-6 backdrop-blur-xl max-[809px]:inset-x-5 max-[809px]:bottom-5"
          >
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#ef82ef]">
              第 {active + 1} 步
            </p>
            <h3 className="mt-3 font-heading text-3xl leading-tight">
              {steps[active].title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-[#bfbfbf]">
              {steps[active].text}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
