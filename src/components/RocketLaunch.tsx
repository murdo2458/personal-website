"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * A multi-stage rocket launch sequence:
 *   0.0–0.6s  rocket rumbles on the pad, exhaust starts flickering
 *   0.6s      shockwave + smoke bloom
 *   0.8s      liftoff — rocket climbs, flame flares, glow trail stretches
 *   0.8–4s    ascent across the viewport
 *   4–6s      shrinks into the distance (perspective)
 *   ~9s       a tiny satellite light drifts across the top of the screen
 *
 * Hidden entirely when the user prefers reduced motion.
 */

type Spark = {
  id: number;
  dx: number;
  delay: number;
  lifetime: number;
  endY: number;
  size: number;
  hue: number;
};

// Seed sparks only on the client (after mount) so values are stable for this
// render and do not trigger an SSR/CSR hydration mismatch.
function buildSparks(): Spark[] {
  return Array.from({ length: 28 }, (_, i) => ({
    id: i,
    dx: (Math.random() - 0.5) * 40,
    delay: 0.8 + i * 0.06,
    lifetime: 1.2 + Math.random() * 0.9,
    endY: 120 + Math.random() * 220,
    size: 1.5 + Math.random() * 3,
    hue: 18 + Math.random() * 30, // orange → yellow
  }));
}

export default function RocketLaunch() {
  const reduce = useReducedMotion();
  const [sparks, setSparks] = useState<Spark[] | null>(null);

  useEffect(() => {
    setSparks(buildSparks());
  }, []);

  if (reduce) return null;
  // Wait for client-side mount before rendering — avoids hydration mismatch
  // from random values and lets the whole launch play once cleanly.
  if (!sparks) return null;

  return (
    <>
      {/* === Shockwave ring (two concentric) === */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-1/2 bottom-[7vh] rounded-full border-2 border-white/80"
        style={{ width: 36, height: 36, translate: "-50% 50%" }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 6, 14], opacity: [0, 0.9, 0] }}
        transition={{
          duration: 2,
          delay: 0.75,
          times: [0, 0.25, 1],
          ease: "easeOut",
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-1/2 bottom-[7vh] rounded-full border border-sky-200/50"
        style={{ width: 28, height: 28, translate: "-50% 50%" }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 8, 18], opacity: [0, 0.7, 0] }}
        transition={{
          duration: 2.5,
          delay: 0.95,
          times: [0, 0.25, 1],
          ease: "easeOut",
        }}
      />

      {/* === Smoke bloom — multiple overlapping blurred blobs === */}
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={`smoke-${i}`}
          aria-hidden
          className="pointer-events-none fixed bottom-[3vh] rounded-full bg-white/50"
          style={{
            left: `calc(50% + ${(i - 2) * 22}px)`,
            width: 90 + i * 8,
            height: 70 + i * 6,
            filter: "blur(22px)",
            translate: "-50% 0",
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 1.3, 2.3, 2.8],
            opacity: [0, 0.55, 0.25, 0],
          }}
          transition={{
            duration: 3.8,
            delay: 0.7 + i * 0.08,
            ease: "easeOut",
          }}
        />
      ))}

      {/* === Exhaust sparks — staggered particles falling behind launch pad === */}
      {sparks.map((s) => (
        <motion.div
          key={`spark-${s.id}`}
          aria-hidden
          className="pointer-events-none fixed left-1/2 bottom-[5vh] rounded-full"
          style={{
            width: s.size,
            height: s.size,
            background: `hsl(${s.hue}, 100%, 65%)`,
            boxShadow: `0 0 ${s.size * 3}px hsl(${s.hue}, 100%, 60%)`,
            translate: "-50% 50%",
          }}
          initial={{ x: 0, y: 0, opacity: 0 }}
          animate={{
            x: s.dx,
            y: s.endY,
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: s.lifetime,
            delay: s.delay,
            times: [0, 0.1, 0.6, 1],
            ease: "easeOut",
          }}
        />
      ))}

      {/* === Rocket container — rumble on pad, then liftoff and shrink === */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-1/2 bottom-[6vh]"
        style={{ translate: "-50% 0" }}
        initial={{ y: 0 }}
        animate={{
          // Keyframes: rumble, rumble, rumble, hold, launch, climb, exit
          y: [0, 2, -2, 1.5, -1, 0, -30, -360, -1100],
          x: [0, 1, -1, 0.5, -0.5, 0, 0, 0, 0],
        }}
        transition={{
          duration: 6,
          times: [0, 0.04, 0.08, 0.11, 0.14, 0.16, 0.18, 0.55, 1],
          ease: [0.45, 0, 0.2, 1],
        }}
      >
        <motion.div
          animate={{ scale: [1, 1, 1, 1, 0.15] }}
          transition={{
            duration: 6,
            times: [0, 0.2, 0.35, 0.6, 1],
            ease: "easeIn",
          }}
          style={{ transformOrigin: "bottom center" }}
        >
          {/* Heat/glow aura behind the rocket */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: 100,
              height: 100,
              background:
                "radial-gradient(circle, rgba(255,220,170,0.55) 0%, rgba(255,140,60,0.2) 35%, transparent 70%)",
              filter: "blur(10px)",
            }}
          />

          {/* Exhaust flame — flickers on loop during ascent */}
          <motion.div
            className="absolute left-1/2 -bottom-2 -translate-x-1/2"
            style={{
              width: 18,
              transformOrigin: "top center",
              background:
                "linear-gradient(to bottom, #ffffff 0%, #ffe29a 18%, #ff9a3d 55%, rgba(255,70,0,0.2) 90%, rgba(255,0,0,0) 100%)",
              borderBottomLeftRadius: 999,
              borderBottomRightRadius: 999,
              filter: "blur(1.5px)",
            }}
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: [0, 14, 28, 52, 46, 58, 48, 62, 54],
              opacity: [0, 0.9, 1, 1, 1, 1, 1, 1, 1],
              scaleX: [1, 1, 1.1, 0.9, 1.2, 0.95, 1.15, 1, 1.05],
            }}
            transition={{
              duration: 0.45,
              delay: 0.45,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "easeInOut",
            }}
          />

          {/* Rocket SVG */}
          <svg
            width="44"
            height="72"
            viewBox="0 0 44 72"
            className="relative drop-shadow-[0_0_14px_rgba(255,220,180,0.55)]"
          >
            <defs>
              <linearGradient id="rocketBody" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#bdbdbd" />
                <stop offset="45%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#9a9a9a" />
              </linearGradient>
              <linearGradient id="rocketFin" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#ea4335" />
                <stop offset="100%" stopColor="#a8271a" />
              </linearGradient>
            </defs>
            {/* Body */}
            <path
              d="M22 2 Q30 12 30 28 L30 56 L14 56 L14 28 Q14 12 22 2 Z"
              fill="url(#rocketBody)"
              stroke="#7a7a7a"
              strokeWidth="0.5"
            />
            {/* Accent stripe */}
            <rect x="14" y="40" width="16" height="2" fill="#ea4335" opacity="0.85" />
            {/* Window */}
            <circle cx="22" cy="24" r="4.5" fill="#4aa3ff" stroke="#1f3a5a" strokeWidth="0.8" />
            <circle cx="20.3" cy="22.3" r="1.3" fill="#dcefff" />
            {/* Left fin */}
            <path d="M14 44 L4 64 L14 58 Z" fill="url(#rocketFin)" />
            {/* Right fin */}
            <path d="M30 44 L40 64 L30 58 Z" fill="url(#rocketFin)" />
            {/* Nozzle */}
            <rect x="16" y="56" width="12" height="6" rx="1" fill="#3a3a3a" />
            <rect x="17" y="60" width="10" height="2" fill="#1a1a1a" />
          </svg>

          {/* Long glowing streak trail — stretches during climb, fades as it shrinks */}
          <motion.div
            className="absolute left-1/2 top-full -translate-x-1/2"
            style={{
              width: 3,
              transformOrigin: "top center",
              background:
                "linear-gradient(to bottom, rgba(255,255,255,0.95) 0%, rgba(190,215,255,0.5) 35%, rgba(0,0,0,0) 100%)",
              filter: "blur(3px)",
            }}
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: [0, 140, 500, 320, 80],
              opacity: [0, 0.95, 1, 0.7, 0],
            }}
            transition={{
              duration: 5.5,
              delay: 0.9,
              times: [0, 0.18, 0.5, 0.8, 1],
              ease: "easeOut",
            }}
          />
        </motion.div>
      </motion.div>

      {/* === Burst flash — fires as the rocket passes through the middle
           of the screen, exactly when the name/icons emerge. === */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-1/2 top-1/2 rounded-full"
        style={{
          width: 180,
          height: 180,
          translate: "-50% -50%",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(200,220,255,0.5) 30%, transparent 70%)",
          filter: "blur(10px)",
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.3, 2.8], opacity: [0, 0.9, 0] }}
        transition={{
          duration: 1.6,
          delay: 2.3,
          times: [0, 0.2, 1],
          ease: "easeOut",
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-1/2 top-1/2 rounded-full border-2 border-white/70"
        style={{ width: 40, height: 40, translate: "-50% -50%" }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 4, 9], opacity: [0, 0.9, 0] }}
        transition={{
          duration: 1.4,
          delay: 2.5,
          times: [0, 0.25, 1],
          ease: "easeOut",
        }}
      />

      {/* === Orbital satellite pass — tiny light drifts across the sky === */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed top-[14vh] left-0 h-[3px] w-[3px] rounded-full bg-white"
        style={{
          boxShadow:
            "0 0 6px rgba(255,255,255,0.95), 0 0 14px rgba(180,210,255,0.6)",
        }}
        initial={{ x: "-5vw", opacity: 0 }}
        animate={{ x: "110vw", opacity: [0, 1, 1, 1, 0] }}
        transition={{
          duration: 22,
          delay: 9,
          ease: "linear",
          times: [0, 0.04, 0.5, 0.96, 1],
          repeat: Infinity,
          repeatDelay: 8,
        }}
      />
    </>
  );
}
