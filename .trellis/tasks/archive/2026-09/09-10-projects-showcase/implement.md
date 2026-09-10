# 执行计划:项目展示分区

## 步骤

1. **转码预览视频**(已完成)
   - 2 个 4K 源 → 1440×810 / 30fps / H.264 CRF22 → `public/projects/*.mp4`
   - 各生成 WebP poster(取第 2 秒帧)
   - 命令与参数依据:[research/video-transcode-spec.md](./research/video-transcode-spec.md)

2. **`src/index.css` 新增 utility**
   - `line-dash-t` / `line-dash-b`(预览位上下虚线)
   - `grid-2-divide`(2 列网格分隔)
   - 检查点:`vp check` 无格式问题

3. **重写 `src/components/Showcase/Projects.tsx`**
   - `PROJECTS` 常量(01/02 带 `video`/`poster`,03/04 占位)
   - 标题区 + 2 列卡片;每张:标签行 → 16:9 预览位 → 标题描述
   - 整卡 `<a>` 外链 + 悬停高亮(纯 CSS)
   - 悬停/聚焦起播、离开/失焦暂停(事件委托,无 state / effect)
   - 检查点:`vp run check` 0 error

4. **素材入库策略**
   - `mp4s/` 写入 `.gitignore` 并从索引移除(原始 4K 不入库)
   - `public/projects/` 的转码产物入库

5. **视觉与性能验证**
   - 桌面 2 列截图:预览清晰度、分隔线、悬停态
   - 窄屏单列截图:无横向滚动
   - 构建产物:`dist/projects/` 体积与 25MB 上限
   - 首屏不加载视频全片(未悬停时无全片请求)

## 验证命令

```bash
vp check        # 格式 + lint + 类型
vp run check    # astro check(要求 0 error)
vp run build    # 静态构建
vp run dev      # 目视 + 交互验证
```

## 回滚点

- `Projects.tsx`、`index.css`、`.gitignore` 各自可独立回滚(单文件 `git checkout`)。
- `public/projects/` 删除即回滚;原始素材仍在本机 `mp4s/`。
- 不触碰转场 / Lenis / Nav —— 无回滚面。

## 完成后仍待办(不阻塞本任务)

- 01/02 的描述文案与真实外链。
- 03/04 的项目文案、外链与预览视频。
- 顶部标题区真实文案。
