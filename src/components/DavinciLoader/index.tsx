import { useEffect, useRef, useState } from 'react';

/**
 * 达芬奇几何线条加载页(SSR 直出 + 客户端门卫)。
 *
 * 几何 = 原站最终态(data-active=7)可见集,即 data-group 含 7 的元素,坐标逐字符复刻自
 * research/davinci-lines-svg.html;最终态三竖线均为实线、无中心水平线(其为过程组 1/3/5 过渡线)。
 *
 * 门卫逻辑(仅客户端,hydration 后接管;Layout 需 client:load 才会生效):
 * - 矩形闭合 = 页面加载进度,与几何线条同帧开始(原站行为):
 *   前段:6s 缓动 cubic-bezier(.45,.28,.34,.84)(原站 load-lines,前快后慢、尾段爬行);
 *   未就绪:进度封顶于第 3 边 1/3 处(HOLD_P)停驻待命;
 *   就绪:1s 收口 cubic-bezier(.72,.16,.19,.96)(原站 complete 冲口),闭合不早于几何描画完成;
 *   字在绘制第 2 边(1.5s)时开始淡入;
 *   就绪信号:window load / <script data-davinci-ready> onload / READY_BAIL_MS(5s)兜底,先到者胜;
 * - 闭合 → 标题已就位 → 200ms 淡出 → setShouldRender(false) 彻底卸载,零 DOM/CPU 残留;
 * - prefers-reduced-motion / 无 JS:免动画直通,不阻塞内容;SSR 直出 + z-[9999] 遮罩,爬虫零影响。
 */

// 线条公共类:终态(白 15%)+ 描画动画辅助(原 CSS .dl-draw 职责,仅 motion-safe 时进入动画态)
const DL_DRAW =
  '[stroke:#ffffff26] [stroke-width:0.4px] motion-safe:[stroke-dasharray:1] motion-safe:[stroke-dashoffset:1px] motion-safe:animate-dl-draw';

// —— 门卫时序参数(前段/收口缓动忠实取自原站)——
const READY_BAIL_MS = 5000; // 兜底:最迟 5s 强制就绪
const EDGE_MS = 1500; // 每边时长(6s/4,用于定义"第 2 边开始"= 1.5s)
const FRAME_MS = 6000; // 前段描画总时长(原站 --lines-loading-duration)
const HOLD_P = 7 / 12; // 未就绪时进度上限:第 3 边 1/3 处(0.583)
const CLOSE_MS = 1000; // 就绪后收口时长(原站 --lines-complete-duration:1s)
// 闭合完成不早于几何描画(3s,同帧开始)完成后的缓冲点,否则几何未画完就退出
const CLOSE_EARLIEST_AT = 4500;
const TITLE_AT_MS = EDGE_MS; // 第 2 边开始绘制(矩形第 1 边完成)→ 标题淡入
const TITLE_FADE_MS = 520; // 标题淡入时长
const TITLE_SUB_GAP_MS = 400; // 副行"诗维"相对主行延迟
const FADE_OUT_MS = 200; // 遮罩淡出时长
const LERP_TAU_MS = 90; // 进度插值时间常数(指数收敛,防就绪瞬间跳变)

/**
 * cubic-bezier(x1,y1,x2,y2) → 输入 x(0..1) 返回 y(0..1),牛顿迭代解参方程。
 * JS 层驱动矩形进度需要与 CSS 等价的缓动曲线(原站 load-lines / complete 均由 CSS 定义)。
 */
function makeBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  const sampleXDeriv = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    let t = x;
    for (let i = 0; i < 5; i++) {
      const dx = sampleX(t) - x;
      const d = sampleXDeriv(t);
      if (Math.abs(dx) < 1e-5 || d === 0) break;
      t -= dx / d;
    }
    return sampleY(t);
  };
}

// 前段描画缓动(原站 --lines-loading-easing:前快后慢,尾段爬行)
const FRAME_EASE = makeBezier(0.45, 0.28, 0.34, 0.84);
// 收口缓动(原站 --lines-complete-easing:快入慢出的"冲口")
const CLOSE_EASE = makeBezier(0.72, 0.16, 0.19, 0.96);

export default function DavinciLoader() {
  // phase = 'gone' 即 setShouldRender(false):React 从 DOM 树彻底拔除该组件
  const [phase, setPhase] = useState<'active' | 'gone'>('active');
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<SVGRectElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const frame = frameRef.current;
    const title = titleRef.current;
    if (!stage || !frame || !title) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const start = performance.now();
    let readyAt = Number.POSITIVE_INFINITY; // 绝对性能时间;Infinity = 未就绪
    let closing = false; // 就绪后进入加速闭合
    let qFrom = 0; // 加速闭合起点进度
    let closeStartAt = 0;
    let qCur = 0; // 当前进度(每帧向 qTarget 指数收敛)
    let lastT = start;
    let frameDone = false;
    let titleAt = -1; // 标题开始出现的绝对时刻
    let exitStarted = false;
    let raf = 0;
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => {
      timers.push(window.setTimeout(fn, Math.max(0, ms)));
    };
    const setFrameProgress = (q: number) => {
      frame.style.strokeDashoffset = `${(1 - q).toFixed(4)}px`;
    };

    // —— 就绪信号:window load / [data-davinci-ready] 脚本 onload / 5000ms 兜底,先到者胜 ——
    const markReady = () => {
      if (!Number.isFinite(readyAt)) readyAt = performance.now();
    };
    window.addEventListener('load', markReady, { once: true });
    // hydration 晚于 load 时监听不再触发,必须依据 readyState 即刻判断
    if (document.readyState === 'complete') markReady();
    document
      .querySelector<HTMLElement>('[data-davinci-ready]')
      ?.addEventListener('load', markReady, { once: true });
    later(markReady, READY_BAIL_MS);

    const showTitle = () => {
      // 容器先揭开(父级 opacity:0 是根因躲藏点):主行随容器 0.52s 淡入
      title.style.transition = `opacity ${TITLE_FADE_MS}ms ease-out`;
      title.style.opacity = '1';
      // 副行"诗维"延迟 0.4s 各自淡入
      const sub = title.querySelectorAll<HTMLElement>('p')[1];
      if (sub) {
        sub.style.transition = `opacity ${TITLE_FADE_MS}ms ease-out ${TITLE_SUB_GAP_MS}ms`;
        sub.style.opacity = '1';
      }
    };

    const tick = (now: number) => {
      const t = now - start;

      if (reduced) {
        // 免动画:终态 + 就绪即退
        setFrameProgress(1);
        title.style.opacity = '1';
        if (Number.isFinite(readyAt)) {
          setPhase('gone');
          return; // 终止循环
        }
        raf = requestAnimationFrame(tick);
        return;
      }

      // —— 进度模型:前段 6s 缓动(原站 load-lines);未就绪封顶第 3 边 1/3;就绪后 1s 收口(原站 complete)——
      let qTarget: number;
      if (!closing) {
        const base = FRAME_EASE(Math.min(t / FRAME_MS, 1));
        // 未就绪:进度封顶于第 3 边 1/3(缓动下约 3.1s 到达,停驻待命);就绪后继续按曲线推进
        qTarget = Number.isFinite(readyAt) ? base : Math.min(base, HOLD_P);
        // 就绪后进入收口;但就绪极早时保持曲线推进,闭合完成不早于几何描画完成时刻
        const reachAt = Math.max(readyAt, CLOSE_EARLIEST_AT - CLOSE_MS);
        if (Number.isFinite(readyAt) && now >= reachAt) {
          closing = true;
          qFrom = qTarget;
          closeStartAt = reachAt;
        }
      } else {
        // 收口:从就绪时刻的进度以原站 complete 缓动 1s 冲口
        const k = Math.min(1, (now - closeStartAt) / CLOSE_MS);
        qTarget = qFrom + (1 - qFrom) * CLOSE_EASE(k);
      }

      // Lerp 平滑插值:防目标跳变导致画面闪断
      const dt = Math.min(48, now - lastT);
      lastT = now;
      const k = 1 - Math.exp(-dt / LERP_TAU_MS);
      qCur += (qTarget - qCur) * k;
      if (qCur < 0.0001) qCur = 0;
      setFrameProgress(Math.min(qCur, 1));

      if (qCur >= 0.999) frameDone = true;

      // 标题:第 2 边开始绘制时浮现;就绪极早(第 2 边前已闭合)则等闭合完成后再现
      if (titleAt < 0 && (t >= TITLE_AT_MS || frameDone)) {
        titleAt = now;
        showTitle();
      }
      // 退出:矩形闭合完成,且标题两行全部淡入(主行 0.52s + 副行延迟 0.4s 与 0.52s)后才淡出
      if (
        !exitStarted &&
        frameDone &&
        titleAt >= 0 &&
        now >= titleAt + TITLE_SUB_GAP_MS + TITLE_FADE_MS
      ) {
        exitStarted = true;
        if (reduced) {
          setPhase('gone');
        } else {
          stage.style.transition = `opacity ${FADE_OUT_MS}ms ease-out`;
          stage.style.opacity = '0';
          later(() => setPhase('gone'), FADE_OUT_MS);
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      window.removeEventListener('load', markReady);
    };
  }, []);

  if (phase === 'gone') return null;

  return (
    <div
      ref={stageRef}
      className="fixed inset-0 z-9999 grid place-items-center overflow-hidden bg-black"
    >
      {/* pointer-events 默认 auto:拦截底层交互,加载期间页面不可点击 */}
      <svg
        className="h-full w-full text-[#f7f7ee]"
        viewBox="0 0 1440 890"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* 中心框:颜色复用 svg 的 currentColor(#f7f7ee),1px;闭合进度由门卫 JS 逐帧驱动(最早出现) */}
        <rect
          ref={frameRef}
          className="stroke-current stroke-[1px]"
          style={{ strokeDasharray: '1', strokeDashoffset: '1px' }}
          x="550"
          y="208"
          width="340"
          height="464"
          pathLength="1"
          strokeLinecap="square"
        />

        {/* 原站最终态(data-active=7)可见集:data-group 含 7 的元素,坐标逐字符复制。
            centered-horizontal(data-group=1,3,5)属过程态过渡线,最终态不显示,故不复刻 */}
        <g className="dl-lines">
          <path className={DL_DRAW} id="centered-vertical" pathLength="1" d="M720 -1000v2880" />
          <path
            className={DL_DRAW}
            id="golden-top-horizontal-left"
            pathLength="1"
            d="M-1840 336.1300899000925h2390.0310562001514"
          />
          <path
            className={DL_DRAW}
            id="golden-lower-horizontal-right"
            pathLength="1"
            d="M889.9689437998486 543.8699100999074h2390.0310562001514"
          />
          <path
            className={DL_DRAW}
            id="golden-left-vertical"
            pathLength="1"
            d="M550.0310562001514 -1000v2880"
          />
          <path
            className={DL_DRAW}
            id="golden-right-vertical"
            pathLength="1"
            d="M889.9689437998486 -1000v2880"
          />
          <path
            className={DL_DRAW}
            id="diagonal-top-left-to-bottom-right"
            pathLength="1"
            d="M-1636.3636363636363,-1000L3076.363636363636,1880"
          />
          <path
            className={DL_DRAW}
            id="diagonal-top-right-to-bottom-left"
            pathLength="1"
            d="M3076.363636363636,-1000L-1636.363636363636,1880"
          />
          {/* 斐波那契螺旋 TL/BR 各 6 条(3 层回字) */}
          <path
            className={DL_DRAW}
            id="spiral-top-left-vertical-1"
            pathLength="1"
            d="M339.93788759969715 -1000v1336.1300899000926"
          />
          <path
            className={DL_DRAW}
            id="spiral-top-left-horizontal-1"
            pathLength="1"
            d="M339.93788759969715 207.73982019981494h210.09316860045425"
          />
          <path
            className={DL_DRAW}
            id="spiral-top-left-vertical-2"
            pathLength="1"
            d="M420.1863372009085 207.73982019981494v128.39026970027757"
          />
          <path
            className={DL_DRAW}
            id="spiral-top-left-horizontal-2"
            pathLength="1"
            d="M339.93788759969715 256.7805394005552h80.24844960121135"
          />
          <path
            className={DL_DRAW}
            id="spiral-top-left-vertical-3"
            pathLength="1"
            d="M389.5341569977287 256.7805394005552v-49.040719200740256"
          />
          <path
            className={DL_DRAW}
            id="spiral-top-left-horizontal-3"
            pathLength="1"
            d="M389.5341569977287 238.048651498612h30.652180203179796"
          />
          <path
            className={DL_DRAW}
            id="spiral-bottom-right-vertical-1"
            pathLength="1"
            d="M1100.0621124003028 543.8699100999074v1336.1300899000926"
          />
          <path
            className={DL_DRAW}
            id="spiral-bottom-right-horizontal-1"
            pathLength="1"
            d="M889.9689437998486 672.260179800185h210.0931686004542"
          />
          <path
            className={DL_DRAW}
            id="spiral-bottom-right-vertical-2"
            pathLength="1"
            d="M1019.8136627990915 672.260179800185v-128.3902697002776"
          />
          <path
            className={DL_DRAW}
            id="spiral-bottom-right-horizontal-2"
            pathLength="1"
            d="M1019.8136627990915 623.2194605994448h80.24844960121129"
          />
          <path
            className={DL_DRAW}
            id="spiral-bottom-right-vertical-3"
            pathLength="1"
            d="M1050.4658430022714 623.2194605994448v49.04071920074023"
          />
          <path
            className={DL_DRAW}
            id="spiral-bottom-right-horizontal-3"
            pathLength="1"
            d="M1050.4658430022714 641.9513485013881h-30.65218020317991"
          />
          {/* r=425 圆 ×2:rotate-45 定位描边起点(否则右竖弧先出) */}
          <circle
            className={`${DL_DRAW} transform-fill origin-center -rotate-45`}
            id="circle-center-small-top"
            pathLength="1"
            cx="720"
            cy="15"
            r="425"
          />
          <circle
            className={`${DL_DRAW} transform-fill origin-center rotate-45`}
            id="circle-center-small-bottom"
            pathLength="1"
            cx="720"
            cy="865"
            r="425"
          />
        </g>
      </svg>

      {/* 品牌:versiw = verse×wise(诗句与智慧),中文"诗维";矩形绘制第 2 边时淡入 */}
      <div
        ref={titleRef}
        className="pointer-events-none absolute left-1/2 top-1/2 w-[min(304px,60vw)] -translate-x-1/2 -translate-y-1/2 text-center"
        style={{ opacity: 0 }}
      >
        <p className="m-0 font-normal text-[#f7f7ee] font-['BT_Grotesk',Georgia,'Times_New_Roman',serif] tracking-[0.22em] uppercase text-[clamp(12px,2vw,17px)] leading-[1.4]">
          Versiw
        </p>
        <p className="m-0 mt-[0.5em] font-normal text-[#f7f7ee] font-['PingFang_SC','Hiragino_Sans_GB','Microsoft_YaHei',sans-serif] tracking-[0.4em] text-[clamp(11px,1.5vw,14px)] leading-[1.6] indent-[0.4em]">
          诗维
        </p>
      </div>
    </div>
  );
}
