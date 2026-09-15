"use client";

import { useEffect } from "react";

const revealSelector = "main > section, footer";

export function PageMotion() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const navigation = document.querySelector<HTMLElement>("[data-site-nav]");
    const updateNavigation = () => navigation?.toggleAttribute("data-scrolled", window.scrollY > 20);

    if (reduceMotion.matches) {
      updateNavigation();
      return;
    }

    const targets = Array.from(document.querySelectorAll<HTMLElement>(revealSelector)).filter(
      (target) => !(target.matches("[data-roadmap-story]") || target.querySelector("[data-step-story]")),
    );
    targets.forEach((target, index) => {
      target.dataset.motion = index === 0 ? "visible" : "pending";
      target.style.setProperty("--reveal-delay", `${Math.min(index % 3, 2) * 70}ms`);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const target = entry.target as HTMLElement;
          target.dataset.motion = "visible";
          observer.unobserve(target);
        });
      },
      { rootMargin: "0px 0px -9%", threshold: 0.1 },
    );

    targets.slice(1).forEach((target) => observer.observe(target));
    updateNavigation();
    window.addEventListener("scroll", updateNavigation, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateNavigation);
      targets.forEach((target) => {
        delete target.dataset.motion;
        target.style.removeProperty("--reveal-delay");
      });
    };
  }, []);

  return null;
}
