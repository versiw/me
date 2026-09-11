// 项目分区:顶部标题区 + 2 列大卡片(16:9 预览位);跳转入口是文字块右侧的箭头方框,卡片本身不响应点击。
// 视频:首屏只加载 poster;preload=metadata 仅取 moov(转码已 faststart,约 4KB),悬停/聚焦才 play、离开即 pause。
// 尊重 prefers-reduced-motion(该偏好下不起播,保留 poster);无视频的项目沿用 16:9 文本占位。
import { ArrowRight } from 'lucide-react';

type Project = {
  index: string; // 序号,渲染为 [01]
  tag: string; // mono 大写标签
  title: string;
  desc: string;
  href: string;
  video?: string; // 预览视频(public/projects/,自 4K 录制转码为 1440×810/30fps)
  poster?: string; // 视频封面(WebP,首屏只加载它);仅在 video 存在时生效
};

// 占位数据:03/04 的文案与外链待补;视频就位后填 video/poster
const PROJECTS: Project[] = [
  {
    index: '01',
    tag: 'AI Training',
    title: 'AI 视觉模型训练平台',
    desc: '一句话说明这个项目解决的问题与亮点,后续替换为真实文案。',
    href: 'https://example.com',
    video: '/projects/ai-training.mp4',
    poster: '/projects/ai-training-poster.webp',
  },
  {
    index: '02',
    tag: 'AI Annotation',
    title: '多人协作图片标注平台',
    desc: '一句话说明这个项目解决的问题与亮点,后续替换为真实文案。',
    href: 'https://example.com',
    video: '/projects/ai-anno.mp4',
    poster: '/projects/ai-anno-poster.webp',
  },
  {
    index: '03',
    tag: 'Web App',
    title: '项目标题占位三',
    desc: '一句话说明这个项目解决的问题与亮点,后续替换为真实文案。',
    href: 'https://example.com',
  },
  {
    index: '04',
    tag: 'Open Source',
    title: '项目标题占位四',
    desc: '一句话说明这个项目解决的问题与亮点,后续替换为真实文案。',
    href: 'https://example.com',
  },
];

// 起播/暂停:在卡片根元素上做委托,省去每张卡片一个 ref;reduced-motion 下不起播
const playPreview = (card: HTMLElement) => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // 快速划过卡片时起播会被紧随的 pause 打断,play() 以 AbortError 拒绝 —— 预期路径,不必上报
  card
    .querySelector('video')
    ?.play()
    .catch(() => {});
};
const pausePreview = (card: HTMLElement) => {
  card.querySelector('video')?.pause();
};

export default function Projects() {
  return (
    <section id="projects" className="flex flex-col line-b">
      {/* 标题区:大标题 + 右侧说明 */}
      <div className="line-b flex flex-col gap-6 px-8 pt-8 pb-8 md:px-10 lg:flex-row lg:items-start lg:justify-between">
        <h2 className="font-brand font-bold text-3xl md:text-5xl tracking-[-0.04em] text-primary">
          构建档案
        </h2>
        <div className="shrink-0 lg:w-1/4">
          <p className="text-sm leading-relaxed text-secondary">
            有的在真实世界里稳定运行，有的只是为了验证某个有趣的念头。记录已交付的产品，与试验台上的原型。
          </p>
        </div>
      </div>

      {/* 主体:2 列大卡片(grid-2-divide 窄屏转为上边线) */}
      <div className="grid-2-divide grid grid-cols-1 lg:grid-cols-2">
        {PROJECTS.map((project) => (
          <article
            key={project.index}
            onMouseEnter={(e) => playPreview(e.currentTarget)}
            onMouseLeave={(e) => pausePreview(e.currentTarget)}
            onFocus={(e) => playPreview(e.currentTarget)}
            onBlur={(e) => pausePreview(e.currentTarget)}
            className="group flex flex-col"
          >
            {/* 标签行:mono 标签 + [0N] 编号 */}
            <div className="flex items-baseline justify-between gap-3 px-8 pt-6 pb-5 md:px-10">
              <span className="font-mono text-xs uppercase tracking-[0.08em] text-primary transition-colors duration-200 group-hover:text-brand">
                {project.tag}
              </span>
              <span className="font-mono text-xs text-disable transition-colors duration-200 group-hover:text-brand">
                [{project.index}]
              </span>
            </div>

            {/* 预览位:16:9,有视频则渲染 <video>(首屏仅 poster),否则文本占位 */}
            <div className="line-dash-t line-dash-b relative aspect-video overflow-hidden bg-primary/5">
              {project.video ? (
                // 展示用视频不接受 UA 媒体交互:浏览器收不到事件,就不会浮出画中画等原生控件
                <video
                  aria-hidden
                  src={project.video}
                  poster={project.poster}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  disablePictureInPicture
                  disableRemotePlayback
                  className="pointer-events-none h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span
                    aria-hidden
                    className="font-mono text-xs uppercase tracking-[0.08em] text-disable"
                  >
                    [ Image ]
                  </span>
                </div>
              )}
            </div>

            {/* 左标题描述、右跳转方框:方框垂直居中于左侧整块 */}
            <div className="flex items-center justify-between gap-4 px-8 pt-6 pb-8 md:px-10">
              <div className="min-w-0">
                <h3 className="font-brand font-bold text-xl md:text-2xl tracking-[-0.03em] text-primary">
                  {project.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-secondary">{project.desc}</p>
              </div>
              <a
                href={project.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`访问 ${project.title}(新标签页打开)`}
                className="flex h-9 w-9 shrink-0 items-center justify-center border border-border text-primary transition-colors duration-200 hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <ArrowRight aria-hidden strokeWidth={1.5} className="h-4 w-4" />
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
