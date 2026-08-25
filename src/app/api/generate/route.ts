import { NextResponse } from "next/server";
import { isSkillId } from "@/lib/skills";
import { composeArtwork, readSource } from "@/lib/server/compositor";
import { analyzeImage, generatePanel, GenerationError } from "@/lib/server/minimax";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const imageValue = form.get("image");
    const skillValue = form.get("skillId");
    const attemptValue = form.get("attempt");

    if (!(imageValue instanceof File)) return errorResponse("请选择一张图片。", 400);
    if (typeof skillValue !== "string" || !isSkillId(skillValue)) return errorResponse("请选择有效的 Skill。", 400);
    if (!ACCEPTED_TYPES.has(imageValue.type)) return errorResponse("仅支持 JPG、PNG 和 WebP 图片。", 415);
    if (imageValue.size === 0 || imageValue.size > MAX_FILE_BYTES) return errorResponse("图片大小必须在 15 MB 以内。", 413);

    const attempt = typeof attemptValue === "string"
      ? Math.max(0, Math.min(20, Number.parseInt(attemptValue, 10) || 0))
      : 0;
    const input = Buffer.from(await imageValue.arrayBuffer());
    const source = await readSource(input);
    const { plan, referenceDataUrl } = await analyzeImage(input, imageValue.type, skillValue, attempt);

    const panels = await Promise.all(
      plan.panels.map((panel) => generatePanel(
        skillValue,
        plan,
        panel,
        skillValue === "surreal-pop" ? referenceDataUrl : undefined,
      )),
    );

    const output = await composeArtwork(skillValue, source, panels, plan);
    const outputName = `image-field-${skillValue}-${Date.now()}.png`;

    return new Response(new Uint8Array(output), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Length": String(output.byteLength),
        "Content-Disposition": `inline; filename="${outputName}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
        "X-Content-Type-Options": "nosniff",
        "X-Output-Name": outputName,
      },
    });
  } catch (cause) {
    if (cause instanceof GenerationError) return errorResponse(cause.message, cause.status);
    const message = cause instanceof Error ? cause.message : "生成失败，请稍后再试。";
    if (/像素|尺寸|图片/.test(message)) return errorResponse(message, 400);
    console.error("Artwork generation failed:", cause);
    return errorResponse("生成过程中出现异常，请重新生成。", 500);
  }
}
