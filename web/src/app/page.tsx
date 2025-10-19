import { CelestialBackground } from "@/components/celestial/celestial-background";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Rocket, Telescope } from "lucide-react";

export default function Home() {
  return (
    <main className="relative mx-auto max-w-5xl px-6 py-16">
      <CelestialBackground />
      <section className="relative z-10 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-balance bg-gradient-to-br from-indigo-200 via-white to-fuchsia-200 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent md:text-6xl">
            CarNance — See your financial future before you drive into it
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-white/75">
            An elegant, cosmic UI to explore car financing scenarios with clarity. Built with Next.js, Tailwind, and shadcn/ui.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-500">
              <Link href="/form">
                <Rocket className="mr-2 size-4" /> Begin your journey
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
