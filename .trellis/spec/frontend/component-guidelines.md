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

## 反模式

- ❌ 组件内 `setInterval`/`addEventListener` 不清理。
- ❌ 直接 DOM 强依赖(内置 `document.querySelector` 穿层)替代 ref;全局查询限定在明确场景(如锚点拦截)。
- ❌ 在组件内手写长 CSS 串接(优先 Tailwind 原子/工具类)。
