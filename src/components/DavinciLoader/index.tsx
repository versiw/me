import './davinci-loader.css';

/**
 * 达芬奇几何线条加载页(纯静态 SSR,零客户端 JS)。
 *
 * 几何 = 原站 hero 组(data-group 含 7)元素集,坐标逐字符复刻自 research/davinci-lines-svg.html;
 * 动画:0s 同帧描画 3s + 呼吸 4s,中心框 6s 连续闭合,标题 6.2s/6.6s 淡入。
 * 全屏覆盖并拦截交互;加载结束常驻(退出机制属后续任务)。样式见 davinci-loader.css。
 */

export default function DavinciLoader() {
  return (
    <div className="davinci-lines__stage">
      <svg
        className="davinci-lines"
        viewBox="0 0 1440 890"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* 虚线 pattern */}
        <defs>
          <pattern id="dashed-stroke" patternUnits="userSpaceOnUse" width="4" height="1">
            <rect x="0" y="0" width="1" height="1" fill="currentColor" opacity="0.2" />
          </pattern>
          <pattern id="dashed-stroke-vertical" patternUnits="userSpaceOnUse" width="1" height="4">
            <rect x="0" y="0" width="1" height="1" fill="currentColor" opacity="0.2" />
          </pattern>
        </defs>

        {/* 中心框 */}
        <rect
          className="dl-frame-rect"
          x="550"
          y="208"
          width="340"
          height="464"
          pathLength="1"
          strokeLinecap="square"
        />

        {/* 原站 hero 组(data-group 含 7)元素集,坐标逐字符复制 */}
        <g className="dl-lines">
          <path
            className="dl-draw dl-dashed"
            id="centered-horizontal"
            pathLength="1"
            d="M-1840 440h5120"
          />
          <path
            className="dl-draw dl-dashed-v"
            id="centered-vertical"
            pathLength="1"
            d="M720 -1000v2880"
          />
          <path
            className="dl-draw"
            id="golden-top-horizontal-left"
            pathLength="1"
            d="M-1840 336.1300899000925h2390.0310562001514"
          />
          <path
            className="dl-draw"
            id="golden-lower-horizontal-right"
            pathLength="1"
            d="M889.9689437998486 543.8699100999074h2390.0310562001514"
          />
          <path
            className="dl-draw"
            id="golden-left-vertical"
            pathLength="1"
            d="M550.0310562001514 -1000v2880"
          />
          <path
            className="dl-draw"
            id="golden-right-vertical"
            pathLength="1"
            d="M889.9689437998486 -1000v2880"
          />
          <path
            className="dl-draw"
            id="diagonal-top-left-to-bottom-right"
            pathLength="1"
            d="M-1636.3636363636363,-1000L3076.363636363636,1880"
          />
          <path
            className="dl-draw"
            id="diagonal-top-right-to-bottom-left"
            pathLength="1"
            d="M3076.363636363636,-1000L-1636.363636363636,1880"
          />
          {/* 斐波那契螺旋 TL/BR 各 6 条(3 层回字) */}
          <path
            className="dl-draw"
            id="spiral-top-left-vertical-1"
            pathLength="1"
            d="M339.93788759969715 -1000v1336.1300899000926"
          />
          <path
            className="dl-draw"
            id="spiral-top-left-horizontal-1"
            pathLength="1"
            d="M339.93788759969715 207.73982019981494h210.09316860045425"
          />
          <path
            className="dl-draw"
            id="spiral-top-left-vertical-2"
            pathLength="1"
            d="M420.1863372009085 207.73982019981494v128.39026970027757"
          />
          <path
            className="dl-draw"
            id="spiral-top-left-horizontal-2"
            pathLength="1"
            d="M339.93788759969715 256.7805394005552h80.24844960121135"
          />
          <path
            className="dl-draw"
            id="spiral-top-left-vertical-3"
            pathLength="1"
            d="M389.5341569977287 256.7805394005552v-49.040719200740256"
          />
          <path
            className="dl-draw"
            id="spiral-top-left-horizontal-3"
            pathLength="1"
            d="M389.5341569977287 238.048651498612h30.652180203179796"
          />
          <path
            className="dl-draw"
            id="spiral-bottom-right-vertical-1"
            pathLength="1"
            d="M1100.0621124003028 543.8699100999074v1336.1300899000926"
          />
          <path
            className="dl-draw"
            id="spiral-bottom-right-horizontal-1"
            pathLength="1"
            d="M889.9689437998486 672.260179800185h210.0931686004542"
          />
          <path
            className="dl-draw"
            id="spiral-bottom-right-vertical-2"
            pathLength="1"
            d="M1019.8136627990915 672.260179800185v-128.3902697002776"
          />
          <path
            className="dl-draw"
            id="spiral-bottom-right-horizontal-2"
            pathLength="1"
            d="M1019.8136627990915 623.2194605994448h80.24844960121129"
          />
          <path
            className="dl-draw"
            id="spiral-bottom-right-vertical-3"
            pathLength="1"
            d="M1050.4658430022714 623.2194605994448v49.04071920074023"
          />
          <path
            className="dl-draw"
            id="spiral-bottom-right-horizontal-3"
            pathLength="1"
            d="M1050.4658430022714 641.9513485013881h-30.65218020317991"
          />
          {/* r=425 圆 ×2:rotate-45 定位描边起点(否则右竖弧先出) */}
          <circle
            className="dl-draw dl-arc dl-arc--top"
            id="circle-center-small-top"
            pathLength="1"
            cx="720"
            cy="15"
            r="425"
          />
          <circle
            className="dl-draw dl-arc dl-arc--bottom"
            id="circle-center-small-bottom"
            pathLength="1"
            cx="720"
            cy="865"
            r="425"
          />
        </g>
      </svg>

      {/* 品牌:versiw = verse×wise(诗句与智慧),中文"诗维" */}
      <div className="davinci-lines__title">
        <p className="davinci-lines__title-line">Versiw</p>
        <p className="davinci-lines__title-sub">诗维</p>
      </div>
    </div>
  );
}
