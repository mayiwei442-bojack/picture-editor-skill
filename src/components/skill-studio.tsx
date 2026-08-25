"use client";

import Image from "next/image";
import { ChangeEvent, DragEvent, useCallback, useEffect, useRef, useState } from "react";
import { ArrowIcon, CloseIcon, DownloadIcon, RefreshIcon, UploadIcon } from "./icons";
import { SkillDefinition, skills } from "@/lib/skills";

type Phase = "empty" | "ready" | "generating" | "done" | "error";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_BYTES = 15 * 1024 * 1024;

function formatBytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function SkillStudio() {
  const [selected, setSelected] = useState<SkillDefinition | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("image-field.png");
  const [phase, setPhase] = useState<Phase>("empty");
  const [error, setError] = useState("");
  const [stage, setStage] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearResult = useCallback(() => {
    setResultUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
  }, []);

  const clearFile = useCallback(() => {
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const closeStudio = useCallback(() => {
    if (phase === "generating") return;
    clearResult();
    clearFile();
    setSelected(null);
    setError("");
    setPhase("empty");
    setAttempt(0);
  }, [clearFile, clearResult, phase]);

  useEffect(() => {
    if (!selected) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeStudio();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeStudio, selected]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
  }, [previewUrl, resultUrl]);

  useEffect(() => {
    if (phase !== "generating") return;
    const first = window.setTimeout(() => setStage(1), 5200);
    const second = window.setTimeout(() => setStage(2), 15500);
    return () => {
      window.clearTimeout(first);
      window.clearTimeout(second);
    };
  }, [attempt, phase]);

  function openStudio(skill: SkillDefinition) {
    setSelected(skill);
    setPhase("empty");
    setError("");
  }

  function acceptFile(nextFile: File) {
    setError("");
    if (!ACCEPTED_TYPES.includes(nextFile.type)) {
      setError("请上传 JPG、PNG 或 WebP 图片。");
      setPhase("error");
      return;
    }
    if (nextFile.size > MAX_FILE_BYTES) {
      setError("图片不能超过 15 MB。");
      setPhase("error");
      return;
    }
    clearResult();
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(nextFile);
    });
    setFile(nextFile);
    setPhase("ready");
    setAttempt(0);
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0];
    if (nextFile) acceptFile(nextFile);
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    const nextFile = event.dataTransfer.files?.[0];
    if (nextFile) acceptFile(nextFile);
  }

  async function generate(nextAttempt = attempt) {
    if (!file || !selected) return;
    clearResult();
    setPhase("generating");
    setError("");
    setStage(0);

    const form = new FormData();
    form.append("image", file);
    form.append("skillId", selected.id);
    form.append("attempt", String(nextAttempt));

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        body: form,
        cache: "no-store",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "生成失败，请稍后再试。");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setDownloadName(response.headers.get("X-Output-Name") || `${selected.id}.png`);
      setStage(2);
      setPhase("done");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "生成失败，请稍后再试。");
      setPhase("error");
    }
  }

  function regenerate() {
    const nextAttempt = attempt + 1;
    setAttempt(nextAttempt);
    void generate(nextAttempt);
  }

  return (
    <>
      <section className="archive-section" aria-labelledby="archive-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">SELECT A VISUAL LANGUAGE</p>
            <h2 id="archive-heading">六种 Skill</h2>
          </div>
          <p>每次仅处理一张图片，并输出一张完整作品。</p>
        </div>

        <div className="skill-grid">
          {skills.map((skill) => (
            <button
              className="skill-card"
              key={skill.id}
              type="button"
              onClick={() => openStudio(skill)}
              style={{ "--accent": skill.accent } as React.CSSProperties}
              aria-label={`选择 ${skill.nameZh}`}
            >
              <Image
                className="skill-card-image"
                src={skill.cover}
                alt=""
                fill
                loading="eager"
                sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw"
              />
              <span className="skill-card-shade" />
              <span className="skill-card-topline">
                <span>{skill.index}</span>
                <span>{skill.kicker}</span>
              </span>
              <span className="skill-card-copy">
                <span className="skill-card-en">{skill.nameEn}</span>
                <strong>{skill.nameZh}</strong>
                <span className="skill-card-description">{skill.description}</span>
              </span>
              <span className="skill-card-action">
                开始创作 <ArrowIcon />
              </span>
            </button>
          ))}
        </div>
      </section>

      {selected && (
        <div className="studio-shell" role="dialog" aria-modal="true" aria-labelledby="studio-title">
          <div className="studio-topbar">
            <div className="studio-brand">
              <span>{selected.index}</span>
              <span>IMAGE FIELD / STUDIO</span>
            </div>
            <button
              className="icon-button"
              type="button"
              onClick={closeStudio}
              disabled={phase === "generating"}
              aria-label="关闭编辑台"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="studio-layout">
            <section className="studio-canvas">
              {phase === "done" && resultUrl ? (
                <div className="result-frame">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={resultUrl} alt={`${selected.nameZh} 生成结果`} />
                  <span className="result-badge">PNG · READY</span>
                </div>
              ) : previewUrl ? (
                <div className="preview-frame">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="上传图片预览" />
                  {phase === "generating" && (
                    <div className="processing-veil" aria-hidden="true">
                      <span className="scanner" />
                      <span>PROCESSING</span>
                    </div>
                  )}
                </div>
              ) : (
                <label
                  className="drop-zone"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={onDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={onFileChange}
                  />
                  <UploadIcon />
                  <strong>拖入一张照片</strong>
                  <span>或点击选择 · JPG / PNG / WebP · 最大 15 MB</span>
                </label>
              )}
            </section>

            <aside className="studio-panel">
              <div>
                <p className="eyebrow">{selected.nameEn}</p>
                <h2 id="studio-title">{selected.nameZh}</h2>
                <p className="studio-description">{selected.description}</p>
              </div>

              <div className="studio-spec">
                <span>OUTPUT</span>
                <strong>{selected.output}</strong>
              </div>

              {file && phase !== "done" && (
                <div className="file-row">
                  <span className="file-thumb">
                    {previewUrl && <Image src={previewUrl} alt="" fill unoptimized />}
                  </span>
                  <span className="file-copy">
                    <strong>{file.name}</strong>
                    <span>{formatBytes(file.size)}</span>
                  </span>
                  {phase !== "generating" && (
                    <button type="button" onClick={clearFile} aria-label="移除图片">移除</button>
                  )}
                </div>
              )}

              {phase === "generating" && (
                <div className="progress-block" aria-live="polite">
                  {selected.stages.map((label, index) => (
                    <div
                      className={`progress-step ${index < stage ? "is-complete" : ""} ${index === stage ? "is-active" : ""}`}
                      key={label}
                    >
                      <span>{index < stage ? "✓" : `0${index + 1}`}</span>
                      <p>{label}</p>
                    </div>
                  ))}
                  <small>生成通常需要 1–4 分钟，请保持页面打开。</small>
                </div>
              )}

              {error && <p className="error-message" role="alert">{error}</p>}

              <div className="studio-actions">
                {phase === "done" && resultUrl ? (
                  <>
                    <a className="primary-action" href={resultUrl} download={downloadName}>
                      下载原图 PNG <DownloadIcon />
                    </a>
                    <button className="secondary-action" type="button" onClick={regenerate}>
                      重新生成 <RefreshIcon />
                    </button>
                  </>
                ) : (
                  <button
                    className="primary-action"
                    type="button"
                    disabled={!file || phase === "generating"}
                    onClick={() => void generate()}
                  >
                    {phase === "generating" ? "正在生成" : "生成作品"}
                    {phase !== "generating" && <ArrowIcon />}
                  </button>
                )}
              </div>

              <p className="privacy-note">
                图片仅用于本次生成。服务器不落盘，响应完成后即从运行内存释放。
              </p>
            </aside>
          </div>
        </div>
      )}
    </>
  );
}
