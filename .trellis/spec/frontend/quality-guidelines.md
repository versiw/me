# Quality Guidelines

> 质量度量、命令、禁止模式。项目以"静态部署 + 高性能/Lighthouse 第一优先级"为准绳。

---

## 质量门(提交前必跑)

| 命令 | 作用 |
|------|------|
| `vp run check` | Astro 类型检查(0 errors;允许的 hint 需注明) |
| `vp run build` | 静态构建成功 |
| `vp lint` | 格式/lint |

> 注:`vp` 是唯一依赖命令入口(CLAUDE.md),裸 `pnpm`/`npm` 会因 packageManager 约束报错。

## 性能红线(Lighthouse/静态产出导向)

1. **静态优先**:内容 SSR 直出,JS 只在 `client:load`/`client:only` 处加载;纯展示组件尽量 `.astro`,非交互 React 不 hydration。
2. **重型运行时隔离**:WebGL(Three.js)只用在一个组件(InfiniteParticles),且 `prefers-reduced-motion` 下仅渲染一帧;loading 组件的门卫逻辑不阻塞内容(SSR 直出遮罩,无 JS 直通)。
3. **动画成本意识**:
   - 优先 transform/opacity(合成器),避免 height/top/left 布局抖动(Showcase 转场即 transform + CSS 变量)。
   - `gsap.ticker` 是共享时钟:一个 raf 服务所有 GSAP 动画 + Lenis,不另开 rAF 循环。
   - `will-change` 只在真正动画的元素上。
4. **资产**:
   - woff2 字体(自备),不引入额外字体库/网络字体阻塞。
   - 纸纹/格栅为小 svg 平铺;不做大图 LCP。
   - 不引入未使用的整包库(plugins/动画库只按需 import)。
5. **运行时错误零容忍**:`vp run check` 0 error 是硬门槛;`three`/`gsap`/`lenis` 实现在浏览器端须无 console error。

## 代码质量期望

1. **注释**:少而精。关键"为什么"(如 Lenis stop 下 scrollTo 失效、变量轴分离)值得写,不写显而易见的过程注释。
2. **命名对齐项目**:组件 PascalCase,工具类 kebab,单位/变量沿用既有 TV(如 `--fp*`、`p-2.25`)。
3. **禁用全局搜索式样式**:多用 Tailwind 原子类与 `@utility`,控制样式在 index.css 一处。

## 禁止模式

- ❌ import 未使用的模块(参与 check 即可发现)。
- ❌ 在 `useEffect` 外访问 `document`/`window`(SSR 崩溃)。
- ❌ 构建产物含 console/alert/debugger。
- ❌ 动画直接操作布局属性(width/height/top)而非 transform(参考站复刻除外,需要时注释说明)。

## 复刻参考站(heronaiapp.com)的纪律

1. 复刻 ≠ 抄堆栈;从源站提取规格(字号/CSS 变量/动画时序)后在研究目录 `research/` 归档证据。
2. 效果移入项目时,适应本项目体系(React/Astro/Tailwind),不引入 Barba 等已过时依赖(见先前分析)。
3. 若引入第三方动画库,先确认其为"必要"且替换成本可接受(本项目倾向 GSAP + Lenis 双核心)。
