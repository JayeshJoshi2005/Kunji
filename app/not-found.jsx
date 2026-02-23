import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 mt-12 overflow-hidden">
      {/* Big background 404 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="flex gap-24 text-slate-200 font-extrabold text-[18rem] leading-none opacity-40">
          <span>4</span>
          <span>0</span>
          <span>4</span>
        </div>
      </div>

      {/* TV Wrapper */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Antenna */}
        <div className="relative mb-[-48px]">
          <div className="h-16 w-16 rounded-full bg-orange-500 border-2 border-black" />
          <div className="absolute -top-16 left-1/2 h-24 w-[3px] -translate-x-1/2 rotate-[-20deg] bg-black" />
          <div className="absolute -top-20 left-1/2 h-24 w-[3px] -translate-x-1/2 rotate-[20deg] bg-black" />
        </div>

        {/* TV Body */}
        <div className="relative rounded-2xl border-2 border-black bg-orange-600 p-4 shadow-xl">
          {/* Screen */}
          <div className="relative flex h-48 w-80 items-center justify-center rounded-xl border-2 border-black bg-gradient-to-r from-blue-600 via-pink-500 to-emerald-400 overflow-hidden">
            <div className="absolute inset-0 bg-black/10" />
            <span className="relative z-10 rounded bg-black px-3 py-1 text-sm font-bold tracking-widest text-white">
              NOT FOUND
            </span>
          </div>

          {/* Controls */}
          <div className="mt-4 flex items-center justify-between px-2">
            <div className="flex gap-2">
              <div className="h-4 w-4 rounded-full border-2 border-black bg-amber-700" />
              <div className="h-4 w-4 rounded-full border-2 border-black bg-amber-700" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="h-1 w-8 bg-black rounded" />
              <div className="h-1 w-8 bg-black rounded" />
              <div className="h-1 w-8 bg-black rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Text */}
      <div className="relative z-10 mt-12 text-center max-w-md">
        <h1 className="text-4xl font-bold text-slate-900 mb-3">
          This page went missing
        </h1>
        <p className="text-slate-600 mb-8">
          Looks like the link is broken or the page never existed.
          Let’s get you back to something useful.
        </p>

        <Link href="/">
          <Button className="px-8 py-6 rounded-xl text-base font-semibold shadow-md">
            Go back home
          </Button>
        </Link>
      </div>
    </div>
  );
}
