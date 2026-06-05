import type { Aggregate, SkillSummary } from "./aggregate.ts";

function pct(n: number): string {
  return `${(n * 100).toFixed(0)}%`;
}

function verdict(rate: number, total: number): string {
  if (total < 3) return "low-signal";
  if (rate >= 0.75) return "landing";
  if (rate >= 0.5) return "mixed";
  return "drifting";
}

function renderSkill(s: SkillSummary): string {
  const parts: string[] = [];
  parts.push(`### \`/${s.skill}\` — ${s.total} ratings, ${pct(s.useful_rate)} useful — ${verdict(s.useful_rate, s.total)}`);
  parts.push("");
  parts.push(`- useful: ${s.useful}`);
  parts.push(`- not-useful: ${s.not_useful}`);
  parts.push(`- mixed: ${s.mixed}`);
  parts.push(`- bailed: ${s.bailed}`);
  if (s.top_reasons.length > 0) {
    parts.push("");
    parts.push("Top reasons for not-useful:");
    for (const r of s.top_reasons) {
      parts.push(`  - (${r.count}×) ${r.reason}`);
    }
  }
  if (s.top_tags.length > 0) {
    parts.push("");
    parts.push("Tags:");
    for (const t of s.top_tags) {
      parts.push(`  - ${t.tag} (${t.count})`);
    }
  }
  if (s.newest_at && s.oldest_at) {
    parts.push("");
    parts.push(`Range: ${s.oldest_at} → ${s.newest_at}`);
  }
  parts.push("");
  return parts.join("\n");
}

export function renderMarkdown(a: Aggregate): string {
  const lines: string[] = [];
  lines.push(`# gamestack skill-feedback`);
  lines.push("");
  lines.push(`- Project: \`${a.project}\``);
  lines.push(`- Window: \`${a.window}\``);
  lines.push(`- Sources: ${a.sources.map((s) => `\`${s}\``).join(", ")}`);
  lines.push(`- Total entries: ${a.total_entries}`);
  lines.push("");
  if (a.skills.length === 0) {
    lines.push("_No feedback entries in this window. Run `/skill-feedback` after any skill output to seed the log._");
    lines.push("");
    return lines.join("\n");
  }
  lines.push("## Per-skill summary");
  lines.push("");
  lines.push("Sorted by volume (descending), then by useful-rate (ascending) — the skills you should look at first are at the top of low-rated buckets.");
  lines.push("");
  for (const s of a.skills) {
    lines.push(renderSkill(s));
  }
  return lines.join("\n");
}
