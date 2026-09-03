# 执行计划:达芬奇几何线条加载页(视觉阶段)· v3(已完成)

> v3 记录(2026-09-02):按用户反馈重构为"原生 SVG 直接控制线条动画"方案,已实现并通过 check(见下)。本文件作为 v3 过程记录执行完毕。

## 实施结果(已完成)

| 文件 | 动作 | 状态 |
|---|---|---|
| `src/components/DavinciLoader.tsx` | 重写:纯静态 SSR(无 hooks/state/事件);骨架 14 图元(line→path 保真) + 螺旋 12 path + 中心双 rect + 标题 DOM | ✅ |
| `src/components/davinci-loader.css` | 重写:终态优先 + no-preference 动画;时序照抄原站(3s/0.9-2.1s/6s/1s@6.2s/0.52s@6.8s) | ✅ |
| `src/components/davinci-lines-geometry.ts` | 删除(v2 常量文件) | ✅ |
| `src/layouts/Layout.astro` | `<DavinciLoader />`,无 client 指令 | ✅ |
| `astro.config.mjs` / `package.json` | @astrojs/react 集成保留 | ✅ |

## 验证命令(已执行,全绿)

```bash
corepack pnpm astro check   # 0 errors / 0 warnings / 0 hints
corepack pnpm build         # 1 page / 623ms
# dist/index.html:script 0、astro-island 0、modulepreload 0;HTML gzip 2405 B
corepack pnpm preview       # 200
```

## 验收(待用户视觉验收后闭环)

- [ ] 用户浏览器肉眼验收:动画顺序/时序/配色/无闪动
- [ ] AC1–AC9(程序化已通过,用户验收后归档)
- [ ] trellis-check 结论:0 代码缺陷(保真逐字符验证、时序数值核对)

## 备注

- `dist/_astro/client.*.js` 为 @astrojs/react 产物,页面零引用(死文件),无网络负担。
- 后续 dev 请用 `corepack pnpm`(全局 pnpm 10 与项目 v11 store 不兼容)。
