import Image from "next/image";

interface BadgeProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  label: string;
}

function Badge({ href, children, className = "", label }: BadgeProps) {
  return (
    <a
      href={href}
      aria-label={label}
      className={`flex h-[74px] items-center justify-center rounded-[16px] bg-[#171717] px-3 transition hover:-translate-y-1 hover:bg-[#1c1c1c] ${className}`}
    >
      {children}
    </a>
  );
}

export function ReviewBadges() {
  return (
    <section id="reviews" className="px-5 pb-[72px] pt-2">
      <p className="mb-6 text-center text-[13px] text-[#858585]">
        深受全球高效工作者信赖与好评
      </p>
      <div className="mx-auto flex max-w-[740px] flex-wrap items-center justify-center gap-3">
        <Badge
          href="#reviews"
          label="Linkdo 在 GetApp 上的评价"
          className="w-[104px]"
        >
          <div className="text-center leading-none">
            <strong className="text-[16px] text-[#79d9d1]">GetApp</strong>
            <span className="mt-1 block text-[9px] text-white">★★★★★ 4.8</span>
          </div>
        </Badge>
        <Badge href="#reviews" label="Linkdo 社区评分" className="w-[130px]">
          <div className="text-center leading-none">
            <strong className="text-[11px]">社区评分</strong>
            <span className="mt-2 block text-[12px] text-[#ef7162]">★★★★★</span>
          </div>
        </Badge>
        <Badge
          href="https://www.softwareadvice.com/product/519553-Linkdo/reviews/"
          label="Linkdo 在 Software Advice 上的评价"
          className="w-[129px]"
        >
          <div className="text-center">
            <strong className="rounded bg-[#6951ad] px-1.5 py-1 text-[13px]">
              Software Advice
            </strong>
            <span className="mt-1 block text-[10px] text-[#f6c44e]">
              ★★★★★ 4.8
            </span>
          </div>
        </Badge>
        <Badge
          href="https://www.capterra.com/p/10020211/Linkdo/reviews/"
          label="Linkdo 在 Capterra 上的评价"
          className="w-[128px]"
        >
          <div className="text-center">
            <strong className="text-[17px] text-[#55bfe3]">Capterra</strong>
            <span className="ml-1 text-[13px]">4.8</span>
            <span className="block text-[9px] text-[#f6c44e]">★★★★★</span>
          </div>
        </Badge>
        <Badge
          href="#reviews"
          label="Linkdo 登上 Tool Finder"
          className="h-[110px] w-[150px] flex-col"
        >
          <span className="text-[11px] text-[#858585]">媒体报道</span>
          <Image
            src="http://static.a1ex.online/linkdo/images/AfLm4itvIQ1i0bDHBQ3jM0R1ZL8.png"
            alt="Tool Finder"
            width={884}
            height={312}
            className="mt-1 h-auto w-[98px] opacity-75"
          />
        </Badge>
      </div>
    </section>
  );
}
