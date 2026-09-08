# Directory Structure

> 文件放哪、怎么组织。基于当前代码库布局。

---

## 顶层结构

```
src/
├── pages/            # 路由入口(当前仅 index.astro → Showcase)
│   └── index.astro
├── layouts/          # 全局骨架
│   └── Layout.astro  # <html>/<head>/<body> + 全局 import('...index.css')
├── components/       # 共享组件与业务分区
│   ├── InfiniteParticles.tsx   # WebGL ∞ 粒子(仅 Hero 用)
│   ├── DavinciLoader.tsx       # 加载页门卫(当前被注释,未挂载)
│   └── Showcase/     # 主页业务组件(占位+命名分区)
│       ├── index.tsx           # 分区容器 + 外框转场 + 锚点拦截
│       ├── Nav.tsx / Hero.tsx / Projects.tsx / About.tsx
│       ├── LogSection.tsx / ResumeSection.tsx   # 占位 section
│       └── Footer.tsx
├── index.css         # 全局样式:Tailwind 4 @theme + @utility + body 背景
└── assets/           # 静态资产
    ├── fonts/        # woff2(BT Grotesk ×4)
    └── svg/          # bg.svg(纸纹) / bg-deco.svg(格栅)
```

## 放置规则

1. **路由页面** = `src/pages/`,Astro 组件为 `.astro` 后缀,React 组件为 `.tsx`。
2. **一个 URL 分区一个文件**:主页各屏独立文件(Nav/Hero/...)= `Showcase/` 下平铺,不在单个 index.tsx 中堆叠。
3. **重型运行时组件独立**:WebGL/大逻辑(DavinciLoader、InfiniteParticles)放 `components/` 顶层,不就近塞在 Showcase 里(便于将来复用/剔除)。
4. **资产归类**:字体→`assets/fonts/`,SVG→`assets/svg/`,CSS 变量路径引 `./assets/...`。
5. **研究存档**:复刻参考站的 HTML/CSS/SVG 证据放任务 `research/`;不放入 src,源码注释只引用不内嵌。

## 反模式

- ❌ 在 `src/pages/index.astro` 内写长业务 JSX(页面只做 props/import 转发)。
- ❌ 把 React 组件放 Astro 布局内(布局应仅作壳,组件经 `client:load` 挂在页面)。
- ❌ 样式文件零散分布(全量样式收敛到 `src/index.css`,组件不建 `*.css`)。

## 约定:`.astro` vs `.tsx`

- `.astro` = 壳/结构/SEO(元信息、script/link);默认零 JS。
- `.tsx`(React)= 带交互/状态的部件,按需 `client:load`;纯静态展示的 React 组件首选 `.astro` 而非 `.tsx`,除非复用既有 React 生态。
