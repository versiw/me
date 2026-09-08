# PRD:展示页外框重构与页面转场

## 背景

展示页(src/components/Showcase)当前视口外框是单个 `fixed inset-2.25 line`(1px border),无法参与动画。参考站(heronaiapp.com,Bear Plus 作品)的外框是 4 条独立 line 元素,由 CSS 变量驱动,支持页面转场时的收拢/展开动画。

## 需求

1. **外框改为 4 条独立的 line**,不涉及角标(参考站视觉上也不见角标):
   - 上、下、左、右各一条,绝对定位(fixed 层,相对视口)
   - 4 条线必须能被 GSAP 同时向内收拢/展开
   - 强度:线宽与当前 `.line`(1px)视觉一致
2. **实现同款页面转场切换效果**(参考站的"外框从外向内收拢,再从内到位"动态遮罩):
   - 转场时 4 条线同时向中心收拢,主内容区被裁切成中心小画框,再展开复位
   - 触发时机:后续页面跳转(当前项目为单页,先实现条带式触发或预留钩子)
3. **优先使用 Tailwind CSS 工具类**,重复/大量原子 CSS 时抽 tailwind 工具类(如 `@utility`)

## 约束

- 单页展示(src/pages/index.astro → Showcase),当前无真实多跳转;转场先实现单页内的"演示触发"(如某个锚点或按钮),架构上预留页面级切换接口
- 沿用已有的 Lenis 滚动容器(Showcase 自身 overflow-y-auto)
- 纸纹背景(/已 `bg-img`)与视口边界的既有样式保持,不得影响
- 转场动画用 gsap + 现有 ticker(Lenis 已与 gsap.ticker 集成)

## 验收标准

- [ ] 外框为 4 条独立 line 元素,视觉与当前 1px 外框一致(四边闭合,线距视口边距 2.25 = 框内)
- [ ] 调用转场函数(showcase 内暴露 `transitionShowcase()` 或自定义事件)时,4 条线从外侧向中心收拢,主内容 clip-path 同步收缩到中心,随后展开复位,视觉与参考站一致
- [ ] 转场期间滚动被锁定(Lenis stop),结束后恢复
- [ ] 转场动画期间无滚动条、无布局跳动
- [ ] Tailwind 工具类用于外框线和转场的基础样式;新抽象若与既有 `line`/`line-*` 工具重复,抽象为新 `@utility`
- [ ] `vp run check` 与 `vp run build` 通过
