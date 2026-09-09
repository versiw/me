// 顶部导航:文档流内第一屏顶部(距视口 9px 即框内),左侧品牌 + 右侧 6 等分菜单单元格。
// line 四周闭合(顶/左/右与视口外框同位重合),为后续 gsap 吸顶效果预留完整的框条。
// 菜单项为真实锚点(<a href="#section">),点击由 Showcase 接管转场;布局/样式维持原样,仅 span → a
export default function Nav() {
  return (
    <header className="h-18 flex line font-sans text-sm">
      {/* 左侧区域:Logo / 品牌名称 (占宽 50%),点击回首页(转场滚回顶部) */}
      <div className="w-1/2 flex items-center px-6 line-r">
        <a
          href="#hero"
          className="font-sans font-bold text-lg md:text-xl tracking-tight text-primary uppercase"
        >
          Versiw's Blog
        </a>
      </div>

      {/* 右侧区域:6 个等分单元格 (占宽 50%,每个单元格左上对齐排版) */}
      <nav className="w-1/2 grid grid-cols-6 h-full">
        {/* 关于我 */}
        <div className="h-full p-3 flex flex-col justify-between line-r text-terriary">
          <a href="#about" className="font-sans leading-[1.1]">
            关于我
          </a>
        </div>

        {/* 技能 */}
        <div className="h-full p-3 flex flex-col justify-between line-r text-terriary">
          <a href="#skills" className="font-sans leading-[1.1]">
            技能
          </a>
        </div>

        {/* 项目 */}
        <div className="h-full p-3 flex flex-col justify-between line-r text-terriary">
          <a href="#projects" className="font-sans leading-[1.1]">
            项目
          </a>
        </div>

        {/* 日志 (右下角带折角角标 ⌟) */}
        <div className="relative h-full p-3 flex flex-col justify-between line-r text-terriary">
          <a href="#log" className="font-sans leading-[1.1]">
            日志
          </a>
        </div>

        {/* 简历 */}
        <div className="h-full p-3 flex flex-col justify-between line-r text-terriary">
          <a href="#resume" className="font-sans leading-[1.1]">
            简历
          </a>
        </div>

        {/* 联系我 (品牌橙红 + 右下角箭头) */}
        <div className="relative h-full p-3 flex flex-col justify-between text-brand">
          <a href="#footer" className="font-sans leading-[1.1]">
            联系我
          </a>
        </div>
      </nav>
    </header>
  );
}
