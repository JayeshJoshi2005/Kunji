"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const HeroSection = () => {

  return (
    <section className="pt-44 pb-28 px-4 bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto text-center">
        <h1 className="text-5xl md:text-7xl lg:text-[100px] font-extrabold tracking-tight pb-8">
          Manage Your Finances <br />
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            with Intelligence
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          KUNJI is an AI-powered financial management platform that helps you
          track, analyze, and optimize your spending with clear, real-time
          insights.
        </p>

        <div className="flex justify-center gap-4 mb-16">
          <Link href="/dashboard">
            <Button
              size="lg"
              className="px-10 py-6 rounded-xl text-base font-semibold shadow-lg"
            >
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
