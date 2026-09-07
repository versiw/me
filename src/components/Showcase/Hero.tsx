// Hero 主区:整屏一视口 —— 上部 ∞ 粒子画布盒(伸缩区)+ 下部信息网格(大标语/简介/更多/状态)
import InfiniteParticles from '../InfiniteParticles';

export default function Hero() {
  return (
    <section id="hero" className="h-[calc(100dvh-90px)] flex flex-col line-b">
      {/* 粒子区:占满剩余空间,∞ 盒居中;Nav 悬浮于其上方 */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-full max-w-215 aspect-16/10">
          <InfiniteParticles />
        </div>
      </div>

      {/* 信息网格:左侧 58% 主标语 + 右侧 42% 简介/了解更多/状态标语 */}
      <div className="w-full flex flex-col lg:flex-row line-t">
        {/* 左侧主标题单元格 (严格占宽 58%) */}
        <div className="lg:w-[58%] p-8 md:p-10 flex items-center border-b lg:border-b-0 lg:line-r">
          <h1 className="font-brand font-bold text-3xl sm:text-4xl md:text-5xl lg:text-[3.8rem] xl:text-[4.2rem] leading-[0.92] tracking-[-0.04em] text-primary">
            把想法做成产品
            <br />
            把过程写成笔记
          </h1>
        </div>

        {/* 右侧信息网格 (严格占宽 42%,上下两行结构) */}
        <div className="lg:w-[42%] flex flex-col justify-between">
          {/* 上半行：简介区 + 了解更多独立单元格 */}
          <div className="flex flex-1 line-b">
            {/* 简介 */}
            <div className="flex-1 p-6 md:p-8 text-[13px] md:text-sm leading-relaxed text-primary line-r flex items-center">
              <p>
                你好,我是 Versiw,一名设计驱动的全栈开发者。常用 Next.js、Vite、
                TailwindCSS、shadcn/ui 与 Claude Code 做 Web 全栈,也写 Electron、Tauri
                桌面应用,喜欢把复杂的流程做成顺手的工具,并
                <span className="font-bold underline underline-offset-2">持续记录这段旅程</span>。
              </p>
            </div>

            {/* 了解更多独立单元格 (右下箭头) */}
            <div className="w-36 md:w-44 p-5 md:p-6 flex flex-col justify-between text-brand">
              <span className="font-sans text-xs font-bold leading-tight">了解更多</span>
              <span className="self-end text-sm leading-none">→</span>
            </div>
          </div>

          {/* 下半行：静态状态标语栏 (高度固定 40px) */}
          <div className="h-10 px-5 flex items-center font-sans text-xs text-secondary overflow-hidden">
            <div className="flex items-center gap-6 whitespace-nowrap">
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
