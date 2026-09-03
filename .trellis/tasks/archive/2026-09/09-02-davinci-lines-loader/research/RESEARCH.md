# 原站实现逆向研究:Shopify Editions Winter 2026 (www.shopify.com/editions/winter2026)

> 抓取于 2026-09-02。素材见同目录:winter2026.html(整页)、davinci-lines-svg.html(加载 SVG)、
> davinci-lines-title.svg(标题 SVG)、davinci-lines.css(相关 CSS 规则)、tailwind.css(全部样式)。

## 1. 引入方式(回答"整个引入还是什么")

- **video-modal 背景**(用户提供的片段):`<picture>` 三档断点响应式引入**三个不同的静态 SVG 文件**:
  桌面 `Line_Grid.svg`(1440×890)、平板 `Line_Grid-tablet.svg`(744×1133)、移动 `Frame_2085655272.svg`(392×664 竖屏构图),`<img object-cover aria-hidden>` 作为静态背景层。**这些文件均无动画**(与本地 Line_Grid.svg 内容一致,已抓取比对)。
- **加载动画本体**:页面中是一个**唯一的、内联的 `<svg class="davinci-lines fixed inset-0 overflow-visible w-full">`**(已完整提取,davinci-lines-svg.html,6.4KB → gzip 1.4KB)。全部几何元素(贯穿线、螺旋、圆、中心框)都在**这一个 SVG** 内:
  - `viewBox="550 208 340 464"`(中心框区域);`overflow-visible` 允许线延伸出 viewBox(如 `M-1840 440h5120` 贯穿全屏)至视口外。
  - **答案:动画是"整个引入一个内联 SVG"**,静态背景层才用响应式 picture。

## 2. 加载 SVG 图元清单(坐标原样保留)

| 组 | 元素(id) | 数量 |
|---|---|---|
| 中心框 | rect `davinci-lines__loader` + rect `davinci-lines__complete`(各 340×464,pathLength=1) | 2 |
| 贯穿线 | centered-horizontal、centered-vertical、golden-top/bottom-horizontal-left、golden-lower-horizontal-right、golden-left/right-vertical | 6 |
| 对角虚线 | diagonal-top-left-to-bottom-right、diagonal-top-right-to-bottom-left、diagonal-golden-*(6 条) | 8 |
| 螺旋 | spiral-top-left-vertical-1/2/3 + horizontal-1/2/3;spiral-bottom-right-vertical-1/2/3 + horizontal-1/2/3(**3 层回字形 path,非嵌套 rect!**) | 12 |
| 圆 | circle-bottom-arc(550,886,r550)、right-arc(1440,544,r550)、corner-*(r805×4)、center-small-*(r425×2)、center-large-*(r805×2)、bottom-right/left/top-right/top-left(r917×4,rotate-45) | 16 |
| pattern defs | dashed-stroke(4×1,1px rect opacity-20)、dashed-stroke-vertical(1×4) | 2 |

每个 path/circle/rect 均带 `pathLength="1"`;各元素带 `data-group="1,2,3..."`(滚动重组分组)与
`data-dashed` / `data-dashed-v`(虚线归属);circle 带 `rotate-45`/`-rotate-45` class。

## 3. 动画机制(真实实现)

**核心:归一化描画 + data-active 状态机 + CSS transition(非 animation-delay 排谱,非 WAAPI!)**

```css
.davinci-lines path, .davinci-lines circle {
  stroke: #ffffff26;                /* 白 15% */
  stroke-width: .4px;
  stroke-dasharray: 1; stroke-dashoffset: 1px;   /* 初态隐藏 */
  transition: stroke-dashoffset var(--lines-duration) var(--lines-easing);
  /* --lines-duration: 3s, --lines-easing: cubic-bezier(.34,.22,.47,.84) */
}
.davinci-lines[data-active="N"] [data-group*="N"] { stroke-dashoffset: 0; }  /* 绘制完成 */
```

JS 依次设置 `data-active=1 → 8`(8 组),每组 3s 缓动绘制;下组开始时间由 JS 控制(phase 编排)。

其余关键规则:

- **虚线**:`data-dashed` 元素在 data-active 时切换 `stroke: url(#dashed-stroke)`(pattern 实为 1px 间隔点线)。
- **线条呼吸**:`[data-animating="N"] [data-group*="N"] { animation: 4s ease-out forwards line-fade }`;
  `line-fade: 0% {stroke:#ffffffbf} → 100% {stroke:#ffffff26}`(亮白 75% → 15%)。
- **中心框 loader**:`animation: load-lines var(--lines-loading-duration: 6s) both var(--lines-loading-easing: cubic-bezier(.45,.28,.34,.84))`;
  `load-lines: to { stroke-dashoffset: .2px }`(6s 画到 0.2px,不收口)。
- **中心框 complete**:`stroke-dasharray:1; stroke-dashoffset:1px` + transition(1s, `cubic-bezier(.72,.16,.19,.96)`)
  → `[data-sidebar-loaded=true] .davinci-lines__complete { stroke-dashoffset: 0 }`(与页面内容解锁联动)。
- **颜色**:`.davinci-lines { color:#f7f7ee }`(暖白,title/svg 用 currentColor);`stroke-current` 的 rect 用它;
  `html[data-nav-theme=light] → #909083`。背景体纯黑(用户确认)。
- **中心容器**:`.davinci-lines__container{pointer-events:none; aspect-ratio:340/464; width:min(340px, 100vw-24px); position:fixed; top:50svh; left:50%; translate:-50% -50%; padding:1.25rem; container-type:size}`。
- **标题(svg path 文字)**:`davinci-lines__title`(viewBox="0 0 2927 1269",三词分块
  `title__word--the/--ren/--ssance/--ai` = "The Renaissance Edition",fill currentColor,gzip 8.4KB);
  初态 opacity 0;`[data-initiated=true]` 后 `fade-in .52s`(delay .2s);词 `--ai` 从 translate(-898px) slide .6s 进入。
- **状态机属性**:`data-initiated / data-scrolled / data-sidebar-ready / data-sidebar-loaded / data-active / data-shown / data-animating`(加载后 scroll 联动、sidebar 解锁均走这些,本任务只做 data-active/initiated 序列)。

## 4. 时间节点(用户问的"动画时间节点")

| 组 | 说明 | 时长/缓动 |
|---|---|---|
| group 1-8 依次 data-active | 整体绘制 | `--lines-duration:3s`,easing `cubic-bezier(.34,.22,.47,.84)` |
| 中心框 loader | 6s 完整收合(至 0.2px) | `--lines-loading-duration:6s`,`cubic-bezier(.45,.28,.34,.84)` |
| 中心框 complete | 与 sidebar 解锁联动 1s | `--lines-complete-duration:1s`,`cubic-bezier(.72,.16,.19,.96)` |
| line-fade | 线条呼吸 4s | ease-out |
| 标题 fade-in | `.52s` delay `.2s` | `cubic-bezier(.25,.46,.45,.94)` |
| 标题 slide | `.6s`(delay=fade 后),slide 位移 -898px | `cubic-bezier(.72,.16,.19,.96)` |

8 组依次激活的总节奏:加载帧约为 6s 量级(与原站 lines-loading-duration 一致)。

## 5. JS 状态机逆向(2026-09-02 二次挖掘,_locale.editions.winter2026-DhFtUF58.js)

```js
const Co = {0:7, 1:6, 2:6, 3:5, 4:4, 5:3, 6:2, 7:1, 8:8, 9:7, 10:6, 11:5, 12:4};
// Zustand subscribe(activeSection):
//   activeSection=null → data-active=""
//   a = Co[activeSection] → data-active=String(a)   ← 滚动区段 → 组号
//   首次非空组:data-animating=String(a)(触发 line-fade),此后 ""
//   data-shown = 已累积组集合(滚动后保留已见组)
```

**决定性结论**:
- 加载瞬间 = hero 区段(section 0)→ **data-active="7"**,data-animating="7"(首帧同时设置)。
- **加载时只绘制 data-group 含 "7" 的元素**(22 个:centered-h*、centered-v、golden-top/lower-h、golden-left/right-v、diagonal 2 条、spiral TL/BR 12 条、circle-center-small 2 个);其余组(corner 805、arc 550、center-large 805、R917 四角、diagonal-golden-*)属于滚动后续区段,**加载画面不出现**。
- 原站无"分批依次描画":同组元素同帧 start;两条无 data-group 的线(golden-bottom-horizontal、diagonal-golden-right-to-bottom-right)无激活规则,永不显示(推测为迭代遗留)。
- 虚线走 pattern:data-dashed="1" → stroke:url(#dashed-stroke),与 data-dashed-v → 竖版 pattern;只存在于 active=1/6/7/8(水平)与 1/2(垂直)时。
- 线条 loading 观感:data-animating 与 data-active 同帧 → `line-fade 4s ease-out forwards`(from #ffffffbf to #ffffff26)与 3s 描画**同时**进行(线 = 亮白起画 + 4s 渐暗)。
- complete 框由 `sidebarLoaded`(网络时序)触发,随后 `getAnimations().finished` → sidebarReady(加载完成信号流)。

## 6. 与原描述文档的关键差异(实现时以原站为准)

1. 斐波那契螺旋 = **3 层回字形 path**(TL/BR 各 6 条),不是"144-13 六个嵌套 rect 方块"。
2. 中心框是 **SVG rect** + currentColor(非 DOM div)。
3. 虚线用 **pattern**(非 stroke-dasharray 属性)。
4. 驱动机制 = **CSS transition + JS 递进 data-active**(不是每元素 animation-delay,也不是 WAAPI 定时计算)。
5. 标题 = **SVG path 字体**(非 HTML 文本)。
6. 圆有 rotate-45 动画类,且坐标/半径与 Line_Grid.svg 不同(多了 r917、r550 等)。
7. 性能关键:整页动画总 JS = 仅一个数据状态递进器;计算全在 CSS。
