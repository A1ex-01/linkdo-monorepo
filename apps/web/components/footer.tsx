import Image from "next/image";

const explore = ["Blog"];
const support = ["Changelog", "Roadmap"];
const compare = ["TickTick"];

function FooterColumn({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h3 className="text-[12px] font-semibold uppercase leading-5 text-[#444]">
        {title}
      </h3>
      <ul className="mt-5 space-y-4">
        {links.map((link) => (
          <li key={link}>
            <a
              href="#"
              className="text-[14px] leading-[22.4px] text-[#858585] transition-colors duration-300 ease-[cubic-bezier(.44,0,.56,1)] hover:text-white"
            >
              {link}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className=" border-t border-[#363636] px-5 pb-10 pt-[75px] max-[809px]:pt-[72px]">
      <div className="mx-auto flex max-w-[1080px] flex-col">
        <div className="flex items-center justify-between">
          <a
            href="#"
            className="flex items-center gap-1.5"
            aria-label="Linkdo home"
          >
            <Image
              src="/linkdo-dark.png"
              alt=""
              width={26}
              height={26}
              className="size-[26px]"
            />
            <span className="font-heading text-[26px] font-medium leading-[26px]">
              Linkdo
            </span>
          </a>
          <a href="#get-linkdo" className="linkdo-button h-12 min-w-32">
            Download
          </a>
        </div>

        <div className="mt-[76px] grid grid-cols-[168px_120px_1fr_280px] gap-12 max-[809px]:mt-[72px] max-[809px]:grid-cols-2 max-[809px]:gap-x-8 max-[809px]:gap-y-16">
          <FooterColumn title="Explore" links={explore} />
          <FooterColumn title="Support" links={support} />
          <FooterColumn title="Compare" links={compare} />

          <div className="max-[809px]:col-span-2">
            <h3 className="text-[12px] font-semibold uppercase leading-5 text-[#444]">
              Connect with us
            </h3>
            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href="mailto:peterxhhx@gmail.com"
                className="rounded-lg border border-white/[.08] bg-[#171717] px-3 py-2 text-[13px] font-semibold text-[#858585] transition hover:text-white"
              >
                ✉ &nbsp; peterxhhx@gmail.com
              </a>
            </div>
          </div>
        </div>

        <div className="mt-auto flex items-end justify-between gap-8 text-[14px] leading-[22.4px] text-[#858585] max-[809px]:flex-col max-[809px]:items-start">
          <p>
            © 2025 Linkdo App Ltd. All Rights Reserved. Company No 14163956.
          </p>
          <div className="flex gap-8">
            <a href="#" className="transition hover:text-white">
              Terms of use
            </a>
            <a href="#" className="transition hover:text-white">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
