# IMAGE FIELD

单页图片 Skill 合集 MVP。用户上传一张图片、选择一个 Skill，生成一张 PNG 作品；无需登录，生成后仅可下载或重新生成。

## 本地运行

要求 Node.js 20.9 或更高版本，并使用 pnpm。

```bash
pnpm install
copy .env.example .env.local
pnpm dev
```

在 `.env.local` 中填写：

```env
MINIMAX_API_KEY=your_api_key
MINIMAX_BASE_URL=https://api.minimaxi.com
MINIMAX_CHAT_MODEL=MiniMax-M3
MINIMAX_IMAGE_MODEL=image-01
```

浏览器打开 `http://localhost:3000`。

## MVP 范围

- 一个页面，六张圆角 Skill 卡片
- 一张图片 + 一个 Skill + 一张成品
- JPG / PNG / WebP 上传，最大 15 MB、2000 万像素
- 输出无水印 PNG，可直接下载或重新生成
- 不做用户、历史记录、数据库和限流
- 上传图片及生成中间图仅保存在单次请求的运行内存中，不写入磁盘、不进缓存；响应结束后释放

## 六个 Skill

1. Starryear Odyssey：原片与抽象续章组成档案双联画
2. Threefold Memory：感知、现场、记忆三层纵向画幅
3. Abstract Quartet：现实、记忆、结构、混合四联画
4. Photo Abstract Editorial：原片与象牙白抽象编辑版面
5. Surreal Pop Collage：3:4 黑白现实锚点与巨物波普拼贴
6. Travel Photo Abstraction：原片与大面积留白的旅行档案

前四联画/双联画与旅行版式会保留原片区域的原始像素尺寸；超现实波普按照 Skill 定义输出 3:4 画幅。

## 生成架构

1. `MiniMax-M3` 读取上传照片，提取视觉锚点、色彩、光线和分镜方案。
2. `image-01` 按当前 Skill 生成抽象面板；超现实波普会把上传图片作为参考图传入。
3. `sharp` 在服务器内存中按 Skill 规则合成最终 PNG，不创建临时文件。

核心接口是 `POST /api/generate`，使用 `multipart/form-data`：

- `image`：一张图片
- `skillId`：六个 Skill ID 之一
- `attempt`：重新生成次数

## 验证

```bash
pnpm typecheck
pnpm lint
pnpm build
```

## 示例作品来源

卡片背景使用已获授权的 Skill 示例作品。超现实波普卡片图为本项目使用 OpenAI 图像生成工具制作的原创示例，提示词方向为：竖版纽约街景波普拼贴、黑白现实锚点、黄红平涂色块、单一巨大交通灯、弧形鸽群、无文字与水印。

- [Starryear Odyssey](https://github.com/mayiwei442-bojack/Starryear-Odyssey)
- [Starryear Threefold Memory](https://github.com/mayiwei442-bojack/Starryear-Threefold-Memory)
- [Starryear Abstract Quartet](https://github.com/mayiwei442-bojack/Starryear-Abstract-Quartet)
- [Photo Abstract Editorial](https://github.com/mayiwei442-bojack/photo-abstract-editorial)
- [Surreal Pop Collage](https://github.com/mayiwei442-bojack/surreal-pop-collage)
- [Travel Photo Abstraction](https://github.com/mayiwei442-bojack/travel-photo-abstraction)
