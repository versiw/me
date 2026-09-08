# implement.md:展示页外框重构与页面转场

## 前置

- Lenis(showcase 容器滚动)、gsap 已集成,`vp run check`/`vp run build` 通过
- dev server: http://localhost:4321

## 步骤

### 1. 外框重构(Showcase/index.tsx)

- 删除现有单 div `fixed inset-2.25 z-50 line`
- 新增外框层(固定相对视口,4 条独立 line):
  - `fixed` 容器(pointer-events-none, inset-0, z 与现有一致)
  - 4 条线:top/bot 横线 `h-px w-full`,left/right 竖线 `w-px h-full`
  - 各线初始位置 `inset-2.25` 等价:top → `top-2.25`;bot → `bottom-2.25`;left → `left-2.25`;right → `right-2.25`
  - 线颜色沿用现有 border 色(--color-border)
- 验证静态视觉:四边闭合、线距视口 2.25,与当前一致(对比截图)

### 2. 转场实现(Showcase/index.tsx)

- 新增 `transitionShowcase()`(模块内导出,或作为 hook 暴露),步骤:
  1. `lenis.stop()`
  2. gsap timeline:
     - 4 线各朝中心滑入(上:top → -2.25=-9px 或按比例,下/左/右对称)——"从外向内"
     - 同时 `contentRef` clip-path: inset(0%) → inset(50%) → 中心小框
  3. 到达中心时序(最长边一致)后:
     - 反向:线回到 inset-2.25,clip-path 回 inset(0%)
  4. `lenis.start()`
- 时长/缓动:参照参考站 .8s duration + 标准阻尼缓动(e.g. `power2.inOut`),先落地可调参数
- **触发**:展示页不做真实多页,先用 dev 触发(如 Hero 上的一个测试按钮或控制台 `window.__transitionShowcase()` 调试);若有方便的自然触发(导航菜单锚点)也可接上,核心是接口暴露

### 3. Tailwind 收敛

- 4 线静态定位全部用原子类,不重复写 CSS
- 若出现 >=2 处相同的长组合,再抽 `@utility`(评审时决定,避免早期抽象)

### 4. 验证

- [ ] `vp run check` 无错误(新 hint 也顺带清理)
- [ ] `vp run build` 成功
- [ ] 外框静态视觉与当前一致(边距、线粗、颜色)
- [ ] 触发转场:4 线收拢 → clip 收拢 → 复位,期间无滚动条/布局跳动
- [ ] 转场期间滚动被锁定,结束后恢复

## 回滚

改动集中在 Showcase/index.tsx 与(index.css 可选);还原这两个文件即可退出,无迁移。
