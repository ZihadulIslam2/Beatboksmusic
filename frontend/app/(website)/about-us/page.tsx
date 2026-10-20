"use client";

import { Copyright, Globe2 } from "lucide-react";

const details = [
  {
    icon: Copyright,
    text: "The music is licensed from a music publisher who owns 100% of all Copyrights, (Master Rights, Publishing rights & Neighbouring rights) everything is cleared and ready to use",
  },
  {
    icon: Globe2,
    text: "The music is purchased directly from Composers, Recordings Studios, Music Publishers & Record Companies around the world, which may include AI created songs.",
  },
];

const royaltyItems = [
  "Mechanical Royalties: Generated from digital streams and physical sales.",
  "Performance Royalties: Generated when the song is played on the radio, in live venues, or broadcasted.",
  "Synchronization (Sync) Fees: Generated when the song is placed in TV, film, games, or advertisements.",
];

export default function AboutUsPage() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-black">
      {/* Ambient equalizer backdrop */}
      <div className="pointer-events-none absolute inset-0 flex items-end justify-center gap-2 opacity-[0.08]">
        {Array.from({ length: 40 }).map((_, i) => (
          <span
            key={i}
            className="w-2 rounded-t-sm bg-[#00EF01]"
            style={{
              height: `${20 + ((i * 37) % 80)}%`,
              animation: `eqPulse 2.4s ease-in-out infinite`,
              animationDelay: `${(i % 8) * 0.15}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex min-h-full flex-col justify-center gap-10 px-5 py-12 sm:px-8 lg:px-14">
        <div className="mx-auto w-full max-w-7xl">
          {/* Eyebrow */}
          <div className="mb-6 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00EF01] shadow-[0_0_10px_2px_#00EF01]" />

            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#00EF01]">
              BeatBoks Music Group
            </span>
          </div>

          {/* Hero stat block */}
          <div className="mb-6 flex flex-col gap-6 rounded-2xl border border-[#00EF01]/25 bg-black/50 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.4)] backdrop-blur sm:p-10 lg:flex-row lg:items-center">
            <div className="shrink-0">
              <p className="bg-gradient-to-b from-white to-[#00EF01] bg-clip-text text-6xl font-extrabold leading-none text-transparent sm:text-7xl lg:text-8xl">
                5,000+
              </p>

              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#7A7A7A]">
                Tracks in our catalog
              </p>
            </div>

            <div className="hidden h-20 w-px bg-white/10 lg:block" />

            <p className="text-lg leading-[135%] text-[#D6D6D6] sm:text-2xl lg:text-2xl">
              Access to a unique, extensive catalog to find high-quality music
              for every setting — your movie, advertising, TV series or other
              multimedia projects.
            </p>
          </div>

          {/* Supporting details */}
          <div className="grid gap-4 sm:grid-cols-2">
            {details.map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="group rounded-xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-[#00EF01]/40 hover:bg-white/[0.07] sm:p-6"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#00EF01]/10 text-[#00EF01] transition-colors group-hover:bg-[#00EF01]/20">
                  <Icon className="h-5 w-5" />
                </div>

                <p className="text-sm leading-6 text-[#B8B8B8] sm:text-base">
                  {text}
                </p>
              </div>
            ))}
          </div>

          {/* We take care of */}
          <div className="mt-4 rounded-xl border border-[#00EF01]/25 bg-black/45 p-5 backdrop-blur sm:p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">
              We take care of:
            </h2>

            <div className="space-y-4 text-sm leading-6 text-[#B8B8B8] sm:text-base">
              {/* Administration & Registration */}
              <p>
                <span className="font-semibold text-white">
                  Administration &amp; Registration:
                </span>{" "}
                Publishers register compositions with global rights
                organizations, issue licenses to streaming services, and track
                usage.
              </p>

              {/* Royalties & Collection */}
              <div>
                <p>
                  <span className="font-semibold text-white">
                    Royalties &amp; Collection:
                  </span>{" "}
                  They collect three main types of royalties:
                </p>

                <ul className="mt-2 space-y-2 pl-5">
                  {royaltyItems.map((item) => (
                    <li key={item} className="list-disc">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Creative Promotion */}
              <p>
                <span className="font-semibold text-white">
                  Creative Promotion:
                </span>{" "}
                Publishers actively pitch catalog songs to major artists for
                recording, secure lucrative sync deals, and facilitate
                co-writing sessions to create new material.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes eqPulse {
          0%,
          100% {
            transform: scaleY(0.6);
          }

          50% {
            transform: scaleY(1);
          }
        }
      `}</style>
    </section>
  );
}