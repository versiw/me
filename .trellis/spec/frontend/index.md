# Frontend Development Guidelines

> 本项目的实际前端约定(基于代码库现状提炼,非通用教程)。

---

## 项目形态

Astro 7 + React 19 混合的单页型个人展示站(src/components/Showcase 是实际主页),后期可能集成 blog。
**静态部署、高性能 / Lighthouse 评分为第一优先级**——所有前端决策都从这个约束倒推:
页面最终都是纯静态产物,JS 只在 `client:load` 等显式 mark 处加载。

## 技术栈锚点

| 领域 | 选择 | 依据 |
|------|------|------|
| 框架 | Astro(岛屿架构)+ React 19(交互组件) | `src/pages/index.astro` + `Showcase` 组件 |
| 样式 | Tailwind CSS 4(@theme + @utility) | `src/index.css` 全量主题/工具类都在此 |
| 动画 | GSAP + Lenis(+ 已有 gsap.ticker 时钟) | `Showcase/index.tsx` 的转场与 Smooth Scroll |
| WebGL | Three.js(`InfiniteParticles` 粒子画布) | 唯一重型运行时成员,仅在 Hero 使用 |
| 字体 | BT Grotesk 系列(woff2,用户自备) | `src/assets/fonts/` |
| 构建 | `vp`(包管理器/命令统一入口) | 见 CLAUDE.md(禁用裸 pnpm/npm) |

## 核心原则

1. **高性能先于便利**:效果类动画集中在一个模块内(Showcase),不与页面主体耦合;SSR 直出、无 JS 也能读。
2. **效果复刻有纪律**:像素级复刻参考站(heronaiapp.com)时,样式原子类/Tailwind token 优先;若需复刻源码动画,用 `research/` 归档证据后以注释引用,不散落魔法数字。
3. **工具类优先**:重复的 CSS 模式升级为 `@utility`(如 `line`/`bg-paper`/`no-scrollbar`),不长篇重复内联样式。
4. **双语文案与字体体系已定**:mono 文本走 `font-mono` 链(500/uppercase/0 字距/1.1 行高),常规文本 `font-sans`/`-0.02em` 字距。

## Guidelines Index

| Guide | Description |
|-------|-------------|
| [Directory Structure](./directory-structure.md) | 项目文件组织与放置规则 |
| [Component Guidelines](./component-guidelines.md) | 组件结构、props、命名、生命周期 |
| [Hook Guidelines](./hook-guidelines.md) | 自定义 hook 与客户端副作用模式 |
| [State Management](./state-management.md) | 状态管理(本项目为局部 useState/useRef 为主) |
| [Quality Guidelines](./quality-guidelines.md) | 质量度量、测试、构建、禁止模式 |
| [Type Safety](./type-safety.md) | TS 类型组织与约定 |

---

**Language**: 文档中文为主,保留代码标识符英文(遵循项目既有注释风格)。
