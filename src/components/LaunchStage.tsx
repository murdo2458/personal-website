"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, useReducedMotion } from "framer-motion";
import LaunchButton from "./LaunchButton";
import NameReveal from "./NameReveal";
import RocketLaunch from "./RocketLaunch";
import SocialLinks from "./SocialLinks";

/**
 * Orchestrates the pre-launch → launch → landing flow:
 *
 *   launched = false  →  rocket idling on the pad (subtle smoke wisps),
 *                         centered "LAUNCH" button floating above it.
 *   launched = true   →  full choreography plays: rumble, liftoff, burst
 *                         flash at screen center, name radiates, icons
 *                         spring out behind the rocket's wake.
 *
 * For users with `prefers-reduced-motion`, skip the whole production and
 * reveal the final state (name + icons) immediately — the rocket component
 * returns null in that case, so no motion runs.
 */
export default function LaunchStage() {
  const reduce = useReducedMotion();
  const [launched, setLaunched] = useState(false);

  // Reduced-motion users auto-skip the gate so they still see the content.
  useEffect(() => {
    if (reduce) setLaunched(true);
  }, [reduce]);

  return (
    <>
      <RocketLaunch launched={launched} />
      {/* Name + icons — shown once the rocket has flown up through the center. */}
      <div className="relative z-10 flex min-h-[180px] flex-col items-center justify-center px-6">
        {launched && (
          <>
            <NameReveal />
            <SocialLinks />
          </>
        )}
      </div>
      {/* Launch control — pinned to the bottom of the viewport, directly
          under the rocket on the pad. Disappears (with exit animation) the
          moment the user clicks it. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-20 flex justify-center">
        <div className="pointer-events-auto">
          <AnimatePresence>
            {!launched && (
              <LaunchButton
                key="launch-button"
                onClick={() => setLaunched(true)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
