import { NextRequest, NextResponse } from "next/server";

type HfModelItem = {
  id?: string;
  inferenceProviderMapping?: Record<string, { status?: string; providerId?: string }>;
};

async function tryModelsFromHub(
  pipelineTag: string,
  token: string,
  cleanPrompt: string,
  expectedKind: "video" | "image"
): Promise<{ ok: boolean; dataUrl?: string; model?: string; status?: number }> {
  try {
    const res = await fetch(
      `https://huggingface.co/api/models?pipeline_tag=${encodeURIComponent(pipelineTag)}&sort=downloads&direction=-1&limit=12`
    );
    if (!res.ok) {
      return { ok: false, status: res.status };
    }

    const models = (await res.json()) as HfModelItem[];
    for (const item of models) {
      const modelId = item?.id;
      if (!modelId || modelId.toLowerCase().includes("flux.1-schnell")) continue;

      const providerMap = item.inferenceProviderMapping || {};
      const providers = Object.keys(providerMap);
      const endpoints =
        providers.length > 0
          ? providers.map((p) => ({
              provider: p,
              url: `https://router.huggingface.co/${p}/models/${modelId}`,
            }))
          : [
              {
                provider: "hf-inference",
                url: `https://router.huggingface.co/hf-inference/models/${modelId}`,
              },
            ];

      for (const ep of endpoints) {
        const inferRes = await fetch(ep.url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: cleanPrompt }),
        });

        if (inferRes.ok) {
          const mime = (inferRes.headers.get("content-type") || "").toLowerCase();
          const matchesKind =
            expectedKind === "video"
              ? mime.includes("video") || mime.includes("octet-stream")
              : mime.includes("image");

          if (matchesKind) {
            const buf = Buffer.from(await inferRes.arrayBuffer());
            const safeMime =
              mime && !mime.includes("octet-stream")
                ? mime
                : expectedKind === "video"
                ? "video/mp4"
                : "image/jpeg";
            return {
              ok: true,
              model: `${modelId} (${ep.provider})`,
              dataUrl: `data:${safeMime};base64,${buf.toString("base64")}`,
            };
          }
        } else if (inferRes.status === 401 || inferRes.status === 403) {
          return { ok: false, status: inferRes.status };
        }
      }
    }
  } catch {
    // Continue to next fallback
  }

  return { ok: false };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = body?.prompt;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json({ error: "Prompt khali nahi ho sakta." }, { status: 400 });
    }

    const token = process.env.HF_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "HF_TOKEN set nahi hai. .env.local mein token daalein." }, { status: 500 });
    }

    const cleanPrompt = prompt.trim();

    const videoTry = await tryModelsFromHub("text-to-video", token, cleanPrompt, "video");
    if (videoTry.ok && videoTry.dataUrl) {
      return NextResponse.json({
        mode: "video",
        model: videoTry.model,
        videoDataUrl: videoTry.dataUrl,
      });
    }

    if (videoTry.status === 401 || videoTry.status === 403) {
      return NextResponse.json(
        { error: "Hugging Face token authentication error (401/403). Token check karein." },
        { status: videoTry.status }
      );
    }

    const imageTry = await tryModelsFromHub(
      "text-to-image",
      token,
      `${cleanPrompt}, cinematic film still, dramatic lighting, ultra detailed`,
      "image"
    );
    if (imageTry.ok && imageTry.dataUrl) {
      return NextResponse.json({
        mode: "animated-keyframe",
        model: imageTry.model,
        imageDataUrl: imageTry.dataUrl,
        note: "Free video endpoint busy tha, isliye free Hugging Face image model se motion keyframe generate kiya gaya hai.",
      });
    }

    return NextResponse.json({
      mode: "local-motion",
      model: "Zero-Budget Motion Engine",
      prompt: cleanPrompt,
      note: "Free Hugging Face serverless models abhi unavailable hain; local motion preview chalaya gaya hai.",
    });
  } catch (e) {
    console.error("Video generation failed:", e);
    return NextResponse.json({ error: "Server error aaya." }, { status: 500 });
  }
}
