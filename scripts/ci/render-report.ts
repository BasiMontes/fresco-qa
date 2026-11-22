import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

interface OutcomeRecord {
  title: string
  project?: string
  class?: string
  testStatus?: string
  durationMs?: number
}

interface OutcomeSummary {
  total: number
  passed: number
  failed: number
  skipped: number
  flaky: number
}

interface Outcomes {
  generatedAt?: string
  records: OutcomeRecord[]
  summary: OutcomeSummary
}

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  throw new Error('Usage: bun scripts/ci/render-report.ts <test-outcomes.json> <output.html>');
}

const outcomes = JSON.parse(readFileSync(inputPath, 'utf8')) as Outcomes;

const escapeHtml = (value: string): string =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const repository = process.env.GITHUB_REPOSITORY ?? 'BasiMontes/fresco-qa';
const runId = process.env.GITHUB_RUN_ID ?? '';
const commit = (process.env.GITHUB_SHA ?? '').slice(0, 7);
const runUrl = runId ? `https://github.com/${repository}/actions/runs/${runId}` : `https://github.com/${repository}/actions`;

const resultOf = (record: OutcomeRecord): string => record.class ?? record.testStatus ?? 'unknown';

const rows = outcomes.records
  .map((record) => {
    const result = resultOf(record);
    const cssClass = result === 'passed' ? 'ok' : result === 'skipped' ? 'skip' : 'bad';
    return `<tr><td>${escapeHtml(record.title)}</td><td>${escapeHtml(record.project ?? '')}</td><td class="${cssClass}">${escapeHtml(result)}</td><td class="num">${record.durationMs ?? 0}</td></tr>`;
  })
  .join('\n');

const { summary } = outcomes;
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fresco QA test results</title>
<style>
:root{--ink:#16302b;--paper:#f6f4ec;--card:#fcfbf7;--line:#cfcab8;--ok:#276b43;--bad:#b3261e;--skip:#8a6d00}
@media (prefers-color-scheme: dark){:root{--ink:#e4efe7;--paper:#16302b;--card:#1f3f38;--line:#2f5a50;--ok:#7fd1a0;--bad:#ff9a92;--skip:#e6c75a}}
body{margin:0;padding:32px 16px;background:var(--paper);color:var(--ink);font:16px/1.5 system-ui,sans-serif}
main{max-width:960px;margin:0 auto}
h1{font-size:28px;margin:0 0 8px}
.meta{margin:0 0 24px}
.cards{display:flex;flex-wrap:wrap;gap:12px;margin:0 0 24px}
.card{flex:1 1 120px;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 16px}
.card b{display:block;font-size:28px}
table{width:100%;border-collapse:collapse;background:var(--card)}
th,td{padding:8px 10px;border-bottom:1px solid var(--line);text-align:left}
td.num{text-align:right}
.ok{color:var(--ok);font-weight:600}.bad{color:var(--bad);font-weight:600}.skip{color:var(--skip);font-weight:600}
a{color:inherit}
</style>
</head>
<body>
<main>
<h1>Fresco QA test results</h1>
<p class="meta">Commit ${escapeHtml(commit || 'unknown')} · generated ${escapeHtml(outcomes.generatedAt ?? 'unknown')} · <a href="${escapeHtml(runUrl)}">CI run</a> · <a href="https://github.com/${escapeHtml(repository)}">repository</a></p>
<div class="cards">
<div class="card"><b>${summary.total}</b>entries</div>
<div class="card"><b>${summary.passed}</b>passed</div>
<div class="card"><b>${summary.failed}</b>failed</div>
<div class="card"><b>${summary.skipped}</b>skipped</div>
<div class="card"><b>${summary.flaky}</b>flaky</div>
</div>
<table>
<thead><tr><th>Test</th><th>Project</th><th>Result</th><th>ms</th></tr></thead>
<tbody>
${rows}
</tbody>
</table>
<p class="meta">Steps, traces and logs stay in the CI run: the page lists only the result of each test.</p>
</main>
</body>
</html>
`;

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, html);
console.log(`wrote ${outputPath}: ${outcomes.records.length} records`);
