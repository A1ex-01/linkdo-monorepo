"use client";

import Image from "next/image";
import { useState } from "react";
import { CheckIcon } from "@/components/icons";

const checklist = [
  "Try check me off",
  "Ok now check me off",
  "And don't forget me",
  "Isn't it satisfying?",
];

function Card({
  title,
  description,
  className = "",
  children,
}: {
  title: string;
  description: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <article
      className={`feature-surface linkdo-card noise relative overflow-hidden ${className}`}
    >
      <div className="relative z-10 p-5">
        <h3 className="text-lg leading-[25.2px]">{title}</h3>
        <p className="mt-1 max-w-[270px] text-sm leading-[22.4px] text-[#858585]">
          {description}
        </p>
      </div>
      {children}
    </article>
  );
}

export function FeatureGridSection() {
  const [checked, setChecked] = useState<number[]>([]);
  const toggle = (index: number) =>
    setChecked((items) =>
      items.includes(index)
        ? items.filter((item) => item !== index)
        : [...items, index],
    );

  return (
    <section
      id="features"
      className="overflow-hidden bg-[#111] px-5 py-[120px] max-[809px]:py-[72px]"
    >
      <h2 className="mx-auto max-w-[650px] text-center font-heading text-[44px] font-medium leading-[52.8px]">
        All you need to get
        <br />
        <span className="linkdo-gradient-text">sharp focus</span> and crush it
      </h2>
      <div className="feature-surface mx-auto mt-[72px] grid max-w-[1080px] grid-cols-3 grid-rows-[325px_390px_390px] gap-6 max-[809px]:grid-cols-1 max-[809px]:grid-rows-none">
        <Card
          title="Estimate and track task time"
          description="Estimate how long a task takes, then see the real time next to it."
          className="max-[809px]:min-h-[325px]"
        >
          <div className="absolute inset-x-5 bottom-7 rounded-2xl border border-white/10 bg-[#242424] p-5 shadow-[0_26px_55px_rgba(188,91,196,.24)]">
            <div className="flex justify-between text-base">
              <b>Fix bug #2324</b>
              <b className="text-[#e5b349]">+ 00:00:08</b>
            </div>
            <div className="mt-5 flex justify-between text-xs text-[#a8a8a8]">
              <span>Est: 1hr 30min</span>
              <span>Done: 2hr 32min</span>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-[radial-gradient(ellipse_at_50%_100%,rgba(218,228,124,.7),transparent_67%),radial-gradient(ellipse_at_0%_40%,rgba(217,91,219,.45),transparent_62%)]" />
        </Card>
        <Card
          title="Pomodoros"
          description="Work in fixed focus intervals and restorative breaks."
          className="max-[809px]:min-h-[325px]"
        >
          <div className="absolute inset-x-0 bottom-0 h-3/5 bg-[radial-gradient(ellipse_at_50%_100%,rgba(172,225,117,.6),transparent_66%),rgba(85,217,198,.05)]" />
          <div className="absolute inset-x-10 bottom-7 rounded-2xl border border-white/10 bg-[#202020]/90 p-5">
            <div className="flex items-center justify-between">
              <span>Pomodoros</span>
              <span className="size-5 rounded-full bg-[#83caa4]" />
            </div>
            <div className="mt-7 flex gap-8 text-xs text-[#777]">
              <span>
                Work sprint
                <br />
                <b className="text-white">60 min</b>
              </span>
              <span>
                Break
                <br />
                <b className="text-white">15 min</b>
              </span>
            </div>
          </div>
        </Card>
        <Card
          title="Schedule tasks"
          description="Place one-time and recurring work exactly when you need it."
          className="row-span-2 max-[809px]:row-auto max-[809px]:min-h-[622px]"
        >
          <Image
            className="absolute bottom-0 right-0 w-[92%] object-cover object-top"
            src="/images/jyCIvYCVaGFXs51i79AZrnvaoqY.png"
            alt="Linkdo schedule"
            width={736}
            height={1056}
          />
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#0c2a29]/80 via-transparent to-transparent" />
        </Card>
        <Card
          title="Satisfying checklists"
          description="A little visual momentum for the work that matters."
          className="max-[809px]:min-h-[390px]"
        >
          <div className="relative z-10 space-y-2 px-5 pb-5">
            {checklist.map((item, index) => (
              <button
                key={item}
                onClick={() => toggle(index)}
                type="button"
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition ${checked.includes(index) ? "border-[#b5d982]/40 bg-[#b5d982]/10 text-[#b5d982]" : "border-white/10 bg-[#202020]"}`}
              >
                <span className="grid size-5 place-items-center rounded-md border border-white/15">
                  {checked.includes(index) && <CheckIcon className="size-3" />}
                </span>
                {index + 1}. {item}
              </button>
            ))}
          </div>
        </Card>
        <Card
          title="Create lists"
          description="Bring related work together in one calm, clear surface."
          className="max-[809px]:min-h-[390px]"
        >
          <Image
            className="absolute bottom-[-70px] left-1/2 w-[105%] -translate-x-1/2"
            src="/images/yFesICeLTusjxdesBDiV5an10vk.png"
            alt="Linkdo lists"
            width={736}
            height={1072}
          />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#8e7ef1]/35 to-transparent" />
        </Card>
        <Card
          title="Notes"
          description="Keep the decision, link, or thought with the task it belongs to."
          className="max-[809px]:min-h-[390px]"
        >
          <div className="mx-5 mt-3 rounded-2xl border border-white/10 bg-[#212121] p-4 text-sm text-[#aaa]">
            <b className="block text-white">Review payment system</b>
            <p className="mt-8">Enter your notes</p>
            <span className="float-right text-[#e880e6]">00:52</span>
          </div>
        </Card>
        <Card
          title="Personalize"
          description="Make Linkdo feel like your own workspace."
          className="max-[809px]:min-h-[390px]"
        >
          <div className="absolute inset-x-0 bottom-0 h-3/5 bg-[radial-gradient(circle_at_50%_75%,rgba(239,130,239,.45),transparent_54%)]" />
          <Image
            className="absolute bottom-[-20px] left-1/2 w-[220px] -translate-x-1/2"
            src="/images/AOwdsA2vcPsVJk49vzHnCoSU0.svg"
            alt="Linkdo themes"
            width={504}
            height={981}
          />
        </Card>
      </div>
    </section>
  );
}
