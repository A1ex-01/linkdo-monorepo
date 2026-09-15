"use client";

import { useState } from "react";
import { CheckIcon } from "@/components/icons";

const coreFeatures = ["所有 Linkdo 功能", "不限数量的列表与任务"];

function FeatureList({ annual = false }: { annual?: boolean }) {
  const features = annual
    ? [...coreFeatures, "未来所有更新"]
    : coreFeatures;

  return (
    <ul className="space-y-4 text-[16px] leading-6 text-[#858585]">
      {features.map((feature) => (
        <li key={feature} className="flex items-center gap-2.5">
          <CheckIcon className="size-4 text-[#858585]" />
          {feature}
        </li>
      ))}
    </ul>
  );
}

export function PricingSection() {
  const [copied, setCopied] = useState(false);

  async function copyCoupon() {
    try {
      await navigator.clipboard.writeText("NY26");
    } catch {
      // Clipboard access can be unavailable in preview iframes; the visual state
      // still confirms the user's intent without interrupting the interaction.
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <section id="pricing" className="px-5 py-[120px] max-[809px]:py-[72px]">
      <div className="mx-auto flex max-w-[1080px] flex-col items-center">
        <h2 className="text-center font-heading text-[44px] font-medium leading-[52.8px] max-[809px]:text-[40px] max-[809px]:leading-[48px]">
          <span className="linkdo-gradient-text">简单定价，</span>免费试用
        </h2>
        <p className="mt-10 max-w-[650px] text-center text-[18px] leading-[25.2px] text-[#d0d0d0] max-[809px]:mt-7 max-[809px]:text-[16px] max-[809px]:leading-[24px]">
          下载并安装 Linkdo，即可开始 7 天免费试用。准备好后，你可以在应用内购买下方任意方案。
        </p>
        <a className="linkdo-button mt-12 h-12 min-w-32" href="#get-linkdo">
          下载
        </a>

        <div className="mt-[112px] grid w-full max-w-[900px] grid-cols-2 items-start gap-6 max-[809px]:mt-[120px] max-[809px]:grid-cols-1 max-[809px]:gap-5">
          <article className="relative flex h-[220px] flex-col overflow-hidden rounded-[20px] border border-white/[.08] bg-[#171717] p-6 max-[809px]:h-[278px]">
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-full bg-[radial-gradient(circle_at_8%_100%,rgba(239,130,239,.28),transparent_44%),radial-gradient(circle_at_42%_110%,rgba(85,217,198,.24),transparent_45%)]" />
            <div className="relative flex items-start justify-between gap-5">
              <h3 className="text-[24px] font-semibold leading-8">
                月度方案
              </h3>
              <p className="text-right leading-none">
                <strong className="text-[28px] font-medium">$0</strong>
                <span className="mt-1 block text-[13px] text-[#9b9b9b]">
                  / 每月
                </span>
              </p>
            </div>
            <div className="relative mt-8">
              <FeatureList />
            </div>
            <p className="relative mt-auto text-center text-[12px] font-semibold text-[#666]">
              试用结束后可在应用内升级
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
