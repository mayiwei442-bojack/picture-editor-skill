import "server-only";

import sharp, { type OverlayOptions } from "sharp";
import path from "node:path";
import { SkillId } from "@/lib/skills";
import { AnalysisPlan } from "./minimax";

const MAX_INPUT_PIXELS = 20_000_000;
const MAX_OUTPUT_PIXELS = 80_000_000;

type SourceImage = {
  buffer: Buffer;
  width: number;
  height: number;
};

function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (character) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    '"': "&quot;",
    "'": "&apos;",
  })[character]!);
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function assertCanvas(width: number, height: number) {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width <= 0 || height <= 0) {
    throw new Error("Invalid output dimensions");
  }
  if (width * height > MAX_OUTPUT_PIXELS) {
    throw new Error("生成画布超过 8000 万像素，请换用分辨率稍低的原图。");
  }
}

export async function readSource(input: Buffer): Promise<SourceImage> {
  const pipeline = sharp(input, { failOn: "error", limitInputPixels: MAX_INPUT_PIXELS }).rotate();
  const metadata = await pipeline.metadata();
  if (!metadata.width || !metadata.height) throw new Error("无法读取图片尺寸。");
  if (metadata.width * metadata.height > MAX_INPUT_PIXELS) {
    throw new Error("原图不能超过 2000 万像素。");
  }
  const { data, info } = await pipeline.png({ compressionLevel: 3 }).toBuffer({ resolveWithObject: true });
  return { buffer: data, width: info.width, height: info.height };
}

async function fitPanel(panel: Buffer, width: number, height: number) {
  return sharp(panel, { failOn: "error" })
    .rotate()
    .resize(width, height, { fit: "cover", position: sharp.strategy.attention })
    .png({ compressionLevel: 5 })
    .toBuffer();
}

async function renderCanvas(
  width: number,
  height: number,
  background: string,
  composites: OverlayOptions[],
) {
  assertCanvas(width, height);
  return sharp({ create: { width, height, channels: 4, background } })
    .composite(composites)
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
}

function dateLabel() {
  const date = new Date();
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"][date.getUTCMonth()];
  return `${day} ${month} ${date.getUTCFullYear()}`;
}

function captionSvg(width: number, height: number, options: { left: string; right?: string; color: string; muted: string; background?: string }) {
  const fontSize = clamp(Math.round(width * 0.018), 12, 30);
  const y = Math.round(height * 0.57);
  return Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    ${options.background ? `<rect width="100%" height="100%" fill="${options.background}"/>` : ""}
    <text x="0" y="${y}" fill="${options.color}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="600" letter-spacing="${Math.max(1, Math.round(fontSize * 0.12))}">${escapeXml(options.left)}</text>
    ${options.right ? `<text x="${width}" y="${y}" text-anchor="end" fill="${options.muted}" font-family="Georgia, serif" font-size="${Math.round(fontSize * 1.1)}" font-style="italic">${escapeXml(options.right)}</text>` : ""}
  </svg>`);
}

async function composeOdyssey(source: SourceImage, lower: Buffer, plan: AnalysisPlan) {
  const pad = clamp(Math.round(source.width * 0.034), 18, 72);
  const gap = clamp(Math.round(source.width * 0.01), 6, 22);
  const captionHeight = clamp(Math.round(source.width * 0.09), 62, 170);
  const width = source.width + pad * 2;
  const height = pad + source.height * 2 + gap + captionHeight;
  const fittedLower = await fitPanel(lower, source.width, source.height);
  const caption = captionSvg(source.width, captionHeight, {
    left: `NO. 001  /  ${dateLabel()}`,
    right: plan.episodeTitle.toUpperCase(),
    color: "#E8E2D7",
    muted: "#AFA89B",
  });
  return renderCanvas(width, height, "#10100F", [
    { input: source.buffer, left: pad, top: pad },
    { input: fittedLower, left: pad, top: pad + source.height + gap },
    { input: caption, left: pad, top: pad + source.height * 2 + gap },
  ]);
}

async function composeThreefold(source: SourceImage, panels: Buffer[]) {
  const width = source.width;
  const height = source.height * 3;
  const fitted = await Promise.all(panels.map((panel) => fitPanel(panel, width, source.height)));
  return renderCanvas(width, height, "#10100F", [
    { input: fitted[0], left: 0, top: 0 },
    { input: source.buffer, left: 0, top: source.height },
    { input: fitted[1], left: 0, top: source.height * 2 },
  ]);
}

async function composeQuartet(source: SourceImage, panels: Buffer[]) {
  const width = source.width;
  const height = source.height * 4;
  const fitted = await Promise.all(panels.map((panel) => fitPanel(panel, width, source.height)));
  return renderCanvas(width, height, "#10100F", [
    { input: source.buffer, left: 0, top: 0 },
    { input: fitted[0], left: 0, top: source.height },
    { input: fitted[1], left: 0, top: source.height * 2 },
    { input: fitted[2], left: 0, top: source.height * 3 },
  ]);
}

async function composeEditorial(source: SourceImage, lower: Buffer, plan: AnalysisPlan) {
  const lowerHeight = clamp(Math.round(source.height * 0.92), Math.round(source.width * 0.56), Math.round(source.height * 1.2));
  const fitted = await fitPanel(lower, source.width, lowerHeight);
  const textHeight = clamp(Math.round(source.width * 0.13), 76, 220);
  const textWidth = source.width - clamp(Math.round(source.width * 0.07), 36, 120) * 2;
  const inset = Math.round((source.width - textWidth) / 2);
  const caption = captionSvg(textWidth, textHeight, {
    left: "IMAGE FIELD / EDITION 01",
    right: plan.title,
    color: "#27251F",
    muted: "#746E63",
  });
  return renderCanvas(source.width, source.height + lowerHeight, "#F3F0E8", [
    { input: source.buffer, left: 0, top: 0 },
    { input: fitted, left: 0, top: source.height },
    { input: caption, left: inset, top: source.height + lowerHeight - textHeight },
  ]);
}

async function composeSurreal(source: SourceImage, collage: Buffer) {
  const width = source.width;
  const height = Math.round(width * 4 / 3);
  const fitted = await fitPanel(collage, width, height);
  return renderCanvas(width, height, "#F2E83A", [{ input: fitted, left: 0, top: 0 }]);
}

async function composeScenePoster(source: SourceImage, panel: Buffer, plan: AnalysisPlan) {
  const width = source.width;
  const height = Math.round(width * 4 / 3);
  const panelMetadata = await sharp(panel).metadata();
  if (!panelMetadata.width || !panelMetadata.height) throw new Error("无法读取海报画面尺寸。");
  // The brief reserves outer bleed, excluding incidental model-generated
  // edge marks and mock borders from the finished artwork.
  const bleedX = Math.floor(panelMetadata.width * 0.06);
  const bleedY = Math.floor(panelMetadata.height * 0.06);
  const fitted = await sharp(panel).extract({
    left: bleedX, top: bleedY,
    width: panelMetadata.width - bleedX * 2, height: panelMetadata.height - bleedY * 2,
  }).resize(width, height, { fit: "cover" }).png().toBuffer();
  const title = plan.title.toUpperCase().replace(/[^A-Z0-9 '-]/g, "").trim().slice(0, 40) || "FIELD NOTES";
  const placement = plan.posterTitlePlacement || "top";
  const vertical = placement === "left";
  const textWidth = Math.max(1, Math.floor((vertical ? height : width) * 0.86));
  const textHeight = Math.max(1, Math.floor(width * 0.12));
  const left = Math.floor(width * 0.07);
  const top = placement === "bottom" ? Math.floor(height * 0.94) - textHeight : Math.floor(height * 0.06);
  const stats = await sharp(fitted).extract({ left, top,
    width: vertical ? textHeight : textWidth,
    height: vertical ? textWidth : textHeight,
  }).stats();
  const luminance = (rgb: number[]) => rgb.map((value) => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
  const backgroundLight = luminance(stats.channels.slice(0, 3).map((channel) => channel.mean));
  let color = /^#[0-9a-f]{6}$/i.test(plan.posterTitleColor || "") ? plan.posterTitleColor! : "#F3F0E8";
  const titleLight = luminance([1, 3, 5].map((offset) => Number.parseInt(color.slice(offset, offset + 2), 16)));
  if ((Math.max(backgroundLight, titleLight) + 0.05) / (Math.min(backgroundLight, titleLight) + 0.05) < 3) {
    color = backgroundLight > 0.18 ? "#191817" : "#F3F0E8";
  }
  const text = await sharp({ text: {
    text: `<span foreground="${color}">${escapeXml(title)}</span>`,
    font: "Barlow Condensed SemiBold",
    fontfile: path.join(process.cwd(), "src/lib/server/assets/BarlowCondensed-SemiBold.ttf"),
    width: textWidth, height: textHeight, rgba: true, wrap: "none",
  } }).png().toBuffer();
  const typography = await sharp(text).rotate(vertical ? 270 : 0).png().toBuffer();
  return renderCanvas(width, height, "#F3F0E8", [
    { input: fitted, left: 0, top: 0 },
    { input: typography, left, top },
  ]);
}

async function composeTravel(source: SourceImage, lower: Buffer, plan: AnalysisPlan) {
  const lowerHeight = Math.round(source.height * 1.25);
  const fitted = await fitPanel(lower, source.width, lowerHeight);
  const inset = clamp(Math.round(source.width * 0.065), 32, 110);
  const captionHeight = clamp(Math.round(lowerHeight * 0.18), 90, 250);
  const caption = captionSvg(source.width - inset * 2, captionHeight, {
    left: `NO. 001     ${dateLabel()}`,
    right: plan.phrase,
    color: "#27251F",
    muted: "#6E6A61",
  });
  return renderCanvas(source.width, source.height + lowerHeight, "#F3F0E8", [
    { input: source.buffer, left: 0, top: 0 },
    { input: fitted, left: 0, top: source.height },
    { input: caption, left: inset, top: source.height + lowerHeight - captionHeight - Math.round(inset * 0.35) },
  ]);
}

export async function composeArtwork(
  skillId: SkillId,
  source: SourceImage,
  panels: Buffer[],
  plan: AnalysisPlan,
) {
  switch (skillId) {
    case "odyssey":
      return composeOdyssey(source, panels[0], plan);
    case "threefold-memory":
      return composeThreefold(source, panels);
    case "abstract-quartet":
      return composeQuartet(source, panels);
    case "photo-editorial":
      return composeEditorial(source, panels[0], plan);
    case "surreal-pop":
      return composeSurreal(source, panels[0]);
    case "scene-to-art":
      return composeScenePoster(source, panels[0], plan);
    case "travel-abstraction":
      return composeTravel(source, panels[0], plan);
  }
}
