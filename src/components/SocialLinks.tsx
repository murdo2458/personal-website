"use client";

import { motion, type Variants } from "framer-motion";
import { Github, Linkedin } from "lucide-react";

const GITHUB_URL = "https://github.com/murdo2458";
const LINKEDIN_URL = "https://www.linkedin.com/in/murdo-duncan-3ba958143/";

// Matches NameReveal's BURST_START (3.96s — when the rocket actually
// crosses screen center on the slowed 7.2s trajectory). Icons land just
// after the last name letter settles AND after the rocket has climbed past
// them and exited the top of the viewport, so they clearly look ejected by
// the rocket's wake rather than appearing before it arrives.
const BURST_START = 3.96;
const ICONS_DELAY = BURST_START + 1.44;
const ICON_STEP = 0.096;
const RING_OFFSET = 0.18; // ring pulse fires just after the icon lands

type LinkItem = {
  href: string;
  label: string;
  Icon: typeof Github;
  side: -1 | 1; // -1 = left icon (starts offset right, toward center)
};

const LINKS: LinkItem[] = [
  { href: GITHUB_URL, label: "GitHub", Icon: Github, side: -1 },
  { href: LINKEDIN_URL, label: "LinkedIn", Icon: Linkedin, side: 1 },
];

// Custom carries both which side the icon is on AND its scheduled delay,
// because Framer Motion's variant-level `transition` overrides anything
// set via the `transition` prop — so the delay MUST live inside the
// variant or it will be ignored and icons will pop in immediately.
type EjectCustom = { side: -1 | 1; delay: number };

const iconEject: Variants = {
  hidden: ({ side }: EjectCustom) => ({
    opacity: 0,
    scale: 0.4,
    x: -side * 40,
  }),
  visible: ({ delay }: EjectCustom) => ({
    opacity: 1,
    scale: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 220,
      damping: 17,
      delay,
    },
  }),
};

/**
 * Two icon links that spring outward from the rocket's mid-screen burst,
 * then settle into a row. Each icon has a one-shot ring pulse on reveal
 * and a soft glow on hover.
 */
export default function SocialLinks() {
  return (
    <ul className="relative z-10 mt-10 flex items-center justify-center gap-8">
      {LINKS.map(({ href, label, Icon, side }, i) => {
        const delay = ICONS_DELAY + i * ICON_STEP;
        return (
          <motion.li
            key={label}
            custom={{ side, delay }}
            variants={iconEject}
            initial="hidden"
            animate="visible"
            className="relative"
          >
            {/* One-shot ring pulse on reveal, synced to the icon landing */}
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-full border border-white/40"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.8, opacity: [0, 0.6, 0] }}
              transition={{
                duration: 1.68,
                delay: delay + RING_OFFSET,
                ease: "easeOut",
                times: [0, 0.2, 1],
              }}
            />
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              className="group relative flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 backdrop-blur-sm transition-all duration-300 hover:border-white/40 hover:text-white hover:shadow-[0_0_24px_rgba(255,255,255,0.25)]"
            >
              <Icon
                className="h-5 w-5 transition-transform duration-300 group-hover:scale-110"
                strokeWidth={1.75}
              />
            </a>
          </motion.li>
        );
      })}
    </ul>
  );
}
