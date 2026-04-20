"use client";

import { motion } from "framer-motion";
import { Rocket } from "lucide-react";

const MONO_STACK =
  'Monaco, "Menlo", "Consolas", "Courier New", monospace';

type Props = {
  onClick: () => void;
};

/**
 * Single pill-shaped button rendered in the center of the viewport while the
 * rocket is idling on the pad. Click → caller flips `launched` → whole
 * rocket-launch choreography fires. Visual styling mirrors SocialLinks:
 * rounded-full, border-white/15 on bg-white/5, backdrop blur, hover glow.
 */
export default function LaunchButton({ onClick }: Props) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.9, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, filter: "blur(6px)" }}
      transition={{ duration: 0.6, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      className="group relative z-10 flex items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-5 py-2 text-white/80 backdrop-blur-sm transition-colors duration-300 hover:border-white/40 hover:text-white hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
      style={{
        fontFamily: MONO_STACK,
        letterSpacing: "0.14em",
      }}
      aria-label="Launch"
    >
      <Rocket
        className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        strokeWidth={1.75}
      />
      <span className="text-xs font-semibold">LAUNCH</span>
    </motion.button>
  );
}
