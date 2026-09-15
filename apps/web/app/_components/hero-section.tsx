import Image from "next/image";

const avatars = [
  "zqg4xaUR7i8TqSev0BA79kfRwlk.png",
  "0TC6g6QmYADlBY2JtcvyDtKmHQ.png",
  "wVgc6DevW3NlELhtHdkwybBC4c.png",
  "KvWjUGif2RLSaq2hzSVmhY313Q.png",
];

export function HeroSection() {
  return (
    <section id="top" className="relative min-h-[896px] overflow-hidden bg-[#111] px-5 pb-[72px] pt-[148px] max-[809px]:min-h-[1337px] max-[809px]:pb-0 max-[809px]:pt-[104px]">
      <div className="mx-auto grid w-full max-w-[1080px] grid-cols-2 gap-6 max-[809px]:grid-cols-1">
        <div className="flex min-h-[676px] flex-col justify-start max-[809px]:min-h-0">
          <div className="flex items-center">
            <div className="flex -space-x-2">
              {avatars.map((avatar) => <Image key={avatar} className="size-9 rounded-full border border-[#111] object-cover" src={`/images/${avatar}`} alt="" width={40} height={40} />)}
            </div>
            <p className="ml-5 text-sm leading-[22.4px] text-[#bfbfbf]">2,160,000+ tasks organized</p>
          </div>
          <h1 className="mt-12 font-heading text-[64px] font-medium leading-[64px] max-[809px]:mt-8 max-[809px]:text-[44px] max-[809px]:leading-[52.8px]">
            A simple to-do list &amp; timer app<br className="max-[809px]:hidden" /> that gives you<br />
            <span className="linkdo-gradient-text">superpowers</span>
          </h1>
          <div className="mt-[68px] flex items-center gap-6 max-[809px]:mt-9 max-[809px]:flex-wrap">
            <a className="linkdo-button" href="#get-linkdo">Get Linkdo</a>
            <a href="#reviews" aria-label="Linkdo community reviews" className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-[#bfbfbf]">
              <b className="block text-sm text-white">BUILT FOR FOCUS</b> Plan less. Finish more.
            </a>
          </div>
        </div>
        <div className="relative min-h-[676px] animate-[linkdo-fade-up_1.2s_cubic-bezier(.74,.09,.04,.97)_.3s_both] max-[809px]:min-h-[760px]">
          <div className="absolute inset-x-[-40px] top-[-30px] h-[730px] rounded-full bg-[radial-gradient(circle,rgba(239,130,239,.18),transparent_58%)] blur-2xl" />
          <Image className="absolute left-1/2 top-1/2 w-[320px] max-w-none -translate-x-1/2 -translate-y-1/2 -rotate-[7deg] drop-shadow-[0_40px_80px_rgba(0,0,0,.65)] max-[809px]:top-[47%] max-[809px]:w-[300px]" src="/images/6dGrzmG6PWGvJdiPf7k6vGbAo.png" alt="Linkdo task timer app" width={518} height={1234} priority />
          <div className="absolute bottom-[92px] left-1/2 w-[310px] -translate-x-1/2 rounded-2xl border border-white/10 bg-[#181818]/95 p-4 shadow-2xl max-[809px]:bottom-[105px]">
            <div className="flex items-center justify-between text-xs text-[#858585]"><span>Today</span><span>2/6 DONE</span></div>
            <div className="mt-3 rounded-xl bg-[#232323] p-3 text-sm"><b>Review landing page</b><span className="float-right text-[#b5d982]">01:00:29</span></div>
          </div>
          <p className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-[#858585]">Simple task planning. Serious focus.</p>
        </div>
      </div>
    </section>
  );
}
