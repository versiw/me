# 设计文档:达芬奇几何线条加载页(视觉阶段)· v3

> v3:用户否决 JS 状态机方案(刷新后线条闪动/位移),定调**原生 SVG 直接控制线条动画、保持原站动画时序**。
> 本版是唯一生效设计;v2(数据驱动状态机)废弃。

## 1. 架构

```
Layout.astro
└─ <DavinciLoader />                       ← React 组件,纯静态 SSR(无 hooks/state,无 client 指令,零 hydration)
   └─ .davinci-lines__stage                ← fixed inset-0;背景 #000;grid 居中;pointer-events:none;z-index:10
      ├─ svg.davinci-lines (viewBox="0 0 1440 890", preserveAspectRatio="xMidYMid meet", 100%×100%)
      │  ├─ g.dl-skeleton                  ← Line_Grid.svg 14 图元(line 转 path,坐标逐位保真)
      │  ├─ g.dl-spiral                    ← 斐波那契螺旋:原站 12 条回字 path(TL/BR 各 6,d 属性直接复制)
      │  └─ g.dl-frame                     ← 中心双 rect(550,208,340,464):dl-loader + dl-complete
      └─ .davinci-lines__title             ← HTML 文本 "The Renaissance Edition"(居中 overlay,系统 serif)
```

- **viewBox 修正(修复"闪动/位移"根因)**:v2 用原站 `viewBox="550 208 340 464"` + overflow-visible,在非 1440×890 视口下内容溢出错位;v3 回到用户资产坐标系 `0 0 1440 890`,`meet` 缩放 letterbox 居中,中心框 (720,445) 恒在视口中心,任意视口构图固定。
- **动画引擎**:全部图元 `pathLength="1"`;隐藏态 `stroke-dasharray:1; stroke-dashoffset:1`;描画经 CSS keyframes 至 0。编排 = **animation-delay 排谱**(一次性静态声明),**无 JS 状态机、无逐帧计算、无 hydration**。CSS 采用"终态默认 + `@media (prefers-reduced-motion: no-preference)` 内启用动画"模式,JS 禁用/动画降级时直接呈现构图。
- **line → path**:`<line>` 的 `pathLength` 在部分引擎的兼容性弱于 path,统一转 `<path d="M{x1} {y1}L{x2} {y2}">`,原坐标逐位保真。
- **虚线**:3 条带 `stroke-dasharray="0.8 3.2"` 的图元不做描画动画(与固有 dasharray 冲突),改 opacity 0→1 渐入(元素自持 stroke-opacity 0.2/0.1,终态正确)。

## 2. 时序(原站数值,总 ≈8.5s)

| 元素 | 动画 | duration / delay / easing |
|---|---|---|
| 骨架实线 7 + 圆 4 | 描画 dl-draw + 呼吸 dl-line-fade | 3s/0s + 4s(渐暗)/8.4s,`cubic-bezier(.34,.22,.47,.84)` |
| 虚线 3 | dl-fade(opacity) | 1.2s / 0.3 / 0.45 / 0.6s / ease-out |
| 螺旋 TL+BR(层 1→3,由外向内) | 描画 dl-draw | 3s / 0.9 / 1.5 / 2.1s(同层同 delay) |
| dl-frame 中心框(单 rect) | 描画 dl-draw(连续闭合,无缺口) | 3s / 4.8s / `cubic-bezier(.34,.22,.47,.84)` |
| 标题文案 | dl-fade-title | 0.52s / 8s / ease-out |

- 线条亮度:显示/绘制期亮白 `#ffffffbf`;8.4s 起全部线条 4s 呼吸渐暗至 `#ffffff26` 定格(还原原站 line-fade 观感;中心框/标题保持 #f7f7ee 不参与渐暗)。
- 所有 delay 经元素内联 `--dl-d` 变量注入;duration/easing 集中于**组件根 `.davinci-lines__stage`**(CSS 变量随继承仅在组件内生效,不污染全局作用域)。

## 3. 颜色与排版

- 背景 `#000`;线:显示期 `#ffffffbf`(白 75%),呼吸渐暗后 `#ffffff26`(15%)、`stroke-width:.4px`;中心框与标题 `#f7f7ee`(暖白)、框线 1px。
- 标题:`serif 系统栈`、`letter-spacing:.22em`、`text-transform:uppercase`、`clamp(11px,1.8vw,15px)`,容器 `width:min(304px,60vw)`(中心框内框)。

## 4. 性能

- 新增客户端 JS = **0KB**(组件 SSR 静态;无 client 指令)。无动画库/字体/外链请求。
- SVG 标记:骨架(≈2.6KB 原样)+ 螺旋 12 path + 双 rect ≈ 4KB,内联于 HTML,gzip ≈3KB。

## 5. 适配 / 可访问性

- `preserveAspectRatio="xMidYMid meet"` + 100%×100%:任何视口黄金矩形完整居中,375×812 与 1440×900 均构图完整(AC8)。
- `prefers-reduced-motion: reduce`:动画不在 no-preference 媒体块内→ 元素回退终态(描画完成、opacity 终值),静态定格(AC7)。

## 6. 文件

| 文件 | 动作 |
|---|---|
| `src/components/DavinciLoader.tsx` | 重写为纯静态(几何常量 + 标题 DOM) |
| `src/components/davinci-loader.css` | 重写(终态默认 + no-preference 动画) |
| `src/components/davinci-lines-geometry.ts` | **删除**(旧常量文件) |
| `src/layouts/Layout.astro` | `<DavinciLoader />`(去 client:load) |
| `astro.config.mjs` / `package.json` | 保留(@astrojs/react 继续使用) |

## 7. 回滚

删除 `<DavinciLoader />` 与新文件即回原状;`public/svgs/Line_Grid.svg`、`astro.config.mjs` 集成仍可保留(无副作用)。
