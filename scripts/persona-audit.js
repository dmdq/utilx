// 职业画像 × 任务覆盖度审计
// 运行：npm run persona-audit
// 输出：控制台摘要 + docs/PERSONA_AUDIT.md（每次覆盖最新，不追加）
// 用途：选品从"断档任务"挑；画像覆盖率是加工具的科学依据。
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const require_ = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { personas } = require_(join(root, 'src/data/personas.js'));
const { tools } = require_(join(root, 'src/data/tools.js'));

const toolIds = new Set(tools.map((t) => t.id));
const toolNameOf = Object.fromEntries(tools.map((t) => [t.id, t.name]));

// ---------- 校验 ----------
const badRefs = [];
const seenPersonaIds = new Set();
for (const p of personas) {
  if (seenPersonaIds.has(p.id)) badRefs.push(`画像 id 重复: ${p.id}`);
  seenPersonaIds.add(p.id);
  for (const t of p.tasks) for (const id of t.tools || []) if (!toolIds.has(id)) badRefs.push(`${p.id} → ${id}（tools.js 不存在）`);
}
if (badRefs.length) {
  console.error('❌ personas.js 存在无效工具引用：\n' + badRefs.map((x) => '  - ' + x).join('\n'));
  process.exit(1);
}

// ---------- 统计 ----------
const coveredToolIds = new Set(personas.flatMap((p) => p.tasks.flatMap((t) => t.tools || [])));
const stats = personas
  .map((p) => {
    const total = p.tasks.length;
    const coveredTasks = p.tasks.filter((t) => (t.tools || []).length > 0);
    const gaps = p.tasks.filter((t) => (t.tools || []).length === 0);
    const toolSet = new Set(coveredTasks.flatMap((t) => t.tools));
    return { p, total, covered: coveredTasks.length, gaps, toolCount: toolSet.size, coverage: Math.round((coveredTasks.length / total) * 100) };
  })
  .sort((a, b) => a.coverage - b.coverage);

const totalTasks = stats.reduce((s, x) => s + x.total, 0);
const totalCovered = stats.reduce((s, x) => s + x.covered, 0);
const overallPct = Math.round((totalCovered / totalTasks) * 100);
const gapTasks = [];
for (const { p } of stats) for (const t of p.tasks) if (!(t.tools || []).length) gapTasks.push({ persona: p.name, personaId: p.id, task: t.task });

// ---------- 控制台摘要 ----------
const line = (n) => console.log('─'.repeat(n));
line(72);
console.log(`职业画像覆盖度审计 · ${personas.length} 画像 / ${totalTasks} 任务 / 覆盖 ${overallPct}% / 关联工具 ${coveredToolIds.size}/${tools.length}`);
line(72);
console.log('覆盖率 ↓ 画像（任务 covered/total · 工具 n）  [断档数]');
for (const s of stats) {
  console.log(`${String(s.coverage).padStart(3)}%  ${s.p.name}（${s.covered}/${s.total} · ${s.toolCount} 款）  ${s.gaps.length ? `[断档 ${s.gaps.length}]` : ''}`);
}
line(72);
if (gapTasks.length) {
  console.log(`断档任务 ${gapTasks.length} 条（下批选品候选池）：`);
  for (const g of gapTasks) console.log(`  · [${g.persona}] ${g.task}`);
} else {
  console.log('无断档任务（底账全覆盖，可扩充新画像或新任务）');
}
line(72);
console.log(`未挂画像的通用工具：${tools.length - coveredToolIds.size} 款（属正常，通用件可不绑定画像）`);

// ---------- Markdown 报告 ----------
const reportPath = join(root, 'docs', 'PERSONA_AUDIT.md');
const rows = stats
  .map(
    (s) =>
      `| ${s.p.name} | ${s.p.group} | ${s.total} | ${s.covered} | ${s.coverage}% | ${s.toolCount} | ${s.gaps.map((g) => g.task).join('；') || '—'} |`
  )
  .join('\n');
const gapRows = gapTasks.map((g) => `| ${g.persona} | ${g.task} |`).join('\n');
const md = `# 职业画像覆盖度审计报告

> 由 \`npm run persona-audit\` 自动生成（数据源 \`src/data/personas.js\`），覆盖至 ${tools.length} 款工具。
> 选品规则：优先从"断档任务"中挑新工具；画像覆盖率 ≥90% 视为饱和，不再主动加工具。

## 总览

- 画像 ${personas.length} 个 · 核心任务 ${totalTasks} 条 · 已覆盖 ${totalCovered} 条（${overallPct}%）
- 被画像任务引用的工具 ${coveredToolIds.size} 款（其余 ${tools.length - coveredToolIds.size} 款为通用件，未绑定画像属正常）
${gapTasks.length ? `- **断档任务 ${gapTasks.length} 条**（见下表，即下一批选品候选池）` : '- 当前无断档任务'}

## 各画像覆盖度（按覆盖率升序，越靠前越该补）

| 画像 | 分组 | 任务 | 覆盖 | 覆盖率 | 关联工具 | 断档任务 |
|---|---|---|---|---|---|---|
${rows}

## 断档任务清单（选品候选池）

| 画像 | 任务 |
|---|---|
${gapRows || '（无）'}

## 使用规则

1. 每批工具上线后：先在 \`src/data/personas.js\` 把新工具挂到对应画像任务上，再跑本脚本刷新报告；
2. 新任务（发现新需求）直接往对应画像的 tasks 里加一条 tools: [] 的记录，它会自动进入断档清单；
3. 画像覆盖率 ≥90% 即"饱和"，选品跳过该画像；
4. 报告每次全量覆盖 PERSONA_AUDIT.md，如需历史请自行拷贝归档。
`;
writeFileSync(reportPath, md, 'utf8');
console.log(`✅ 报告已生成：docs/PERSONA_AUDIT.md`);
