# State Management

> 本项目状态管理极其轻量:无 Redux/Zustand/Context,局部 useState/useRef 为主。

---

## 原则

1. **默认不用状态库**:单页、展示为主,状态少且局部。
2. **跨组件通信用"共享函数 + 事件/拦截"**,不用全局 store(见 "Showcase 锚点转场 模式")。
3. **渲染态用 useState;瞬态(句柄/进度/引用)用 useRef**。

## 使用模式

### 1) 局部 UI 状态

```tsx
// DavinciLoader.tsx(加载页卸载)
const [shouldRender, setShouldRender] = useState(false);
// setShouldRender(false) 触发卸载,零 DOM/CPU 残留
```

### 2) 防重入标记(transient boolean → ref)

```tsx
const transitioningRef = useRef(false);
const shown = (hash: string) => {
  if (transitioningRef.current) return; // 转场中忽略重复触发
  transitioningRef.current = true;
  // ...
  gsap.timeline({ ..., onComplete: () => { transitioningRef.current = false; } });
};
```

- 非渲染数据、只用于"逻辑闸门"的布尔 → **ref**,不触发 re-render。

### 3) 跨组件联动(锚点转场)

导航点击 → 全局事件委托 → 转场函数操作共享 DOM 的 CSS 变量 → 状态变化只在你掌控的组件内。

```
<a href="#log"> click
  → document 级拦截(e.target.closest('a[href^="#"]'))
  → preventDefault + showTransition(hash)
  → gsap tween --fp-y/--fp-x → 原生 scrollTo(section)
```

要点:拦截/副作用归属在 Showcase 容器层;导航项(子组件)不持状态,只暴露语义锚点 `<a>`。

## 反模式

- ❌ 为单个页面引入全局状态库。
- ❌ 用 useState 存 animation 句柄/定时器 id/EventSource(它们不驱动渲染)。
- ❌ 状态在多个组件间相互 setState 形成链条——用 ref/事件委托收敛至一处。
