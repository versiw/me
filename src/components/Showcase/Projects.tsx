// 项目分区:顶部标题区 + 2 列大卡片(16:9 预览位),整列外链新标签打开;预览放得下 PC 录屏的界面细节。
// 视频性能:默认只渲染 poster,preload=metadata 不拉全片;悬停/聚焦才 play、离开即 pause → 首屏零全片流量。
// 尊重 prefers-reduced-motion(该偏好下不起播,保留 poster);无视频的项目沿用 16:9 文本占位。
import { ArrowUpRight } from 'lucide-react';

type Project = {
  index: string; // 序号,渲染为 [01]
  tag: string; // mono 大写标签
  title: string;
  desc: string;
  href: string;
  video?: string; // 预览视频(public/videos/,自 4K 录制转码为 1440×810/30fps)
  poster?: string; // 视频封面(WebP,首屏只加载它)
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
      {/* 标题区:大标题 + 右侧说明与品牌色方块 */}
      <div className="flex flex-col gap-6 px-8 pt-8 pb-8 md:px-10 lg:flex-row lg:items-start lg:justify-between">
        <h2 className="font-brand font-bold text-3xl md:text-5xl tracking-[-0.04em] text-primary">
          精选项目
        </h2>
        <div className="shrink-0 lg:w-1/4">
          <p className="text-sm leading-relaxed text-secondary">
            这个分区的说明段落占位,后续替换为真实文案。
          </p>
          <span aria-hidden className="mt-3 block h-3 w-3 bg-brand" />
        </div>
      </div>

      {/* 主体:2 列大卡片(grid-2-divide 窄屏转为上边线) */}
      <div className="grid-2-divide grid grid-cols-1 lg:grid-cols-2">
        {PROJECTS.map((project) => (
          <a
            key={project.index}
            href={project.href}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={(e) => playPreview(e.currentTarget)}
            onMouseLeave={(e) => pausePreview(e.currentTarget)}
            onFocus={(e) => playPreview(e.currentTarget)}
            onBlur={(e) => pausePreview(e.currentTarget)}
            className="group flex flex-col focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
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
                <video
                  aria-hidden
                  src={project.video}
                  poster={project.poster}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-cover"
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

            {/* 标题 + 描述 */}
            <div className="px-8 pt-6 pb-8 md:px-10">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-brand font-bold text-xl md:text-2xl tracking-[-0.03em] text-primary">
                  {project.title}
                </h3>
                <ArrowUpRight
                  aria-hidden
                  strokeWidth={1.5}
                  className="mt-1 h-5 w-5 shrink-0 text-brand opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
                />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-secondary">{project.desc}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
