"use client";

import { useState } from "react";

interface FaqItem {
  question: string;
  answer: string;
}

const faqItems: FaqItem[] = [
  {
    question: "Linkdo 仅支持桌面端吗？有移动版吗？",
    answer: "Linkdo 目前支持桌面端。",
  },
  {
    question: "Linkdo 可以安装在几台设备上？",
    answer:
      "你可以在多台电脑上安装 Linkdo 并登录同一账户。列表和更改会在设备之间自动同步。",
  },
  {
    question: "Linkdo 是免费应用吗？",
    answer: "是的，Linkdo 可免费使用。创建账户后即可立即开始使用。",
  },
  {
    question: "Linkdo 可以与其他应用集成吗？",
    answer:
      "可以。Linkdo 已支持包括 ClickUp 在内的集成，Figma、Trello、Asana 和 Linear 等更多服务已列入产品路线图。",
  },
  {
    question: "如何获取 Linkdo？",
    answer:
      "点击本页任意“下载”按钮即可获取 Linkdo。启动 Linkdo 后创建账户，免费试用会立即开始。",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="px-5 py-[72px]">
      <div className="mx-auto max-w-[1080px]">
        <div className="mt-12 space-y-2.5">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;
            const answerId = `faq-answer-${index}`;

            return (
              <article
                key={item.question}
                className="overflow-hidden rounded-[24px] border border-[#262626] bg-[#171717]"
              >
                <button
                  type="button"
                  className="flex min-h-[84px] w-full items-center justify-between gap-8 px-6 py-5 text-left"
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  <span className="text-[20px] font-bold leading-8 text-[#858585] max-[809px]:text-[17px] max-[809px]:leading-6">
                    {item.question}
                  </span>
                  <span
                    className={`relative size-6 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-[135deg]" : ""}`}
                    aria-hidden="true"
                  >
                    <span className="absolute left-1/2 top-1/2 h-0.5 w-5 -translate-x-1/2 -translate-y-1/2 bg-[#858585]" />
                    <span className="absolute left-1/2 top-1/2 h-5 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-[#858585]" />
                  </span>
                </button>
                <div
                  id={answerId}
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-7 text-[16px] leading-[25.6px] text-[#858585]">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
