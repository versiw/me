# 达芬奇几何线条加载页(视觉阶段)· v3 修订

> 修订说明:用户反馈"搞复杂了 + 刷新后线条闪动/位置变化"。v3 删去 JS 状态机方案,
> 回归**原生 SVG 直接控制线条动画**(pathLength 归一化 + CSS 描边动画 + 原站时序),零 hydration。

## Goal

复刻原站 (www.shopify.com/editions/winter2026) 几何线条加载页的动画效果与**动画时序**:
纯黑背景 + 暖白线条,由原生 SVG `pathLength="1"` 描边动画直接驱动,依次呈现
骨架延展 → 斐波那契螺旋回字生长 → 中心框闭合 + 标题淡入 → 定格。性能与快速加载为硬性约束。

## Background

- 几何资产:用户 `public/svgs/Line_Grid.svg`(1440×890 黄金矩形骨架,14 图元:7 实线 + 3 虚线 + 4 相切圆,坐标即最终视觉基准)。
- 唯一需动态补充的图形:斐波那契黄金比例螺旋矩形 — 仿原站绘制:TL (550,208) 区与 BR (890,544) 区各 6 条回字 path(3 层嵌套方框折线,坐标已从原站提取于 `research/davinci-lines-svg.html`)。
- 原站时序数值(研究结论,`research/RESEARCH.md`):描边 `3s cubic-bezier(.34,.22,.47,.84)`;组步进 ≈0.6s;loader 框 6s 收合至 0.2px;complete 框 1s `cubic-bezier(.72,.16,.19,.96)` 闭合;标题 fade 0.52s、slide 0.6s。

## Requirements

### R1 — 原生 SVG 动画控制(核心机制)

- 内联 SVG(viewBox `0 0 1440 890`,`preserveAspectRatio="xMidYMid meet"`,全屏居中)。
- **每个线/圆/矩形添加 `pathLength="1"`**,隐藏态 `stroke-dasharray:1; stroke-dashoffset:1`,`@keyframes` 描画至 0。
- 动画编排 = **CSS keyframes + animation-delay 排谱**(原站时序数值),无 JS 状态机、无逐帧计算、无 hydration(`client` 指令)。
- 带固有 `stroke-dasharray` 的虚线图元不做描画动画,以 opacity 渐入处理。
- 圆环描画动画独立正确(4 圆)。

### R2 — 图层与时序(复刻原站)

| 阶段 | 元素 | 动画(duration / delay / easing) |
|---|---|---|
| 骨架 | 7 实线 + 4 圆 | 描画 3s / 0s / `cubic-bezier(.34,.22,.47,.84)` |
| 骨架 | 3 虚线 | opacity 渐入 1.2s / 0.3s / ease-out |
| 螺旋 | 12 回字 path(TL+BR,各 3 层,层间 0.6s 步进) | 描画 3s / 0.9s + k×0.6s / 同上 |
| 中心框 | rect(550,208,340,464)单框 | 连续描画 6s / 0s / `cubic-bezier(.45,.28,.34,.84)`(完整闭合;开始与时长同原站 loader,去掉"0.2px 缺口 + 二次补画"的卡顿设计) |
| 标题 | HTML 文本 "The Renaissance Edition"(居中 overlay,系统字体) | 淡入 0.52s / 0.2s / ease-out(原站 data-initiated) |
| 线条呼吸 | 全部描画线 | 4s 渐暗(亮白 `#ffffffbf` → 15% `#ffffff26`),与绘制同帧开始 / ease-out |

总时长 ≈ 6s 完全定格(线条呼吸 4s 同步,中心框 6s 闭合)。

### R3 — 颜色与背景

- 背景纯黑 `#000`;线条描画/显示期亮白 `#ffffffbf`(75%),绘制完成后 4s 呼吸渐暗至 `#ffffff26`(15%)定格;中心框/标题 `#f7f7ee` 暖白;线宽 0.4px,中心框 1px。

### R4 — 性能与快速加载(硬性)

- 新增客户端 JS = **0**(组件纯静态 SSR 输出,无 client 指令);无动画库/字体/外链请求;SVG 标记 gzip ≈ 3KB。

### R5 — 适配与可访问性

- meet 缩放:375×812 与 1440×900 构图完整(黄金矩形自动 letterbox 居中),标题窄屏 ≤ 100vw-24px。
- `prefers-reduced-motion: reduce`:动画禁用,直接呈现定格态。

## Acceptance Criteria

- [ ] AC1:刷新页面,线条从隐藏态依次描画出现(骨架 → 螺旋 → 中心框 → 标题),**全程线条位置固定不闪动**。
- [ ] AC2:几何内容 = Line_Grid.svg 14 图元(坐标照抄)+ 螺旋 12 回字 path(原站坐标)+ 中心单 rect;全部 `pathLength="1"`。
- [ ] AC3:中心框位于视口中心(黄金矩形构图),标题居中于框内,终态完整闭合。
- [ ] AC4:动画时序与原站一致:描边 3s `cubic-bezier(.34,.22,.47,.84)`、螺旋组步进 0.6s、中心框 4.8s 起连续描画 3s(12s 无卡顿缺口)、标题 fade 0.52s @8s、线条呼吸 4s @8.4s;总长约 8.5s 定格。
- [ ] AC4b:中心框描画为单矩形连续闭合,不存在"缺口停留/突然闭合"现象。
- [ ] AC5:动画全部由 CSS keyframes/transition 驱动;页面 JS 运行时 0(无水合);无 JS 状态机。
- [ ] AC6:网络请求增量 0;加载页新增 JS 0KB。
- [ ] AC7:`prefers-reduced-motion: reduce` 下无动画,直接定格态。
- [ ] AC8:375×812 与 1440×900 构图完整、无溢出、标题可读。
- [ ] AC9:dev / build / preview 正常,控制台无报错;Chrome 与 Safari 动画正常。

## Out of Scope(不变)

动画结束后的内容解锁、滚动联动、浅色主题、多语言、移动独立构图、品牌文案定稿。

## Risks

- 螺旋坐标从原站 550/208 窗口坐标复制到 1440×890 坐标系:原站 SVG 坐标本来就是绝对 1440 系(仅 viewBox 窗口不同),复制后无需变换(已在 research 校验)。
- 虚线图元与描画动画不兼容 → opacity 渐入(原站以 pattern 实现,效果一致)。
