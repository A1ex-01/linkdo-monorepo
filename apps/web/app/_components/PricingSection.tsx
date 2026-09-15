"use client";

import { useState } from "react";
import { CheckIcon } from "@/components/icons";

const coreFeatures = ["All Linkdo features", "Unlimited lists & tasks"];

function FeatureList({ annual = false }: { annual?: boolean }) {
  const features = annual ? [...coreFeatures, "All future updates"] : coreFeatures;

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
          <span className="linkdo-gradient-text">Simple pricing,</span> try for free
        </h2>
        <p className="mt-10 max-w-[650px] text-center text-[18px] leading-[25.2px] text-[#d0d0d0] max-[809px]:mt-7 max-[809px]:text-[16px] max-[809px]:leading-[24px]">
          Download &amp; install Linkdo to take it for a 7 day whirl. When you&apos;re
          ready, you can purchase any of the plans below inside the app.
        </p>
        <a className="linkdo-button mt-12 h-12 min-w-32" href="#get-linkdo">
          Download
        </a>

        <div className="mt-[112px] grid w-full max-w-[900px] grid-cols-2 items-start gap-6 max-[809px]:mt-[120px] max-[809px]:grid-cols-1 max-[809px]:gap-5">
          <article className="relative flex h-[220px] flex-col overflow-hidden rounded-[20px] border border-white/[.08] bg-[#171717] p-6 max-[809px]:h-[278px]">
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-[radial-gradient(circle_at_8%_100%,rgba(239,130,239,.28),transparent_44%),radial-gradient(circle_at_42%_110%,rgba(85,217,198,.24),transparent_45%)]" />
            <div className="relative flex items-start justify-between gap-5">
              <h3 className="text-[24px] font-semibold leading-8">Monthly Plan</h3>
              <p className="text-right leading-none">
                <strong className="text-[28px] font-medium">$6.99</strong>
                <span className="mt-1 block text-[13px] text-[#9b9b9b]">/ per month</span>
              </p>
            </div>
            <div className="relative mt-8">
              <FeatureList />
            </div>
            <p className="relative mt-auto text-center text-[12px] font-semibold text-[#666]">
              Upgrade inside the app after your trial
            </p>
          </article>

          <article className="relative h-[418px] rounded-[20px] bg-[linear-gradient(#171717,#171717)_padding-box,linear-gradient(145deg,#ef82ef,#b5d982,#55d9c6,#6f98e8)_border-box] p-px">
            <div className="pointer-events-none absolute inset-0 rounded-[20px] bg-[radial-gradient(circle_at_72%_8%,rgba(239,130,239,.23),transparent_34%),radial-gradient(circle_at_50%_45%,rgba(181,217,130,.12),transparent_42%)]" />
            <div className="relative flex h-full flex-col overflow-hidden rounded-[19px] bg-[#171717]/90 p-6 pt-8">
              <div className="absolute inset-x-0 top-0 flex h-8 items-center justify-center bg-gradient-to-r from-[#55d9c6] via-[#b5d982] to-[#ef82ef] text-[13px] font-bold text-[#111]">
                Limited New Year Deal
              </div>
              <div className="flex items-start justify-between gap-5">
                <h3 className="text-[24px] font-semibold leading-8">Annual Plan</h3>
                <p className="text-right leading-none">
                  <strong className="text-[28px] font-medium">$4.99</strong>
                  <span className="mt-1 block text-[13px] text-[#9b9b9b]">/ 59.88 paid yearly</span>
                </p>
              </div>
              <div className="mt-6">
                <FeatureList annual />
              </div>
              <div className="mt-5 rounded-lg bg-white/[.04] px-4 py-3 text-center text-[14px] text-[#d5d5d5]">
                Use coupon
                <button
                  type="button"
                  onClick={copyCoupon}
                  className="mx-2 rounded-full bg-gradient-to-r from-[#b5d982] to-[#55d9c6] px-4 py-2 font-bold text-[#111] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#55d9c6]"
                  aria-live="polite"
                >
                  {copied ? "Copied!" : "▣  NY26"}
                </button>
                for extra 20% off
                <span className="mt-2 block text-[12px] text-[#666]">43% off compared to monthly</span>
              </div>
              <p className="mt-auto text-center text-[11px] font-semibold leading-[16px] text-[#666]">
                Upgrade inside the app after your trial
                <br />30 days money back guaranteed, no questions asked.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
