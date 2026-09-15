import Image from "next/image";

export function ClosingCta() {
  return (
    <section id="get-linkdo" className="px-5 py-[72px] text-center">
      <div className="mx-auto max-w-[1080px]">
        <div className="relative aspect-[1080/671] overflow-hidden rounded-[24px] border border-white/[.08] max-[809px]:aspect-[350/218]">
          <Image src="/images/Pn0JaKt9DaRfR4IHVGrHrG8ypnI.jpg" alt="宁静的沙漠风景" fill sizes="(max-width: 809px) 350px, 1080px" className="object-cover" />
          <Image src="/images/7oJaloBCBO7AbIQCRXlFS98To0c.png" alt="" width={2048} height={48} className="absolute inset-x-0 top-0 h-auto w-full" />
        </div>
        <h2 className="mx-auto mt-[72px] max-w-[940px] font-heading text-[64px] font-medium leading-[64px] max-[809px]:mt-12 max-[809px]:max-w-[350px]">
          告别干扰，<br />聚焦重要事项，<br />然后<span className="linkdo-gradient-text">把事情做成。</span>
        </h2>
        <p className="mt-7 text-[14px] text-[#858585]">由高效工作者精心打造</p>
        <a className="linkdo-button mt-8 h-12 min-w-32" href="#get-linkdo">下载</a>
      </div>
    </section>
  );
}
