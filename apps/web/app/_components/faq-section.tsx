"use client";

import { useState } from "react";

interface FaqItem {
  question: string;
  answer: string;
}

const faqItems: FaqItem[] = [
  {
    question: "Is Linkdo only for Desktop? Is there a mobile app version?",
    answer: "Linkdo is available for macOS",
  },
  {
    question: "How many machines can I install Linkdo on?",
    answer:
      "You can install Linkdo on multiple computers and sign in with the same account. Your lists and changes sync automatically between your devices.",
  },
  {
    question: "Is Linkdo a free app?",
    answer:
      "Yes, Linkdo is free to use. You can create an account and start using the app immediately.",
  },
  {
    question: "Can I integrate Linkdo with other apps?",
    answer:
      "Yes. Linkdo supports integrations including ClickUp, with more services such as Figma, Trello, Asana and Linear planned on the roadmap.",
  },
  {
    question: "How do I get access to Linkdo?",
    answer:
      "Use any Download button on this page to get the macOS. Create an account when you launch Linkdo and your free trial starts right away.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="px-5 py-[72px]">
      <div className="mx-auto max-w-[1080px]">
        <div className="text-center">
          <h2 className="font-heading text-[28px] font-medium leading-[33.6px]">
            Frequently asked questions
          </h2>
          <p className="mt-6 text-[16px] leading-[25.6px] text-[#c8c8c8]">
            Don&apos;t see your answer? Get in touch via our communities.
          </p>
          <p className="text-[16px] leading-[25.6px] text-[#ef82ef]">
            <a
              href="https://discord.com"
              className="transition hover:text-white"
            >
              Discord
            </a>{" "}
            /{" "}
            <a
              href="https://www.facebook.com/groups/3563033377301367"
              className="transition hover:text-white"
            >
              Facebook
            </a>
          </p>
        </div>

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
