import Nav from './Nav';
import Hero from './Hero';
import Projects from './Projects';
import About from './About';
import Footer from './Footer';

// 展示页骨架:视口外框 fixed 钉在可视区(滚动时每屏都被框住),各分区文档流内各占一个视口
export default function Showcase() {
  return (
    <div className="relative min-h-screen w-full p-2.25 text-primary select-none">
      {/* 视口外框:1px 细线,与滚动无关,始终框住当前可视窗口(Hero 底线在首屏与其底边重合) */}
      <div className="pointer-events-none fixed inset-2.25 z-50 line" aria-hidden="true" />

      <Nav />
      <Hero />
      <Projects />
      <About />
      <Footer />
    </div>
  );
}
