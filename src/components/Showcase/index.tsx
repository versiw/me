import { useEffect, useRef, type CSSProperties } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import Nav from './Nav';
import Hero from './Hero';
import Skills from './Skills';
import Projects from './Projects';
import About from './About';
import LogSection from './LogSection';
import ResumeSection from './ResumeSection';
import Footer from './Footer';

import 'lenis/dist/lenis.css';

// 展示页骨架:各分区文档流内各占一个视口;滚动容器即模块自身,html/body 不滚动 → 刷新无滚动条闪烁。
// 外框层 = 4 线 + 4 纸纹遮罩板:转场仅 tween --fp-y/--fp-x(位移驱动器),元素的 top/left 等几何固定、
// 动画只走 transform calc → 无布局参与;轴内同值 → 收拢为单线十字
export default function Showcase() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const transitioningRef = useRef(false);
  const tlRef = useRef<gsap.core.Timeline | null>(null); // 转场时防重入/卸载时 kill

  // 整站惯性滚动:滚轮插值(滑行减速),触摸屏保留原生;帧循环挂 gsap.ticker 与动画共用时钟
  useEffect(() => {
    const scroller = scrollerRef.current;
    const content = contentRef.current;
    if (!scroller || !content) return;
    const lenis = new Lenis({
      wrapper: scroller,
      content,
      smoothWheel: true,
      syncTouch: false,
    });
    lenisRef.current = lenis;
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // 锚点转场:收拢(板+线同速至中心十字)→ 驻留点滚动到目标 section → 展开回位。
  // 不用 lenis.stop() 锁滚动:stop 下 scrollTo(immediate/force) 全部失效,滚动切换用容器原生 scrollTo
  useEffect(() => {
    // 滚动落位:首屏锚点(#hero)滚到容器顶(Nav+Hero 同屏),其余落位 section 顶;
    // 原生滚动后回传 Lenis 对齐,避免平滑器把位置拉回
    const scrollToHash = (hash: string) => {
      const scroller = scrollerRef.current;
      if (!scroller) return;
      const target = document.getElementById(hash.slice(1));
      const top = hash === '#hero' ? 0 : target ? target.offsetTop : 0;
      scroller.scrollTo({ top, behavior: 'auto' });
      lenisRef.current?.scrollTo(scroller.scrollTop, { immediate: true });
    };
    const shown = (hash: string) => {
      const scroller = scrollerRef.current;
      if (!scroller || transitioningRef.current) return;
      transitioningRef.current = true;
      // 线心对准视口中心(top/bot、left/right 各轴同值 → 两两重合);初始 9px = 2.25
      const cy = scroller.clientHeight / 2 - 0.5;
      const cx = scroller.clientWidth / 2 - 0.5;
      const fp0 = parseFloat(getComputedStyle(scroller).getPropertyValue('--fp-y')) || 9;
      const tl = gsap.timeline({
        defaults: { duration: 0.8, ease: 'power2.inOut' },
        onComplete: () => {
          transitioningRef.current = false;
        },
      });
      tl.to(scroller, { '--fp-y': `${cy}px`, '--fp-x': `${cx}px` }, 0)
        .add(() => scrollToHash(hash))
        .to({}, { duration: 0.2 }, '>')
        .to(scroller, { '--fp-y': `${fp0}px`, '--fp-x': `${fp0}px` }, '>');
      tlRef.current = tl;
    };
    // 锚点统一拦截 → 转场;修饰键/右键交给浏览器
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey)
        return;
      const a = e.target instanceof Element ? e.target.closest('a[href^="#"]') : null;
      if (!a) return;
      e.preventDefault();
      // URL 同步锚点(pushState 不触发 hashchange,不会引起二次滚动)
      history.pushState(null, '', a.getAttribute('href')!);
      shown(a.getAttribute('href')!);
    };
    // 浏览器前进/后退(或手动改 URL)时,URL 已变化 → 走转场滚动回对应 section;
    // 空 hash(退到无锚点状态)等同回首页
    const onHashChange = () => {
      shown(location.hash || '#hero');
    };
    document.addEventListener('click', onClick);
    window.addEventListener('hashchange', onHashChange);
    // 加载时 URL 已带锚点(刷新/分享链接)→ 直达 section,不走转场(首屏无动画)
    if (location.hash) scrollToHash(location.hash);
    return () => {
      document.removeEventListener('click', onClick);
      window.removeEventListener('hashchange', onHashChange);
      tlRef.current?.kill();
      tlRef.current = null;
    };
  }, []);

  return (
    <div
      ref={scrollerRef}
      className="relative h-screen w-full overflow-y-auto no-scrollbar"
      style={{ '--fp-y': '9px', '--fp-x': '9px' } as CSSProperties}
    >
      {/* 外框层(fixed 不随滚动):几何固定,位移 = calc(var(--fp)-…) → 合成器动画无布局;
          线初始停在 2.25 边距;板为视口全尺平移(纹理不变形),初始露出 9px,收拢后盖至中心 */}
      <div className="pointer-events-none fixed inset-0 z-50" aria-hidden="true">
        {/* 遮罩板:贴视口边,位移控制露出高度,与线同速 */}
        <div
          className="absolute inset-x-0 top-0 h-screen bg-paper"
          style={{ transform: 'translateY(calc(var(--fp-y) - 100vh))' }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-screen bg-paper"
          style={{ transform: 'translateY(calc(100vh - var(--fp-y)))' }}
        />
        <div
          className="absolute inset-y-0 left-0 w-screen bg-paper"
          style={{ transform: 'translateX(calc(var(--fp-x) - 100vw))' }}
        />
        <div
          className="absolute inset-y-0 right-0 w-screen bg-paper"
          style={{ transform: 'translateX(calc(100vw - var(--fp-x)))' }}
        />

        {/* 外框线:各边独立 top/bottom/left 定位,位移 = 变量与 9px(2.25) 之差 */}
        <div
          className="absolute left-2.25 right-2.25 top-2.25 h-px bg-border"
          style={{ transform: 'translateY(calc(var(--fp-y) - 9px))' }}
        />
        <div
          className="absolute left-2.25 right-2.25 bottom-2.25 h-px bg-border"
          style={{ transform: 'translateY(calc(9px - var(--fp-y)))' }}
        />
        <div
          className="absolute top-2.25 bottom-2.25 left-2.25 w-px bg-border"
          style={{ transform: 'translateX(calc(var(--fp-x) - 9px))' }}
        />
        <div
          className="absolute top-2.25 bottom-2.25 right-2.25 w-px bg-border"
          style={{ transform: 'translateX(calc(9px - var(--fp-x)))' }}
        />
      </div>

      <div
        ref={contentRef}
        className="relative min-h-screen w-full p-2.25 text-primary select-none"
      >
        <Nav scrollerRef={scrollerRef} />
        <Hero />
        <Skills />
        <Projects />
        <About />
        <LogSection />
        <ResumeSection />
        <Footer />
      </div>
    </div>
  );
}
