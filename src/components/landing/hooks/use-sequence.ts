"use client";

import { useEffect, useState } from "react";

import { useReducedMotion } from "./use-reduced-motion";

/**
 * Steps a little story along: step 0 shows for `durations[0]` ms, then step 1, and so on, looping
 * back to 0 after the last. While `play` is off, or the visitor prefers less motion, it rests on
 * the last step, which every preview draws as its finished state. Pass `durations` as a module
 * constant so the timer isn't restarted on each render.
 */
export function useSequence(durations: readonly number[], play: boolean) {
  const reduced = useReducedMotion();
  const running = play && !reduced;
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!running) return;
    let index = 0;
    let timer = 0;
    const tick = () => {
      setStep(index);
      const wait = durations[index];
      index = (index + 1) % durations.length;
      timer = window.setTimeout(tick, wait);
    };
    timer = window.setTimeout(tick, 0);
    return () => {
      window.clearTimeout(timer);
      setStep(0);
    };
  }, [running, durations]);

  return running ? step : durations.length - 1;
}

/**
 * Text that types itself out while `play` is on, a few characters a frame. Rests on the full text
 * otherwise, so a paused preview still reads.
 */
export function useTyped(text: string, play: boolean, { speed = 28, delay = 0 } = {}) {
  const reduced = useReducedMotion();
  const running = play && !reduced;
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!running) return;
    let shown = 0;
    let timer = window.setTimeout(function next() {
      shown = Math.min(text.length, shown + 2);
      setCount(shown);
      if (shown < text.length) timer = window.setTimeout(next, speed);
    }, delay);
    return () => {
      window.clearTimeout(timer);
      setCount(0);
    };
  }, [running, text, speed, delay]);

  return running ? text.slice(0, count) : text;
}
