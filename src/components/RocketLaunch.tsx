"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Rocket component with two visual states:
 *
 *   launched = false  →  rocket sits on the pad, subtle smoke wisps rise
 *                         from the nozzle on a loop. Nothing else animates.
 *   launched = true   →  the full sequence fires (all delays measured from
 *                         the moment `launched` flips):
 *     0.0–0.6s   rocket rumbles on the pad, exhaust starts flickering
 *     0.6s       shockwave + smoke bloom
 *     0.8s       liftoff — rocket climbs, flame flares, glow trail stretches
 *     ~3.3s      rocket crosses screen center; burst flash fires
 *     3.3–4.5s   shrinks into the distance (perspective)
 *     ~9s        a tiny satellite light drifts across the top of the screen
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

type Wisp = {
  id: number;
  dx: number;
  delay: number;
  duration: number;
  size: number;
  rise: number;
};

// Seed random particles only on the client (after mount) so values are
// stable for this render and do not trigger an SSR/CSR hydration mismatch.
function buildSparks(): Spark[] {
  return Array.from({ length: 28 }, (_, i) => ({
    id: i,
    dx: (Math.random() - 0.5) * 40,
    delay: 0.96 + i * 0.072,
    lifetime: 1.44 + Math.random() * 1.08,
    endY: 120 + Math.random() * 220,
    size: 1.5 + Math.random() * 3,
    hue: 18 + Math.random() * 30, // orange → yellow
  }));
}

function buildWisps(): Wisp[] {
  // 8 overlapping wisps, each spaced ~0.45s apart. Since each lasts ~3.5s,
  // 6–7 are on screen at any given moment → continuous, obvious smoke
  // rather than sparse individual puffs. dx is always positive so every
  // wisp drifts to the right, giving a "light wind blowing" feel.
  return Array.from({ length: 8 }, (_, i) => ({
    id: i,
    dx: 16 + Math.random() * 30, // 16–46px rightward drift
    delay: i * 0.45 + Math.random() * 0.2,
    duration: 3.2 + Math.random() * 0.7,
    size: 12 + Math.random() * 10, // 12–22px base
    rise: 46 + Math.random() * 22,
  }));
}

type Props = {
  launched: boolean;
};

export default function RocketLaunch({ launched }: Props) {
  const reduce = useReducedMotion();
  const [sparks, setSparks] = useState<Spark[] | null>(null);
  const [wisps, setWisps] = useState<Wisp[] | null>(null);

  useEffect(() => {
    setSparks(buildSparks());
    setWisps(buildWisps());
  }, []);

  if (reduce) return null;
  // Wait for client-side mount before rendering — avoids hydration mismatch
  // from random values and lets the whole launch play once cleanly.
  if (!sparks || !wisps) return null;

  return (
    <>
      {/* ================================================================
          Launch-only staging effects — only mount after click so their
          delays measure from the launch moment, not from page load.
          ================================================================ */}
      {launched && (
        <>
          {/* === Shockwave ring (two concentric) === */}
          <motion.div
            aria-hidden
            className="pointer-events-none fixed left-1/2 bottom-16 rounded-full border-2 border-white/80"
            style={{ width: 36, height: 36, translate: "-50% 50%" }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 6, 14], opacity: [0, 0.9, 0] }}
            transition={{
              duration: 2.4,
              delay: 0.9,
              times: [0, 0.25, 1],
              ease: "easeOut",
            }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none fixed left-1/2 bottom-16 rounded-full border border-sky-200/50"
            style={{ width: 28, height: 28, translate: "-50% 50%" }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 8, 18], opacity: [0, 0.7, 0] }}
            transition={{
              duration: 3,
              delay: 1.14,
              times: [0, 0.25, 1],
              ease: "easeOut",
            }}
          />

          {/* === Smoke bloom — multiple overlapping blurred blobs === */}
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={`smoke-${i}`}
              aria-hidden
              className="pointer-events-none fixed bottom-4 rounded-full bg-white/50"
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
                duration: 4.56,
                delay: 0.84 + i * 0.096,
                ease: "easeOut",
              }}
            />
          ))}

          {/* === Exhaust sparks === */}
          {sparks.map((s) => (
            <motion.div
              key={`spark-${s.id}`}
              aria-hidden
              className="pointer-events-none fixed left-1/2 bottom-10 rounded-full"
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
        </>
      )}

      {/* ================================================================
          Launchpad crane arm — a miniature umbilical tower on the left of
          the rocket. It's rendered as a vertical mast whose right edge
          sits flush with the rocket's left side, plus a short horizontal
          swing arm + clamp that "holds" the rocket, and a small curved
          hose slung under the arm for a bit of mechanical detail.

          On launch, the whole assembly rotates up-and-away around its
          base (bottom-left of the mast), fading out — mimicking a real
          swing-arm retraction. Timed to complete *before* the rocket's
          main ascent so the rocket visually breaks free of the clamp.
          ================================================================ */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed z-10"
        style={{
          // Crane SVG is 42px wide; its right edge lands at calc(50% - 4px),
          // which overlaps the rocket body's left edge (at calc(50% - 8px))
          // by ~4px so the clamp visibly grips the body rather than
          // hanging in free space next to it.
          left: "calc(50% - 46px)",
          bottom: "58px",
          transformOrigin: "bottom left",
        }}
        initial={{ opacity: 0, rotate: 0 }}
        animate={
          launched
            ? { opacity: 0, rotate: -22 }
            : { opacity: 1, rotate: 0 }
        }
        transition={
          launched
            ? { duration: 0.55, delay: 0.3, ease: "easeIn" }
            : { duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }
        }
      >
        <svg width="42" height="60" viewBox="0 0 42 60">
          {/* Vertical mast — thicker column, full height */}
          <rect x="0" y="0" width="4" height="60" fill="#5a5a5a" />
          {/* Mast highlight stripe */}
          <rect
            x="0.6"
            y="0"
            width="1.1"
            height="60"
            fill="#8a8a8a"
            opacity="0.4"
          />
          {/* Mast rivets — tiny dots for texture */}
          <circle cx="2" cy="12" r="0.5" fill="#2a2a2a" />
          <circle cx="2" cy="26" r="0.5" fill="#2a2a2a" />
          <circle cx="2" cy="40" r="0.5" fill="#2a2a2a" />
          <circle cx="2" cy="54" r="0.5" fill="#2a2a2a" />
          {/* Top cap */}
          <rect x="-0.5" y="0" width="5" height="2.5" fill="#6a6a6a" />
          {/* Horizontal swing arm — extends from mast to (past) rocket body */}
          <rect x="4" y="7" width="34" height="3" fill="#5a5a5a" />
          {/* Arm top highlight */}
          <rect
            x="4"
            y="7"
            width="34"
            height="0.8"
            fill="#8a8a8a"
            opacity="0.55"
          />
          {/* Arm underside shadow */}
          <rect
            x="4"
            y="9.3"
            width="34"
            height="0.7"
            fill="#3a3a3a"
            opacity="0.6"
          />
          {/* Diagonal brace triangle under the arm */}
          <path d="M 4 16 L 4 10 L 12 10 Z" fill="#4a4a4a" />
          <path
            d="M 4 16 L 4 10 L 12 10"
            stroke="#6a6a6a"
            strokeWidth="0.4"
            fill="none"
            opacity="0.5"
          />
          {/* Clamp — grips the rocket body. Extends past SVG-right so it
              visually wraps around the rocket's left edge. */}
          <rect
            x="34"
            y="4"
            width="8"
            height="12"
            fill="#7a7a7a"
            rx="1"
          />
          <rect
            x="34"
            y="4"
            width="8"
            height="1.5"
            fill="#a0a0a0"
            opacity="0.6"
          />
          {/* Clamp bolts */}
          <circle cx="36" cy="7" r="0.6" fill="#2a2a2a" />
          <circle cx="36" cy="13" r="0.6" fill="#2a2a2a" />
          {/* Drooping umbilical hose */}
          <path
            d="M 6 14 Q 20 19, 34 14"
            stroke="#2a2a2a"
            strokeWidth="1.1"
            fill="none"
          />
          <path
            d="M 6 14 Q 20 19, 34 14"
            stroke="#5a5a5a"
            strokeWidth="0.4"
            fill="none"
            opacity="0.6"
          />
        </svg>
      </motion.div>

      {/* ================================================================
          Rocket container — always mounted. Position + scale animate only
          when launched flips to true, otherwise it sits motionless on the
          pad so the idle smoke has something to rise from.
          ================================================================ */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-1/2 bottom-14"
        style={{ translate: "-50% 0" }}
        initial={{ y: 0, x: 0 }}
        animate={
          launched
            ? {
                y: [0, 2, -2, 1.5, -1, 0, -30, -360, -1100],
                x: [0, 1, -1, 0.5, -0.5, 0, 0, 0, 0],
              }
            : { y: 0, x: 0 }
        }
        transition={
          launched
            ? {
                duration: 7.2,
                times: [0, 0.04, 0.08, 0.11, 0.14, 0.16, 0.18, 0.55, 1],
                ease: [0.45, 0, 0.2, 1],
              }
            : { duration: 0 }
        }
      >
        <motion.div
          animate={launched ? { scale: [1, 1, 1, 1, 0.15] } : { scale: 1 }}
          transition={
            launched
              ? {
                  duration: 7.2,
                  times: [0, 0.2, 0.35, 0.6, 1],
                  ease: "easeIn",
                }
              : { duration: 0 }
          }
          style={{ transformOrigin: "bottom center" }}
        >
          {/* === Idle smoke wisps — only while sitting on the pad ===
              Rise from the nozzle, always drift rightward (light wind),
              and dissipate on loop. 8 overlapping wisps so there's always
              visible smoke rather than sparse individual puffs. */}
          {!launched &&
            wisps.map((w) => (
              <motion.div
                key={`wisp-${w.id}`}
                aria-hidden
                className="pointer-events-none absolute left-1/2 -bottom-2 rounded-full bg-white/75"
                style={{
                  width: w.size,
                  height: w.size * 0.85,
                  filter: "blur(7px)",
                  translate: "-50% 0",
                }}
                initial={{ y: 0, x: 0, opacity: 0, scale: 0.4 }}
                animate={{
                  y: [0, -w.rise * 0.5, -w.rise],
                  // Rightward drift: starts anchored, accelerates right as
                  // the puff rises, so the plume visibly leans to the right.
                  x: [0, w.dx * 0.55, w.dx],
                  opacity: [0, 0.7, 0],
                  scale: [0.4, 1.4, 2.3],
                }}
                transition={{
                  duration: w.duration,
                  delay: w.delay,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
            ))}

          {/* === Heat/glow aura — only during launch === */}
          {launched && (
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
          )}

          {/* === Exhaust flame — flickers on loop during ascent === */}
          {launched && (
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
                duration: 0.54,
                delay: 0.54,
                repeat: Infinity,
                repeatType: "mirror",
                ease: "easeInOut",
              }}
            />
          )}

          {/* === Rocket SVG — always visible === */}
          <svg
            width="44"
            height="72"
            viewBox="0 0 44 72"
            className={
              launched
                ? "relative drop-shadow-[0_0_14px_rgba(255,220,180,0.55)]"
                : "relative drop-shadow-[0_0_10px_rgba(180,200,230,0.25)]"
            }
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

          {/* === Long glowing streak trail — only during launch === */}
          {launched && (
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
                duration: 6.6,
                delay: 1.08,
                times: [0, 0.18, 0.5, 0.8, 1],
                ease: "easeOut",
              }}
            />
          )}
        </motion.div>
      </motion.div>

      {/* ================================================================
          Post-liftoff effects — burst flash at center + orbital satellite.
          ================================================================ */}
      {launched && (
        <>
          {/* === Burst flash — fires at t≈3.96s when the rocket crosses
               screen center (y=-360 keyframe at 0.55 of its 7.2s flight).
               Name/icons radiate out from this moment. === */}
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
              duration: 1.92,
              delay: 3.66,
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
              duration: 1.68,
              delay: 3.9,
              times: [0, 0.25, 1],
              ease: "easeOut",
            }}
          />

          {/* === Orbital satellite pass === */}
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
              delay: 10.8,
              ease: "linear",
              times: [0, 0.04, 0.5, 0.96, 1],
              repeat: Infinity,
              repeatDelay: 8,
            }}
          />
        </>
      )}
    </>
  );
}
