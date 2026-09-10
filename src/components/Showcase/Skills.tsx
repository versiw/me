// 技能分区:左 DriftWall 技能栈墙(官方动画/交互,瓦片内容项目定制)+ 右「核心能力」列表(lucide 图标);
// 墙瓦片悬停抬起,href 设置过的技能可点击跳转官网(新标签);
// icon 走 Simple Icons 静态 SVG(public/simple-icons/<slug>.svg),扩展技能:下载对应 <slug>.svg 并加一行数据
import DriftWall, { type DriftWallItem } from '../custom/DriftWall';
import { CodeXml, AppWindow, Sparkles, MousePointerClick } from 'lucide-react';

// 技能栈数据(href/iconUrl 可选:未设置则分别不可点击 / 走 monogram 兜底)
const SKILLS: DriftWallItem[] = [
  { name: 'React', href: 'https://react.dev', iconUrl: '/simple-icons/react.svg' },
  { name: 'Next.js', href: 'https://nextjs.org', iconUrl: '/simple-icons/nextdotjs.svg' },
  {
    name: 'TypeScript',
    href: 'https://www.typescriptlang.org',
    iconUrl: '/simple-icons/typescript.svg',
  },
  { name: 'Vite', href: 'https://vite.dev', iconUrl: '/simple-icons/vite.svg' },
  { name: 'Astro', href: 'https://astro.build', iconUrl: '/simple-icons/astro.svg' },
  {
    name: 'Tailwind CSS',
    href: 'https://tailwindcss.com',
    iconUrl: '/simple-icons/tailwindcss.svg',
  },
  { name: 'Three.js', href: 'https://threejs.org', iconUrl: '/simple-icons/threedotjs.svg' },
  { name: 'GSAP', href: 'https://gsap.com', iconUrl: '/simple-icons/gsap.svg' },
  { name: 'Electron', href: 'https://www.electronjs.org', iconUrl: '/simple-icons/electron.svg' },
  { name: 'Tauri', href: 'https://tauri.app', iconUrl: '/simple-icons/tauri.svg' },
  { name: 'Node.js', href: 'https://nodejs.org', iconUrl: '/simple-icons/nodedotjs.svg' },
  {
    name: 'Claude Code',
    href: 'https://claude.com/claude-code',
    iconUrl: '/simple-icons/claude.svg',
  },
];

// 核心能力(右列):lucide 图标 + 标题 + 简介
const CORE_ABILITIES = [
  {
    icon: CodeXml,
    title: 'Web 全栈开发',
    desc: '熟练使用 Next.js、shadcn、Vite 构建现代化的 Web 全栈应用。',
  },
  {
    icon: AppWindow,
    title: '桌面端应用开发',
    desc: '使用 Electron、Tauri 构建跨平台桌面应用，提供流畅的桌面体验。',
  },
  {
    icon: Sparkles,
    title: 'AI 辅助开发',
    desc: '熟练使用 Claude、Codex、Gemini 等进行高效的 AI 开发。',
  },
  {
    icon: MousePointerClick,
    title: '交互与视觉设计',
    desc: '注重用户体验与视觉美感，追求简洁、优雅、易用的界面设计。',
  },
];

export default function Skills() {
  return (
    <section id="skills" className="flex h-[calc(100dvh-18px)] flex-col line-b">
      {/* 左技能墙 + 右核心能力 */}
      <div className="relative flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* 左:DriftWall 技能墙(布局占 55%) */}
        <div className="relative min-h-0 flex-1 lg:w-[55%]">
          <div className="absolute inset-0">
            <DriftWall
              items={SKILLS}
              columns={4}
              tileWidth={196}
              tileHeight={118}
              gap={13}
              radius={0}
              tilt={14}
              turn={-8}
              perspective={1200}
              depth={120}
              speed={38}
              direction="up"
              variance={0.3}
              parallax={0.6}
              lift={22}
              fade={0.6}
              dim={0.72}
              overlayColor="#f5f5ed"
            />
          </div>
        </div>

        {/* 右:核心能力列表(45%,线与左列分隔) */}
        <aside className="flex min-h-0 flex-col border-t lg:w-[45%] lg:border-l lg:border-t-0 lg:line-l">
          <div className="flex items-baseline gap-3 px-8 md:px-10 pt-6 pb-4">
            <h3 className="font-brand font-bold text-2xl md:text-3xl tracking-[-0.04em] text-primary">
              核心能力
            </h3>
            <span className="font-mono text-xs text-secondary">/ 01</span>
          </div>
          <div className="flex min-h-0 flex-1 flex-col">
            {CORE_ABILITIES.map((ability) => (
              <div
                key={ability.title}
                className="line-t flex flex-1 items-center gap-4 px-8 md:px-10 py-5"
              >
                <ability.icon className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.5} />
                <div>
                  <p className="font-sans text-base font-bold text-primary">{ability.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-secondary">{ability.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
