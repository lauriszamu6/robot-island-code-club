import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, type CSSProperties } from "react";
import "@/styles/landing.css";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Astrobit — Small inventor. Big universe." },
      { name: "description", content: "Team up with Bolt. Solve coding puzzles. Bring five floating workshop islands back to life. For ages 8–12 and a grown-up." },
      { property: "og:title", content: "Astrobit — welcome" },
      { property: "og:description", content: "Repair floating robot workshops by solving coding challenges together." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&family=Space+Grotesk:wght@500;700&display=swap" }],
  }),
  component: Welcome,
});

type Motion = { range?: [number, number]; x?: [number, number]; y?: [number, number]; xv?: [number, number]; yv?: [number, number]; rot?: [number, number]; s?: [number, number]; o?: [number, number] };

function Welcome() {
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    document.documentElement.classList.add("astro-landing-html");
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduce = media.matches;
    const secs = [...root.querySelectorAll<HTMLElement>("[data-pin]")];
    const info = new Map<HTMLElement, { top: number; h: number }>();
    const movers = [...root.querySelectorAll<HTMLElement>("[data-m]")].flatMap((el) => {
      const sec = el.closest<HTMLElement>("[data-pin]");
      if (!sec || !el.dataset['m']) return [];
      return [{ el, sec, m: JSON.parse(el.dataset['m']) as Motion }];
    });
    const words = [...root.querySelectorAll<HTMLElement>("#words h2")];
    const wordsEl = root.querySelector<HTMLElement>("#words");
    const lab = root.querySelector<HTMLElement>("#steplab");
    const labs = [
      ["var(--cyan)", "01 / THINK LIKE A CODER", "Snap blocks together. Make things happen."],
      ["var(--violet)", "02 / BUILD WITH BOLT", "Power machines and repair robot friends."],
      ["var(--lime)", "03 / GO BEYOND", "Every puzzle opens up a new possibility."],
    ];
    const trackx = root.querySelector<HTMLElement>("#trackx");
    const isles = [...(trackx?.querySelectorAll<HTMLElement>(".isle") ?? [])];
    const fill = root.querySelector<HTMLElement>("#fill");
    const steps = root.querySelector<HTMLElement>("#steps");
    const map = root.querySelector<HTMLElement>("#map");
    const forge = root.querySelector<HTMLElement>("#forge");
    let vw = window.innerWidth, vh = window.innerHeight, cur = window.scrollY, lastIdx = -1, lastIsle = -1;
    let raf = 0;
    let disposed = false;
    const measure = () => {
      vw = window.innerWidth;
      vh = window.innerHeight;
      for (const s of secs) info.set(s, { top: s.getBoundingClientRect().top + window.scrollY, h: Math.max(1, s.offsetHeight - vh) });
    };
    const prog = (s: HTMLElement | null) => {
      const i = s ? info.get(s) : undefined;
      return i ? Math.min(1, Math.max(0, (cur - i.top) / i.h)) : 0;
    };
    const ease = (t: number) => t < .5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;
    const frame = () => {
      const target = window.scrollY;
      cur = reduce ? target : cur + (target - cur) * .12;
      if (Math.abs(target - cur) < .1) cur = target;
      for (const { el, sec, m } of movers) {
        const p = prog(sec), r = m.range ?? [0, 1];
        const t = ease(Math.min(1, Math.max(0, (p - r[0]) / (r[1] - r[0]))));
        const v = (k: keyof Omit<Motion, "range">) => {
          const pair = m[k];
          return pair ? pair[0] + (pair[1] - pair[0]) * t : 0;
        };
        const x = v("x") + v("xv") * vw / 100, y = v("y") + v("yv") * vh / 100;
        el.style.transform = `translate3d(${x}px,${y}px,0) rotate(${v("rot")}deg) scale(${m.s ? v("s") : 1})`;
        if (m.o) el.style.opacity = String(v("o"));
      }
      const f = prog(steps) * (words.length - 1);
      const i0 = Math.floor(f), i1 = Math.min(words.length - 1, i0 + 1), fr = f - i0;
      const w0 = words[i0], w1 = words[i1];
      if (w0 && w1 && wordsEl) {
        const c0 = w0.offsetTop + w0.offsetHeight / 2, c1 = w1.offsetTop + w1.offsetHeight / 2;
        wordsEl.style.transform = `translate3d(0,${vh / 2 - (c0 + (c1 - c0) * fr)}px,0)`;
      }
      const idx = Math.round(f);
      if (idx !== lastIdx) {
        words.forEach((w, i) => w.classList.toggle("on", i === idx));
        const label = labs[idx], bold = lab?.querySelector("b"), span = lab?.querySelector("span");
        if (label && bold && span) {
          bold.style.color = label[0] ?? "";
          bold.textContent = label[1] ?? "";
          span.textContent = label[2] ?? "";
        }
        lastIdx = idx;
      }
      const pm = prog(map);
      if (trackx) {
        const travel = Math.max(0, trackx.scrollWidth - vw);
        trackx.style.transform = `translate3d(${-travel * pm}px,0,0)`;
      }
      const near = Math.round(pm * (isles.length - 1));
      if (near !== lastIsle) { isles.forEach((el, i) => el.classList.toggle("on", i === near)); lastIsle = near; }
      const max = document.documentElement.scrollHeight - vh;
      if (fill) fill.style.height = (max > 0 ? (target / max) * 100 : 0) + "%";
      raf = window.requestAnimationFrame(frame);
    };
    const io = new IntersectionObserver((es) => {
      for (const e of es) if (e.isIntersecting) { forge?.classList.add("in"); io.disconnect(); }
    }, { threshold: .2 });
    if (forge) { io.observe(forge); if (reduce) forge.classList.add("in"); }
    const onMotion = () => { reduce = media.matches; if (reduce) forge?.classList.add("in"); };
    media.addEventListener("change", onMotion);
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    window.addEventListener("resize", measure);
    measure();
    void document.fonts.ready.then(() => { if (!disposed) measure(); });
    raf = window.requestAnimationFrame(frame);
    return () => {
      disposed = true;
      window.cancelAnimationFrame(raf);
      io.disconnect(); ro.disconnect();
      window.removeEventListener("resize", measure);
      media.removeEventListener("change", onMotion);
      document.documentElement.classList.remove("astro-landing-html");
    };
  }, []);

  return (
    <div className="astro-landing" ref={rootRef}>
      <header className="nav">
        <div className="nav-in">
          <a className="brand" href="#hero"><span className="spark">A</span>astrobit</a>
          <nav className="links" aria-label="Main"><a className="on" href="#hero">Explore</a><a href="#map">Mission map</a><a href="#steps">Rewards</a></nav>
          <div className="adult"><Link className="signin" to="/auth">Grown-up sign in</Link><Link className="btn primary" to="/verify-adult">Get started ↗</Link></div>
        </div>
      </header>
      <div className="rail" aria-hidden="true"><i id="fill" /></div>
      <main>
        <section className="pin" id="hero" data-pin>
          <div className="stage">
            <div className="sky" aria-hidden="true" data-m='{"range":[0,1],"y":[0,-90]}'>
              <span className="shoot" style={{ left: "78%", top: "14%", animationDelay: ".4s" }} />
              <span className="shoot" style={{ left: "96%", top: "34%", animationDelay: "2.1s", animationDuration: "8s" }} />
              <span className="shoot" style={{ left: "52%", top: "9%", animationDelay: "3.6s", animationDuration: "6.5s" }} />
              <span className="shoot" style={{ left: "88%", top: "62%", animationDelay: "5.2s", animationDuration: "9s" }} />
              <span className="shoot" style={{ left: "64%", top: "26%", animationDelay: "6.4s", animationDuration: "7.5s" }} />
              <span className="shoot" style={{ left: "40%", top: "18%", animationDelay: "1.3s", animationDuration: "10s" }} />
              <span className="shoot" style={{ left: "99%", top: "8%", animationDelay: "4.4s", animationDuration: "8.5s" }} />
            </div>
            <div className="glow" aria-hidden="true" />
            <div className="rings" aria-hidden="true" data-m='{"range":[0,1],"rot":[0,10],"s":[1,1.25],"o":[1,0.35]}'>
              <svg viewBox="0 0 1000 1000" preserveAspectRatio="none"><ellipse cx="500" cy="500" rx="499" ry="499" fill="none" stroke="#222E4B" strokeWidth="2" vectorEffect="non-scaling-stroke" /><ellipse cx="560" cy="520" rx="380" ry="370" fill="none" stroke="#1A2642" strokeWidth="2" vectorEffect="non-scaling-stroke" /><ellipse cx="610" cy="540" rx="250" ry="250" fill="none" stroke="#222E4B" strokeWidth="1.5" strokeDasharray="4 8" vectorEffect="non-scaling-stroke" /></svg>
            </div>
            <div className="copy" data-m='{"range":[0.05,0.6],"y":[0,-140],"o":[1,0]}'>
              <span className="badge"><span>●</span>BIG IDEAS. AGES 8–12.</span>
              <h1>Small inventor. Big universe.</h1>
              <p>Team up with Bolt. Solve coding puzzles. Bring five floating workshop islands back to life.</p>
              <div className="acts"><Link className="btn primary" to="/verify-adult">Set up our adventure →</Link><a className="btn ghost" href="#map">Explore the missions</a></div>
              <Link className="builder-link" to="/children">Already have a Builder? Pick your profile →</Link>
              <p className="small">A grown-up sets up your profile. Then you take the controls.</p>
              <div className="facts"><span><b>05</b>&nbsp;&nbsp;ISLANDS TO DISCOVER</span><span>ZERO CODING EXPERIENCE NEEDED</span></div>
            </div>
            <div className="scene" role="img" aria-label="Bolt the robot waves from a floating workshop island, with a rocket, energy crystals and two small satellite islands">
              <div className="L" style={{ left: "76%", top: "22%", width: "16%", height: "23%" }} data-m='{"range":[0,0.35],"o":[1,0]}'><img src="/astrobit/route.svg" alt="" /></div>
              <div className="L" style={{ left: "5%", top: "45%", width: "84%", height: "52%" }} data-m='{"range":[0.05,1],"y":[0,90],"rot":[0,3],"s":[1,1.08]}'><img src="/astrobit/island.svg" alt="" /></div>
              <div className="L" style={{ left: "41%", top: "20%", width: "30%", height: "38%" }} data-m='{"range":[0.05,1],"y":[0,40],"s":[1,1.1]}'><img src="/astrobit/workshop.svg" alt="" /></div>
              <div className="L" style={{ left: "69%", top: "50%", width: "18%", height: "11.3%" }} data-m='{"range":[0.05,1],"y":[0,70]}'><img src="/astrobit/launchpad.svg" alt="" /></div>
              <div className="L" style={{ left: "73.5%", top: "35%", width: "9%", height: "17.7%" }} data-m='{"range":[0.12,0.85],"yv":[0,-120],"rot":[0,-8]}'><img src="/astrobit/rocket.svg" alt="" /></div>
              <div className="L" style={{ left: "9.5%", top: "50%", width: "10%", height: "14.7%" }} data-m='{"range":[0.05,1],"x":[0,-90],"y":[0,-60],"rot":[0,-14],"s":[1,1.3]}'><div className="bob slow"><img src="/astrobit/crystals.svg" alt="" /></div></div>
              <div className="L" style={{ left: "14%", top: "17%", width: "28%", height: "45.8%", zIndex: 5 }} data-m='{"range":[0.05,1],"x":[0,-40],"y":[0,-120],"s":[1,1.2]}'><div className="bob wave bolt"><img src="/astrobit/robot.svg" alt="" /></div></div>
              <div className="L" style={{ left: "65%", top: "0%", width: "12.5%", height: "20.6%" }} data-m='{"range":[0,1],"x":[0,140],"y":[0,-200],"rot":[0,12]}'><div className="bob"><img src="/astrobit/satfar.svg" alt="" /></div></div>
              <div className="L" style={{ left: "86%", top: "13%", width: "13%", height: "17.8%" }} data-m='{"range":[0,1],"x":[0,220],"y":[0,-70],"rot":[0,-10]}'><div className="bob slow"><img src="/astrobit/satnear.svg" alt="" /></div></div>
              <span className="sector" data-m='{"range":[0,0.4],"y":[0,-60],"o":[1,0]}'>SECTOR 01 / WORKSHOP</span>
              <div className="hchips" data-m='{"range":[0.05,0.45],"x":[0,-60],"y":[0,30],"o":[1,0]}'><div className="bob slow" style={{ display: "flex", gap: 8, alignItems: "center" }}><span className="chip">move forward</span><i>→</i><span className="chip v">turn right</span></div></div>
              <div className="hello" data-m='{"range":[0.08,0.4],"y":[0,-40],"o":[1,0]}'><b>Hey, inventor. I’m Bolt!</b><span>Ready to power this place up?</span></div>
            </div>
          </div>
        </section>
        <section className="pin" id="steps" data-pin>
          <div className="stage">
            <div className="words" id="words"><h2 className="on">Crack the code.</h2><h2>Bring your world to life.</h2><h2>Unlock the next island.</h2></div>
            <div className="steplab" id="steplab"><b style={{ color: "var(--cyan)" }}>01 / THINK LIKE A CODER</b><span>Snap blocks together. Make things happen.</span></div>
            {/* Keep these video slots available for future autoplay muted loop playsInline videos. */}
            <figure className="clip" style={{ left: "5%", top: 0 }} data-video-slot="code-run" data-m='{"range":[0,0.5],"yv":[105,-75],"rot":[-6,4]}'><span className="tag">Loop</span><div className="in"><div className="grid"><span className="goal" /><span className="mini" /></div><div className="chips"><span className="chip">move forward</span><span className="chip v">turn right</span></div></div></figure>
            <figure className="clip" style={{ right: "6%", top: 0 }} data-video-slot="orbit" data-m='{"range":[0.02,0.55],"yv":[125,-70],"rot":[5,-3]}'><span className="tag">Loop</span><div className="in"><div className="orbit"><span className="ring" /><img className="ws" src="/astrobit/workshop.svg" alt="" /><img className="sat" src="/astrobit/satfar.svg" alt="" /></div></div></figure>
            <figure className="clip" style={{ left: "9%", top: 0 }} data-video-slot="power" data-m='{"range":[0.3,0.78],"yv":[110,-80],"rot":[4,-4]}'><span className="tag">Loop</span><div className="in"><div className="power"><img src="/astrobit/crystals.svg" alt="" /><div className="row">WORKSHOP POWER<b>READY TO CHARGE</b></div><div className="track"><i /></div></div></div></figure>
            <figure className="clip" style={{ right: "4%", top: 0 }} data-video-slot="bolt-wave" data-m='{"range":[0.35,0.85],"yv":[130,-70],"rot":[-5,5]}'><span className="tag">Loop</span><div className="in"><img className="wave bob wave" src="/astrobit/robot.svg" alt="" /></div></figure>
            <figure className="clip" style={{ left: "4%", top: 0 }} data-video-slot="island-steps" data-m='{"range":[0.62,1],"yv":[110,-60],"rot":[3,-5]}'><span className="tag">Loop</span><div className="in"><div className="steps5"><i>01</i><i>02</i><i>03</i><i>04</i><i>05</i></div></div></figure>
            <figure className="clip" style={{ right: "12%", top: 0 }} data-video-slot="launch" data-m='{"range":[0.58,1],"yv":[135,-55],"rot":[-4,4]}'><span className="tag">Loop</span><div className="in"><div className="launch"><img className="pad" src="/astrobit/launchpad.svg" alt="" /><img className="rk" src="/astrobit/rocket.svg" alt="" /></div></div></figure>
          </div>
        </section>
        <section className="pin" id="map" data-pin>
          <div className="stage">
            <div className="maphead"><h2>Five islands. One route.</h2><p>Every puzzle you solve powers up an island and opens the path to the next one.</p></div>
            <div style={{ position: "relative" }}><div className="trackx" id="trackx"><span className="dots" aria-hidden="true" />
              <article className="isle on"><div className="art"><img src="/astrobit/satnear.svg" alt="" /></div><span className="num">01</span><h3>Sequences</h3><p>Steps in the right order.</p></article>
              <article className="isle"><div className="art"><img src="/astrobit/satfar.svg" alt="" /></div><span className="num">02</span><h3>Loops</h3><p>Do it again, without rewriting.</p></article>
              <article className="isle"><div className="art"><img src="/astrobit/satnear.svg" alt="" /></div><span className="num">03</span><h3>Conditionals</h3><p>If this happens, do that.</p></article>
              <article className="isle"><div className="art"><img src="/astrobit/satfar.svg" alt="" /></div><span className="num">04</span><h3>Variables</h3><p>Boxes that remember things.</p></article>
              <article className="isle"><div className="art"><img src="/astrobit/satnear.svg" alt="" /></div><span className="num">05</span><h3>Debugging</h3><p>Find the bug, fix the bug.</p></article>
            </div></div>
          </div>
        </section>
        <section className="finale" id="start">
          <div><h2>Your next big idea starts here.</h2><p className="lead">You write the code. Bolt builds it. Block by block, your programs power up whole islands.</p><div className="pts"><span>Real coding ideas</span><span>Builds you can see</span><span>Zero experience needed</span></div><div className="acts"><Link className="btn primary" to="/verify-adult">Set up our adventure →</Link><Link className="btn ghost" to="/auth">Grown-up sign in</Link></div><p className="small" style={{ marginTop: 16 }}>A grown-up sets up your profile. Then you take the controls.</p></div>
          <div className="forge" id="forge" role="img" aria-label="Bolt runs a program on a holographic console, and a tower of glowing blocks builds itself on the island, one block per line of code">
            <div className="L" style={{ left: "2%", top: "50%", width: "96%", height: "48%" }}><img src="/astrobit/island.svg" alt="" /></div>
            <div className="L" style={{ left: "-1%", top: "55%", width: "9%", height: "10.5%" }}><div className="bob slow"><img src="/astrobit/crystals.svg" alt="" /></div></div>
            <div className="L" style={{ left: "84%", top: "-2%", width: "13%", height: "14%" }}><div className="bob"><img src="/astrobit/satnear.svg" alt="" /></div></div>
            <div className="tower">
              {[0, 1, 2, 3].map((i) => <div className="cube" key={i}><svg viewBox="0 0 60 56"><path d="M0 14L30 0L60 14L30 28Z" fill="#B3A0FF" /><path d="M0 14L30 28V56L0 42Z" fill="#9173FF" /><path d="M60 14L30 28V56L60 42Z" fill="#6651B2" /><path d="M8 20L22 26.5V38L8 31.5Z" fill="#57E5F1" /></svg></div>)}
              <span className="zap" style={{ left: "45%", top: "-4%", "--dx": "-26px", "--dy": "-30px", animationDelay: "3.1s" } as CSSProperties} />
              <span className="zap" style={{ left: "55%", top: "-4%", "--dx": "24px", "--dy": "-34px", animationDelay: "3.15s" } as CSSProperties} />
              <span className="zap" style={{ left: "50%", top: "30%", "--dx": "30px", "--dy": "-14px", animationDelay: "1.5s" } as CSSProperties} />
              <span className="zap" style={{ left: "40%", top: "55%", "--dx": "-28px", "--dy": "-10px", animationDelay: ".7s" } as CSSProperties} />
            </div>
            <svg className="beam" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M9 22 Q 22 -8 44 9" /><path d="M80 30 Q 86 24 87 31" style={{ animationDuration: ".9s" }} /></svg>
            <div className="L" style={{ left: "5%", top: "14%", width: "38%", height: "48.8%", zIndex: 5 }}><div className="bob bolt"><img src="/astrobit/robot.svg" alt="" /></div></div>
            <div className="holo"><div className="bar">BOLT.CODE<span>RUNNING</span></div><ol className="prog"><li className="g">when ▶ run</li><li className="c run">repeat 4 ×</li><li className="v run ind">place block</li><li className="c run ind">move up</li><li className="g run">light up island</li></ol></div>
            <span className="done">BUILD COMPLETE ✓</span>
          </div>
        </section>
      </main>
      <footer><div><b>astrobit</b><span>Little steps. Extraordinary discoveries.</span><span>Made for curious kids + their grown-ups</span></div></footer>
    </div>
  );
}
