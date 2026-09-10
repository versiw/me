# 项目展示分区:4 个精选项目的展示与交互

## Goal

在展示页新增「项目」分区(`#projects`):以 2 列大卡片呈现 4 个精选项目,前两个项目用转码后的预览视频展示(悬停起播、首屏零全片流量)。沿用整站线条网格风格与设计 token,承接 Skills 与 About 之间的滚动位置。

## Background / 已知事实

- **现状**:[Projects.tsx](src/components/Showcase/Projects.tsx) 原为空占位,Nav 的「项目」入口已指向 `#projects`;转场由 `Showcase/index.tsx` 的锚点拦截统一处理,本分区不改动转场逻辑。
- **版式参考**:原站 heronaiapp.com 的「Your design tools do what you tell them, nothing more」区块(用户提供截图)。结构规格与 token 映射见 [research/heron-projects-section.md](./research/heron-projects-section.md)。
- **视频素材**:用户提供 2 个项目的 4K/60fps PC 录屏(7–8.5 秒、无音轨,合计 33.5MB)。转码规格与命令见 [research/video-transcode-spec.md](./research/video-transcode-spec.md)。
- **部署约束**:静态部署到 Cloudflare,**单个静态文件必须 < 25MB**。
- **技术约束**:见 `.trellis/spec/frontend/`(静态优先 / Lighthouse 优先、Tailwind token 与 `@utility` 优先);分区布局与视频预览约定已写入 component-guidelines 的「分区布局模式」。
- **设计资产**:`--color-brand(#fa3600)` 等 token;`font-mono`(500/uppercase/0.08em);`line-*`(实线)、`line-dash-*`(虚线)、`grid-2-divide`(网格分隔)。

## Requirements

- **R1 版式**:顶部标题区(大标题 + 右侧说明 + 品牌色小方块);主体为 **2 列大卡片**,每张自上而下:mono 标签 + `[0N]` 编号 → **16:9 预览位** → 加粗标题 + 浅色描述。分区高度随内容自适应(桌面约 1.4 屏,不再锁定一屏)。
- **R2 交互**:整卡可点击,新标签页打开项目外链;悬停时标签与编号转品牌色、外链指示淡入;键盘可聚焦、焦点可见。
- **R3 预览位**:固定 16:9;有视频的项目渲染 `<video>`,无视频的沿用文本占位。转码产物置于 `public/projects/`,以 `video`/`poster` 字段引用。
- **R4 视频加载性能**:`preload="metadata"` 不拉全片;悬停/聚焦才起播、离开即暂停;`muted`/`loop`/`playsInline`;`prefers-reduced-motion` 用户不起播;预览视频对读屏无信息量故加 `aria-hidden`;**单文件 ≤ 25MB**。
- **R5 动效**:不做入场/滚动动效;仅保留 CSS 悬停微交互与视频起播这一最小 JS(无 state、无 effect)。
- **R6 内容**:01/02 用真实项目名(AI 视觉模型训练平台 / 多人协作图片标注平台)+ 预览视频,描述与外链暂为占位;03/04 的文案与外链全部占位。
- **R7 响应式**:窄视口降为单列堆叠,内容完整可读、无横向滚动。

## Out of Scope

- 不做项目详情页或弹层:点击整卡直接跳外链。
- 不做筛选、分类、排序、分页。
- 不做 CMS 或数据层:文案与链接硬编码于组件内。
- 不做音轨:源素材无音轨,转码时显式去除。
- 不做多码率自适应(HLS/DASH):已压到约 1.1MB/个,单码率足够。
- 不改动 `Showcase/index.tsx` 的锚点转场与 Lenis 滚动逻辑。

## Acceptance Criteria

- [ ] ≥1024px 时主体呈 2 列卡片网格,偶数列有竖分隔线,第 2 行卡片有横分隔线。
- [ ] 每张卡片自上而下渲染:mono 标签(左)+ `[0N]` 编号(右)、16:9 预览位、加粗标题、浅色描述,无溢出裁切。
- [ ] 01/02 卡片显示视频封面且界面细节可辨;03/04 卡片显示 16:9 文本占位。
- [ ] 悬停任一卡片:标签与编号转品牌色、外链指示淡入;有视频的卡片开始播放,移开后暂停。
- [ ] 键盘 Tab 依次聚焦 4 张卡片且焦点可见;聚焦时视频起播,失焦暂停。
- [ ] 点击任一卡片在新标签页打开其外链(`target="_blank"` + `rel="noopener noreferrer"`)。
- [ ] 首屏(未悬停)不加载任何视频全片;单个视频文件 ≤ 25MB。
- [ ] 视口 <1024px 时为单列堆叠,无横向滚动条。
- [ ] `vp check`、`vp run check`、`vp run build` 全部通过。

## 后续待办(非本任务验收)

- 替换 01/02 的描述文案与真实外链。
- 补 03/04 的项目文案、外链与预览视频(转码流程见 research/video-transcode-spec.md)。
- 顶部标题区真实文案。
