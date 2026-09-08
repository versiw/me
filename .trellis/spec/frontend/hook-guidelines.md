# Hook Guidelines

> 自定义 hook 与客户端副作用模式。项目当前以"组件内 useEffect + ref"为主,无自定义 hook 库依赖。

---

## 现状

项目尚无自定义 hook(无 `use*` 导出文件);副作用(滚动/动画/WebGL)直接写在组件内。**若新增 hook:**

1. 文件命名 `useXxx.ts`,放 `src/components/` 与该逻辑组件同目录,或专用 `src/hooks/`(如逻辑跨组件复用)。
2. 一 hook 一职责;引用的资源(raf/thenable/observer/subscription)必须在返回的 cleanup 中释放。
3. 返回稳定引用(ref、callback)。不返回依赖外部 ref 的可变对象给渲染层。

## 常用模式(代码库既存)

### 1) 资源型 effect(Lenis 对接 gsap.ticker)

```tsx
useEffect(() => {
  const lenis = new Lenis({ wrapper: scroller, content, smoothWheel: true, syncTouch: false });
  lenisRef.current = lenis;
  const raf = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);
  return () => {
    gsap.ticker.remove(raf);
    gsap.ticker.lagSmoothing(500, 33);
    lenis.destroy();
    lenisRef.current = null;
  };
}, []);
```

要点:创建实例 → 注册到共享调度器 → cleanup 里**对称注销**(remove + lagSmoothing 还原 + destroy + ref 置 null)。

### 2) 动画时间线句柄(闭包外可达)

```tsx
const tlRef = useRef<gsap.core.Timeline | null>(null);
useEffect(() => {
  const shown = () => { const tl = gsap.timeline({ ... }); tlRef.current = tl; };
  document.addEventListener('click', onClick);
  return () => { tlRef.current?.kill(); tlRef.current = null; document.removeEventListener('click', onClick); };
}, []);
```

要点:timeline 在事件回调/闭包内创建,用 ref 带出到 cleanup 时可 `kill()`(转场中途卸载/HMR 需要)。

### 3) WebGL 一次性初始化 + reduced-motion 降级

```tsx
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
renderFrame();
if (!reduced) { /* requestAnimationFrame 循环 */ }
// cleanup: stopped + cancelAnimationFrame + dispose 全套
```

## 骨架与约定

- useEffect 依赖数组显式;如只用一次用 `[]`。
- ref 是"可变暂存",state 是"渲染数据"——动画句柄/定时器等瞬态必进 ref。
- **禁止**在渲染函数内直接创建资源(class 实例/ArrayBuffer/requestAnimationFrame)。
