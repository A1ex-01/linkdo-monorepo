import Image from "next/image";

const features = [
  { label: "创建任务", icon: "✓" },
  { label: "安排日程", icon: "▦" },
  { label: "查找内容", icon: "⌕" },
];

function SoonBadge() {
  return (
    <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white">
      即将推出
    </span>
  );
}

function AssistantCard() {
  return (
    <article className="linkdo-card noise relative min-h-[882px] p-5 md:min-h-[882px]">
      <h3 className="relative z-10 text-lg font-bold">
        把想法变成计划！
      </h3>
      <p className="relative z-10 mt-1 max-w-[320px] text-sm leading-6 text-[#858585]">
        Linkdo AI 会把你脑海中的想法整理成任务、笔记、子任务和日程。
      </p>
      <div className="absolute inset-x-8 bottom-8 top-[130px] overflow-hidden rounded-[24px] border border-[#d96ee6] bg-[#171717]">
        <Image
          className="absolute -bottom-20 left-1/2 w-[580px] max-w-none -translate-x-1/2 opacity-55"
          src="/images/XGrZiuZ78TIqjAdDetbAOVSfQQ.png"
          alt=""
          width={906}
          height={648}
        />
        <div className="absolute left-6 right-6 top-16 rounded-2xl bg-[#292929] p-3 text-sm text-[#dedede]">
          创建两个任务：一个用于落地页设计，一个用于修复问题；为落地页的
          头部至页脚各个区块添加子任务。
        </div>
        <p className="absolute left-6 top-[190px] text-sm text-[#df72e6]">
          正在思考…
        </p>
        <div className="absolute inset-x-3 bottom-3 h-[108px] rounded-2xl border border-white/5 bg-[#282828] p-4 text-sm text-[#858585]">
          输入你的消息
          <div className="absolute bottom-3 right-3 flex gap-2">
            <span className="grid size-8 place-items-center rounded-full bg-[#39233e] text-[#e171ea]">
              ♫
            </span>
            <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-[#ef82ef] to-[#6f98e8]">
              ↑
            </span>
          </div>
        </div>
        <Image
          className="absolute -bottom-3 -right-3 size-[74px]"
          src="/images/z8fxe3EBvisaVsY8ekUwIYeY.png"
          alt="Linkdo AI"
          width={512}
          height={512}
        />
      </div>
    </article>
  );
}

function VoiceCard() {
  return (
    <article className="linkdo-card noise relative min-h-[282px] p-5">
      <div className="relative z-10 flex items-start justify-between gap-4">
        <p className="text-sm text-[#858585]">
          直接将语音或会议记录保存到任务笔记中
        </p>
        <SoonBadge />
      </div>
      <Image
        className="absolute left-1/2 top-1/2 w-[372px] -translate-x-1/2 -translate-y-1/2"
        src="/images/yBUdr1WdCqmE37TI8HHsGhq7SZc.png"
        alt="Linkdo AI 记录会议笔记"
        width={744}
        height={224}
      />
    </article>
  );
}

function ContextCard() {
  return (
    <article className="linkdo-card noise relative min-h-[566px] p-5">
      <div className="relative z-10 flex items-start justify-between gap-4">
        <p className="max-w-[360px] text-sm leading-6 text-[#858585]">
          Linkdo AI 能理解标题、笔记和历史记录中的上下文，在关键时刻呈现重要信息。
        </p>
        <SoonBadge />
      </div>
      <Image
        className="absolute bottom-[-70px] left-[-25px] w-[650px] max-w-none opacity-70"
        src="/images/sd1l1foDOqBlOYHlAfs5rrUVN4o.png"
        alt=""
        width={2042}
        height={1984}
      />
      <div className="absolute bottom-[165px] left-1/2 w-[340px] -translate-x-1/2 rounded-[24px] border border-white/20 bg-[#171717] p-6">
        <h3 className="text-lg font-bold text-[#858585]">
          看起来这个任务<span className="text-white">很重要</span>
        </h3>
        <div className="mt-5 rounded-xl bg-[#292929] p-3 text-xs">
          <div className="flex justify-between">
            <span>完成黑色星期五活动</span>
            <b className="text-[#54d56f]">W</b>
          </div>
          <div className="mt-2 flex justify-between text-[#858585]">
            <span>+EST</span>
            <span>0min</span>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-gradient-to-r from-[#55d9c6] to-[#b5d982] px-4 py-2 text-black">
            🚀&nbsp; 立即完成
          </span>
          <span className="rounded-full bg-[#292929] px-4 py-2">
            ◷&nbsp; 稍后完成
          </span>
          <span className="rounded-full bg-[#292929] px-4 py-2">
            ▣&nbsp; 明天完成
          </span>
        </div>
      </div>
    </article>
  );
}

export function LinkdoAiSection() {
  return (
    <section className="relative min-h-[1442px] overflow-hidden bg-[#111] px-[10px] pb-[72px] pt-[120px] text-white max-[809px]:min-h-[2252px]">
      <div className="mx-auto flex w-full max-w-[1080px] flex-col items-center">
        <div className="relative mt-[-12px] text-center">
          <h2 className="font-heading text-[72px] font-medium leading-none max-[809px]:text-[48px]">
            {" "}
            <span className="bg-gradient-to-r from-[#ef82ef] to-[#6f98e8] bg-clip-text text-transparent">
              认识 Linkdo AI，
            </span>
          </h2>
          <span className="absolute -right-6 top-0 rounded-full bg-white/10 px-3 py-1 text-xs max-[809px]:-right-5 max-[809px]:-top-8">
            测试版
          </span>
          <p className="mx-auto mt-7 max-w-[420px] font-heading text-[24px] font-medium leading-[28.8px]">
            你的个人效率
            <br />
            AI 助手。
          </p>
        </div>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {features.map((feature) => (
            <span
              key={feature.label}
              className="flex h-[43px] items-center gap-2 rounded-full bg-[#171717] px-3.5 text-sm font-semibold"
            >
              <i className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-[#ef82ef]/40 to-[#4830a7] not-italic text-[#d880e7]">
                {feature.icon}
              </i>
              {feature.label}
            </span>
          ))}
        </div>
        <div className="mt-[72px] grid w-full grid-cols-2 gap-6 max-[809px]:mt-[120px] max-[809px]:grid-cols-1">
          <AssistantCard />
          <div className="grid gap-6">
            <VoiceCard />
            <ContextCard />
          </div>
        </div>
      </div>
    </section>
  );
}
