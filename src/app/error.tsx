"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="fatal-error">
      <p className="eyebrow">IMAGE FIELD / ERROR</p>
      <h1>页面暂时无法打开。</h1>
      <button type="button" onClick={reset}>重新加载</button>
    </main>
  );
}
