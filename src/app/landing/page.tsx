'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Intersection Observer hook for scroll-triggered animations
// ---------------------------------------------------------------------------
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function RevealSection({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mock card for hero background
// ---------------------------------------------------------------------------
function MockCard({
  title,
  category,
  delay,
  rotation,
  offsetY,
}: {
  title: string;
  category: string;
  delay: number;
  rotation: number;
  offsetY: number;
}) {
  return (
    <div
      className="absolute w-72 sm:w-80 rounded-2xl p-5 border border-white/10 shadow-2xl"
      style={{
        background: 'linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)',
        transform: `rotate(${rotation}deg) translateY(${offsetY}px)`,
        animation: `float 6s ease-in-out ${delay}s infinite`,
      }}
    >
      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/30 text-primary-light mb-3">
        {category}
      </span>
      <p className="text-white font-semibold text-sm leading-relaxed">{title}</p>
      <div className="mt-3 h-2 w-3/4 rounded-full bg-white/5" />
      <div className="mt-1.5 h-2 w-1/2 rounded-full bg-white/5" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Landing Page
// ---------------------------------------------------------------------------
export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-bg text-slate-200 overflow-x-hidden">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-10 h-14 bg-bg/70 backdrop-blur-xl border-b border-white/5">
        <span className="text-sm font-semibold text-white tracking-tight">
          🌱 Daily Kernel
        </span>
        <Link
          href="/login"
          className="px-4 py-1.5 rounded-full text-sm font-medium bg-primary hover:bg-primary-light text-white transition-colors"
        >
          Sign In
        </Link>
      </nav>

      {/* ----------------------------------------------------------------- */}
      {/* HERO */}
      {/* ----------------------------------------------------------------- */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 pt-14 overflow-hidden">
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ transform: `translateY(${scrollY * 0.15}px)` }}
        >
          <MockCard
            title="CRISPR Base Editing Achieves 98% Efficiency in Liver Cells"
            category="Biomedical"
            delay={0}
            rotation={-8}
            offsetY={-40}
          />
          <MockCard
            title="New Transformer Architecture Reduces Training Compute by 40%"
            category="AI · Lesson 14"
            delay={2}
            rotation={5}
            offsetY={60}
          />
          <MockCard
            title="Arctic Sea Ice Reaches Record Minimum for March"
            category="Climate"
            delay={4}
            rotation={-3}
            offsetY={-80}
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-bg via-bg/80 to-bg z-10" />

        <div className="relative z-20 text-center max-w-3xl mx-auto">
          <div
            className="text-6xl mb-6"
            style={{ animation: 'fade-in-up 1s ease-out' }}
          >
            🌱
          </div>
          <h1
            className="text-4xl sm:text-6xl md:text-7xl font-bold text-white tracking-tight leading-[1.1]"
            style={{ animation: 'fade-in-up 1s ease-out 0.15s both' }}
          >
            Daily Kernel
          </h1>
          <p
            className="mt-6 text-lg sm:text-xl text-slate-400 max-w-lg mx-auto leading-relaxed"
            style={{ animation: 'fade-in-up 1s ease-out 0.3s both' }}
          >
            A daily feed of research papers and news, summarized into
            cards you can get through in a few minutes. Pick your fields,
            and it gets smarter about what you care about over time.
          </p>
          <div
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            style={{ animation: 'fade-in-up 1s ease-out 0.45s both' }}
          >
            <Link
              href="/login"
              className="px-8 py-3.5 rounded-full text-base font-semibold bg-primary hover:bg-primary-light text-white transition-all shadow-lg shadow-primary/25"
            >
              Try It Free
            </Link>
            <a
              href="#how-it-works"
              className="px-8 py-3.5 rounded-full text-base font-medium text-slate-300 hover:text-white border border-white/10 hover:border-white/20 transition-all"
            >
              How It Works
            </a>
          </div>
        </div>

        <div
          className="absolute bottom-10 z-20"
          style={{ animation: 'fade-in-up 1s ease-out 1s both' }}
        >
          <div className="w-5 h-8 rounded-full border-2 border-white/20 flex items-start justify-center p-1">
            <div className="w-1 h-2 rounded-full bg-white/40 animate-bounce" />
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* THE PROBLEM (honest, not guilt-trippy) */}
      {/* ----------------------------------------------------------------- */}
      <section className="py-32 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <RevealSection>
            <p className="text-xl sm:text-2xl text-slate-300 leading-relaxed">
              There are thousands of papers published every week.
              Most of us don&rsquo;t read any of them — not because we don&rsquo;t
              want to, but because sitting down with a 30-page PDF
              just doesn&rsquo;t happen.
            </p>
          </RevealSection>
          <RevealSection delay={200}>
            <p className="mt-8 text-xl sm:text-2xl text-slate-300 leading-relaxed">
              Daily Kernel gives you the key ideas from the papers
              and news in your field, a few cards at a time,
              so you can actually keep up.
            </p>
          </RevealSection>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* HOW IT WORKS */}
      {/* ----------------------------------------------------------------- */}
      <section id="how-it-works" className="py-32 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <RevealSection>
            <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-20">
              Here&rsquo;s how it works.
            </h2>
          </RevealSection>

          <div className="grid sm:grid-cols-3 gap-8 sm:gap-12">
            {[
              {
                num: '1',
                title: 'Pick your topics',
                desc: 'Add categories like "AI," "Genomics," or "Climate." Choose whether you want recent news, research papers, or a structured learning path for each one.',
              },
              {
                num: '2',
                title: 'Read your daily cards',
                desc: 'Each day you get a short stack of cards. Swipe through them — mark what was useful, save papers to read later, skip what\'s not relevant.',
              },
              {
                num: '3',
                title: 'It adapts to you',
                desc: 'The app tracks what you\'ve seen so it doesn\'t repeat itself. Papers you liked come back later with a different angle. The summaries adjust as you learn more.',
              },
            ].map((step, i) => (
              <RevealSection key={step.num} delay={i * 150}>
                <div>
                  <p className="text-3xl font-bold text-primary-light mb-3">
                    {step.num}.
                  </p>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-slate-400 leading-relaxed text-sm">
                    {step.desc}
                  </p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* LEARNING PATHS */}
      {/* ----------------------------------------------------------------- */}
      <section className="py-32 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-16 items-center">
            <RevealSection>
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-secondary mb-4">
                Learning Paths
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-6">
                Or learn something from scratch.
              </h2>
              <p className="text-slate-400 leading-relaxed mb-4">
                Set a category to &ldquo;Learn&rdquo; mode and it generates a full
                syllabus for that subject — ordered from basics to advanced
                topics. You get a couple of lessons per day, each with a
                question to think about.
              </p>
              <p className="text-slate-400 leading-relaxed">
                At more advanced levels, it pulls in real papers from
                PubMed, arXiv, and OpenAlex so you&rsquo;re learning from
                actual research, not just a language model&rsquo;s memory.
              </p>
            </RevealSection>

            <RevealSection delay={200}>
              <div className="relative">
                <div className="rounded-2xl border border-white/10 bg-surface p-6 shadow-xl">
                  <p className="text-xs font-semibold tracking-widest uppercase text-primary-light mb-4">
                    Machine Learning · Lesson 14
                  </p>
                  <h3 className="text-lg font-bold text-white mb-3">
                    Why Attention Is All You Need
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed mb-4">
                    The transformer architecture replaced RNNs by computing relationships
                    between all tokens simultaneously. Self-attention lets each word
                    &ldquo;look at&rdquo; every other word to understand context,
                    regardless of distance in the sequence.
                  </p>
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-base mt-0.5">💡</span>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      If self-attention compares every token to every other token,
                      why does it get expensive for long sequences?
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                    arXiv · Vaswani et al.
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between px-1">
                  <span className="text-xs text-slate-500">14 of 82 topics</span>
                  <div className="w-32 h-1.5 rounded-full bg-surface-light overflow-hidden">
                    <div className="h-full w-[17%] rounded-full bg-primary" />
                  </div>
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* SOURCES */}
      {/* ----------------------------------------------------------------- */}
      <section className="py-32 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <RevealSection>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Where the content comes from.
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto mb-16">
              Cards link back to the original source so you can go deeper
              whenever you want.
            </p>
          </RevealSection>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { name: 'PubMed', desc: '36M+ biomedical articles', icon: '🧬' },
              { name: 'arXiv', desc: '2.4M+ STEM preprints', icon: '🔬' },
              { name: 'OpenAlex', desc: '250M+ scholarly works', icon: '📚' },
              { name: 'Google News', desc: 'Current events', icon: '📰' },
            ].map((source, i) => (
              <RevealSection key={source.name} delay={i * 100}>
                <div className="p-5 rounded-2xl bg-surface/60 border border-white/5">
                  <div className="text-3xl mb-3">{source.icon}</div>
                  <p className="font-semibold text-white text-sm">{source.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{source.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* SPACED REPETITION */}
      {/* ----------------------------------------------------------------- */}
      <section className="py-32 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-16 items-center">
            <RevealSection delay={100}>
              <div className="flex items-end gap-1 h-40">
                {[
                  { h: 20, label: 'Day 1', active: true },
                  { h: 15, label: '', active: false },
                  { h: 30, label: 'Day 2', active: true },
                  { h: 10, label: '', active: false },
                  { h: 8, label: '', active: false },
                  { h: 40, label: 'Day 4', active: true },
                  { h: 6, label: '', active: false },
                  { h: 5, label: '', active: false },
                  { h: 4, label: '', active: false },
                  { h: 50, label: 'Day 7', active: true },
                  { h: 3, label: '', active: false },
                  { h: 2, label: '', active: false },
                  { h: 60, label: 'Day 14', active: true },
                ].map((bar, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className={`w-full rounded-t-sm transition-all duration-700 ${
                        bar.active ? 'bg-primary' : 'bg-white/5'
                      }`}
                      style={{ height: `${bar.h}%` }}
                    />
                    {bar.label && (
                      <span className="text-[9px] text-slate-500 whitespace-nowrap">
                        {bar.label}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 text-center mt-4">
                Review intervals grow as retention improves
              </p>
            </RevealSection>

            <RevealSection>
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-emerald-400 mb-4">
                Spaced Repetition
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-6">
                Things you liked come back.
              </h2>
              <p className="text-slate-400 leading-relaxed">
                When you mark a paper as interesting, it shows up again later —
                first the next day, then after 2 days, 4, 7, 14, and so on. Each
                time it highlights something different: a practical application,
                a limitation, a connection you might have missed. Same paper,
                new perspective.
              </p>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* WHAT THIS IS / ISN'T */}
      {/* ----------------------------------------------------------------- */}
      <section className="py-32 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <RevealSection>
            <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-16">
              What this is.
            </h2>
          </RevealSection>

          <div className="grid sm:grid-cols-2 gap-8">
            {[
              {
                title: 'A side project, not a startup',
                desc: 'Built for friends and family who wanted a better way to keep up with research. Free to use, open source.',
              },
              {
                title: 'Cards, not papers',
                desc: '2-3 sentence summaries with a link to the original. Enough to know what\'s happening — you decide when to go deeper.',
              },
              {
                title: 'Gets better with use',
                desc: 'It tracks what you\'ve seen, adjusts difficulty, and stops showing you the same things. Not magic, just bookkeeping.',
              },
              {
                title: 'AI-generated, source-linked',
                desc: 'Summaries are written by Claude. Every card links to the real paper or article so you can verify and read more.',
              },
            ].map((value, i) => (
              <RevealSection key={value.title} delay={i * 100}>
                <div className="p-6 rounded-2xl bg-surface/40 border border-white/5">
                  <h3 className="font-semibold text-white mb-2">{value.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{value.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* CTA */}
      {/* ----------------------------------------------------------------- */}
      <section className="py-32 px-6 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <RevealSection>
            <div className="text-5xl mb-6">🌱</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-6">
              Give it a try.
            </h2>
            <p className="text-lg text-slate-400 mb-10 max-w-md mx-auto">
              Pick a couple of topics, see if the cards are useful.
              Takes about a minute to set up.
            </p>
            <Link
              href="/login"
              className="inline-block px-10 py-4 rounded-full text-lg font-semibold bg-primary hover:bg-primary-light text-white transition-all shadow-lg shadow-primary/25"
            >
              Try It Free
            </Link>
          </RevealSection>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-slate-500">
            🌱 Daily Kernel
          </span>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/login" className="hover:text-white transition-colors">
              Sign In
            </Link>
            <a
              href="https://github.com/russellpbell/Daily-Kernel"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: rotate(var(--rotation, 0deg)) translateY(var(--offset, 0px)); }
          50% { transform: rotate(var(--rotation, 0deg)) translateY(calc(var(--offset, 0px) - 20px)); }
        }
      `}</style>
    </div>
  );
}
