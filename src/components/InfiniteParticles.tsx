import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * ∞ 粒子画布:复刻 blog.maximeheckel.com hero 的 WebGL 粒子效果。
 *
 * 原站(R3F,模块 37168)把粒子位置存进 256×256 RenderTarget 做双缓冲模拟,
 * 但其模拟 shader 是无状态解析式(位置只由相位与时间决定),因此这里单 pass
 * 直接写在 Points 顶点着色器里逐帧现算,效果与动画与原站等价且省一次全屏渲染。
 *
 * ∞ 形状 = 伯努利双纽线参数化:x = cosT/(1+sin²T)、y = sinT·cosT/(1+sin²T),
 * 每粒子按索引分配相位,叠加随机扰动与 curl noise(simplex 求旋度)产生流动感。
 * 彩虹边缘 = RGB 分通道偏移 + 超饱和后处理(原站 HalftoneEffect 的色散分量)。
 */

// 粒子总数:256×256(与原站一致)
const SIZE = 256;
const COUNT = SIZE * SIZE;
const PI = 3.141592653589793;

// —— 粒子顶点着色器:伯努利双纽线 + 随机扰动 + curl noise(数学取自原站模拟 shader)——
const VERTEX_SHADER = /* glsl */ `
uniform float uTime;
uniform float uSize;
varying float vDistance;

vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

// Ashima 3D simplex noise(原站同名实现,Gustavson 成果)
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

vec3 snoiseVec3(vec3 x) {
  return vec3(
    snoise(vec3(x)),
    snoise(vec3(x.y - 19.1, x.z + 33.4, x.x + 47.2)),
    snoise(vec3(x.z + 74.2, x.x - 124.5, x.y + 99.4))
  );
}

vec3 curlNoise(vec3 p) {
  const float e = 0.1;
  vec3 p_x0 = snoiseVec3(p - vec3(e, 0.0, 0.0));
  vec3 p_x1 = snoiseVec3(p + vec3(e, 0.0, 0.0));
  vec3 p_y0 = snoiseVec3(p - vec3(0.0, e, 0.0));
  vec3 p_y1 = snoiseVec3(p + vec3(0.0, e, 0.0));
  vec3 p_z0 = snoiseVec3(p - vec3(0.0, 0.0, e));
  vec3 p_z1 = snoiseVec3(p + vec3(0.0, 0.0, e));
  float x = p_y1.z - p_y0.z - p_z1.y + p_z0.y;
  float y = p_z1.x - p_z0.x - p_x1.z + p_x0.z;
  float z = p_x1.y - p_x0.y - p_y1.x + p_y0.x;
  return normalize(vec3(x, y, z) / (2.0 * e));
}

float random(vec2 co) {
  return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
  // 粒子相位:256×256 网格索引均匀分配在 [0, 2π)
  float particleIndex = floor(position.x * uSize) + floor(position.y * uSize) * uSize;
  float t = particleIndex / (uSize * uSize) * 6.283185307179586 + uTime * 2.5;

  float sinT = sin(t);
  float cosT = cos(t);
  float scale = 2.5;

  // 伯努利双纽线(∞):与原站模拟 shader 逐行一致
  float x = (cosT / (1.0 + sinT * sinT)) * scale;
  float y = (sinT * cosT / (1.0 + sinT * sinT)) * scale;
  float z = (0.5 * sinT) * scale;
  vec3 pos = vec3(x, y, z);

  // 随机扰动 + curl noise 流动
  float randomness = 0.5;
  pos.x += (random(position.xy) - 0.5) * randomness;
  pos.y += (random(position.xy + 1.0) - 0.5) * randomness;
  pos.z += (random(position.xy + 2.0) - 0.5) * randomness;
  pos += curlNoise(pos * 0.05 + uTime * 0.1) * 0.25;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  vDistance = length(mv.xyz);
  gl_PointSize = 3.5 * 3.0 / vDistance;
}
`;

// —— 粒子片段着色器:圆形点 + 按距离淡出(原站白点,这里适配纸纹底改主文字色)——
const FRAGMENT_SHADER = /* glsl */ `
varying float vDistance;

void main() {
  vec2 cxy = 2.0 * gl_PointCoord - 1.0;
  float dist = length(cxy);
  if (dist > 0.8) discard;
  float intensity = dist * 1.8;
  gl_FragColor = vec4(vec3(0.157, 0.157, 0.157), 1.0 - clamp(vDistance, 0.0, 0.75) * intensity);
}
`;

// —— 后处理:RGB 分通道偏移 + 超饱和(原站 HalftoneEffect 的 ogColor 分支)——
const POST_VERTEX_SHADER = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const POST_FRAGMENT_SHADER = /* glsl */ `
uniform sampler2D tDiffuse;
varying vec2 vUv;

void main() {
  vec3 color;
  color.r = texture2D(tDiffuse, vUv + vec2(0.00075, 0.0)).r;
  color.g = texture2D(tDiffuse, vUv).g;
  color.b = texture2D(tDiffuse, vUv - vec2(0.0015, 0.0)).b;
  color *= 1.5;
  float luma = dot(vec3(0.2125, 0.7154, 0.0721), color);
  color = mix(vec3(luma), color, 1.35);
  // alpha 透传:粒子外透明,露出底下渐变背景
  float alpha = texture2D(tDiffuse, vUv).a;
  gl_FragColor = vec4(color, alpha);
}
`;

export default function InfiniteParticles({ className = '' }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
    camera.position.set(0, 0, 1);

    // 粒子组:整体左倾(原站的 -0.065π),居中显示
    const group = new THREE.Group();
    group.rotation.z = -(0.065 * PI);

    // 65536 粒子:attribute position 存 256×256 网格坐标(顶点着色器用其求相位)
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (i % SIZE) / SIZE;
      positions[i * 3 + 1] = i / SIZE / SIZE;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uSize: { value: SIZE } },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
    });
    group.add(new THREE.Points(geometry, material));

    const scene = new THREE.Scene();
    scene.add(group);

    // 后处理:粒子先渲染到 RT,再经色散 quad 输出到屏幕
    const postScene = new THREE.Scene();
    const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        uniforms: { tDiffuse: { value: null } },
        vertexShader: POST_VERTEX_SHADER,
        fragmentShader: POST_FRAGMENT_SHADER,
        depthTest: false,
        depthWrite: false,
      }),
    );
    postScene.add(quad);

    let rt = new THREE.WebGLRenderTarget(1, 1);

    const setSize = (w: number, h: number) => {
      // updateStyle=true:canvas CSS 尺寸跟随容器,避免无样式撑破宿主
      renderer.setSize(w, h, true);
      const aspect = w / h;
      camera.aspect = aspect;
      // 自适应变焦(保完整):以"随机浮动最大范围"求最近焦距,任何 t 时刻都不会探出盒子。
      // 边界来源:双纽线 ±2.5 + 随机 ±0.5 + curl noise ±0.25,经 group 旋转 -0.065π
      // 后相机轴投影半界 x≈3.25、y≈2.0;近端粒子(z 前伸)透视放大 ≈1.15 直接并入,粒子更大
      const tan = Math.tan((75 * PI) / 360);
      const HALF_X = 3.75;
      const HALF_Y = 2.3;
      camera.position.z = Math.max(HALF_Y / tan, HALF_X / (tan * aspect));
      camera.updateProjectionMatrix();
      rt.setSize(
        Math.round(w * renderer.getPixelRatio()),
        Math.round(h * renderer.getPixelRatio()),
      );
    };

    const rect = host.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) setSize(rect.width, rect.height);

    let raf = 0;
    let stopped = false;
    const t0 = performance.now();

    const renderFrame = () => {
      material.uniforms.uTime.value = (performance.now() - t0) / 1000;
      // pass 1:粒子 → RT
      renderer.setRenderTarget(rt);
      renderer.render(scene, camera);
      // pass 2:色散 quad → 屏幕
      renderer.setRenderTarget(null);
      (quad.material as THREE.ShaderMaterial).uniforms.tDiffuse.value = rt.texture;
      renderer.render(postScene, postCamera);
    };

    // 静止动画偏好:只渲染一帧;正常循环
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    renderFrame();
    if (!reduced) {
      const tick = () => {
        if (stopped) return;
        renderFrame();
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize(width, height);
    });
    observer.observe(host);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      geometry.dispose();
      material.dispose();
      quad.geometry.dispose();
      (quad.material as THREE.ShaderMaterial).dispose();
      rt.dispose();
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, []);

  // 无背景:canvas 透明,粒子直接浮在页面背景上;absolute 铺满调用方定位的父级
  return <div ref={hostRef} className={`absolute inset-0 overflow-hidden ${className}`} />;
}
