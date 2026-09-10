# 预览视频转码规格

> 依据:用户 2026-09-10 提供的 4K PC 录屏。约束:Cloudflare 静态部署(单文件 <25MB)+ 性能优先 + 质量不被过度下降。

## 源素材

| 文件 | 分辨率 | 时长 | 码率 | 体积 | 现状 |
|---|---|---|---|---|---|
| `ai-training-origin.mp4` | 3840×2160 | 8.5s | 10.8 Mbps | 12.2 MB | 已从本机清理 |
| `ai-anno-origin.mp4` | 3840×2160 | 7.0s | 24.4 Mbps | 21.3 MB | 已被新录制替换 |
| `export-1789032028403.mp4` | 3840×2160 | 9.2s | 24.7 Mbps | 27.2 MB | **当前 ai-anno 的转码来源** |

均为 60fps、无音轨,存放于本机 `mp4s/`(该目录已 gitignore,不入库)。

## 转码命令

```bash
ffmpeg -y -i mp4s/<name>-origin.mp4 \
  -vf "scale=1440:810:flags=lanczos,fps=30" \
  -c:v libx264 -crf 22 -preset slow -pix_fmt yuv420p \
  -movflags +faststart -an public/projects/<name>.mp4

# poster:取第 2 秒一帧(避开开场)
ffmpeg -y -ss 2 -i public/projects/<name>.mp4 -frames:v 1 \
  -c:v libwebp -quality 82 public/projects/<name>-poster.webp
```

## 参数依据

| 参数 | 取值 | 理由 |
|---|---|---|
| 分辨率 1440×810 | 展示位约 700px 宽,2x DPR 需 1400px | 720p 在高分屏下会发虚 |
| 帧率 30 | 录屏内容无高速运动 | 相比 60fps 码率近乎减半 |
| CRF 22 | H.264 的视觉近无损区间 | 兼顾"质量不被过度下降" |
| `-preset slow` | 离线批量转码,不在乎耗时 | 同码率下质量更好 |
| `+faststart` | moov 前置 | 配合 `preload="metadata"` 让起播更快 |
| `-an` | 源无音轨 | 显式去除,避免意外音轨 |

## 实测结果

| 产物 | 体积 | 相对源 |
|---|---|---|
| `ai-training.mp4` | 1100 KB | 9.0% |
| `ai-anno.mp4` | 1516 KB | 5.6%(2026-09-10 用 `export-1789032028403.mp4` 重转) |
| poster(WebP) | 25 / 31 KB | — |

合计 2.4MB,单文件远低于 25MB 上限。

## 复用:新增项目视频时

1. 用上面的命令转码,**只改 `<name>`**(需要本机有 ffmpeg)
2. 产物放 `public/projects/`,poster 命名 `<name>-poster.webp`
3. 在 `Projects.tsx` 的数据项填 `video` / `poster` 字段
4. 复核单文件 < 25MB;源更长时按比例下调 CRF 或分辨率
