// DriftWall:基于 React Bits 开源组件(reactbits.dev / github.com/DavidHDev/react-bits)的定制版,
// 因定制瓦片内容(技能栈 icon + 名称)而归于自定义组件目录;动画/交互/参数均为官方原版。
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

// 项目定制:瓦片内容替换为技能栈(icon + 名称),动画/交互/参数均为官方 DriftWall 原版
export interface DriftWallItem {
  name: string;
  href?: string;
  /** Simple Icons 静态 SVG 路径(public/simple-icons/<slug>.svg),优先渲染 */
  iconUrl?: string;
  /** 自定义内联图标(ReactNode),未提供 iconUrl 时兜底 */
  icon?: ReactNode;
}

export interface DriftWallProps {
  /** 瓦片数据(必填):技能栈列表 */
  items: DriftWallItem[];
  /** 列数(瓦片按列轮转);半屏布局建议 4,全屏建议 5~7 */
  columns?: number;
  /** 瓦片宽度 px;宽了瓦片大、墙更满 */
  tileWidth?: number;
  /** 瓦片高度 px;矮了列更紧凑 */
  tileHeight?: number;
  /** 瓦片间距 px(横向纵向共用) */
  gap?: number;
  /** 瓦片圆角 px;项目默认 0 保持直角硬朗 */
  radius?: number;
  /** 平面俯角 deg(rotateX);越大墙面俯视感越强 */
  tilt?: number;
  /** 平面偏航 deg(rotateY);负值墙面左转 */
  turn?: number;
  /** 平面滚转 deg(rotateZ) */
  roll?: number;
  /** 视点距 px;越小纵深越戏剧化(1000 左右已很立体) */
  perspective?: number;
  /** 平面距视点后退距离 px;越小墙离观者越近 */
  depth?: number;
  /** 漂移基准速度 px/s(列间再按 variance 微分);40 左右是舒缓节奏 */
  speed?: number;
  /** 主漂移方向,列围绕它上下交替 */
  direction?: 'up' | 'down';
  /** 列速差异化(0~1);越大列间错落越明显 */
  variance?: number;
  /** 指针跟随的平面微倾强度;0 关闭(动感弱、性能略省) */
  parallax?: number;
  /** 指针悬停于墙上时暂停整墙漂移 */
  pauseOnHover?: boolean;
  /** 悬停瓦片向视点抬升 px;越大抬起越"突出" */
  lift?: number;
  /** 边缘与纵深溶解强度(0~1);越大瓦片越早淡入纸底 */
  fade?: number;
  /** 未悬停瓦片静默透明度(0~1);越小瓦片越"沉底" */
  dim?: number;
  /** 静默瓦片去饱和,悬停恢复颜色(对彩色瓦片有效) */
  grayscale?: boolean;
  /** 静默瓦片罩色(叠加在静默瓦片上的色调) */
  overlayColor?: string;
  /** 附加类名 */
  className?: string;
  /** 额外样式 */
  style?: CSSProperties;
}

interface ColumnMeta {
  copyHeight: number;
  copies: number;
}

const cx = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(' ');

// 墙边缘纵深溶解涂布:与 theme 无关的静态模板(组件外缓存,避免每次渲染重建)
const maskStyle =
  'radial-gradient(ellipse 78% 82% at 50% 46%, #000 var(--dw-edge), transparent 100%), ' +
  'linear-gradient(to top, #000 var(--dw-edge), transparent 100%)';

// 无 icon 时的缺省徽章:技能名首字母(与瓦片同构)
const Monogram = ({ name }: { name: string }) => (
  <span className="flex h-11 w-11 items-center justify-center rounded-(--dw-radius) border border-border bg-paper font-mono text-lg font-bold text-secondary">
    {name.charAt(0)}
  </span>
);

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const columnFactor = (index: number, variance: number): number => {
  const pseudo = ((index * 0.6180339887 + 0.35) % 1) * 2 - 1;
  return 1 + variance * pseudo;
};

const DriftWall = ({
  items,
  columns = 5,
  tileWidth = 200,
  tileHeight = 132,
  gap = 18,
  radius = 14,
  tilt = 16,
  turn = -14,
  roll = 0,
  perspective = 1200,
  depth = 120,
  speed = 42,
  direction = 'up',
  variance = 0.45,
  parallax = 0.6,
  pauseOnHover = false,
  lift = 64,
  fade = 0.6,
  dim = 0.55,
  grayscale = false,
  overlayColor = '#060010',
  className = '',
  style,
}: DriftWallProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const trackRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);

  const offsetsRef = useRef<number[]>([]);
  const velocitiesRef = useRef<number[]>([]);
  const hoveredColRef = useRef<number>(-1);
  const wallHoveredRef = useRef<boolean>(false);
  const pointerRef = useRef({ x: 0, y: 0 });
  const pointerDampedRef = useRef({ x: 0, y: 0 });
  const lastTsRef = useRef<number | null>(null);

  const [containerHeight, setContainerHeight] = useState(600);
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeIdRef = useRef<string | null>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(prefersReducedMotion());
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const columnItems = useMemo<DriftWallItem[][]>(() => {
    const cols: DriftWallItem[][] = Array.from({ length: columns }, () => []);
    items.forEach((item, i) => cols[i % columns].push(item));
    return cols.map((col) => (col.length ? col : items.slice(0, 1)));
  }, [items, columns]);

  const columnMeta = useMemo<ColumnMeta[]>(() => {
    const unit = tileHeight + gap;
    return columnItems.map((col) => {
      const copyHeight = Math.max(unit, col.length * unit);
      const copies = Math.max(2, Math.ceil((containerHeight * 1.6) / copyHeight) + 1);
      return { copyHeight, copies };
    });
  }, [columnItems, tileHeight, gap, containerHeight]);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerHeight(entry.contentRect.height || 600);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const baseVelocities = useMemo<number[]>(() => {
    const dirSign = direction === 'up' ? 1 : -1;
    return columnItems.map((_, c) => {
      const altSign = c % 2 === 0 ? 1 : -1;
      return speed * columnFactor(c, variance) * dirSign * altSign;
    });
  }, [columnItems, speed, direction, variance]);

  useEffect(() => {
    offsetsRef.current = columnMeta.map((meta, c) => meta.copyHeight * ((c * 0.37) % 1));
    velocitiesRef.current = columnItems.map(() => 0);
  }, [columnMeta, columnItems]);

  const applyPlaneTransform = useCallback(
    (px: number, py: number) => {
      const plane = planeRef.current;
      if (!plane) return;
      plane.style.transform =
        `translate(-50%, -50%) scale(1.18) ` +
        `rotateX(${tilt + py}deg) rotateY(${turn + px}deg) rotateZ(${roll}deg) ` +
        `translateZ(${-depth}px)`;
    },
    [tilt, turn, roll, depth],
  );

  useEffect(() => {
    const animate = (ts: number) => {
      if (lastTsRef.current === null) lastTsRef.current = ts;
      const dt = Math.min(0.05, Math.max(0, ts - lastTsRef.current) / 1000);
      lastTsRef.current = ts;

      const maxTilt = parallax * 8;
      const targetX = pointerRef.current.x * maxTilt;
      const targetY = -pointerRef.current.y * maxTilt;
      const damp = 1 - Math.exp(-dt / 0.12);
      pointerDampedRef.current.x += (targetX - pointerDampedRef.current.x) * damp;
      pointerDampedRef.current.y += (targetY - pointerDampedRef.current.y) * damp;
      applyPlaneTransform(pointerDampedRef.current.x, pointerDampedRef.current.y);

      if (!reduced) {
        for (let c = 0; c < trackRefs.current.length; c++) {
          const meta = columnMeta[c];
          if (!meta) continue;
          const paused = wallHoveredRef.current && pauseOnHover;
          const factor = paused || hoveredColRef.current === c ? 0 : 1;
          const target = baseVelocities[c] * factor;

          const ease = 1 - Math.exp(-dt / (target === 0 ? 0.16 : 0.28));
          velocitiesRef.current[c] += (target - velocitiesRef.current[c]) * ease;
          let next = (offsetsRef.current[c] ?? 0) + velocitiesRef.current[c] * dt;
          next = ((next % meta.copyHeight) + meta.copyHeight) % meta.copyHeight;
          offsetsRef.current[c] = next;

          const el = trackRefs.current[c];
          if (el) el.style.transform = `translate3d(0, ${-next}px, 0)`;
        }
      } else {
        for (let c = 0; c < trackRefs.current.length; c++) {
          const el = trackRefs.current[c];
          const meta = columnMeta[c];
          if (el && meta)
            el.style.transform = `translate3d(0, ${-(offsetsRef.current[c] ?? 0)}px, 0)`;
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = null;
    };
  }, [baseVelocities, columnMeta, pauseOnHover, parallax, reduced, applyPlaneTransform]);

  const activate = useCallback((id: string, index: number): void => {
    activeIdRef.current = id;
    hoveredColRef.current = index;
    setActiveId(id);
  }, []);
  const release = useCallback((): void => {
    activeIdRef.current = null;
    hoveredColRef.current = -1;
    setActiveId(null);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      if (parallax > 0 && !reduced) {
        pointerRef.current = {
          x: (e.clientX - rect.left) / rect.width - 0.5,
          y: (e.clientY - rect.top) / rect.height - 0.5,
        };
      }
      const hit = document.elementFromPoint(e.clientX, e.clientY);
      const tile =
        hit && hit.closest ? (hit.closest('[data-tile-id]') as HTMLElement | null) : null;
      if (!tile) return;
      const id = tile.dataset.tileId ?? null;
      if (id === activeIdRef.current) return;
      activeIdRef.current = id;
      hoveredColRef.current = Number(tile.dataset.col);
      setActiveId(id);
    },
    [parallax, reduced],
  );

  const handlePointerLeaveWall = useCallback((): void => {
    wallHoveredRef.current = false;
    pointerRef.current = { x: 0, y: 0 };
    release();
  }, [release]);

  const cssVars = useMemo<CSSProperties>(
    () =>
      ({
        '--dw-tile-w': `${tileWidth}px`,
        '--dw-tile-h': `${tileHeight}px`,
        '--dw-gap': `${gap}px`,
        '--dw-radius': `${radius}px`,
        '--dw-lift': `${lift}px`,
        '--dw-dim': dim,
        '--dw-gray': grayscale ? 1 : 0,
        '--dw-overlay': overlayColor,
        '--dw-edge': `${Math.max(0, (1 - fade) * 100)}%`,
        perspective: `${perspective}px`,
        perspectiveOrigin: '50% 50%',
        WebkitMaskImage: maskStyle,
        maskImage: maskStyle,
        WebkitMaskComposite: 'source-in',
        maskComposite: 'intersect',
        ...style,
      }) as CSSProperties,
    [
      tileWidth,
      tileHeight,
      gap,
      radius,
      lift,
      dim,
      grayscale,
      overlayColor,
      fade,
      perspective,
      maskStyle,
      style,
    ],
  );

  const tileClass = cx(
    'group/tile relative block flex-none cursor-pointer outline-none',
    'w-full h-[calc(var(--dw-tile-h)+var(--dw-gap))] transform-3d',
  );
  const innerClass = cx(
    'pointer-events-none absolute inset-[calc(var(--dw-gap)/2)] flex flex-col items-center justify-center gap-2.5 overflow-hidden',
    'border border-border bg-[#f5f5ed]/60 px-3 py-2',
    'rounded-(--dw-radius) opacity-[var(--dw-dim)] [transform:translateZ(0)]',
    'transition-[transform,opacity,box-shadow,border-color,background-color] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
    'group-[.is-active]/tile:opacity-100 group-[.is-active]/tile:[transform:translateZ(var(--dw-lift))_scale(1.06)]',
    'group-[.is-active]/tile:border-secondary/70 group-[.is-active]/tile:bg-white',
    'group-[.is-active]/tile:shadow-[0_16px_36px_-18px_rgba(40,40,40,0.3)]',
    'group-focus-visible/tile:opacity-100 group-focus-visible/tile:[transform:translateZ(var(--dw-lift))_scale(1.06)]',
    'group-focus-visible/tile:shadow-[0_16px_36px_-18px_rgba(40,40,40,0.3),0_0_0_2px_rgba(40,40,40,0.25)]',
  );
  const imgClass = cx(
    'block h-6 w-6 select-none',
    '[filter:grayscale(var(--dw-gray))_saturate(0.92)]',
    'transition-[filter] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
    'group-[.is-active]/tile:[filter:grayscale(0)_saturate(1.05)] group-focus-visible/tile:[filter:grayscale(0)_saturate(1.05)]',
  );
  const overlayClass = cx(
    'pointer-events-none absolute inset-0 bg-[var(--dw-overlay)] opacity-[0.42]',
    'transition-opacity duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
    'group-[.is-active]/tile:opacity-0 group-focus-visible/tile:opacity-0',
  );

  const renderTile = (item: DriftWallItem, id: string, colIndex: number) => {
    // 项目定制:瓦片 = icon(静态 SVG / 自定义 / monogram 兜底)+ 技能名 + 静默罩
    const inner = (
      <span className={innerClass}>
        {item.iconUrl ? (
          <img
            src={item.iconUrl}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            className={imgClass}
          />
        ) : (
          (item.icon ?? <Monogram name={item.name} />)
        )}
        <span className="text-center font-sans text-sm font-medium leading-tight text-primary">
          {item.name}
        </span>
        <span className={overlayClass} aria-hidden="true" />
      </span>
    );
    const commonProps = {
      className: cx(tileClass, activeId === id && 'is-active'),
      'data-tile-id': id,
      'data-col': colIndex,
      onFocus: () => activate(id, colIndex),
      onBlur: release,
    };
    if (item.href) {
      return (
        <a key={id} href={item.href} target="_blank" rel="noreferrer noopener" {...commonProps}>
          {inner}
        </a>
      );
    }
    return (
      <div key={id} tabIndex={0} role="button" aria-label={item.name} {...commonProps}>
        {inner}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={cx('relative h-full w-full overflow-hidden', className)}
      style={cssVars}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => {
        wallHoveredRef.current = true;
      }}
      onPointerLeave={handlePointerLeaveWall}
      role="group"
      aria-label="Drifting wall of tiles"
    >
      <div
        ref={planeRef}
        className="absolute left-1/2 top-1/2 flex cursor-pointer flex-row transform-3d origin-[50%_50%] will-change-transform"
      >
        {columnItems.map((col, c) => {
          const meta = columnMeta[c];
          const copies = Array.from({ length: meta.copies });
          return (
            <div
              className="relative w-[calc(var(--dw-tile-w)+var(--dw-gap))] transform-3d"
              key={`col-${c}`}
            >
              <div
                className="flex flex-col transform-3d will-change-transform"
                ref={(el) => {
                  trackRefs.current[c] = el;
                }}
              >
                {copies.map((_, copyIndex) =>
                  col.map((item, itemIndex) =>
                    renderTile(item, `${c}-${copyIndex}-${itemIndex}`, c),
                  ),
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DriftWall;
