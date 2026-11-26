"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Film,
  Sparkles,
  Download,
  Loader2,
  AlertCircle,
  Play,
  Pause,
  Video,
  SlidersHorizontal,
  Wand2,
  X,
  ShieldCheck,
} from "lucide-react";

const SAMPLE_PROMPTS = [
  "Cyberpunk neon street in rain at night, fast car driving with glowing lights",
  "Golden hour waves crashing on rocky cliffs with boat sailing in slow motion",
  "Rocket launching into space past glowing moon and flying stars",
];

const CAMERA_MOTIONS = ["Dynamic Pan", "Zoom In", "Parallax Sweep"] as const;
const ASPECT_RATIOS = ["16:9", "1:1", "21:9"] as const;

const BG_FACILITIES = [
  "Free Hugging Face + Motion Engine",
  "4s WebM & PNG Export",
  "Camera Pan, Zoom & Speed Controls",
  "16:9 • 1:1 • 21:9 Aspect Ratios",
  "Zero-Budget Public Studio",
];

type GenerateResponse = {
  mode?: "video" | "animated-keyframe" | "local-motion";
  model?: string;
  prompt?: string;
  videoDataUrl?: string;
  imageDataUrl?: string;
  note?: string;
  error?: string;
};

type ScenePlan = {
  seed: number;
  hueA: number;
  hueB: number;
  hasCar: boolean;
  hasRocket: boolean;
  hasBird: boolean;
  hasBoat: boolean;
  hasMoonOrSun: boolean;
  hasMountains: boolean;
  hasCity: boolean;
  hasRain: boolean;
  speedFactor: number;
  keywords: string[];
};

function hashPrompt(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function buildScenePlan(text: string, motionSpeed: number): ScenePlan {
  const clean = text.trim().toLowerCase() || "wobi ai cinematic scene";
  const seed = hashPrompt(clean);
  const q = ` ${clean} `;

  const hasCar = /\b(car|cars|truck|bus|bike|motorcycle|drive|driving|road|highway|street)\b/.test(q);
  const hasRocket = /\b(rocket|spaceship|ufo|ship|launch|fly|flying|space|astronaut|planet)\b/.test(q);
  const hasBird = /\b(bird|birds|eagle|dragon|bat|butterfly|plane|airplane)\b/.test(q);
  const hasBoat = /\b(boat|boats|sail|sailing|wave|waves|ocean|sea|river|water)\b/.test(q);
  const hasMoonOrSun = /\b(sun|sunset|sunrise|moon|moons|night|day|glow|glowing|light|lights)\b/.test(q);
  const hasMountains = /\b(mountain|mountains|hill|hills|cliff|cliffs|forest|trees|desert|dune|dunes)\b/.test(q);
  const hasCity = /\b(city|building|buildings|cyberpunk|neon|town|tower|towers)\b/.test(q);
  const hasRain = /\b(rain|raining|storm|snow|snowing|fog)\b/.test(q);

  let wordSpeed = 1.0;
  if (/\b(fast|speed|racing|rush|quick|super)\b/.test(q)) wordSpeed = 1.65;
  if (/\b(slow|slow motion|calm|peaceful|gentle)\b/.test(q)) wordSpeed = 0.55;

  const stopWords = new Set([
    "a", "an", "the", "in", "on", "at", "with", "and", "or", "to", "of", "for",
    "from", "by", "is", "are", "was", "were", "be", "into", "over", "under", "4k", "hd"
  ]);
  const keywords = clean
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w))
    .slice(0, 4);

  const hueA = seed % 360;
  const hueB = (hueA + 65 + ((seed >> 7) % 120)) % 360;

  return {
    seed,
    hueA,
    hueB,
    hasCar,
    hasRocket,
    hasBird,
    hasBoat,
    hasMoonOrSun,
    hasMountains,
    hasCity,
    hasRain,
    speedFactor: wordSpeed * motionSpeed,
    keywords,
  };
}

function drawCar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number,
  accentHue: number
) {
  ctx.save();
  ctx.translate(x, y);

  const beam = ctx.createLinearGradient(44, -8, 175, -14);
  beam.addColorStop(0, "rgba(254, 240, 138, 0.45)");
  beam.addColorStop(1, "rgba(254, 240, 138, 0)");
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(42, -8);
  ctx.lineTo(175, -34);
  ctx.lineTo(175, 14);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = `hsl(${accentHue}, 82%, 55%)`;
  ctx.beginPath();
  ctx.roundRect(-42, -18, 86, 18, 5);
  ctx.fill();

  ctx.fillStyle = "#18181b";
  ctx.beginPath();
  ctx.moveTo(-24, -18);
  ctx.lineTo(-14, -31);
  ctx.lineTo(14, -31);
  ctx.lineTo(25, -18);
  ctx.closePath();
  ctx.fill();

  const wheelSpin = t * 14;
  for (const wx of [-24, 24]) {
    ctx.fillStyle = "#09090b";
    ctx.beginPath();
    ctx.arc(wx, 2, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#e4e4e7";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(wx, 2, 5, wheelSpin, wheelSpin + Math.PI * 1.4);
    ctx.stroke();
  }

  ctx.restore();
}

function drawRocket(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  t: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  const flameLen = 22 + Math.sin(t * 28) * 9;
  const flame = ctx.createLinearGradient(0, 22, 0, 22 + flameLen);
  flame.addColorStop(0, "#fef08a");
  flame.addColorStop(0.5, "#f97316");
  flame.addColorStop(1, "rgba(239, 68, 68, 0)");
  ctx.fillStyle = flame;
  ctx.beginPath();
  ctx.moveTo(-9, 22);
  ctx.lineTo(0, 22 + flameLen);
  ctx.lineTo(9, 22);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.moveTo(-12, 10);
  ctx.lineTo(-22, 24);
  ctx.lineTo(-10, 22);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(12, 10);
  ctx.lineTo(22, 24);
  ctx.lineTo(10, 22);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#f4f4f5";
  ctx.beginPath();
  ctx.moveTo(0, -30);
  ctx.quadraticCurveTo(15, -8, 12, 22);
  ctx.lineTo(-12, 22);
  ctx.quadraticCurveTo(-15, -8, 0, -30);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#38bdf8";
  ctx.beginPath();
  ctx.arc(0, -5, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawBird(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const flap = Math.sin(t * 10) * 10;

  ctx.strokeStyle = "#f4f4f5";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-14, -flap * 0.5);
  ctx.quadraticCurveTo(-6, -12 + flap, 0, 0);
  ctx.quadraticCurveTo(6, -12 + flap, 14, -flap * 0.5);
  ctx.stroke();

  ctx.restore();
}

function drawBoat(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(t * 3) * 0.06);

  ctx.fillStyle = "#f59e0b";
  ctx.beginPath();
  ctx.moveTo(-34, 0);
  ctx.lineTo(34, 0);
  ctx.lineTo(22, 14);
  ctx.lineTo(-24, 14);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#fafafa";
  ctx.beginPath();
  ctx.moveTo(0, -2);
  ctx.lineTo(0, -34);
  ctx.lineTo(22, -4);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function StudioMotionMonitor({
  prompt,
  keyframeUrl,
  cameraMotion,
  motionSpeed,
  aspectRatio,
}: {
  prompt: string;
  keyframeUrl?: string | null;
  cameraMotion: (typeof CAMERA_MOTIONS)[number];
  motionSpeed: number;
  aspectRatio: (typeof ASPECT_RATIOS)[number];
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [playing, setPlaying] = useState(true);
  const [recording, setRecording] = useState(false);

  const dims =
    aspectRatio === "1:1"
      ? { width: 640, height: 640 }
      : aspectRatio === "21:9"
      ? { width: 840, height: 360 }
      : { width: 800, height: 450 };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    const startTime = performance.now();
    let imgEl: HTMLImageElement | null = null;
    const plan = buildScenePlan(prompt, motionSpeed);

    if (keyframeUrl) {
      const img = new Image();
      img.src = keyframeUrl;
      img.onload = () => {
        imgEl = img;
      };
    }

    const particles = Array.from({ length: 50 }, (_, idx) => {
      const s = hashPrompt(`${prompt}-${idx}`);
      return {
        x: (s % 1000) / 1000,
        y: ((s >> 10) % 1000) / 1000,
        speed: 0.05 + ((s >> 20) % 16) * 0.012,
        size: 1.4 + (idx % 3) * 0.8,
      };
    });

    function render(now: number) {
      if (!canvas || !ctx) return;
      const t = (playing ? (now - startTime) / 1000 : 0) * plan.speedFactor;
      const w = canvas.width;
      const h = canvas.height;

      ctx.save();
      ctx.clearRect(0, 0, w, h);

      const camZoom =
        cameraMotion === "Zoom In"
          ? 1.04 + ((Math.sin(t * 0.6) + 1) * 0.04)
          : cameraMotion === "Parallax Sweep"
          ? 1.05
          : 1.02;
      const camPanX =
        cameraMotion === "Dynamic Pan"
          ? Math.sin(t * 0.5) * 14
          : cameraMotion === "Parallax Sweep"
          ? Math.cos(t * 0.45) * 18
          : 0;
      const camPanY =
        cameraMotion === "Parallax Sweep" ? Math.sin(t * 0.35) * 8 : 0;

      ctx.translate(w / 2 + camPanX, h / 2 + camPanY);
      ctx.scale(camZoom, camZoom);
      ctx.translate(-w / 2, -h / 2);

      if (imgEl && imgEl.complete && imgEl.naturalWidth > 0) {
        const scale = 1.08 + Math.sin(t * 0.65) * 0.045;
        const dw = w * scale;
        const dh = h * scale;
        ctx.drawImage(imgEl, (w - dw) / 2, (h - dh) / 2, dw, dh);
      } else {
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, `hsl(${plan.hueA}, 52%, 11%)`);
        sky.addColorStop(0.6, `hsl(${plan.hueB}, 56%, 18%)`);
        sky.addColorStop(1, `hsl(${(plan.hueA + 25) % 360}, 45%, 9%)`);
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);

        if (plan.hasMoonOrSun || plan.hasRocket || (!plan.hasCar && !plan.hasBoat)) {
          const orbX = w * (0.22 + ((plan.seed % 55) / 100) + Math.cos(t * 0.35) * 0.05);
          const orbY = h * (0.24 + Math.sin(t * 0.3) * 0.04);
          const halo = ctx.createRadialGradient(orbX, orbY, 8, orbX, orbY, 130);
          halo.addColorStop(0, `hsla(${plan.hueB}, 90%, 70%, 0.45)`);
          halo.addColorStop(1, `hsla(${plan.hueB}, 90%, 60%, 0)`);
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(orbX, orbY, 130, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = `hsl(${plan.hueB}, 88%, 74%)`;
          ctx.beginPath();
          ctx.arc(orbX, orbY, 32, 0, Math.PI * 2);
          ctx.fill();
        }

        if (plan.hasCity) {
          const baseCityY = h * 0.66;
          for (let i = 0; i < 12; i++) {
            const bw = 42 + ((plan.seed + i * 19) % 36);
            const bh = 55 + ((plan.seed * (i + 3)) % 110);
            const bx = ((((i * 78 - t * 24) % (w + 120)) + (w + 120)) % (w + 120)) - 60;
            ctx.fillStyle = `hsla(${plan.hueA}, 38%, 14%, 0.92)`;
            ctx.fillRect(bx, baseCityY - bh, bw, bh);

            ctx.fillStyle = `hsla(${plan.hueB}, 88%, 72%, 0.45)`;
            for (let wy = baseCityY - bh + 10; wy < baseCityY - 12; wy += 16) {
              ctx.fillRect(bx + 8, wy, 6, 8);
              ctx.fillRect(bx + bw - 14, wy, 6, 8);
            }
          }
        }

        if (plan.hasMountains || (!plan.hasCar && !plan.hasBoat && !plan.hasRocket)) {
          ctx.fillStyle = `hsla(${(plan.hueA + 20) % 360}, 40%, 16%, 0.88)`;
          ctx.beginPath();
          ctx.moveTo(0, h * 0.68);
          for (let x = 0; x <= w; x += 40) {
            const peak =
              h * 0.52 +
              Math.sin(x * 0.008 + (plan.seed % 7)) * 42 +
              Math.cos(x * 0.017) * 22;
            ctx.lineTo(x, peak);
          }
          ctx.lineTo(w, h * 0.68);
          ctx.closePath();
          ctx.fill();
        }

        const groundY = h * 0.67;
        ctx.fillStyle = plan.hasBoat
          ? `hsla(200, 75%, 22%, 0.94)`
          : `hsla(${plan.hueA}, 28%, 13%, 0.96)`;
        ctx.fillRect(0, groundY, w, h - groundY);

        if (plan.hasBoat) {
          ctx.strokeStyle = "rgba(186, 230, 253, 0.35)";
          ctx.lineWidth = 2;
          for (let r = 0; r < 5; r++) {
            const ry = groundY + 18 + r * 20;
            ctx.beginPath();
            for (let x = 0; x <= w; x += 24) {
              const wy = ry + Math.sin(x * 0.02 + t * 3 + r) * 5;
              if (x === 0) ctx.moveTo(x, wy);
              else ctx.lineTo(x, wy);
            }
            ctx.stroke();
          }
        } else if (plan.hasCar) {
          ctx.fillStyle = "#18181b";
          ctx.fillRect(0, groundY, w, h - groundY);
          ctx.strokeStyle = "#facc15";
          ctx.lineWidth = 3;
          ctx.setLineDash([28, 24]);
          ctx.lineDashOffset = -t * 180;
          ctx.beginPath();
          ctx.moveTo(0, groundY + 38);
          ctx.lineTo(w, groundY + 38);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        if (plan.hasCar) {
          const carX = ((t * 150 + (plan.seed % 300)) % (w + 180)) - 90;
          drawCar(ctx, carX, groundY + 30, t, plan.hueB);
        }

        if (plan.hasBoat) {
          const boatX = ((t * 65 + (plan.seed % 260)) % (w + 140)) - 70;
          drawBoat(ctx, boatX, groundY + 12, t);
        }

        if (plan.hasRocket) {
          const prog = (t * 0.22) % 1;
          const rx = w * (0.2 + prog * 0.65);
          const ry = h * (0.78 - prog * 0.56) + Math.sin(t * 5) * 6;
          drawRocket(ctx, rx, ry, 0.52, t);
        }

        if (plan.hasBird || (!plan.hasCar && !plan.hasBoat && !plan.hasRocket)) {
          for (let b = 0; b < 3; b++) {
            const bx = ((t * (75 + b * 14) + b * 130) % (w + 100)) - 50;
            const by = h * (0.24 + b * 0.065) + Math.sin(t * 2.5 + b) * 10;
            drawBird(ctx, bx, by, t + b, 1 - b * 0.14);
          }
        }
      }

      ctx.strokeStyle = `hsla(${plan.hueB}, 85%, 75%, 0.55)`;
      ctx.fillStyle = `hsla(${plan.hueB}, 85%, 75%, 0.55)`;
      for (const p of particles) {
        if (plan.hasRain) {
          const rx = (p.x * w + t * 120) % w;
          const ry = (p.y * h + t * 380) % h;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx - 4, ry + 13);
          ctx.stroke();
        } else {
          const px = (((p.x + t * p.speed) % 1) + 1) % 1 * w;
          const py = (((p.y + Math.sin(t + p.x * 8) * 0.03) % 1) + 1) % 1 * h;
          ctx.beginPath();
          ctx.arc(px, py, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();

      ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
      ctx.fillRect(0, 0, w, 32);
      ctx.fillRect(0, h - 42, w, 42);

      ctx.fillStyle = "#c4b5fd";
      ctx.font = "600 11px sans-serif";
      const hudText = `WOBI AI • ${cameraMotion.toUpperCase()} • ${aspectRatio}`;
      ctx.fillText(hudText, 16, 20);

      ctx.fillStyle = "#f4f4f5";
      ctx.font = "12px sans-serif";
      ctx.fillText(prompt.slice(0, 96), 16, h - 16);

      animId = requestAnimationFrame(render);
    }

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [prompt, keyframeUrl, playing, cameraMotion, motionSpeed, aspectRatio]);

  function handleDownloadFrame() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "wobi-ai-frame.png";
    link.click();
  }

  function handleRecordWebm() {
    const canvas = canvasRef.current;
    if (!canvas || recording) return;
    if (typeof MediaRecorder === "undefined" || typeof canvas.captureStream !== "function") {
      handleDownloadFrame();
      return;
    }

    setPlaying(true);
    setRecording(true);

    const stream = canvas.captureStream(30);
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";
    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks: BlobPart[] = [];

    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) {
        chunks.push(ev.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "wobi-ai-clip.webm";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 3000);
      setRecording(false);
    };

    recorder.start();
    setTimeout(() => {
      if (recorder.state !== "inactive") {
        recorder.stop();
      }
    }, 4000);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl overflow-hidden bg-black border border-zinc-800/90 shadow-2xl">
        <canvas
          ref={canvasRef}
          width={dims.width}
          height={dims.height}
          className="w-full max-h-[470px] object-contain mx-auto block"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <button
          type="button"
          onClick={() => setPlaying((prev) => !prev)}
          className="inline-flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 transition cursor-pointer"
        >
          {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {playing ? "Pause" : "Play"}
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRecordWebm}
            disabled={recording}
            className="inline-flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-medium transition cursor-pointer"
          >
            <Video className="w-3.5 h-3.5" />
            {recording ? "Recording 4s Video..." : "Download Video (WebM)"}
          </button>

          <button
            type="button"
            onClick={handleDownloadFrame}
            className="inline-flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Frame (PNG)
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [prompt, setPrompt] = useState("");
  const [cameraMotion, setCameraMotion] = useState<(typeof CAMERA_MOTIONS)[number]>("Parallax Sweep");
  const [aspectRatio, setAspectRatio] = useState<(typeof ASPECT_RATIOS)[number]>("16:9");
  const [motionSpeed, setMotionSpeed] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [termsOpen, setTermsOpen] = useState(false);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!prompt.trim()) {
      setError("Pehle ek video prompt likhein ya sample prompt chunein.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      const data = (await res.json()) as GenerateResponse;

      if (!res.ok || data.error) {
        setError(data.error || "Video generate nahi ho saka.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Network ya server error aaya.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-[#09090b] text-zinc-100 flex flex-col overflow-hidden">
      {/* Subtle Background Watermark & Suvidha Layer */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none fixed inset-0 z-0 overflow-hidden"
      >
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute bottom-10 -left-24 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl" />

        <div className="grid grid-cols-2 md:grid-cols-3 gap-12 p-10 -rotate-12 scale-110 opacity-[0.045]">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div key={idx} className="space-y-2">
              <div className="text-4xl sm:text-5xl font-black tracking-widest text-white">
                WOBI AI
              </div>
              <div className="text-xs font-medium tracking-wider uppercase text-violet-200">
                {BG_FACILITIES[idx % BG_FACILITIES.length]}
              </div>
            </div>
          ))}
        </div>
      </div>

      <nav className="relative z-10 border-b border-zinc-800/80 bg-[#111115]/90 backdrop-blur px-5 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-600/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white">Wobi AI</span>
              <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">
                Video Studio
              </span>
            </div>
          </div>

          <div className="text-xs text-zinc-400 hidden sm:block">
            Zero-Budget AI Video Generator
          </div>
        </div>
      </nav>

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 py-7 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleGenerate}
            className="lg:col-span-5 bg-[#121217]/95 border border-zinc-800/90 rounded-2xl p-5 space-y-5 shadow-xl backdrop-blur-xs"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-violet-400" />
                Text to Video
              </h2>
              <span className="text-[11px] text-zinc-400">Free Mode</span>
            </div>

            <div className="space-y-2">
              <label htmlFor="prompt" className="block text-xs font-medium text-zinc-300">
                Prompt
              </label>
              <textarea
                id="prompt"
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your scene, camera movement, lighting, and action..."
                className="w-full rounded-xl bg-[#09090b] border border-zinc-800 focus:border-violet-500 focus:outline-none p-3.5 text-sm text-zinc-100 placeholder:text-zinc-500"
              />
            </div>

            <div className="space-y-1.5">
              <span className="block text-[11px] font-medium text-zinc-400">Quick Presets</span>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_PROMPTS.map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => setPrompt(sample)}
                    className="text-[11px] px-2.5 py-1.5 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer text-left"
                  >
                    {sample.slice(0, 32)}...
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-zinc-800/80 pt-4 space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-300">
                <SlidersHorizontal className="w-3.5 h-3.5 text-violet-400" />
                Camera &amp; Format Controls
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="camera" className="block text-[11px] text-zinc-400">
                    Camera Motion
                  </label>
                  <select
                    id="camera"
                    value={cameraMotion}
                    onChange={(e) => setCameraMotion(e.target.value as (typeof CAMERA_MOTIONS)[number])}
                    className="w-full rounded-lg bg-[#09090b] border border-zinc-800 px-2.5 py-2 text-xs text-zinc-200 focus:border-violet-500 focus:outline-none"
                  >
                    {CAMERA_MOTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="ratio" className="block text-[11px] text-zinc-400">
                    Aspect Ratio
                  </label>
                  <select
                    id="ratio"
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as (typeof ASPECT_RATIOS)[number])}
                    className="w-full rounded-lg bg-[#09090b] border border-zinc-800 px-2.5 py-2 text-xs text-zinc-200 focus:border-violet-500 focus:outline-none"
                  >
                    {ASPECT_RATIOS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-zinc-400">
                  <span>Motion Intensity</span>
                  <span className="text-zinc-200">{motionSpeed.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  value={motionSpeed}
                  onChange={(e) => setMotionSpeed(parseFloat(e.target.value))}
                  className="w-full accent-violet-500 cursor-pointer"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-60 font-medium text-sm text-white flex items-center justify-center gap-2 transition shadow-lg shadow-violet-600/20 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating on Wobi AI...
                </>
              ) : (
                <>
                  <Film className="w-4 h-4" />
                  Generate with Wobi AI
                </>
              )}
            </button>

            <p className="text-[11px] text-zinc-400 text-center">
              Generate karke aap{" "}
              <button
                type="button"
                onClick={() => setTermsOpen(true)}
                className="text-violet-300 underline hover:text-violet-200 cursor-pointer"
              >
                Terms &amp; Conditions
              </button>{" "}
              se sahmat hote hain.
            </p>
          </form>

          <section className="lg:col-span-7 bg-[#121217]/95 border border-zinc-800/90 rounded-2xl p-5 min-h-[430px] flex flex-col justify-between shadow-xl backdrop-blur-xs">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3.5">
              <div>
                <h1 className="text-base font-semibold text-white">Wobi AI Preview Stage</h1>
                <p className="text-xs text-zinc-400">
                  {result?.model ? `Engine: ${result.model}` : "Ready to render your scene"}
                </p>
              </div>
              {result?.videoDataUrl && (
                <a
                  href={result.videoDataUrl}
                  download="wobi-ai-clip.mp4"
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download MP4
                </a>
              )}
            </div>

            {error && (
              <div className="my-4 flex items-start gap-3 p-4 rounded-xl bg-red-950/50 border border-red-800/70 text-red-200 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
                <div>{error}</div>
              </div>
            )}

            {!error && result && (
              <div className="my-4 space-y-3">
                {result.note && (
                  <p className="text-xs text-amber-300/90 bg-amber-950/35 border border-amber-800/40 rounded-lg px-3 py-2">
                    {result.note}
                  </p>
                )}

                {result.videoDataUrl ? (
                  <div className="rounded-xl overflow-hidden bg-black border border-zinc-800">
                    <video
                      src={result.videoDataUrl}
                      controls
                      autoPlay
                      loop
                      className="w-full max-h-[470px] object-contain mx-auto"
                    />
                  </div>
                ) : (
                  <StudioMotionMonitor
                    prompt={result.prompt || prompt}
                    keyframeUrl={result.imageDataUrl}
                    cameraMotion={cameraMotion}
                    motionSpeed={motionSpeed}
                    aspectRatio={aspectRatio}
                  />
                )}
              </div>
            )}

            {!error && !result && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-14 px-6 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-center text-violet-300">
                  <Film className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-zinc-200">
                  Wobi AI Studio Monitor Khali Hai
                </p>
                <p className="text-xs text-zinc-400 max-w-md">
                  Left side mein apna prompt aur camera controls set karein, phir{" "}
                  <span className="text-violet-300 font-medium">Generate with Wobi AI</span> dabayein.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Subtle Background-Style Suvidha Strip */}
        <div className="rounded-2xl border border-zinc-800/60 bg-[#101015]/65 px-4 py-3 flex flex-wrap items-center justify-center gap-2 text-[11px] text-zinc-400">
          <span className="text-zinc-500 font-medium">Wobi AI Suvidha:</span>
          {BG_FACILITIES.map((item) => (
            <span
              key={item}
              className="px-2.5 py-1 rounded-full bg-zinc-900/80 border border-zinc-800/80 text-zinc-300"
            >
              {item}
            </span>
          ))}
        </div>
      </main>

      <footer className="relative z-10 border-t border-zinc-800/80 bg-[#111115]/90 px-5 py-4 text-xs text-zinc-400">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <span>© 2026 Wobi AI. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setTermsOpen(true)}
              className="hover:text-zinc-200 transition cursor-pointer"
            >
              Terms &amp; Conditions
            </button>
            <Link href="/terms" className="hover:text-zinc-200 transition">
              Full Policy Page
            </Link>
          </div>
        </div>
      </footer>

      {termsOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-[#121217] border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-semibold text-white">Wobi AI — Terms &amp; Conditions</h3>
              </div>
              <button
                type="button"
                onClick={() => setTermsOpen(false)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-zinc-300 leading-relaxed max-h-[65vh] overflow-y-auto pr-1">
              <p>
                <strong className="text-white">1. Free Service:</strong> Wobi AI free Hugging Face models ya browser motion engine se video preview aur WebM/PNG export provide karta hai.
              </p>
              <p>
                <strong className="text-white">2. Safe Usage:</strong> Illegal, harmful, ya copyright-violating prompts aur content generate karna mana hai.
              </p>
              <p>
                <strong className="text-white">3. No Warranty:</strong> Service &ldquo;as is&rdquo; basis par available hai; free model limits ya downtime ke liye koi guarantee nahi hai.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <Link
                href="/terms"
                onClick={() => setTermsOpen(false)}
                className="text-xs text-violet-300 hover:text-violet-200 underline"
              >
                Open Full Terms Page
              </Link>
              <button
                type="button"
                onClick={() => setTermsOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-medium text-white cursor-pointer"
              >
                I Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
