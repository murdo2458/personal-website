import LaunchStage from "@/components/LaunchStage";
import Starfield from "@/components/Starfield";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black">
      <Starfield />
      {/* Radial vignette for depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0) 30%, rgba(0,0,0,0.75) 100%)",
        }}
      />
      <LaunchStage />
    </main>
  );
}
