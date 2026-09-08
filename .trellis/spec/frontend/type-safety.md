# Type Safety

> TypeScript 约定与类型组织。项目为 Astro check 驱动,无重型类型工程。

---

## 基线

- `vp run check`(Astro 的 tsc)为唯一类型门;**0 errors**必须;hint 需注明(若有现存 hint 属已知)。
- 无独立 tsconfig 拆分/AST 大写约定;类型靠近使用处。

## 常见模式(代码库)

### 1) 组件 props

简单类型 → 默认参数 + 内联类型:

```tsx
export default function InfiniteParticles({ className = '' }: { className?: string }) { ... }
```

复杂 props → `interface XxxProps`(PascalCase + Props 后缀)放同一文件顶部导出。

### 2) ref 类型

```tsx
const scrollerRef = useRef<HTMLDivElement>(null);
const lenisRef = useRef<Lenis | null>(null);       // 可空(挂载前 null)
const tlRef = useRef<gsap.core.Timeline | null>(null);
```

- 元素 ref:`useRef<T>(null)`,访问点判空。
- 对象句柄 ref:显式 `T | null`,赋值后**不要**自动推断可空到任意访问(`xxx?.`)。

### 3) CSS 变量注入 style

```tsx
style={{ '--fp-y': '9px', '--fp-x': '9px' } as CSSProperties}
```

自定义属性需 `as CSSProperties` 断言(React 类型不收录未知 CSS 变量);取值回读用 `getComputedStyle(...).getPropertyValue('--fp-y')`。

### 4) 事件类型

- `MouseEvent`(React 事件:`React.MouseEvent`,原生:`globalThis.MouseEvent`)。
- 全局监听(如 `document.addEventListener('click', onClick)`)用原生类型,不要混 React 合成事件。

## 组织约定

- 工具/类型按需就近声明,不建 `types/` 全局目录(当前规模不需要)。
- 引用 Three/GSAP/Lenis 类型直接 `import type * as THREE` 或命名类型。
- 环境声明:如需全局类型(如 `window.__xxx` 调试入口),用 `as any` 临时断言或 types 文件;**禁止**留 `any` 在公开 API。

## 反模式

- ❌ `if (ref.current) { ... }` 后长链访问不加判空。
- ❌ 事件参数一律 `any`。
- ❌ 状态/动画共享对象用未知空推断(易产生 `cannot read of undefined`)。
