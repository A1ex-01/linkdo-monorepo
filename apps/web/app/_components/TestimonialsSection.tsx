import Image from "next/image";

interface Testimonial {
  name: string;
  role?: string;
  quote: string;
  avatar: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Jakub Wieckowski",
    role: "Product builder",
    quote: "Absolutely the best productivity app I've found so far! It is simple, fast and keeps the task I should be doing right in front of me.",
    avatar: "/images/PuoEYuuIeepyWwrekieqn8syGks.png",
  },
  {
    name: "Jordan B.",
    role: "UX Designer",
    quote: "It's the perfect accountability buddy. I needed a tool to keep myself accountable and this has massively helped me keep on track.",
    avatar: "/images/8AUImYA2E1BlhJ0jbyuOsRNBKw.png",
  },
  {
    name: "Cameron Nimmo",
    quote: "Game changer of a product and the founder is on it with the customer service. It fits into my day without adding more noise.",
    avatar: "/images/6hhzTEWqSaB08Vmr352myBXePi8.png",
  },
  {
    name: "Vikas Tiwari",
    role: "Consultant",
    quote: "I love how slick this product is without any compromise on use cases and features. Focus mode is now part of my daily routine.",
    avatar: "/images/J6BR3dKNtxAVdv6O5YoVoiQPKU.jpg",
  },
  {
    name: "Christian H.",
    role: "Senior Product Designer",
    quote: "It's the right balance of simple yet powerful. The Flow mode hides all distractions so I can get work done.",
    avatar: "/images/oVUWGFBvQDHJvfOVjEuLjJel9D0.png",
  },
  {
    name: "Brittany McNicholas",
    role: "Strategic Marketing Designer",
    quote: "This one is different than most apps I've tried. I love the simplicity and focus on TODAY, and that you can rearrange tasks as you go.",
    avatar: "/images/AKkdoCVxmQ1GMxay7gVVRObkQ.png",
  },
  {
    name: "Char B",
    quote: "This app has kept me motivated and focused on tasks. I would highly recommend it to everyone who just needs to focus.",
    avatar: "/images/I727fO1GyBbCut2CyVa4eRc5sqU.png",
  },
  {
    name: "George K.",
    role: "Independent creator",
    quote: "Linkdo has been incredibly helpful for organising my to-do list and, most importantly, tracking the time spent on each task.",
    avatar: "/images/5afHk04dydj1urP5S6C4klUfPM.jpg",
  },
];

function TestimonialCard({ name, role, quote, avatar }: Testimonial) {
  return (
    <article className="rounded-[16px] border border-white/[.08] bg-[linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.015))] p-6">
      <div className="flex items-center gap-3">
        <Image src={avatar} alt="" width={48} height={48} className="size-12 rounded-full object-cover" />
        <div>
          <h3 className="text-[14px] font-medium leading-5 text-[#d8d8d8]">{name}</h3>
          {role ? <p className="text-[12px] leading-4 text-[#777]">{role}</p> : null}
        </div>
      </div>
      <p className="mt-5 text-[14px] italic leading-[22.4px] text-[#a7a7a7]">{quote}</p>
    </article>
  );
}

export function TestimonialsSection() {
  const columns = [
    testimonials.slice(0, 3),
    testimonials.slice(3, 6),
    testimonials.slice(6).concat(testimonials.slice(0, 1)),
  ];

  return (
    <section data-fast-reveal className="px-5 py-[120px] max-[809px]:py-[72px]">
      <div className="mx-auto max-w-[1080px]">
        <h2 className="mx-auto max-w-[624px] text-center font-heading text-[28px] font-medium leading-[33.6px]">
          <span className="linkdo-gradient-text">People just like you</span> are already using Linkdo to stay super focused, crush more tasks and save hours of their time
        </h2>
        <div className="relative mt-20 h-[833px] overflow-hidden max-[809px]:mt-14 max-[809px]:h-[680px]">
          <div className="grid grid-cols-3 gap-3 max-[809px]:block">
            {columns.map((column, index) => (
              <div
                key={index}
                className={`${index > 0 ? "max-[809px]:hidden" : ""} space-y-3 ${index === 1 ? "animate-[linkdo-marquee-up_32s_linear_infinite]" : index === 2 ? "animate-[linkdo-marquee-up_38s_linear_infinite_reverse]" : "animate-[linkdo-marquee-up_35s_linear_infinite]"}`}
              >
                {[...column, ...column].map((item, cardIndex) => (
                  <TestimonialCard key={`${item.name}-${cardIndex}`} {...item} />
                ))}
              </div>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#111] to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#111] to-transparent" />
        </div>
      </div>
    </section>
  );
}
