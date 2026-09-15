import Image from "next/image";

const features = [
  { label: "Speak", icon: "♫" },
  { label: "Create tasks", icon: "✓" },
  { label: "Schedule", icon: "▦" },
  { label: "Find", icon: "⌕" },
];

function SoonBadge() {
  return <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white">Soon</span>;
}

function AssistantCard() {
  return (
    <article className="linkdo-card noise relative min-h-[882px] p-5 md:min-h-[882px]">
      <h3 className="relative z-10 text-lg font-bold">Turn thoughts into plans!</h3>
      <p className="relative z-10 mt-1 max-w-[320px] text-sm leading-6 text-[#858585]">
        Linkdo AI turns your brain dump into organised tasks, notes, subtasks, and schedules.
      </p>
      <div className="absolute inset-x-8 bottom-8 top-[130px] overflow-hidden rounded-[24px] border border-[#d96ee6] bg-[#171717]">
        <Image className="absolute -bottom-20 left-1/2 w-[580px] max-w-none -translate-x-1/2 opacity-55" src="/images/XGrZiuZ78TIqjAdDetbAOVSfQQ.png" alt="" width={906} height={648} />
        <div className="absolute left-6 right-6 top-16 rounded-2xl bg-[#292929] p-3 text-sm text-[#dedede]">
          Create two tasks one for landing page design and one for bug fixing with sub tasks on landing page for a few different sections from header to footer
        </div>
        <p className="absolute left-6 top-[190px] text-sm text-[#df72e6]">Thinking.</p>
        <div className="absolute inset-x-3 bottom-3 h-[108px] rounded-2xl border border-white/5 bg-[#282828] p-4 text-sm text-[#858585]">
          Enter your message
          <div className="absolute bottom-3 right-3 flex gap-2">
            <span className="grid size-8 place-items-center rounded-full bg-[#39233e] text-[#e171ea]">♫</span>
            <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-[#ef82ef] to-[#6f98e8]">↑</span>
          </div>
        </div>
        <Image className="absolute -bottom-3 -right-3 size-[74px]" src="/images/z8fxe3EBvisaVsY8ekUwIYeY.png" alt="Linkdo AI" width={512} height={512} />
      </div>
    </article>
  );
}

function VoiceCard() {
  return (
    <article className="linkdo-card noise relative min-h-[282px] p-5">
      <div className="relative z-10 flex items-start justify-between gap-4">
        <p className="text-sm text-[#858585]">Record your voice or meetings right into task notes</p>
        <SoonBadge />
      </div>
      <Image className="absolute left-1/2 top-1/2 w-[372px] -translate-x-1/2 -translate-y-1/2" src="/images/yBUdr1WdCqmE37TI8HHsGhq7SZc.png" alt="Linkdo AI taking meeting notes" width={744} height={224} />
    </article>
  );
}

function ContextCard() {
  return (
    <article className="linkdo-card noise relative min-h-[566px] p-5">
      <div className="relative z-10 flex items-start justify-between gap-4">
        <p className="max-w-[360px] text-sm leading-6 text-[#858585]">Linkdo AI understands context in your titles, notes, and history, surfacing what’s important when it matters.</p>
        <SoonBadge />
      </div>
      <Image className="absolute bottom-[-70px] left-[-25px] w-[650px] max-w-none opacity-70" src="/images/sd1l1foDOqBlOYHlAfs5rrUVN4o.png" alt="" width={2042} height={1984} />
      <div className="absolute bottom-[165px] left-1/2 w-[340px] -translate-x-1/2 rounded-[24px] border border-white/20 bg-[#171717] p-6">
        <h3 className="text-lg font-bold text-[#858585]">Seems like this task is <span className="text-white">important</span></h3>
        <div className="mt-5 rounded-xl bg-[#292929] p-3 text-xs">
          <div className="flex justify-between"><span>Complete Black Friday Campaign</span><b className="text-[#54d56f]">W</b></div>
          <div className="mt-2 flex justify-between text-[#858585]"><span>+EST</span><span>0min</span></div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-gradient-to-r from-[#55d9c6] to-[#b5d982] px-4 py-2 text-black">🚀&nbsp; Do it now</span>
          <span className="rounded-full bg-[#292929] px-4 py-2">◷&nbsp; Do later</span>
          <span className="rounded-full bg-[#292929] px-4 py-2">▣&nbsp; Tomorrow</span>
        </div>
      </div>
    </article>
  );
}

export function LinkdoAiSection() {
  return (
    <section className="relative min-h-[1442px] overflow-hidden bg-[#111] px-[10px] pb-[72px] pt-[120px] text-white max-[809px]:min-h-[2252px]">
      <div className="mx-auto flex w-full max-w-[1080px] flex-col items-center">
        <div className="relative flex h-[112px] items-center justify-center">
          <Image className="absolute size-[370px] max-w-none opacity-50" src="/images/3OSs3DDWL00YrZSXuSeAkuLco8.png" alt="" width={1000} height={974} />
          <Image className="relative size-[88px]" src="/images/z8fxe3EBvisaVsY8ekUwIYeY.png" alt="Linkdo AI" width={512} height={512} />
        </div>
        <div className="relative mt-[-12px] text-center">
          <h2 className="font-heading text-[72px] font-medium leading-none max-[809px]:text-[48px]"> <span className="bg-gradient-to-r from-[#ef82ef] to-[#6f98e8] bg-clip-text text-transparent">Meet Linkdo AI,</span></h2>
          <span className="absolute -right-6 top-0 rounded-full bg-white/10 px-3 py-1 text-xs max-[809px]:-right-5 max-[809px]:-top-8">BETA</span>
          <p className="mx-auto mt-7 max-w-[420px] font-heading text-[24px] font-medium leading-[28.8px]">Your personal productivity<br />assistant powered by AI.</p>
        </div>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {features.map((feature) => <span key={feature.label} className="flex h-[43px] items-center gap-2 rounded-full bg-[#171717] px-3.5 text-sm font-semibold"><i className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-[#ef82ef]/40 to-[#4830a7] not-italic text-[#d880e7]">{feature.icon}</i>{feature.label}</span>)}
        </div>
        <div className="mt-[72px] grid w-full grid-cols-2 gap-6 max-[809px]:mt-[120px] max-[809px]:grid-cols-1">
          <AssistantCard />
          <div className="grid gap-6"><VoiceCard /><ContextCard /></div>
        </div>
      </div>
    </section>
  );
}
