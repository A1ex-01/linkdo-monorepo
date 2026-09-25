"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState } from "react";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    label: "第 1 步：任务分类",
    title: "从集合开始整理工作",
    text: "创建不同集合，让项目、日常和专注任务各归其位。",
    video: "/videos/how-it-works/step-01.mp4",
  },
  // {
  //   label: "第 2 步：规划每周 / 每天",
  //   title: "把任务排进真正可执行的节奏",
  //   text: "在看板中拖动任务，安排今天与本周的优先顺序。",
  //   video: "/videos/how-it-works/step-02.mp4",
  // },
  {
    label: "第 2 步：链接集成服务",
    title: "把 Notion/Clickup 任务同步到 Linkdo统一管理",
    text: "关联数据库、创建任务，同步执行，并一键协作。让你专注于当前任务，而不是切换工具。",
    video: "/videos/how-it-works/step-02.mp4",
  },
  {
    label: "第 3 步：进入专注模式",
    title: "进入沉浸的胶囊专注模式",
    text: "从看板到侧边栏，再进入沉浸的胶囊专注模式。沉浸式专注，让你专注于当前任务，而不是切换工具。",
    video: "/videos/how-it-works/step-03.mp4",
  },
  {
    label: "第 4 步：完成任务",
    title: "完成任务，回顾确认今天的进展",
    text: "完成任务，回顾确认今天的进展。",
    video: "/videos/how-it-works/step-04.mp4",
  },
  {
    label: "第 5 步：主题切换",
    title: "按你的工作环境自定义主题",
    text: "在系统设置中切换外观和主题风格。",
    video: "/videos/how-it-works/step-06.mp4",
  },
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
            key={steps[active].video}
            className="absolute inset-0 size-full object-contain opacity-55"
            src={steps[active].video}
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
