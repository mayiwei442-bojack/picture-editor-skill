export const skillIds = [
  "odyssey",
  "threefold-memory",
  "abstract-quartet",
  "photo-editorial",
  "surreal-pop",
  "travel-abstraction",
] as const;

export type SkillId = (typeof skillIds)[number];

export type SkillDefinition = {
  id: SkillId;
  index: string;
  nameZh: string;
  nameEn: string;
  kicker: string;
  description: string;
  cover: string;
  accent: string;
  output: string;
  stages: [string, string, string];
};

export const skills: SkillDefinition[] = [
  {
    id: "odyssey",
    index: "01",
    nameZh: "星年·奥德赛",
    nameEn: "Starryear Odyssey",
    kicker: "档案式双联画",
    description: "保留原始照片，以场景证据生成一段抽象的视觉续章。",
    cover: "/card-art/odyssey.jpg",
    accent: "#d7b16e",
    output: "原图 + 抽象续章 / PNG",
    stages: ["读取场景证据", "生成奥德赛续章", "合成档案双联画"],
  },
  {
    id: "threefold-memory",
    index: "02",
    nameZh: "三重记忆",
    nameEn: "Threefold Memory",
    kicker: "感知·现场·记忆",
    description: "把同一瞬间展开为感知、现实与记忆三层影像。",
    cover: "/card-art/threefold.jpg",
    accent: "#a7bbca",
    output: "三段纵向画幅 / PNG",
    stages: ["分析视觉锚点", "生成感知与记忆", "合成三重画幅"],
  },
  {
    id: "abstract-quartet",
    index: "03",
    nameZh: "抽象四重奏",
    nameEn: "Abstract Quartet",
    kicker: "四种观看方式",
    description: "现实、记忆、结构与混合抽象依次叠合成四联画。",
    cover: "/card-art/quartet.jpg",
    accent: "#d8d0ba",
    output: "四段纵向画幅 / PNG",
    stages: ["拆解形色结构", "生成三种转译", "合成四重画幅"],
  },
  {
    id: "photo-editorial",
    index: "04",
    nameZh: "照片抽象编辑",
    nameEn: "Photo Editorial",
    kicker: "编辑式抽象版面",
    description: "让照片与大面积留白、克制图形和标题形成杂志版面。",
    cover: "/card-art/editorial.jpg",
    accent: "#e8b676",
    output: "原图 + 编辑版面 / PNG",
    stages: ["提炼色彩与情绪", "生成克制抽象画面", "合成编辑版面"],
  },
  {
    id: "surreal-pop",
    index: "05",
    nameZh: "超现实波普拼贴",
    nameEn: "Surreal Pop Collage",
    kicker: "现实锚点与巨物",
    description: "把现场转译成黑白现实、平涂色块与一件不可能巨物。",
    cover: "/card-art/surreal.png",
    accent: "#f15a36",
    output: "3:4 竖版拼贴 / PNG",
    stages: ["识别现实锚点", "生成波普拼贴", "校准竖版画幅"],
  },
  {
    id: "travel-abstraction",
    index: "06",
    nameZh: "旅行照片抽象",
    nameEn: "Travel Abstraction",
    kicker: "旅行视觉档案",
    description: "原片之下，以象牙白留白与微型图形记录地点印象。",
    cover: "/card-art/travel.png",
    accent: "#7da9bd",
    output: "原图 + 旅行档案 / PNG",
    stages: ["提取地点印象", "生成留白图形", "合成旅行档案"],
  },
];

export function isSkillId(value: string): value is SkillId {
  return skillIds.includes(value as SkillId);
}

export function getSkill(id: SkillId) {
  return skills.find((skill) => skill.id === id)!;
}
