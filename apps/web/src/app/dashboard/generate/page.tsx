"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  ArrowUp,
  ChevronDown,
  Ratio,
  Loader2,
  Download,
  ImageIcon,
  Video,
  Sparkles,
  X,
  Clapperboard,
} from "lucide-react";
import { cn } from "@/lib/utils";

type GenType = "image" | "video";

const MODES: Record<GenType, string[]> = {
  image: ["Vivid", "Natural"],
  video: ["Max Watch Time", "Cinematic", "Quick"],
};

const IMAGE_RATIOS = ["1:1", "9:16", "16:9"];
const VIDEO_RATIOS = ["9:16", "1:1", "16:9"];
const VIDEO_DURATIONS = [4, 8];

const SAMPLE_PROMPTS = [
  { text: "A red panda manages a busy coffee shop", emoji: "🐼" },
  { text: '"The Thinker" tries an ergonomic office chair', emoji: "🗿" },
  { text: "Neon city street after the rain, cinematic", emoji: "🌃" },
  { text: "A product hero shot of a glowing sneaker", emoji: "👟" },
];

interface GenJob {
  id: string;
  type: GenType;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  outputUrl?: string;
  model: string;
  error?: string;
}

export default function GeneratePage() {
  const [type, setType] = useState<GenType>("video");
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<string>(MODES.video[0]);
  const [ratio, setRatio] = useState<string>("9:16");
  const [duration, setDuration] = useState<number>(8);
  const [upload, setUpload] = useState<{ name: string; url: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenJob | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [credits, setCredits] = useState<{ plan: string; remaining: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Switch defaults when toggling type
    setMode(MODES[type][0]);
    setRatio(type === "video" ? "9:16" : "1:1");
    setResult(null);
    setNotice(null);
  }, [type]);

  useEffect(() => {
    (async () => {
      try {
        const { data: teams } = await api.get("/api/teams");
        const teamId = teams.data?.[0]?.id;
        if (!teamId) return;
        const { data } = await api.get(`/api/teams/${teamId}/subscription`);
        const s = data.data;
        setCredits({ plan: s.plan, remaining: Math.max(0, (s.aiCreditsLimit || 0) - (s.aiCreditsUsed || 0)) });
      } catch {
        /* no subscription yet */
      }
    })();
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUpload({ name: file.name, url: URL.createObjectURL(file) });
  };

  const pollJob = (id: string) => {
    const started = Date.now();
    const tick = async () => {
      if (Date.now() - started > 5 * 60 * 1000) {
        toast.error("Generation timed out — try again");
        setGenerating(false);
        return;
      }
      try {
        const { data } = await api.get(`/api/generate/${id}`);
        const job: GenJob = data.data;
        if (job.status === "COMPLETED") {
          setResult(job);
          setGenerating(false);
          toast.success("Saved to your Media library");
          return;
        }
        if (job.status === "FAILED") {
          toast.error(job.error || "Generation failed");
          setGenerating(false);
          return;
        }
        setTimeout(tick, 3000);
      } catch {
        setTimeout(tick, 4000);
      }
    };
    setTimeout(tick, 3000);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    setResult(null);
    setNotice(null);
    try {
      const { data } = await api.post("/api/generate", {
        type,
        prompt,
        aspectRatio: ratio,
        ...(type === "video" && { duration }),
        mode,
      });
      const job: GenJob = data.data;
      if (job.status === "COMPLETED") {
        setResult(job);
        setGenerating(false);
        toast.success("Saved to your Media library");
      } else if (job.status === "FAILED") {
        toast.error(job.error || "Generation failed");
        setGenerating(false);
      } else {
        // Async (video): keep the loader up and poll to completion.
        pollJob(job.id);
      }
    } catch (error: any) {
      const status = error?.response?.status;
      const message = error?.response?.data?.error?.message || "Generation failed";
      if (status === 503) setNotice(message);
      else toast.error(message);
      setGenerating(false);
    }
  };

  const ratios = type === "video" ? VIDEO_RATIOS : IMAGE_RATIOS;

  return (
    <div className="-m-8 min-h-[calc(100vh-0px)] bg-neutral-950 text-neutral-100 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2 font-bold text-lg">
          <Clapperboard size={20} className="text-lime-400" />
          Studio
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-lime-500/40 bg-neutral-900 px-3 py-1.5 text-sm">
          <Sparkles size={14} className="text-lime-400" />
          <span className="font-semibold">{credits ? credits.remaining : "—"}</span>
          <span className="text-neutral-500">|</span>
          <span className="text-neutral-300">{credits ? credits.plan : "Free"}</span>
        </div>
      </div>

      {/* Centered generator */}
      <div className="flex-1 flex flex-col items-center px-4 pt-10">
        <div className="w-full max-w-3xl">
          {/* Image / Video toggle */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-full border border-neutral-800 bg-neutral-900 p-1">
              {(["video", "image"] as GenType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-5 py-1.5 text-sm font-medium transition-colors capitalize",
                    type === t ? "bg-lime-400 text-neutral-950" : "text-neutral-400 hover:text-neutral-200"
                  )}
                >
                  {t === "video" ? <Video size={15} /> : <ImageIcon size={15} />}
                  {t}
                </button>
              ))}
            </div>
          </div>

          <h1 className="text-4xl font-bold text-center">AI {type === "video" ? "Video" : "Image"} Generator</h1>
          <p className="text-center text-neutral-400 mt-3">
            Generate {type === "video" ? "videos" : "images"} with maximized{" "}
            <span className="text-lime-400">{type === "video" ? "completion rate" : "visual impact"}</span>
          </p>

          {/* Prompt box */}
          <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
            {upload && (
              <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-neutral-800 px-2 py-1.5 text-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={upload.url} alt="" className="w-8 h-8 rounded object-cover" />
                <span className="max-w-[160px] truncate text-neutral-300">{upload.name}</span>
                <button onClick={() => setUpload(null)} className="text-neutral-500 hover:text-neutral-200">
                  <X size={14} />
                </button>
              </div>
            )}
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate();
              }}
              rows={3}
              placeholder={`Describe your ${type} idea or upload an image… e.g. A red panda manages a coffee shop.`}
              className="w-full resize-none bg-transparent outline-none text-[15px] placeholder:text-neutral-600 min-h-[72px]"
            />

            <div className="flex items-center justify-between gap-2 mt-2">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Upload */}
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-9 h-9 rounded-full border border-neutral-700 hover:bg-neutral-800 flex items-center justify-center transition-colors"
                  title="Upload an image"
                >
                  <Plus size={18} />
                </button>

                {/* Mode */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="rounded-full border border-lime-500/50 text-lime-400 px-3 py-1.5 text-sm font-medium hover:bg-lime-500/10 transition-colors">
                      {mode}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {MODES[type].map((m) => (
                      <DropdownMenuItem key={m} onClick={() => setMode(m)}>
                        {m}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Size / duration */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="inline-flex items-center gap-1.5 rounded-full border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-800 transition-colors">
                      <Ratio size={14} />
                      {ratio}
                      {type === "video" && <span className="text-neutral-500">| {duration}s</span>}
                      <ChevronDown size={13} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">Aspect ratio</div>
                    {ratios.map((r) => (
                      <DropdownMenuItem key={r} onClick={() => setRatio(r)}>
                        {r} {r === ratio && "✓"}
                      </DropdownMenuItem>
                    ))}
                    {type === "video" && (
                      <>
                        <div className="px-2 py-1.5 text-xs text-muted-foreground border-t mt-1">Duration</div>
                        {VIDEO_DURATIONS.map((d) => (
                          <DropdownMenuItem key={d} onClick={() => setDuration(d)}>
                            {d}s {d === duration && "✓"}
                          </DropdownMenuItem>
                        ))}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Submit */}
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || generating}
                className="w-10 h-10 rounded-full bg-lime-400 text-neutral-950 flex items-center justify-center hover:bg-lime-300 transition-colors disabled:opacity-40"
                title="Generate"
              >
                {generating ? <Loader2 size={18} className="animate-spin" /> : <ArrowUp size={18} />}
              </button>
            </div>
          </div>

          {/* Result */}
          {(generating || result || notice) && (
            <div className="mt-6">
              {generating && (
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900 py-16 text-center">
                  <Loader2 className="w-7 h-7 animate-spin mx-auto text-lime-400" />
                  <p className="text-sm text-neutral-400 mt-3">Generating your {type}…</p>
                  {type === "video" && (
                    <p className="text-xs text-neutral-600 mt-1">This can take a minute or two.</p>
                  )}
                </div>
              )}

              {notice && !generating && (
                <div className="rounded-2xl border border-lime-500/30 bg-lime-500/5 p-5 text-sm">
                  <p className="font-medium text-lime-300 mb-1">Not enabled yet</p>
                  <p className="text-neutral-300">{notice}</p>
                </div>
              )}

              {result?.outputUrl && !generating && (
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
                  {result.type === "video" ? (
                    <video
                      src={result.outputUrl}
                      controls
                      autoPlay
                      loop
                      className="rounded-xl w-full max-h-[520px] bg-black"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={result.outputUrl} alt={prompt} className="rounded-xl w-full max-h-[520px] object-contain bg-black" />
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-neutral-500">
                      {result.model} · {ratio}
                    </span>
                    <a
                      href={result.outputUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-lime-400 text-neutral-950 px-4 py-1.5 text-sm font-medium hover:bg-lime-300 transition-colors"
                    >
                      <Download size={15} />
                      Download
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sample prompts */}
          {!result && !generating && (
            <div className="mt-8">
              <p className="text-sm text-neutral-400 mb-3">Sample Prompts</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SAMPLE_PROMPTS.map((s) => (
                  <button
                    key={s.text}
                    onClick={() => setPrompt(s.text)}
                    className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-left hover:border-neutral-700 transition-colors"
                  >
                    <span className="w-9 h-9 rounded-lg bg-neutral-800 flex items-center justify-center text-lg shrink-0">
                      {s.emoji}
                    </span>
                    <span className="text-sm text-neutral-300 flex-1 truncate">{s.text}</span>
                    <ArrowUp size={14} className="text-neutral-600 rotate-45 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
