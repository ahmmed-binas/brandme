"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useEditorialData } from "../EditorialDataContext";

// The portfolio's single distinctive interactive element: a small terminal
// that responds to real commands about the developer's own data. It is
// useful, not decorative — every command reads from portfolioData.
export default function Terminal() {
  const portfolioData = useEditorialData();
  const commands: Record<string, () => string[]> = {
    whoami: () => [portfolioData.personal.name, `${portfolioData.personal.title} · ${portfolioData.personal.subtitle}`, portfolioData.personal.location],
    stack: () => [...portfolioData.skills.frontend.map((s) => s.name), ...portfolioData.skills.backend.map((s) => s.name), ...portfolioData.skills.database.map((s) => s.name)],
    projects: () => portfolioData.projects.map((p) => `${p.name} — ${p.tagline}`),
    status: () => [portfolioData.personal.availability],
    help: () => ["Available commands: whoami, stack, projects, status, clear"],
  };
  const available = Object.keys(commands).concat("clear");
  const shouldReduceMotion = useReducedMotion();
  const [lines, setLines] = useState<{ type: "cmd" | "out"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [typedIntro, setTypedIntro] = useState(false);

  useEffect(() => {
    const introCmd = "whoami";
    if (shouldReduceMotion) {
      setLines([{ type: "cmd", text: introCmd }, ...commands.whoami().map((t) => ({ type: "out" as const, text: t }))]);
      setTypedIntro(true);
      return;
    }
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setInput(introCmd.slice(0, i));
      if (i >= introCmd.length) {
        clearInterval(interval);
        setTimeout(() => {
          setLines([{ type: "cmd", text: introCmd }, ...commands.whoami().map((t) => ({ type: "out" as const, text: t }))]);
          setInput("");
          setTypedIntro(true);
        }, 400);
      }
    }, 90);
    return () => clearInterval(interval);
  }, [shouldReduceMotion, portfolioData]);

  const runCommand = (raw: string) => {
    const cmd = raw.trim().toLowerCase();
    if (!cmd) return;
    if (cmd === "clear") {
      setLines([]);
      return;
    }
    const handler = commands[cmd];
    const output = handler ? handler() : [`command not found: ${cmd}`, "type 'help' for available commands"];
    setLines((prev) => [
      ...prev,
      { type: "cmd", text: cmd },
      ...output.map((t) => ({ type: "out" as const, text: t })),
    ]);
  };

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-md border border-line bg-surface font-mono text-[13px] leading-relaxed"
    >
      <div className="flex items-center gap-1.5 border-b border-line px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-line" />
        <span className="h-2.5 w-2.5 rounded-full bg-line" />
        <span className="h-2.5 w-2.5 rounded-full bg-line" />
        <span className="ml-3 text-muted text-xs">portfolio — zsh</span>
      </div>
      <div className="h-64 overflow-y-auto p-4 no-scrollbar">
        {lines.map((line, idx) =>
          line.type === "cmd" ? (
            <div key={idx} className="flex gap-2 text-text">
              <span className="text-signal">➜</span>
              <span>{line.text}</span>
            </div>
          ) : (
            <div key={idx} className="pl-5 text-muted">{line.text}</div>
          )
        )}
        {typedIntro && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              runCommand(input);
              setInput("");
            }}
            className="mt-1 flex items-center gap-2"
          >
            <span className="text-signal">➜</span>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-label="Terminal command input"
              placeholder="type a command…"
              className="w-full bg-transparent text-text placeholder:text-muted/50 outline-none"
              autoComplete="off"
              spellCheck={false}
            />
          </form>
        )}
        {!typedIntro && (
          <div className="flex gap-2 text-text">
            <span className="text-signal">➜</span>
            <span>{input}</span>
            <span className="animate-pulse">▍</span>
          </div>
        )}
      </div>
      <div className="border-t border-line px-4 py-2 text-[11px] text-muted">
        try: {available.join(", ")}
      </div>
    </motion.div>
  );
}
