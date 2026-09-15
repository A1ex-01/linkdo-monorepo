import Image from "next/image";

export function SessionsSection() {
  return (
    <section className="h-[1006px] overflow-hidden bg-[#111] px-[10px] py-[72px] text-white max-[809px]:h-[644px]">
      <div className="mx-auto w-full max-w-[1080px] text-center">
        <div className="relative inline-block">
          <h2 className="bg-gradient-to-r from-[#ef82ef] to-[#6f98e8] bg-clip-text font-heading text-[72px] font-medium leading-none text-transparent max-[809px]:text-[48px]">
            会话追踪
          </h2>
          <span className="absolute -right-4 -top-8 rounded-full bg-white/10 px-3 py-1 text-xs max-[809px]:-right-1 max-[809px]:-top-10">
            测试版
          </span>
        </div>
        <p className="mt-7 font-heading text-[24px] font-medium leading-[28.8px]">
          每一次会话都有条理。
          <br />
          每一分钟都有记录。
        </p>
        <p className="mt-12 text-lg text-[#858585]">
          （是时候告别 Clockify 和 Toggl 了）
        </p>
        <div className="relative mt-[118px] h-[586px] overflow-hidden rounded-2xl max-[809px]:mt-[96px] max-[809px]:h-[240px]">
          <Image
            className="absolute left-1/2 top-0 w-[864px] max-w-none -translate-x-1/2 rounded-2xl border border-white/10 max-[809px]:w-[339px]"
            src="/images/BQSOUaXrrvhV7u6bjV6ycvb8no.png"
            alt="Linkdo 会话追踪仪表盘"
            width={1440}
            height={1109}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#111]" />
        </div>
      </div>
    </section>
  );
}
