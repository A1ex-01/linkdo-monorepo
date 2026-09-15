import Image from "next/image";

type ReportCardProps = {
  className?: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

function ReportCard({
  className = "",
  title,
  description,
  children,
}: ReportCardProps) {
  return (
    <article
      className={`linkdo-card noise relative overflow-hidden p-5 ${className}`}
    >
      <div className="relative z-10">
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="mt-1 text-sm leading-5 text-[#858585]">{description}</p>
      </div>
      {children}
    </article>
  );
}

function GradientLayer() {
  return (
    <Image
      className="absolute -bottom-40 -left-20 w-[720px] max-w-none rotate-[18deg] opacity-45"
      src="/images/Ev5WadmW4zyn4acFgN2k6Q4rjU.png"
      alt=""
      width={1004}
      height={764}
    />
  );
}

function Donut() {
  return (
    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-8">
      <div className="size-[170px] rounded-full bg-[conic-gradient(#b7d34b_0_24%,#e46be5_24%_36%,#5c9be8_36%_48%,#4bc56a_48%)] p-[34px]">
        <div className="size-full rounded-full bg-[#171717]" />
      </div>
      <div className="space-y-2 text-[11px]">
        <p>
          <b className="text-[#4bc56a]">●</b>&nbsp;
          工作&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 32 小时 40 分&nbsp;&nbsp; <b>60.72%</b>
        </p>
        <p>
          <b className="text-[#b7d34b]">●</b>&nbsp; 设计&nbsp;&nbsp;&nbsp;
          12 小时 24 分&nbsp;&nbsp; <b>23.05%</b>
        </p>
        <p>
          <b className="text-[#e46be5]">●</b>&nbsp; 个人…&nbsp;&nbsp;&nbsp;
          2 小时 12 分&nbsp;&nbsp; <b>4.09%</b>
        </p>
        <p>
          <b className="text-[#5c9be8]">●</b>&nbsp;
          休息&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 6 小时 32 分&nbsp;&nbsp; <b>12.14%</b>
        </p>
        <p className="pt-2">
          合计 <b className="ml-24">12 小时 40 分</b>
        </p>
      </div>
    </div>
  );
}

export function ReportsSection() {
  return (
    <section
      data-fast-reveal
      className="min-h-[1017px] bg-[#111] px-5 py-[72px] text-white max-[809px]:min-h-[2272px]"
    >
      <h2 className="mx-auto max-w-[650px] text-center font-heading text-[44px] font-medium leading-[52.8px] max-[809px]:max-w-[350px]">
        深入了解你的
        <br className="max-[809px]:hidden" />{" "}
        <span className="linkdo-gradient-text">效率，</span>让每天
        都更进一步
      </h2>
      <div className="mx-auto mt-[72px] grid w-full max-w-[1080px] grid-cols-2 gap-6 max-[809px]:grid-cols-1 max-[809px]:gap-[22px]">
        <ReportCard
          className="col-span-2 h-[753px] max-[809px]:col-span-1 max-[809px]:h-[336px]"
          title="报告概览"
          description="鸟瞰你的整体工作习惯与效率表现"
        >
          <GradientLayer />
          <Image
            className="absolute bottom-5 left-1/2 w-[960px] max-w-none -translate-x-1/2 rounded-xl border border-white/10 max-[809px]:bottom-0 max-[809px]:left-5 max-[809px]:w-[424px] max-[809px]:translate-x-0"
            src="/images/q7y0ZjAlnM9R9dJuo20OtPSTkQ.png"
            alt="报告概览仪表盘"
            width={1440}
            height={896}
          />
        </ReportCard>
      </div>
    </section>
  );
}
