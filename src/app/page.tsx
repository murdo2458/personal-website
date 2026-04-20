import NameReveal from "@/components/NameReveal";
import RocketLaunch from "@/components/RocketLaunch";
import SocialLinks from "@/components/SocialLinks";
import Starfield from "@/components/Starfield";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black">
      <Starfield />
      <RocketLaunch />
      {/* Radial vignette for depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0) 30%, rgba(0,0,0,0.75) 100%)",
        }}
      />
      <div className="relative z-10 flex flex-col items-center px-6">
        <NameReveal />
        <SocialLinks />
      </div>
    </main>
  );
}
