"use client";

import { motion, type Variants } from "framer-motion";

const NAME = "MURDO DUNCAN";
const STRAPLINE = "startups -> scaleups -> enterprise";
const MONO_STACK =
  'Monaco, "Menlo", "Consolas", "Courier New", monospace';

// The rocket passes through the middle of the viewport at ~t=2.5s,
// where the burst flash fires. Every reveal here is pinned to that moment
// so the name + strapline appear to radiate out of the rocket's burst.
const BURST_START = 2.5;

// Each letter's delay = BURST_START + (distance from center) * STEP,
// so center letters appear first and outer letters ripple outward.
const LETTER_STEP = 0.055;
const CENTER_INDEX = (NAME.length - 1) / 2;

const letterReveal: Variants = {
  hidden: { opacity: 0, scale: 0.2, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay: BURST_START + Math.abs(i - CENTER_INDEX) * LETTER_STEP,
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

/**
 * Renders the name in Monaco (uppercase) with a per-letter center-out reveal,
 * synced to the rocket's middle-of-screen burst so the whole block looks like
 * it was scattered outward from the rocket's trail. The strapline fades in
 * just after the last letter lands.
 */
export default function NameReveal() {
  return (
    <div className="relative z-10 flex flex-col items-center text-center">
      <motion.h1
        initial="hidden"
        animate="visible"
        className="font-semibold text-white"
        style={{
          fontFamily: MONO_STACK,
          fontSize: "clamp(1.75rem, 6vw, 4.25rem)",
          letterSpacing: "0.02em",
        }}
        aria-label={NAME}
      >
        {NAME.split("").map((char, i) => (
          <motion.span
            key={`${char}-${i}`}
            custom={i}
            variants={letterReveal}
            className="inline-block"
            aria-hidden
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: BURST_START + 0.75,
          duration: 0.8,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="mt-4 text-white/60"
        style={{
          fontFamily: MONO_STACK,
          fontSize: "clamp(0.75rem, 1.4vw, 1rem)",
          letterSpacing: "0.08em",
        }}
      >
        {STRAPLINE}
      </motion.p>
    </div>
  );
}
