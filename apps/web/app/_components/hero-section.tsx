import Image from "next/image";
import { DownloadLink } from "./download-link";

const avatars = [
  "zqg4xaUR7i8TqSev0BA79kfRwlk.png",
  "0TC6g6QmYADlBY2JtcvyDtKmHQ.png",
  "wVgc6DevW3NlELhtHdkwybBC4c.png",
  "KvWjUGif2RLSaq2hzSVmhY313Q.png",
];

export function HeroSection() {
  return (
    <section
      id="top"
      className="relative min-h-[896px] text-foreground overflow-hidden bg-[#111] px-5 pb-[72px] pt-[148px] max-[809px]:min-h-[1337px] max-[809px]:pb-0 max-[809px]:pt-[104px]"
    >
      <div className="mx-auto grid w-full max-w-[1080px] grid-cols-2 gap-6 max-[809px]:grid-cols-1">
        <div className="flex min-h-[676px] flex-col justify-start max-[809px]:min-h-0">
          <h1 className="mt-12 font-heading text-[64px] font-medium leading-[64px] max-[809px]:mt-8 max-[809px]:text-[44px] max-[809px]:leading-[52.8px]">
            简单的待办清单与计时应用
            <br className="max-[809px]:hidden" /> 让你拥有
            <br />
            <span className="linkdo-gradient-text">超强专注力</span>
          </h1>
          <div className="mt-[68px] flex items-center gap-6 max-[809px]:mt-9 max-[809px]:flex-wrap">
            <DownloadLink className="linkdo-button">
              立即获取 Linkdo
            </DownloadLink>
            <a
              href="#reviews"
              aria-label="Linkdo 用户评价"
              className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-[#bfbfbf]"
            >
              <b className="block text-sm text-white">为专注而生</b> 少些规划，
              多些完成。
            </a>
          </div>
        </div>
        <div className="relative min-h-[676px] animate-[linkdo-fade-up_1.2s_cubic-bezier(.74,.09,.04,.97)_.3s_both] max-[809px]:min-h-[760px]">
          <div className="absolute inset-x-[-40px] top-[-30px] h-[730px] rounded-full bg-[radial-gradient(circle,rgba(239,130,239,.18),transparent_58%)] blur-2xl" />
          <Image
            className="absolute left-1/2 top-1/2 w-[320px] max-w-none -translate-x-1/2 -translate-y-1/2 -rotate-[7deg] drop-shadow-[0_40px_80px_rgba(0,0,0,.65)] max-[809px]:top-[47%] max-[809px]:w-[300px]"
            src="/images/6dGrzmG6PWGvJdiPf7k6vGbAo.png"
            alt="Linkdo 任务计时应用"
            width={518}
            height={1234}
            priority
          />
          <div className="absolute bottom-[92px] left-1/2 w-[310px] -translate-x-1/2 rounded-2xl border border-white/10 bg-[#181818]/95 p-4 shadow-2xl max-[809px]:bottom-[105px]">
            <div className="flex items-center justify-between text-xs text-[#858585]">
              <span>今天</span>
              <span>已完成 2/6</span>
            </div>
            <div className="mt-3 rounded-xl bg-[#232323] p-3 text-sm">
              <b>审核落地页</b>
              <span className="float-right text-[#b5d982]">01:00:29</span>
            </div>
          </div>
          <p className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-[#858585]">
            简单规划任务，认真保持专注。
          </p>
        </div>
      </div>
    </section>
  );
}
