import Image from "next/image";
import { DownloadLink } from "./download-link";

export function ClosingCta() {
  return (
    <section id="get-linkdo" className="px-5 py-[72px] text-center">
      <div className="mx-auto max-w-[1080px]">
        <div className="relative w-full overflow-hidden rounded-[24px] border border-white/[.08] max-[809px]:aspect-[350/218]">
          <img
            src="http://static.a1ex.online/linkdo/images/home-source/mini-focus-card.png"
            alt="Mini focus card"
            className="object-cover w-full"
          />
        </div>
        <h2 className="mx-auto mt-[72px] max-w-[940px] font-heading text-[64px] font-medium leading-[64px] max-[809px]:mt-12 max-[809px]:max-w-[350px]">
          告别干扰，
          <br />
          聚焦重要事项，
          <br />
          然后<span className="linkdo-gradient-text">把事情做成。</span>
        </h2>
        <p className="mt-7 text-[14px] text-[#858585]">由高效工作者精心打造</p>
        <DownloadLink className="linkdo-button mt-8 h-12 min-w-32">
          下载 Linkdo
        </DownloadLink>
      </div>
    </section>
  );
}
