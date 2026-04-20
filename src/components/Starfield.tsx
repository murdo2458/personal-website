"use client";

import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  r: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  driftY: number;
};

type ShootingStar = {
  x: number;
  y: number;
  vx: number; // px per second
  vy: number;
  life: number; // elapsed seconds
  maxLife: number; // seconds until fade out
  length: number; // trail length in px
};

const STAR_COUNT = 160;
const MIN_SHOOT_INTERVAL = 1.8; // seconds
const MAX_SHOOT_INTERVAL = 4.5;

/**
 * Full-viewport canvas starfield with twinkle + gentle downward drift, plus
 * periodic shooting stars streaking diagonally across the sky.
 * Respects prefers-reduced-motion (renders static stars, no animation loop).
 */
export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let stars: Star[] = [];
    const shootingStars: ShootingStar[] = [];
    let rafId = 0;
    const startTime = performance.now();
    let lastFrameTime = startTime;
    let nextShootAt = 0.6; // first one soon after load

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    const seedStars = () => {
      stars = Array.from({ length: STAR_COUNT }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.2 + 0.2,
        baseAlpha: Math.random() * 0.6 + 0.3,
        twinkleSpeed: Math.random() * 1.8 + 0.4,
        twinklePhase: Math.random() * Math.PI * 2,
        driftY: Math.random() * 0.03 + 0.005,
      }));
    };

    const spawnShootingStar = () => {
      // Always travel bottom-left → top-right: vx positive, vy negative.
      const angleDeg = 20 + Math.random() * 30; // 20–50deg above horizontal
      const angleRad = (angleDeg * Math.PI) / 180;
      const speed = 600 + Math.random() * 500; // px/sec
      const vx = speed * Math.cos(angleRad);
      const vy = -speed * Math.sin(angleRad);

      // Start anywhere across the left two-thirds of the sky so trails
      // still have room to travel rightward off-screen.
      const startX = -80 + Math.random() * (width * 0.65 + 80);
      const startY = -40 + Math.random() * (height + 80);

      shootingStars.push({
        x: startX,
        y: startY,
        vx,
        vy,
        life: 0,
        maxLife: 0.8 + Math.random() * 0.6, // 0.8–1.4s
        length: 140 + Math.random() * 120, // px
      });
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedStars();
    };

    const drawFrame = (time: number) => {
      const elapsed = (time - startTime) / 1000;
      const dt = Math.min((time - lastFrameTime) / 1000, 0.05); // cap dt for stability
      lastFrameTime = time;

      ctx.clearRect(0, 0, width, height);

      // Background stars
      for (const s of stars) {
        s.y += s.driftY;
        if (s.y > height + 2) s.y = -2;

        const twinkle =
          0.5 + 0.5 * Math.sin(elapsed * s.twinkleSpeed + s.twinklePhase);
        const alpha = s.baseAlpha * (0.4 + 0.6 * twinkle);

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
      }

      // Spawn a new shooting star on the schedule.
      if (elapsed >= nextShootAt) {
        spawnShootingStar();
        nextShootAt =
          elapsed +
          MIN_SHOOT_INTERVAL +
          Math.random() * (MAX_SHOOT_INTERVAL - MIN_SHOOT_INTERVAL);
      }

      // Shooting stars: update + draw, remove when life elapses or off-screen.
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        s.life += dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;

        // Traveling up and right, so they exit past the right edge or the top.
        const offscreen = s.x > width + 200 || s.y < -200;
        if (s.life >= s.maxLife || offscreen) {
          shootingStars.splice(i, 1);
          continue;
        }

        // Fade in at the start, fade out at the end.
        const lifeT = s.life / s.maxLife;
        const fade =
          lifeT < 0.15
            ? lifeT / 0.15
            : lifeT > 0.7
              ? 1 - (lifeT - 0.7) / 0.3
              : 1;

        // Trail points backward along -velocity direction, normalized.
        const vMag = Math.hypot(s.vx, s.vy);
        const tx = s.x - (s.vx / vMag) * s.length;
        const ty = s.y - (s.vy / vMag) * s.length;

        const grad = ctx.createLinearGradient(s.x, s.y, tx, ty);
        grad.addColorStop(0, `rgba(255,255,255,${0.95 * fade})`);
        grad.addColorStop(0.2, `rgba(200,220,255,${0.6 * fade})`);
        grad.addColorStop(1, "rgba(255,255,255,0)");

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();

        // Bright point at the head.
        ctx.beginPath();
        ctx.arc(s.x, s.y, 1.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${fade})`;
        ctx.fill();
      }

      rafId = requestAnimationFrame(drawFrame);
    };

    const drawStatic = () => {
      ctx.clearRect(0, 0, width, height);
      for (const s of stars) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.baseAlpha})`;
        ctx.fill();
      }
    };

    resize();
    if (prefersReducedMotion.matches) {
      drawStatic();
    } else {
      rafId = requestAnimationFrame(drawFrame);
    }

    const handleResize = () => {
      resize();
      if (prefersReducedMotion.matches) drawStatic();
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 h-full w-full"
    />
  );
}
