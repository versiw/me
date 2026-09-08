# design.md:展示页外框重构与页面转场(最终版,同步实现)

> 初稿的 `--trans-percent` 单变量结构在演练中发现双十字问题(垂直/水平中心不同值),已废弃。
> 最终结构为双轴变量 + 原生滚动切换,记录如下。

## 技术基线(参考站研究,主要借鉴思想)

参考站外框转场由 CSS 变量驱动、GSAP tween:
- `--trans-percent` → 四条线从视口边向中心偏移
- `--mask-percent` → 主内容 clip-path 收拢
- 线收拢到中心成十字;遮罩(loading 层)盖窗口外

## 本项目最终设计(适配 React + Tailwind 4 + Lenis 容器滚动)

### 1. 外框层 = 4 线 + 4 纸纹遮罩板,双轴变量驱动

```
<div ref={scrollerRef} h-screen overflow-y-auto no-scrollbar      ← Lenis wrapper/滚动容器
  style={{ '--fp-y': '9px', '--fp-x': '9px' }}                     ← 双轴 CSS 变量(初始 9px = 2.25)
  <div class="fixed inset-0 z-50 pointer-events-none">              ← 外框层(fixed 视口)
    ├─ 遮罩板 top/bot:  height: var(--fp-y)   bg-paper(纸纹)       ← 线外至视口边,不透明
    ├─ 遮罩板 left/right: width:  var(--fp-x)  bg-paper
    ├─ 横线 top/bot:     top/bottom: var(--fp-y)  h-px bg-border   ← 轴内同值 → 收拢到底必重合
    └─ 竖线 left/right:  left/right: var(--fp-x)  w-px bg-border
  <div ref={contentRef}> Nav / Hero / 各 section ... </div>         ← 内容(不参与 clip)
```

关键决策:
- **双轴变量分离**:垂直中心(clientHeight/2)与水平中心(clientWidth/2)值不同,单变量会令竖线停在 1/3、2/3 处形成双十字。`--fp-y`/`--fp-x` 各管一轴,轴内 top/bot(或 left/right)同值 → 十字天然重合。
- **线心对齐**:目标值 `cx/2 - 0.5`(减半线厚),使横线 top 与竖线 left 的中心线重合,十字为单线宽。
- **遮罩板=窗口外遮盖**:板与线同变量驱动,收拢时板贴线外侧扫过;窗口内内容**持续可见**(不做内容 clip,避免滚动容器内元素基准错位)。
- **转场仅 tween 两个变量**:`{ '--fp-y': cy, '--fp-x': cx }` → 驻留 → 回原位。同步性是结构保证。

### 2. 锚点转场流程(Nav 点击 → section 跳转)

```
点击 <a href="#log"> → 全局 click 拦截(preventDefault)
  → 收拢(0.8s power2.inOut:四线+板同速至中心十字,窗口缩为线内小窗)
  → add 回调(十字遮蔽下):
      scrollTop = (#hero ? 0 : target.offsetTop)  ← 首屏锚点滚到容器顶(Nav 同屏)
      scroller.scrollTo({ top, behavior: 'auto' }) ← 容器原生滚动(绕过 Lenis)
      lenis.scrollTo(scroller.scrollTop, { immediate: true })  ← 回传对齐 Lenis
  → 驻留 0.2s(内容切换点)
  → 展开(0.8s:板/线反向回位,目标 section 从中心扩展可见)
```

### 3. 已知坑(Lenis 1.3 定制 wrapper)

- **`lenis.stop()` 状态下 `scrollTo(immediate/force)` 全部失效**(stop 只设 isRunning=false,内部 fromTo 不执行)。因此转场**不使用 stop 锁滚动**,滚动锁由 `transitioningRef` 防重入保证,滚动切换用**容器原生 scrollTo**。
- 元素引用 `scrollTo(element)` 在自定义 wrapper 下基准不稳 → 用 `offsetTop` 数值。
- 原生滚动后必须 `lenis.scrollTo(当前scrollTop, {immediate:true})` 回传对齐,否则 lerp 会把位置拉回原处。

### 4. Tailwind 收敛

- 四线静态定位全部原子类;`bg-paper`/`no-scrollbar` 为 `@utility`(index.css)。
- 遮罩板材质复用 `bg-paper`(与 body 纸纹一致,`--bg-img`)。
- 行内变量用 `style={{ '--fp-y': ... } as CSSProperties}`(CSS 变量不能走 Tailwind API)。

### 5. 触达文件

- src/components/Showcase/index.tsx — 外框层 + 转场 + 全局锚点拦截(Lenis/gsap 生命周期)
- src/components/Showcase/Nav.tsx — 菜单项 span→a(真实锚点),布局/样式不变
- src/components/Showcase/LogSection.tsx / ResumeSection.tsx — 占位 section(#log/#resume)
- src/index.css — `@utility bg-paper` / `@utility no-scrollbar`

## 风险与回滚

- 改动集中在 Showcase 模块与 index.css(工具类),还原这两个文件即可退出,无迁移。
- 转场期间不锁 Lenis,用户极端操作(连续点击)由 transitioningRef 拦截。
