import { SkillStudio } from "@/components/skill-studio";
import { skillCountLabel, skills } from "@/lib/skills";

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="返回顶部">
          IMAGE FIELD
        </a>
        <div className="header-note">
          <span>PUBLIC EDITION</span>
          <span>{String(skills.length).padStart(2, "0")} VISUAL SKILLS</span>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-index" aria-hidden="true">VOL. 01</div>
        <div className="hero-copy">
          <p className="eyebrow">A SMALL ARCHIVE OF VISUAL TRANSFORMATIONS</p>
          <h1>
            一张照片，
            <br />
            {skillCountLabel}种观看方式。
          </h1>
          <p className="hero-intro">
            选择一种视觉语言，把你的照片重新组织成一张完整作品。
            无需登录，生成后直接下载原图 PNG。
          </p>
        </div>
        <div className="hero-aside" aria-hidden="true">
          <span>ORIGINAL IN</span>
          <span>ARTWORK OUT</span>
        </div>
      </section>

      <SkillStudio />

      <footer className="site-footer">
        <span>ONE IMAGE · ONE SKILL · ONE ARTWORK</span>
        <span>文件仅在生成时处理，不在服务器保存</span>
      </footer>
    </main>
  );
}
