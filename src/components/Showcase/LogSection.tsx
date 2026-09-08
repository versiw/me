// 日志:占位 section,一视口高度,内容待实装
export default function LogSection() {
  return (
    <section id="log" className="h-[calc(100dvh-18px)] flex flex-col line-b">
      <div className="flex-1 p-8 md:p-10 flex items-start">
        <h2 className="font-brand font-bold text-3xl md:text-5xl tracking-[-0.04em] text-primary">
          日志占位
        </h2>
      </div>
      <div className="h-10 px-5 flex items-center font-sans text-xs text-secondary">
        记录开发旅程的笔记将在这里按时间线展示
      </div>
    </section>
  );
}
