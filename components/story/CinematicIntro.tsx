"use client";

import { useLayoutEffect, useRef, useState, useCallback, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  NeedleShape,
  NeedleBarShape,
  ThreadSwirl,
  WordmarkGroup,
  MachineHousing,
  HoopFabricShape,
  ShirtShape,
  TowelStackShape,
  ToteShape,
  NapkinShape,
} from "./marks";

const INTRO_SEEN_KEY = "fl-intro-seen";
const CLONE_COUNT_DESKTOP = 14;
const CLONE_COUNT_MOBILE = 6;
const NEEDLE_SPACING_DESKTOP = 42;
const NEEDLE_SPACING_MOBILE = 34;

type IntroPhase = "pending" | "reduced" | "skipped" | "playing";

export function hasSeenIntro() {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(INTRO_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function markIntroSeen() {
  try {
    window.localStorage.setItem(INTRO_SEEN_KEY, "1");
  } catch {
    /* private browsing / storage disabled — non-fatal */
  }
}

export function CinematicIntro({ homeAnchorId = "home" }: { homeAnchorId?: string }) {
  const [phase, setPhase] = useState<IntroPhase>("pending");
  const [replayToken, setReplayToken] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setPhase("reduced");
    } else if (hasSeenIntro()) {
      setPhase("skipped");
    } else {
      setPhase("playing");
    }
  }, [replayToken]);

  const jumpToHome = useCallback(() => {
    const el = document.getElementById(homeAnchorId);
    if (el) el.scrollIntoView({ behavior: "auto", block: "start" });
  }, [homeAnchorId]);

  const replay = useCallback(() => {
    try {
      window.localStorage.removeItem(INTRO_SEEN_KEY);
    } catch {
      /* ignore */
    }
    window.scrollTo({ top: 0, behavior: "auto" });
    setReplayToken((n) => n + 1);
  }, []);

  if (phase === "pending") {
    return <div className="bg-fl-ivory" style={{ height: "100vh" }} aria-hidden />;
  }

  if (phase === "skipped") {
    return <ReplayStoryLink onReplay={replay} />;
  }

  if (phase === "reduced") {
    return <ReducedMotionIntro onFinish={() => { markIntroSeen(); setPhase("skipped"); }} jumpToHome={jumpToHome} />;
  }

  return (
    <PlayingIntro
      onFinish={() => {
        markIntroSeen();
      }}
      jumpToHome={jumpToHome}
    />
  );
}

/** Small understated control shown to returning visitors so they can
 *  re-experience the opening sequence. Rendered in place of the intro. */
function ReplayStoryLink({ onReplay }: { onReplay: () => void }) {
  return (
    <div className="flex justify-center pt-10 pb-2">
      <button
        type="button"
        onClick={onReplay}
        className="font-sans text-[11px] tracking-[0.28em] uppercase text-fl-ink-muted hover:text-fl-charcoal transition-colors"
      >
        Replay Our Story
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Full cinematic version
// ---------------------------------------------------------------------------

function PlayingIntro({ onFinish, jumpToHome }: { onFinish: () => void; jumpToHome: () => void }) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const wordmarkRef = useRef<SVGGElement>(null);
  const needleRef = useRef<SVGGElement>(null);
  const threadRef = useRef<SVGPathElement>(null);
  const machineAssemblyRef = useRef<SVGGElement>(null);
  const housingRef = useRef<SVGGElement>(null);
  const cloneRefs = useRef<(SVGGElement | null)[]>([]);
  const hoopAssemblyRef = useRef<SVGGElement>(null);
  const hoopRingRef = useRef<SVGGElement>(null);
  const hoopThreadRef = useRef<SVGPathElement>(null);
  const hoopWordmarkRef = useRef<SVGGElement>(null);
  const shirtRef = useRef<SVGGElement>(null);
  const towelRef = useRef<SVGGElement>(null);
  const toteRef = useRef<SVGGElement>(null);
  const napkinRef = useRef<SVGGElement>(null);

  const openingRef = useRef<HTMLDivElement>(null);
  const caption1Ref = useRef<HTMLDivElement>(null);
  const caption2Ref = useRef<HTMLDivElement>(null);
  const dimRef = useRef<HTMLDivElement>(null);
  const headlineWrapRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);

  const [transitioning, setTransitioning] = useState(false);
  const transitionLineRef = useRef<HTMLDivElement>(null);
  const transitionOverlayRef = useRef<HTMLDivElement>(null);

  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  // PlayingIntro only ever mounts client-side (see CinematicIntro's phase
  // gating), so `window` is always available here — computed once, reused
  // by both the render below and the layout effect's timeline setup.
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const cloneCount = isMobile ? CLONE_COUNT_MOBILE : CLONE_COUNT_DESKTOP;
  const needleSpacing = isMobile ? NEEDLE_SPACING_MOBILE : NEEDLE_SPACING_DESKTOP;

  const runTransition = useCallback(() => {
    setTransitioning(true);
    requestAnimationFrame(() => {
      const overlay = transitionOverlayRef.current;
      const line = transitionLineRef.current;
      if (!overlay || !line) {
        finishRef.current();
        jumpToHome();
        return;
      }
      gsap.set(overlay, { opacity: 1, display: "flex" });
      gsap.set(line, { scaleX: 0 });
      const tl = gsap.timeline({
        onComplete: () => {
          finishRef.current();
          jumpToHome();
          gsap.set(overlay, { display: "none" });
        },
      });
      tl.to(line, { scaleX: 1, duration: 0.62, ease: "power3.inOut" })
        .to(overlay, { opacity: 0, duration: 0.4, ease: "power1.out" }, "+=0.08");
    });
  }, [jumpToHome]);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const spacing = needleSpacing;

    const section = sectionRef.current;
    if (section) {
      section.style.height = isMobile ? "340vh" : "640vh";
    }

    const ctx = gsap.context(() => {
      // Rest positions -------------------------------------------------
      gsap.set(wordmarkRef.current, { x: 600, y: 462, scale: 1, opacity: 1 });
      gsap.set([needleRef.current, threadRef.current], { x: 600, y: 356, scale: 0.5, rotation: 0 });
      gsap.set(threadRef.current, { opacity: 1 });
      gsap.set(machineAssemblyRef.current, { x: 0, y: 0, scale: 1 });
      gsap.set(housingRef.current, { x: 600, y: 330, opacity: 0, scaleY: 0.85, transformOrigin: "50% 100%" });

      // 15 total needle slots (hero + clones), evenly spaced, hero at slot 0.
      const totalNeedles = cloneCount + 1;
      const half = (totalNeedles - 1) / 2;
      const cloneSlots = Array.from({ length: totalNeedles }, (_, i) => i - half).filter((s) => s !== 0);
      cloneRefs.current.slice(0, cloneCount).forEach((el) => {
        gsap.set(el, { x: 600, y: 330, scale: 0, opacity: 0 });
      });

      // Thread + small wordmark drawn "on the fabric" are nested inside
      // hoopAssemblyRef, so their own transforms are LOCAL offsets within
      // the hoop (the hoop group itself carries the stage-space position).
      gsap.set(hoopAssemblyRef.current, { x: 600, y: 640, scale: 0.1, opacity: 0 });
      gsap.set(hoopThreadRef.current, { x: 6, y: -22, scale: 0.55, strokeDasharray: 1, strokeDashoffset: 1, opacity: 0 });
      gsap.set(hoopWordmarkRef.current, { opacity: 0, scale: 0.16, x: 0, y: 58 });

      gsap.set(shirtRef.current, { x: 470, y: 560, scale: 0.85, opacity: 0 });
      gsap.set(towelRef.current, { x: 900, y: 560, scale: 0.72, opacity: 0, rotation: -5 });
      gsap.set(toteRef.current, { x: 300, y: 660, scale: 0.62, opacity: 0, rotation: 4 });
      gsap.set(napkinRef.current, { x: 860, y: 700, scale: 0.5, opacity: 0, rotation: -3 });

      gsap.set(dimRef.current, { autoAlpha: 0 });
      gsap.set(headlineWrapRef.current, { autoAlpha: 0, y: 26 });
      gsap.set(ctaRef.current, { autoAlpha: 0, y: 18 });
      gsap.set(caption1Ref.current, { autoAlpha: 0 });
      gsap.set(caption2Ref.current, { autoAlpha: 0 });
      gsap.set(openingRef.current, { autoAlpha: 1 });

      // Master timeline, scrubbed 1:1 with scroll through the spacer ---
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });

      // Moment 00 -> 01: the logo awakens ------------------------------
      tl.to(openingRef.current, { autoAlpha: 0, y: -8, duration: 3 }, 0.5)
        .to(wordmarkRef.current, { opacity: 0, y: 438, duration: 7, filter: "blur(4px)" }, 3);

      // Moment 02: the needle (macro) ----------------------------------
      tl.to([needleRef.current, threadRef.current], { x: 600, y: 372, scale: isMobile ? 2.3 : 3.1, rotation: -8, duration: 16 }, 13)
        .to(caption1Ref.current, { autoAlpha: 1, duration: 3 }, 16)
        .to(caption1Ref.current, { autoAlpha: 0, duration: 3 }, 25);

      // Moment 03: one becomes fifteen ----------------------------------
      tl.to(threadRef.current, { opacity: 0, duration: 6 }, 30)
        .to([needleRef.current], { x: 600, y: 330, scale: isMobile ? 0.58 : 0.72, rotation: 0, duration: 12 }, 30);

      cloneSlots.forEach((slot, i) => {
        const el = cloneRefs.current[i];
        if (!el) return;
        const targetX = 600 + slot * spacing;
        const startAt = 33 + i * (10 / cloneCount);
        tl.to(
          el,
          { x: targetX, y: 330, scale: isMobile ? 0.58 : 0.72, opacity: 1, duration: 8, ease: "back.out(1.4)" },
          startAt,
        );
      });

      tl.to(housingRef.current, { opacity: 1, scaleY: 1, duration: 10 }, 38)
        .to(caption2Ref.current, { autoAlpha: 1, duration: 3 }, 39)
        .to(caption2Ref.current, { autoAlpha: 0, duration: 3 }, 47);

      // Moment 04: pull back to reveal the machine + Moment 05: fabric --
      tl.to(machineAssemblyRef.current, { y: -58, scale: 0.84, duration: 12 }, 46)
        .to(hoopAssemblyRef.current, { x: 600, y: 566, scale: isMobile ? 0.62 : 0.82, opacity: 1, duration: 12 }, 47);

      // Moment 05: the first stitch — needle dips toward the fabric -----
      const needleBaseY = 330;
      tl.to(needleRef.current, { y: needleBaseY + 12, duration: 2 }, 58)
        .to(needleRef.current, { y: needleBaseY, duration: 2 }, 60)
        .to(needleRef.current, { y: needleBaseY + 12, duration: 2 }, 62)
        .to(needleRef.current, { y: needleBaseY, duration: 2 }, 64);

      // Moment 06: draw with thread — the mark is stitched onto fabric.
      // hoopThreadRef/hoopWordmarkRef stay at the local rest position set
      // above; only opacity/dashoffset animate, since the hoop's own
      // transform already carries them through the stage.
      tl.to(hoopThreadRef.current, { opacity: 1, duration: 1 }, 63)
        .to(hoopThreadRef.current, { strokeDashoffset: 0, duration: 15 }, 64)
        .to(hoopWordmarkRef.current, { opacity: 1, duration: 8 }, 74);

      // Moment 07: imagination becomes matter — machine recedes, --------
      // fabric becomes a shirt, other products emerge ------------------
      tl.to(machineAssemblyRef.current, { y: -190, scale: 0.7, opacity: 0, duration: 10 }, 78);
      tl.to(hoopAssemblyRef.current, { x: 470, y: 552, scale: isMobile ? 0.5 : 0.64, duration: 12 }, 80)
        .to(shirtRef.current, { opacity: 1, scale: isMobile ? 0.62 : 0.85, duration: 10 }, 80)
        // the hoop ring/fabric dissolve away — only the stitched mark
        // remains, now resting on the shirt's chest as a monogram.
        .to(hoopRingRef.current, { opacity: 0, duration: 8 }, 82);

      tl.to(towelRef.current, { opacity: 1, x: isMobile ? 830 : 900, duration: 8 }, 85)
        .to(toteRef.current, { opacity: 1, y: isMobile ? 700 : 660, duration: 8 }, 87)
        .to(napkinRef.current, { opacity: 1, duration: 8 }, 89);

      // Moment 08: the idea has become real ------------------------------
      tl.to(dimRef.current, { autoAlpha: 1, duration: 6 }, 88)
        .to(headlineWrapRef.current, { autoAlpha: 1, y: 0, duration: 8 }, 90);

      // Moment 09: call to action -----------------------------------------
      tl.to(ctaRef.current, { autoAlpha: 1, y: 0, duration: 8 }, 96);

      ScrollTrigger.refresh();
    }, sectionRef);

    return () => ctx.revert();
    // Deliberately run once on mount: isMobile/cloneCount/needleSpacing are
    // derived from window.innerWidth at first render and drive one-time
    // DOM layout (element count, section height) that the timeline below
    // is built against — re-running this on every render would tear down
    // and rebuild the whole scroll timeline on unrelated state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section ref={sectionRef} className="relative bg-fl-ivory" aria-label="Fine Ligne Studio — introduction">
      <div ref={stageRef} className="sticky top-0 h-[100svh] w-full overflow-hidden bg-fl-ivory">
        <svg
          viewBox="0 0 1200 800"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full text-fl-charcoal"
          aria-hidden
        >
          <defs>
            <linearGradient id="machine-metal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2E2A25" />
              <stop offset="45%" stopColor="#181613" />
              <stop offset="100%" stopColor="#0C0A08" />
            </linearGradient>
          </defs>

          <g ref={machineAssemblyRef}>
            <g ref={housingRef}>
              <MachineHousing id="intro-machine" count={cloneCount + 1} spacing={needleSpacing} />
            </g>
            {Array.from({ length: cloneCount }).map((_, i) => (
              <g
                key={i}
                ref={(el) => {
                  cloneRefs.current[i] = el;
                }}
                className="text-fl-charcoal"
              >
                <NeedleBarShape className="fill-current" />
              </g>
            ))}
            <g ref={needleRef} className="text-fl-charcoal">
              <NeedleShape id="intro-hero-needle" className="fill-current" />
            </g>
            <ThreadSwirl id="intro-hero-thread" ref={threadRef} className="stroke-fl-gold" style={{ strokeWidth: 2.6 }} />
          </g>

          {/* Products sit BEHIND the hoop assembly so the stitched mark
              paints on top of the shirt once the hoop settles onto its
              chest — see Moment 07 in the timeline above. */}
          <g ref={shirtRef}>
            <ShirtShape id="intro-shirt" />
          </g>
          <g ref={towelRef}>
            <TowelStackShape id="intro-towel" />
          </g>
          <g ref={toteRef}>
            <ToteShape id="intro-tote" />
          </g>
          <g ref={napkinRef}>
            <NapkinShape id="intro-napkin" />
          </g>

          <g ref={hoopAssemblyRef}>
            <g ref={hoopRingRef}>
              <HoopFabricShape id="intro-hoop" />
            </g>
            <ThreadSwirl id="intro-hoop-thread" ref={hoopThreadRef} className="stroke-fl-gold" style={{ strokeWidth: 3.4 }} />
            <g ref={hoopWordmarkRef} className="text-fl-brass">
              <WordmarkGroup id="intro-hoop-wordmark" />
            </g>
          </g>

          <g ref={wordmarkRef} className="text-fl-charcoal">
            <WordmarkGroup id="intro-wordmark" />
          </g>
        </svg>

        <div ref={openingRef} className="pointer-events-none absolute inset-x-0 bottom-[13%] flex flex-col items-center gap-4">
          <p className="font-serif italic text-lg text-fl-ink-muted sm:text-xl">Imagined Luxury. Actualized.</p>
          <div className="flex flex-col items-center gap-2">
            <span className="font-sans text-[10px] uppercase tracking-[0.32em] text-fl-ink-faint">Scroll to begin</span>
            <svg width="12" height="18" viewBox="0 0 12 18" className="text-fl-ink-faint">
              <path d="M6 0 V16 M1 11 L6 17 L11 11" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div ref={caption1Ref} className="pointer-events-none absolute inset-x-0 bottom-[16%] flex justify-center px-6">
          <p className="font-sans text-[11px] uppercase tracking-[0.34em] text-fl-ink-muted sm:text-xs">Every idea begins with a line.</p>
        </div>
        <div ref={caption2Ref} className="pointer-events-none absolute inset-x-0 bottom-[16%] flex justify-center px-6">
          <p className="font-sans text-[11px] uppercase tracking-[0.34em] text-fl-ink-muted sm:text-xs">15 needles. Thousands of possibilities.</p>
        </div>

        <div ref={dimRef} className="pointer-events-none absolute inset-0 bg-fl-charcoal/15" />

        <div className="pointer-events-none absolute inset-x-0 bottom-[20%] flex flex-col items-center gap-5 px-6 text-center sm:bottom-[22%]">
          <div ref={headlineWrapRef}>
            <h1 className="font-serif text-4xl leading-[1.05] text-fl-charcoal sm:text-6xl">
              Imagined Luxury.
              <br />
              Actualized.
            </h1>
            <p className="mx-auto mt-4 max-w-md font-sans text-sm text-fl-ink-muted sm:text-base">
              Your idea, translated into thread and made tangible.
            </p>
          </div>

          <div ref={ctaRef} className="pointer-events-auto flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
              <button
                type="button"
                onClick={runTransition}
                className="border border-fl-charcoal bg-fl-charcoal px-8 py-3.5 font-sans text-xs uppercase tracking-[0.28em] text-fl-paper transition-colors hover:bg-transparent hover:text-fl-charcoal"
              >
                Start Your Journey
              </button>
              <button
                type="button"
                onClick={runTransition}
                className="px-8 py-3.5 font-sans text-xs uppercase tracking-[0.28em] text-fl-charcoal underline decoration-fl-ink-faint underline-offset-8 transition-colors hover:decoration-fl-charcoal"
              >
                Explore Fine Ligne
              </button>
            </div>
            <p className="font-serif italic text-sm text-fl-ink-muted">Bring us an idea. We&rsquo;ll help make it real.</p>
          </div>
        </div>

        <button
          ref={skipRef}
          type="button"
          onClick={runTransition}
          className="absolute right-5 top-5 z-10 font-sans text-[10px] uppercase tracking-[0.28em] text-fl-ink-muted transition-colors hover:text-fl-charcoal sm:right-8 sm:top-8"
        >
          Skip Intro
        </button>

        <div
          ref={transitionOverlayRef}
          className="pointer-events-none fixed inset-0 z-40 hidden items-center justify-center bg-fl-ivory opacity-0"
          aria-hidden={!transitioning}
        >
          <div ref={transitionLineRef} className="h-px w-full origin-left bg-fl-gold" />
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Reduced-motion fallback: same conceptual beats, simple cross-fades,
// normal document flow (no pin, no scrub, no transform choreography).
// ---------------------------------------------------------------------------

function ReducedMotionIntro({ onFinish, jumpToHome }: { onFinish: () => void; jumpToHome: () => void }) {
  const beats = [
    {
      key: "logo",
      body: (
        <svg viewBox="-140 -120 280 260" className="h-40 w-40 text-fl-charcoal sm:h-56 sm:w-56">
          <g transform="translate(0,-4) scale(0.9)" className="text-fl-charcoal">
            <NeedleShape id="rm-needle" className="fill-current" />
            <ThreadSwirl id="rm-thread" className="stroke-fl-charcoal" style={{ strokeWidth: 2.6 }} />
          </g>
        </svg>
      ),
      caption: "Every idea begins with a line.",
    },
    {
      key: "machine",
      body: (
        <svg viewBox="-360 -220 720 300" className="h-40 w-full max-w-xl text-fl-charcoal sm:h-52">
          <defs>
            <linearGradient id="rm-metal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2E2A25" />
              <stop offset="100%" stopColor="#0C0A08" />
            </linearGradient>
          </defs>
          <MachineHousing id="rm-machine" count={9} spacing={40} />
          {Array.from({ length: 9 }).map((_, i) => (
            <g key={i} transform={`translate(${(i - 4) * 40},0) scale(0.7)`} className="text-fl-charcoal">
              <NeedleBarShape className="fill-current" />
            </g>
          ))}
        </svg>
      ),
      caption: "15 needles. Thousands of possibilities.",
    },
    {
      key: "fabric",
      body: (
        <svg viewBox="-200 -200 400 400" className="h-44 w-44 text-fl-charcoal sm:h-56 sm:w-56">
          <HoopFabricShape id="rm-hoop" />
          <g transform="scale(0.8)" className="text-fl-brass">
            <ThreadSwirl id="rm-hoop-thread" className="stroke-current" style={{ strokeWidth: 3.2 }} />
          </g>
        </svg>
      ),
      caption: "The machine stitches the mark.",
    },
    {
      key: "product",
      body: (
        <svg viewBox="-360 -220 720 460" className="h-52 w-full max-w-xl text-fl-charcoal sm:h-64">
          <g transform="translate(-140,-20) scale(0.72)">
            <ShirtShape id="rm-shirt" />
          </g>
          <g transform="translate(160,-40) scale(0.6)">
            <TowelStackShape id="rm-towel" />
          </g>
          <g transform="translate(70,140) scale(0.5)">
            <ToteShape id="rm-tote" />
          </g>
        </svg>
      ),
      caption: "The idea becomes an object.",
    },
  ];

  return (
    <section className="bg-fl-ivory">
      <div className="flex min-h-[92svh] flex-col items-center justify-center gap-4 px-6 text-center">
        <svg viewBox="-90 -80 180 240" className="h-44 w-40 text-fl-charcoal">
          <g transform="translate(0,-60) scale(0.62)" style={{ strokeWidth: 2.4 }}>
            <NeedleShape id="rm-open-needle" className="fill-current" />
            <ThreadSwirl id="rm-open-thread" className="stroke-current" />
          </g>
          <WordmarkGroup id="rm-open-wordmark" />
        </svg>
        <p className="mt-2 font-serif italic text-lg text-fl-ink-muted">Imagined Luxury. Actualized.</p>
      </div>

      {beats.map((beat) => (
        <RevealSection key={beat.key}>
          <div className="flex min-h-[70svh] flex-col items-center justify-center gap-6 px-6 text-center">
            {beat.body}
            <p className="font-sans text-xs uppercase tracking-[0.3em] text-fl-ink-muted">{beat.caption}</p>
          </div>
        </RevealSection>
      ))}

      <RevealSection>
        <div className="flex min-h-[80svh] flex-col items-center justify-center gap-6 px-6 text-center">
          <h1 className="font-serif text-4xl leading-[1.05] text-fl-charcoal sm:text-6xl">
            Imagined Luxury.
            <br />
            Actualized.
          </h1>
          <p className="max-w-md font-sans text-sm text-fl-ink-muted sm:text-base">
            Your idea, translated into thread and made tangible.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
            <button
              type="button"
              onClick={() => {
                onFinish();
                jumpToHome();
              }}
              className="border border-fl-charcoal bg-fl-charcoal px-8 py-3.5 font-sans text-xs uppercase tracking-[0.28em] text-fl-paper transition-colors hover:bg-transparent hover:text-fl-charcoal"
            >
              Start Your Journey
            </button>
            <button
              type="button"
              onClick={() => {
                onFinish();
                jumpToHome();
              }}
              className="px-8 py-3.5 font-sans text-xs uppercase tracking-[0.28em] text-fl-charcoal underline decoration-fl-ink-faint underline-offset-8"
            >
              Explore Fine Ligne
            </button>
          </div>
          <p className="font-serif italic text-sm text-fl-ink-muted">Bring us an idea. We&rsquo;ll help make it real.</p>
          <button
            type="button"
            onClick={() => {
              onFinish();
              jumpToHome();
            }}
            className="mt-2 font-sans text-[10px] uppercase tracking-[0.28em] text-fl-ink-faint hover:text-fl-charcoal"
          >
            Skip Intro
          </button>
        </div>
      </RevealSection>
    </section>
  );
}

function RevealSection({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="transition-all duration-700 ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
      }}
    >
      {children}
    </div>
  );
}
