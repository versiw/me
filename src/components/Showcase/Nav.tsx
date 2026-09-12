// 顶部导航:sticky 吸顶(与外框顶线同位 9px),向下滚动滑出隐藏、向上滚动滑入显示;
// 方向由 scroller.scrollTop 差值判定,菜单项为真实锚点,点击由 Showcase 接管转场;
// 「联系我」暂无对应分区,与「关于我」同样回落 #hero。
import { useEffect, useRef, type RefObject } from 'react';
import gsap from 'gsap';

export default function Nav({ scrollerRef }: { scrollerRef: RefObject<HTMLDivElement | null> }) {
  const headerRef = useRef<HTMLElement>(null);

  // 显隐仅发生在吸附后;吸附边界取挂载时刻 offsetTop(首屏恒 9px,吸附后 offsetTop 随滚动变化不再可信)
  useEffect(() => {
    const header = headerRef.current;
    const scroller = scrollerRef.current;
    if (!header || !scroller) return;

    const stickyTop = header.offsetTop;
    let lastY = scroller.scrollTop;
    let shown = true;
    const tick = () => {
      const y = scroller.scrollTop;
      const delta = y - lastY;
      lastY = y;
      const hide = delta > 0 && y > stickyTop && shown;
      const show = delta < 0 && !shown;
      if (!hide && !show) return;
      shown = !shown;
      gsap.to(header, {
        y: hide ? '-110%' : '0%',
        duration: 0.45,
        ease: 'power3.inOut',
        overwrite: 'auto',
      });
    };
    scroller.addEventListener('scroll', tick, { passive: true });
    return () => scroller.removeEventListener('scroll', tick);
  }, [scrollerRef]);

  return (
    <header
      ref={headerRef}
      className="sticky top-2.25 z-40 h-18 flex line bg-paper font-sans text-sm will-change-transform"
    >
      {/* 左侧区域:Logo / 品牌名称 (占宽 50%),点击回首页(转场滚回顶部) */}
      <div className="w-1/2 flex items-center px-6 line-r">
        <a
          href="#hero"
          className="font-sans font-bold text-lg md:text-xl tracking-tight text-primary uppercase"
        >
          Versiw's Blog
        </a>
      </div>

      {/* 右侧区域:4 个等分单元格 (占宽 50%,每个单元格左上对齐排版) */}
      <nav className="w-1/2 grid grid-cols-4 h-full">
        <div className="h-full p-3 flex flex-col justify-between line-r text-terriary">
          <a href="#hero" className="font-sans leading-[1.1]">
            关于我
          </a>
        </div>

        <div className="h-full p-3 flex flex-col justify-between line-r text-terriary">
          <a href="#skills" className="font-sans leading-[1.1]">
            技能
          </a>
        </div>

        <div className="h-full p-3 flex flex-col justify-between line-r text-terriary">
          <a href="#projects" className="font-sans leading-[1.1]">
            项目
          </a>
        </div>

        {/* 联系我 (品牌橙红;暂无对应分区,与「关于我」同样回落 #hero) */}
        <div className="h-full p-3 flex flex-col justify-between text-brand">
          <a href="#hero" className="font-sans leading-[1.1]">
            联系我
          </a>
        </div>
      </nav>
    </header>
  );
}
