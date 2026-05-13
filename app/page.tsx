"use client";

import Link from "next/link";
import { motion } from "motion/react";

const AGENTS: { label: string; href: string | null }[] = [
  { label: "MyChatGPT", href: "/mychatgpt" },
  { label: "Research Agent", href: null },
  { label: "Code Agent", href: null },
];

export default function Home() {
  return (
    <div className="relative flex min-h-full flex-col items-center justify-center overflow-hidden bg-zinc-950 px-6 py-16 text-zinc-50">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-30%,rgba(99,102,241,0.35),transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
      />

      <motion.div
        className="relative z-10 flex w-full max-w-md flex-col items-center text-center"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.h1
          className="mb-14 bg-gradient-to-b from-white via-white to-zinc-400 bg-clip-text text-6xl font-semibold tracking-tight text-transparent sm:text-7xl"
          initial={{ opacity: 0, scale: 0.94, filter: "blur(8px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ delay: 0.06, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          TeAG
        </motion.h1>

        <motion.ul
          className="flex w-full flex-col gap-3"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.09, delayChildren: 0.28 } },
          }}
        >
          {AGENTS.map((agent) => (
            <motion.li
              key={agent.label}
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: {
                  opacity: 1,
                  y: 0,
                  transition: { type: "spring", stiffness: 420, damping: 30 },
                },
              }}
              className="w-full"
            >
              {agent.href ? (
                <Link
                  href={agent.href}
                  className="group flex w-full items-center justify-between rounded-full border border-white/10 bg-white/[0.03] px-5 py-3.5 text-left text-sm font-medium text-zinc-100 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-white/[0.07]"
                >
                  <span>{agent.label}</span>
                  <motion.span
                    className="text-zinc-500 transition-colors group-hover:text-zinc-300"
                    whileHover={{ x: 3 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    →
                  </motion.span>
                </Link>
              ) : (
                <div className="flex w-full cursor-not-allowed items-center justify-between rounded-full border border-dashed border-white/10 px-5 py-3.5 text-left text-sm font-medium text-zinc-500">
                  <span>{agent.label}</span>
                  <span className="text-xs font-normal text-zinc-600">即将上线</span>
                </div>
              )}
            </motion.li>
          ))}
        </motion.ul>
      </motion.div>
    </div>
  );
}
