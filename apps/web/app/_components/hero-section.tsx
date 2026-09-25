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
      className="relative min-h-screen text-foreground overflow-hidden bg-[#111] px-5 pb-[72px] pt-[148px] max-[809px]:min-h-[1337px] max-[809px]:pb-0 max-[809px]:pt-[0]"
    >
      <div className="mx-auto grid w-full max-w-[1080px] grid-cols-2 gap-0 max-[809px]:grid-cols-1">
        <div className="flex min-h-[676px] flex-col justify-start max-[809px]:min-h-0">
          <h1 className="mt-12 font-heading text-[64px] font-medium leading-[64px] max-[809px]:mt-8 max-[809px]:text-[44px] max-[809px]:leading-[52.8px]">
            A simple to-do
            <br className="max-[809px]:hidden" /> list & timer app
            <br />
            that gives you
            <br />
            <span className="linkdo-gradient-text">superpowers</span>
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
        <div className="relative h-screen animate-[linkdo-fade-up_1.2s_cubic-bezier(.74,.09,.04,.97)_.3s_both]">
          <div className="absolute h-screen rounded-full bg-[radial-gradient(circle,rgba(239,130,239,.18),transparent_58%)] blur-2xl" />
          <video
            key={
              "http://static.a1ex.online/linkdo/videos/how-it-works/step-01.mp4"
            }
            className=" w-full  drop-shadow-[0_40px_80px_rgba(0,0,0,.65)]"
            src={
              "http://static.a1ex.online/linkdo/videos/how-it-works/step-01.mp4"
            }
            autoPlay
            muted
            loop
            playsInline
          />

          <p className=" text-center mt-10 whitespace-nowrap text-xs text-[#858585]">
            简单规划任务，认真保持专注。
          </p>
        </div>
      </div>
    </section>
  );
}
