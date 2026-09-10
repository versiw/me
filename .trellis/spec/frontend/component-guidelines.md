# Component Guidelines

> 本项目组件怎么写。示例均来自代码库。

---

## 组件形态

- 大部分是**纯展示函数组件**,无 props 或极少 props,如:

```tsx
// Projects.tsx(占位)
export default function Projects() {
  return <section id="projects" className="h-[calc(100dvh-18px)]" />;
}
```

- 展示组件**不接容器 ref/状态向外暴露**,只提供 section/语义化容器 + `id`(锚点作用)。

## 生命周期与副作用

- 副作用/资源全部封装在 `useEffect` 内,**cleanup 必须成对**:

```tsx
// InfiniteParticles.tsx —— renderer/geometry/raf/observer 全部 dispose
return () => {
  stopped = true;
  cancelAnimationFrame(raf);
  observer.disconnect();
  geometry.dispose();
  material.dispose();
  rt.dispose();
  renderer.dispose();
  host.removeChild(renderer.domElement);
};
```

- 引用类命名:`xxxRef`;控制动画的共享句柄用 ref(如 `Showcase/index.tsx` 的 `tlRef`——timeline 在闭包内创建,cleanup 需要 `kill()`):

```tsx
const tlRef = useRef<gsap.core.Timeline | null>(null);
// cleanup:
tlRef.current?.kill();
tlRef.current = null;
```

## props 约定

1. 简单类型直接默认参数,如 `{ className = '' }: { className?: string }`(InfiniteParticles)。
2. **不用外部状态管理/Context**:组件间联动(如转场函数)通过事件/`data-` 属性 + 统一拦截,避免全局状态。
3. 不用运行时 props 做动画文案等 static 内容;文案硬编码在组件内(双语文案按既有字体体系)。

## 命名

- 文件/组件:PascalCase,与用途对齐(Nav/Hero/Projects/About/Footer)。
- 功能分区大组件用 index.tsx + 平铺子组件;单一可复用部件直接文件名。
- CSS 工具类名 kebab(沿 Tailwind 习惯,`no-scrollbar`)。

## 可访问性与移动端

- 交互元素:菜单用真实 `<a href="#...">`(锚点语义,禁 JS 也可跳),`aria-hidden` 标装饰物。
- `select-none` 用于装饰型文本区;文本可读区块保持可选择。
- 动画尊重 `prefers-reduced-motion`(InfiniteParticles 的 `reduced` 分支),`motion-safe:` Tailwind 变体同样被使用(DavinciLoader)。
- 固定/铺满元素加 `pointer-events-none`(外框层),避免遮挡点击事件。

## 分区布局模式

### 网格分隔:`grid-2-divide`

多列网格在窄屏堆叠、宽屏并排时分隔方向要跟着变,用容器级 `@utility` 一次解决(2 列换行网格版,当前用于项目分区):

```css
/* index.css */
@utility grid-2-divide {
  & > * + * {
    border-top: 1px solid var(--color-border);
  }
  @media (min-width: 64rem) {
    & > * + * {
      border-top: 0;
    }
    & > *:nth-child(even) {
      border-left: 1px solid var(--color-border);
    }
    & > *:nth-child(n + 3) {
      border-top: 1px solid var(--color-border);
    }
  }
}
```

```tsx
<div className="grid-2-divide grid grid-cols-1 lg:grid-cols-2">…</div>
```

**为何用容器选择器而非逐项判断**:`i > 0 ? 'line-t lg:line-l' : ''` 会撞上层叠顺序问题 —— `line-t` 是简写属性(`border-top: 1px solid …`),而 `lg:border-t-0` 只改宽度,谁覆盖谁不可控;换行网格还要额外区分"偶数列加左线"与"次行加上线",逐项判断会迅速失控。

**选择器与列数绑定**:`even` / `n + 3` 是按 2 列写的。改成 3 列要另写一条 utility,不要直接套用。

**断点一致性(易错)**:`@utility` 内的媒体查询断点必须与组件里的 Tailwind 前缀同值(`lg` = 64rem)。改任一处要同步另一处,否则宽屏会出现"列已并排但分隔线还是横的"。

### 多列等高对齐:subgrid

多列各自用 `flex-1` 时,内容行数不等会让列内分段线参差。把分段轨道提到父级 grid,各列 `grid-rows-subgrid` 继承:

```tsx
<div className="grid grid-cols-1 lg:grid-flow-col lg:grid-cols-4 lg:grid-rows-[auto_minmax(0,1fr)_auto]">
  <a className="grid grid-rows-[auto_minmax(0,1fr)_auto] lg:row-span-3 lg:grid-rows-subgrid">
    <div>标签行</div>
    <div>视觉区</div>
    <div>标题 + 描述</div>
  </a>
</div>
```

用 `minmax(0,1fr)` 而非 `1fr`:零最小值的 1fr 才不会被内容撑破轨道。

**先确认是否真需要**:固定比例的内容(如 `aspect-video` 预览位)天然等高,不需要 subgrid;只有"高度随内容变化、却要求分段线跨列齐平"时才用它。

### 整列链接的悬停:`group` 在 `<a>` 自身

整列可点击时 `<a>` 自己就是 `.group`,而 `group-hover:` **只对后代生效,无法作用于 `<a>` 自身的边框/背景**。若要线框高亮,须在 `<a>` 上直接写 `hover:border-*`。

### 视频预览:懒加载 + 悬停起播

展示用视频不要让它在首屏自动加载整片。约定:

- `poster` 用单独生成的 WebP —— 首屏只加载它(几十 KB),配 `preload="metadata"` 不拉全片
- **悬停/聚焦才 `play()`,离开即 `pause()`**:在卡片根元素上做事件委托(`e.currentTarget.querySelector('video')`),省去每张卡片一个 ref
- `muted` + `loop` + `playsInline`;`prefers-reduced-motion` 用户不起播(保留 poster)
- 视频对读屏无信息量 → 加 `aria-hidden`
- 带宽预算:1440×810 / 30fps / H.264 CRF22 的 8 秒录屏约 1.1MB(同源 4K 录制 12MB);**单个静态文件硬上限 25MB**(Cloudflare 部署约束)
- 因此分区**允许这类最小 JS**:无 `useState`、无 `useEffect`,只用 JSX 事件属性

### 静态分区优先零 JS

交互只有悬停态时,优先全 CSS(`group-hover:` + 原生 `<a>`),不要引入 `useState`/`useEffect`。只有像视频播放这类 CSS 表达不了的行为,才加最小化的事件处理。

## 反模式

- ❌ 组件内 `setInterval`/`addEventListener` 不清理。
- ❌ 直接 DOM 强依赖(内置 `document.querySelector` 穿层)替代 ref;全局查询限定在明确场景(如锚点拦截)。
- ❌ 在组件内手写长 CSS 串接(优先 Tailwind 原子/工具类)。
