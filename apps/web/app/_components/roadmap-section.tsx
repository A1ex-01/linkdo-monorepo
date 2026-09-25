"use client";

import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState } from "react";
import { ChevronIcon } from "@/components/icons";

gsap.registerPlugin(ScrollTrigger);

interface RoadmapCard {
  title: string;
  description: string;
  badge?: string;
  image?: string;
  kind?: "ai" | "integrations" | "watch" | "matrix" | "mobile" | "theme";
}

const roadmap: RoadmapCard[] = [
  {
    title: "深色 / 浅色模式 和 主题切换",
    description: "为你的环境选择合适的主题 和 主题切换",
    kind: "theme",
    badge: "已完成",
  },
  // {
  //   title: "休息时光",
  //   description: "在休息期间获取焕发活力的灵感",
  //   badge: "已完成 15%",
  //   image:
  //     "http://static.a1ex.online/linkdo/images/RkLf9p9z7B04lZvKZBoYc0Gcjg.png",
  // },
  {
    title: "AI 创建任务",
    description: "告诉我们你的计划，其余交给 AI",
    // badge: "已上线",
    kind: "ai",
  },
  {
    title: "新增集成",
    description: "通过更多集成，把工作流集中到一个可执行的列表中",
    // badge: "已完成 24%",
    kind: "integrations",
  },
  {
    title: "艾森豪威尔矩阵",
    description: "按紧急程度与重要性确定工作优先级",
    kind: "matrix",
  },
];

function RoadmapArtwork({ card }: { card: RoadmapCard }) {
  if (card.image) {
    return (
      <div className="mt-5 flex h-[230px] gap-3 overflow-hidden">
        <Image
          src={card.image}
          alt=""
          width={384}
          height={476}
          className="h-full w-[182px] rounded-xl object-cover object-top opacity-55"
        />
        <Image
          src="http://static.a1ex.online/linkdo/images/S4LE9Wv2WWiatSe6xzYP5xfqViQ.png"
          alt=""
          width={384}
          height={476}
          className="h-full w-[182px] rounded-xl object-cover object-top"
        />
      </div>
    );
  }

  if (card.kind === "ai") {
    return (
      <div className="mt-10 flex flex-col items-center">
        <div className="flex size-[62px] items-center justify-center rounded-full border-2 border-[#55d9c6] text-[18px] font-bold">
          50%
        </div>
        <p className="mt-4 text-[24px] font-bold">正在生成任务…</p>
        <div className="mt-3 h-9 w-[256px] rounded-lg bg-white/[.055]" />
        <div className="mt-2 h-9 w-[256px] rounded-lg bg-white/[.055]" />
      </div>
    );
  }

  if (card.kind === "integrations") {
    return (
      <div className="mt-8 space-y-2">
        {["ClickUp 任务", "Figma 评论", "Trello 任务", "Asana 任务", "..."].map(
          (item, index) => (
            <div
              key={item}
              className="flex h-9 items-center justify-between rounded-md bg-white/[.07] px-3 text-[13px]"
            >
              {item}
              <span
                className={`size-5 rounded ${["bg-[#00a5df]", "bg-white", "bg-white", "bg-white", "bg-white]"][index]}`}
              />
            </div>
          ),
        )}
      </div>
    );
  }

  if (card.kind === "watch") {
    return (
      <div className="relative mx-auto mt-9 h-[230px] w-[150px]">
        <div className="absolute inset-x-6 -top-9 h-16 rounded-t-[32px] bg-gradient-to-b from-[#aaa] to-[#262626]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[46px] border-[7px] border-[#343434] bg-[#151515] shadow-2xl">
          <strong className="text-[22px]">01:02:23</strong>
          <span className="mt-2 text-[#666]">账户…</span>
        </div>
        <div className="absolute inset-x-6 -bottom-9 h-16 rounded-b-[32px] bg-gradient-to-t from-[#111] to-[#333]" />
      </div>
    );
  }

  if (card.kind === "mobile") {
    return (
      <Image
        src="http://static.a1ex.online/linkdo/images/mDTuItFnKWeNRM28TFR1lW0S69g.png"
        alt=""
        width={1500}
        height={1500}
        className="mx-auto mt-4 h-[250px] w-auto object-contain"
      />
    );
  }

  return (
    <div className="mt-8 grid h-[220px] place-items-center rounded-xl bg-[radial-gradient(circle_at_50%_40%,rgba(111,152,232,.25),transparent_42%),#141414]">
      <span className="text-[56px] text-[#858585]">
        {card.kind === "matrix" ? "✥" : card.kind === "theme" ? "◐" : "↗"}
      </span>
    </div>
  );
}

export function RoadmapSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 810px)");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (
      !mediaQuery.matches ||
      reduceMotion.matches ||
      !sectionRef.current ||
      !viewportRef.current ||
      !trackRef.current
    )
      return;

    const context = gsap.context(() => {
      const distance = () =>
        Math.max(
          0,
          trackRef.current!.scrollWidth - viewportRef.current!.clientWidth + 40,
        );
      const scrollLength = () =>
        Math.max(
          window.innerHeight * (roadmap.length - 1) * 0.85,
          distance() * 1.25,
        );
      gsap.to(trackRef.current, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          id: "linkdo-roadmap",
          trigger: sectionRef.current,
          start: "top top+=72",
          end: () => `+=${scrollLength()}`,
          pin: true,
          scrub: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) =>
            setPosition(Math.round(self.progress * (roadmap.length - 1))),
        },
      });
    }, sectionRef);
    return () => context.revert();
  }, []);

  function move(direction: -1 | 1) {
    const next = Math.min(
      roadmap.length - 1,
      Math.max(0, position + direction),
    );
    const trigger = ScrollTrigger.getById("linkdo-roadmap");
    if (trigger) {
      window.scrollTo({
        top:
          trigger.start +
          (trigger.end - trigger.start) * (next / (roadmap.length - 1)),
        behavior: "smooth",
      });
      return;
    }
    trackRef.current?.scrollTo({
      left:
        (trackRef.current.scrollWidth -
          (viewportRef.current?.clientWidth ?? 0)) *
        (next / (roadmap.length - 1)),
      behavior: "smooth",
    });
    setPosition(next);
  }

  return (
    <section
      ref={sectionRef}
      id="roadmap"
      data-roadmap-story
      className="min-h-[100svh] overflow-hidden px-5 py-[72px] max-[809px]:min-h-0 max-[809px]:py-[72px]"
    >
      <div className="mx-auto flex max-w-[1080px] flex-col items-center text-center">
        <h2 className="font-heading text-[44px] font-medium leading-[52.8px]">
          为<span className="linkdo-gradient-text">未来</span>而规划
        </h2>
        <a
          href="#roadmap"
          className="mt-6 text-[20px] leading-8 text-[#ef82ef] transition hover:text-white"
        >
          提交功能建议 / 为功能投票
        </a>
        <div className="mt-9 flex gap-3">
          <button
            type="button"
            aria-label="上一个"
            onClick={() => move(-1)}
            disabled={position === 0}
            className="grid size-10 place-items-center rounded-full bg-[#262626] text-white transition hover:bg-[#363636] disabled:opacity-35"
          >
            <ChevronIcon className="size-5 rotate-180" />
          </button>
          <button
            type="button"
            aria-label="下一个"
            onClick={() => move(1)}
            disabled={position === roadmap.length - 1}
            className="grid size-10 place-items-center rounded-full bg-[#262626] text-white transition hover:bg-[#363636] disabled:opacity-35"
          >
            <ChevronIcon className="size-5" />
          </button>
        </div>
      </div>

      <div
        ref={viewportRef}
        className="mx-auto mt-6 w-full max-w-[1440px] overflow-hidden max-[809px]:mt-10 max-[809px]:overflow-x-auto"
      >
        <div ref={trackRef} className="flex w-max gap-6 px-5 max-[809px]:pb-4">
          {roadmap.map((card) => (
            <article
              key={card.title}
              className="relative h-[364px] w-[344px] shrink-0 overflow-hidden rounded-[16px] border border-white/[.1] bg-[linear-gradient(145deg,rgba(255,255,255,.035),rgba(255,255,255,.01)),#171717] p-6 text-left max-[809px]:h-[390px] max-[809px]:w-[350px]"
            >
              {card.badge ? (
                <span
                  className={`absolute right-4 top-4 rounded-full px-3 py-1 text-[12px] font-bold text-[#111] ${card.badge === "LIVE" ? "bg-[#77df99]" : "bg-gradient-to-r from-[#ef82ef] to-[#6f98e8]"}`}
                >
                  {card.badge}
                </span>
              ) : null}
              <h3 className="pr-20 text-[20px] font-semibold leading-7">
                {card.title}
              </h3>
              <p className="mt-1 text-[14px] leading-[22.4px] text-[#858585]">
                {card.description}
              </p>
              <RoadmapArtwork card={card} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
