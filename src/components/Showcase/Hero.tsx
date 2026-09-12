// Hero 主区: 整屏一视口 —— 上部 ∞ 粒子画布盒(自适应伸缩) + 下部信息网格(大标语/简介/更多/状态)
// 粒子懒加载:three.js 约 500 KB 独立成 chunk,主 island 的 hydrate 不必等它
import { lazy, Suspense } from 'react';

const InfiniteParticles = lazy(() => import('../InfiniteParticles'));

export default function Hero() {
  return (
    <section id="hero" className="h-[calc(100dvh-90px)] flex flex-col line-b overflow-hidden">
      {/* 粒子区: 允许自适应缩放，绝不顶爆下方内容 */}
      <div className="flex-1 min-h-0 flex items-center justify-center p-4">
        <div className="relative w-full max-w-215 aspect-16/10 max-h-full flex items-center justify-center">
          {/* fallback 拿 null:粒子的 canvas 只能由 JS 生成,本就没有可先渲染的内容 */}
          <Suspense fallback={null}>
            <InfiniteParticles />
          </Suspense>
        </div>
      </div>

      {/* 信息网格: 底部固定高度自适应结构，顶部一条统一的 line-t */}
      <div className="w-full shrink-0 flex flex-col lg:flex-row line-t bg-paper">
        {/* 左侧主标题单元格 (严格占宽 58%，彻底移除多余的 border-b，右侧加单线 line-r) */}
        <div className="lg:w-[58%] p-6 sm:p-8 lg:p-7 xl:p-8 flex items-center lg:line-r">
          <h1 className="font-brand font-bold text-2xl sm:text-3xl md:text-4xl lg:text-[2.9rem] xl:text-[3.4rem] leading-[1.08] tracking-[-0.03em] text-primary">
            把想法做成产品
            <br />
            把过程写成笔记
          </h1>
        </div>

        {/* 右侧信息网格 (严格占宽 42%，上下两行结构) */}
        <div className="lg:w-[42%] flex flex-col justify-between">
          {/* 上半行：简介区 + 了解更多独立单元格 */}
          <div className="flex flex-1 line-b">
            {/* 简介 */}
            <div className="flex-1 p-5 md:p-6 text-xs md:text-[13px] leading-relaxed text-primary line-r flex items-center">
              <p>
                你好, 我是 Versiw, 一名设计驱动的全栈开发者。常用 Next.js、Vite、
                TailwindCSS、shadcn/ui 与 Claude Code 做 Web 全栈, 也写 Electron、Tauri 桌面应用,
                喜欢把复杂的流程做成顺手的工具, 并
                <span className="font-bold underline underline-offset-2 ml-1">
                  持续记录这段旅程
                </span>
                。
              </p>
            </div>

            {/* 了解更多独立单元格 (右下箭头) */}
            <div className="w-32 md:w-36 p-4 md:p-5 flex flex-col justify-between text-brand shrink-0">
              <span className="font-sans text-xs font-bold leading-tight">了解更多</span>
              <span className="self-end text-sm leading-none">→</span>
            </div>
          </div>

          {/* 下半行：静态状态标语栏 (高度固定 38px，底部无需额外线，由 section line-b 兜底) */}
          <div className="h-[38px] px-5 flex items-center font-sans text-xs text-secondary overflow-hidden">
            <div className="flex items-center gap-4 sm:gap-6 whitespace-nowrap">
              <span>专注做事</span>
              <span className="flex items-center gap-1.5">
                <span className="text-[10px]">⬡</span> 更快迭代
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-[10px]">⬡</span> 更少返工
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-[10px]">⬡</span> 更少杂务
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-[10px]">⬡</span> 更多作品
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
