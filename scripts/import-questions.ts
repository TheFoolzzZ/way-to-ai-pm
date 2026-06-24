// scripts/import-questions.ts
// Markdown 批量导入：读取源目录，按类目映射 upsert 分类、去重插入题目。
// 用法：
//   全量导入:  npm run import:questions
//   采样验证:  SAMPLE=1 npm run import:questions   （每类目仅取第 1 道）
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import matter from "gray-matter";

// 加载 .env.local（tsx 脚本不会自动加载 Next 的环境变量文件）
function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  try {
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2];
      }
    }
  } catch {
    // .env.local 不存在时忽略，依赖真实环境变量
  }
}
loadEnv();

// 文件夹 → 入库类目名（替换旧 4 个种子分类）
const CATEGORY_MAP: Record<string, string> = {
  "01-项目-产品经验类": "AI 项目与产品经验",
  "02-产品核心方法论": "产品核心方法论",
  "03-AI技术实操及AI知识面": "AI 技术实操与知识",
  "04-行业-业务-产品-趋势认知类含AI": "行业·业务·趋势认知",
  "05-项目管理-跨团队协调-需求判断类": "项目管理与跨团队协作",
  "06-职场软素质-团队管理-职场情商类": "职场软素质与团队管理",
  "07-个人规划及自我认知类": "个人规划与自我认知",
  "08-谈薪": "谈薪",
  "09-其他通用类": "通用面试题",
};

const SOURCE_DIR =
  process.env.IMPORT_SOURCE_DIR ??
  "/Users/klein/Documents/The Fool's Library/800_learning/产品/Interview";

const SEED_CATEGORIES_TO_REMOVE = ["产品思维", "项目经历", "技术背景", "商业分析"];
const BATCH_SIZE = 100;
const SAMPLE = process.env.SAMPLE === "1"; // 每类目仅取第 1 道（排序后）

// 规范化题干：去首尾空白 + 去开头序号前缀（如 "1、""12."）
function normalizeQuestion(raw: string): string {
  return raw.trim().replace(/^\s*\d+[、.．:：]?\s*/, "").trim();
}

// 答案：去掉首个 "# " 标题行后的全文
function extractAnswer(body: string): string {
  const lines = body.split(/\r?\n/);
  let started = false;
  const out: string[] = [];
  for (const line of lines) {
    if (!started) {
      if (/^#\s+/.test(line)) {
        started = true;
        continue;
      }
      continue;
    }
    out.push(line);
  }
  return out.join("\n").trim();
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("缺少 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SECRET_KEY");
    process.exit(1);
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  console.log(SAMPLE ? "【采样模式】每类目仅取第 1 道\n" : "【全量模式】\n");

  // 0. 清理历史孤儿题（category_id 为空的失败产物）
  const { error: cleanErr } = await supabase.from("questions").delete().is("category_id", null);
  if (cleanErr) console.warn("清理孤儿题失败:", cleanErr.message);

  // 1. 建分类（name 无唯一约束，用 select + insert，不依赖 upsert）
  const folders = fs
    .readdirSync(SOURCE_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const categoryNameToId: Record<string, string> = {};
  for (const folder of folders) {
    const name = CATEGORY_MAP[folder];
    if (!name) {
      console.warn(`跳过未映射目录: ${folder}`);
      continue;
    }
    const sortOrder = parseInt(folder.slice(0, 2), 10) || 0;
    const { data: existingCat } = await supabase
      .from("question_categories")
      .select("id")
      .eq("name", name)
      .maybeSingle();
    let catId = existingCat?.id;
    if (!catId) {
      const { data: insertedCat, error: insertErr } = await supabase
        .from("question_categories")
        .insert({ name, sort_order: sortOrder })
        .select("id")
        .single();
      if (insertErr || !insertedCat) {
        console.error(`分类创建失败 ${name}:`, insertErr?.message);
        continue;
      }
      catId = insertedCat.id;
    }
    categoryNameToId[name] = catId;
    console.log(`分类就绪: ${name} (${catId})`);
  }

  // 2. 清理旧种子分类（连同其下题目一并删除）
  for (const oldName of SEED_CATEGORIES_TO_REMOVE) {
    const { data: oldCat } = await supabase
      .from("question_categories")
      .select("id")
      .eq("name", oldName)
      .maybeSingle();
    if (!oldCat) continue;
    await supabase.from("questions").delete().eq("category_id", oldCat.id);
    await supabase.from("question_categories").delete().eq("id", oldCat.id);
    console.log(`删除旧种子分类(含题目): ${oldName}`);
  }

  // 3. 解析题目（采样模式下每类目仅取第 1 个文件）
  type PendingQ = { question: string; answer: string; category_id: string };
  const pending: PendingQ[] = [];
  const seen = new Set<string>();
  let skippedDupe = 0;
  let skippedParse = 0;

  for (const folder of folders) {
    const categoryName = CATEGORY_MAP[folder];
    if (!categoryName) continue;
    const categoryId = categoryNameToId[categoryName];
    const dir = path.join(SOURCE_DIR, folder);
    let files = fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort();
    if (SAMPLE) files = files.slice(0, 1);
    for (const file of files) {
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      const parsed = matter(raw);
      const title = (parsed.data.title as string | undefined) ?? path.basename(file, ".md");
      const question = normalizeQuestion(title);
      const answer = extractAnswer(parsed.content);
      if (!question || !answer) {
        skippedParse++;
        continue;
      }
      const dedupeKey = `${categoryId}::${question}`;
      if (seen.has(dedupeKey)) {
        skippedDupe++;
        continue;
      }
      seen.add(dedupeKey);
      pending.push({ question, answer, category_id: categoryId });
    }
  }

  // 4. 对已入库题去重
  const existingKeys = new Set<string>();
  for (const catName of Object.keys(categoryNameToId)) {
    const catId = categoryNameToId[catName];
    const { data: exist } = await supabase
      .from("questions")
      .select("question")
      .eq("category_id", catId);
    for (const row of exist ?? []) {
      existingKeys.add(`${catId}::${normalizeQuestion(row.question)}`);
    }
  }
  const toInsert = pending.filter((p) => !existingKeys.has(`${p.category_id}::${p.question}`));
  const skippedExisting = pending.length - toInsert.length;

  // 5. 分批插入
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("questions").insert(batch);
    if (error) {
      console.error(`批次插入失败:`, error.message);
      continue;
    }
    inserted += batch.length;
  }

  console.log("\n===== 导入统计 =====");
  console.log(`解析题目: ${pending.length}`);
  console.log(`新增: ${inserted}`);
  console.log(`跳过(已入库): ${skippedExisting}`);
  console.log(`跳过(本次重复): ${skippedDupe}`);
  console.log(`跳过(解析失败): ${skippedParse}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
