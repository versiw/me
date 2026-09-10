# 技术设计:项目展示分区

## 边界

- `src/components/Showcase/Projects.tsx` —— 分区组件(2 列卡片 + 16:9 预览位 + 最小播放控制)
- `src/index.css` —— `grid-2-divide` / `line-dash-t` / `line-dash-b` 三个 `@utility`
- `public/projects/` —— 转码产物(mp4 + poster webp)
- `.gitignore` —— 原始素材 `mp4s/` 不入库

不动:`Showcase/index.tsx`(锚点转场 / Lenis)、`Nav.tsx`、其他分区。

## 组件形态决策:为何保持 `.tsx`

`directory-structure.md` 约定"纯静态展示的 React 组件首选 `.astro`"。本分区**不采用**该首选路径:

- 父级 `Showcase/index.tsx` 是 React 组件树(滚动容器 + 外框转场 + 全部分区),Astro 组件无法嵌入 React 子树;单独提到 page 层须先拆开滚动容器结构,属跨分区重构。
- 视频起播/暂停是 CSS 表达不了的行为,组件已不再是纯静态。
- JS 收敛到最小:无 `useState`、无 `useEffect`,只用 JSX 事件属性做委托。

## 数据契约

```ts
type Project = {
  index: string; // '01' → 渲染为 [01]
  tag: string; // mono 大写标签
  title: string;
  desc: string;
  href: string; // 外链
  video?: string; // 预览视频(public/projects/…);缺失则预览位走文本占位
  poster?: string; // 视频封面 WebP
};
```

**约束**:`href` 必须是外链 URL,**不能以 `#` 开头** —— `Showcase/index.tsx` 会拦截所有 `a[href^="#"]` 走分区转场([index.tsx:85](src/components/Showcase/index.tsx#L85))。

## 结构

```
<section id="projects" class="flex flex-col line-b">
  ├─ 标题区      大标题(左) | 说明段落 + 品牌色小方块(右)
  └─ 主体 grid-2-divide  grid grid-cols-1 lg:grid-cols-2
       └─ ×4  <a class="group flex flex-col" target="_blank" rel="noopener noreferrer"
                onMouseEnter/onMouseLeave/onFocus/onBlur>
              ├─ 标签行(左:tag 右:[0N])
              ├─ 预览位  line-dash-t line-dash-b aspect-video overflow-hidden bg-primary/5
              │    ├─ 有视频:<video preload="metadata" poster muted loop playsInline aria-hidden>
              │    └─ 无视频:文本占位(aria-hidden)
              └─ 标题 + 描述(含 ↗ 外链指示)
```

分区高度**不再锁定一屏**:16:9 预览位 + 两行卡片在桌面上约 1.4 屏;窄屏单列堆叠、高度自然增长。

## 视频方案

### 转码

| 项 | 源 | 产物 |
|---|---|---|
| 分辨率 | 3840×2160 | 1440×810(lanczos) |
| 帧率 | 60 | 30 |
| 编码 | H.264 High,11–24 Mbps | H.264 CRF 22 / preset slow |
| 音频 | 无 | 显式移除(`-an`) |
| 容器 | — | `+faststart`(moov 前置,利于起播) |
| 体积 | 12.2 / 21.3 MB | 1.07 / 1.18 MB |

1440 宽覆盖 700px 展示位在 2x DPR 下的需要,同时留足压缩余量;30fps 对录屏内容足够。完整命令与参数依据见 [research/video-transcode-spec.md](./research/video-transcode-spec.md)。

### 加载与播放

- 首屏只加载 **poster WebP**(25–32KB)+ `preload="metadata"`,不拉全片
- 悬停/聚焦 → `play()`;移开/失焦 → `pause()`(不重置进度,下次接着播)
- 事件在卡片根元素上委托(`e.currentTarget.querySelector('video')`),避免每张卡片一个 ref
- `prefers-reduced-motion: reduce` 的用户不触发 `play()`,只看到 poster
- 视频无音轨且对读屏无信息量 → `aria-hidden`,`muted` 兜底

### 原始素材处置

`mp4s/`(33.5MB,4K 原始录制)加入 `.gitignore` 并从索引移除;转码产物入库,仓库只保留 `public/projects/` 下的 2.4MB。

## 网格分隔:`grid-2-divide`

2 列换行网格要区分"偶数列左线"与"次行上线",且窄屏切换为纯上边线。逐项判断索引会撞上层叠顺序问题(`line-t` 是简写属性,而 `lg:border-t-0` 只改宽度),改用容器级选择器:

```css
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

选择器与"2 列"绑定:改列数需另写一条 utility。断点 64rem 必须与组件里的 `lg:` 前缀一致。

## 虚线分隔:`line-dash-t` / `line-dash-b`

预览位上下各一条,沿用参考区的虚线分段语言:

```css
@utility line-dash-t { border-top: 1px dashed var(--color-border); }
@utility line-dash-b { border-bottom: 1px dashed var(--color-border); }
```

## 悬停(纯 CSS,无 JS)

- 标签与 `[0N]` 编号 → `group-hover:text-brand`
- 外链指示 `↗`:`opacity-0` → `group-hover:opacity-100`,焦点态同样显示(`group-focus-visible:opacity-100`)
- 颜色过渡 `transition-colors duration-200`;只动 color/opacity
- **线框不参与高亮**:`<a>` 自身即 `.group`,`group-hover:` 无法作用于自身边框

## 可访问性

- 整卡包裹 `<a href target="_blank" rel="noopener noreferrer">`,Tab 可聚焦,焦点环 `focus-visible:outline-*`
- 纯装饰(品牌色小方块、预览位占位文本、预览视频)加 `aria-hidden`;`[0N]` 序号属信息,不加

## 响应式

| 断点 | 列数 | 预览位宽度 |
|---|---|---|
| <1024px | 1(堆叠) | 满宽(16:9) |
| ≥1024px | 2 | 约 700px |

## 风险与回滚

- `Projects.tsx` 独立组件,回滚 = `git checkout -- src/components/Showcase/Projects.tsx`。
- `index.css` 为增量声明,不改动既有 token / utility。
- `public/projects/` 为新增静态资产,删除即回滚(原始素材仍在本机 `mp4s/`)。
- 跨文件风险:`grid-2-divide` 的 64rem 断点须与组件 `lg:` 一致 —— 已用产物 CSS 校验。
- 性能回归面:视频若被误改为 `preload="auto"` 或加 `autoplay`,首屏会多下载 1–2MB;改这两处需复验首屏请求。
