"use client";

import { motion, type Variants } from "framer-motion";
import { Github, Linkedin } from "lucide-react";

const GITHUB_URL = "https://github.com/murdo2458";
const LINKEDIN_URL = "https://www.linkedin.com/in/murdo-duncan-3ba958143/";

// Matches NameReveal's BURST_START (2.5s). Icons land just after the last
// name letter settles, so the whole block reads as one synchronized reveal
// ejected from the rocket's mid-screen burst.
const BURST_START = 2.5;
const ICONS_DELAY = BURST_START + 0.9;

type LinkItem = {
  href: string;
  label: string;
  Icon: typeof Github;
  side: -1 | 1; // -1 = left (flies in from center toward left), +1 = right
};

const LINKS: LinkItem[] = [
  { href: GITHUB_URL, label: "GitHub", Icon: Github, side: -1 },
  { href: LINKEDIN_URL, label: "LinkedIn", Icon: Linkedin, side: 1 },
];

// Each icon starts stacked at center (x offset toward the other side),
// then springs out to its resting position — so they look ejected from
// the rocket's burst point in the middle of the screen.
const iconEject: Variants = {
  hidden: (side: -1 | 1) => ({
    opacity: 0,
    scale: 0.4,
    x: -side * 40,
  }),
  visible: {
    opacity: 1,
    scale: 1,
    x: 0,
    transition: { type: "spring", stiffness: 220, damping: 17 },
  },
};

/**
 * Two icon links that spring outward from the rocket's mid-screen burst,
 * then settle into a row. Each icon has a one-shot ring pulse on reveal
 * and a soft glow on hover.
 */
export default function SocialLinks() {
  return (
    <ul className="relative z-10 mt-10 flex items-center justify-center gap-8">
      {LINKS.map(({ href, label, Icon, side }, i) => (
        <motion.li
          key={label}
          custom={side}
          variants={iconEject}
          initial="hidden"
          animate="visible"
          transition={{ delay: ICONS_DELAY + i * 0.08 }}
          className="relative"
        >
          {/* One-shot ring pulse on reveal, synced to the icon landing */}
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full border border-white/40"
            initial={{ scale: 0.8, opacity: 0.6 }}
            animate={{ scale: 1.8, opacity: 0 }}
            transition={{
              duration: 1.4,
              delay: ICONS_DELAY + i * 0.08 + 0.15,
              ease: "easeOut",
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
      ))}
    </ul>
  );
}
