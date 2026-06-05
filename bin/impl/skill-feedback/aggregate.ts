export type Verdict = "useful" | "not-useful" | "mixed" | "bailed-on-me";

export interface FeedbackEntry {
  at: string;
  skill: string;
  lens?: string | null;
  verdict: Verdict | string;
  reason?: string;
  tags?: string[];
  run_at?: string;
  gamestack_version?: string;
}

export interface SkillSummary {
  skill: string;
  total: number;
  useful: number;
  not_useful: number;
  mixed: number;
  bailed: number;
  useful_rate: number;
  top_reasons: Array<{ reason: string; count: number }>;
  top_tags: Array<{ tag: string; count: number }>;
  newest_at: string | null;
  oldest_at: string | null;
}

export interface Aggregate {
  window: string;
  project: string;
  sources: string[];
  total_entries: number;
  skills: SkillSummary[];
}

function countTop<T>(items: T[], key: (t: T) => string | null | undefined, limit: number): Array<{ value: string; count: number }> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    if (!k) continue;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([value, count]) => ({ value, count }));
}

export function aggregate(entries: FeedbackEntry[]): Aggregate {
  const bySkill = new Map<string, FeedbackEntry[]>();
  for (const e of entries) {
    if (!bySkill.has(e.skill)) bySkill.set(e.skill, []);
    bySkill.get(e.skill)!.push(e);
  }

  const skills: SkillSummary[] = [];
  for (const [skill, list] of bySkill) {
    let useful = 0;
    let notUseful = 0;
    let mixed = 0;
    let bailed = 0;
    let newest = -Infinity;
    let oldest = Infinity;
    let newestAt: string | null = null;
    let oldestAt: string | null = null;
    for (const e of list) {
      switch (e.verdict) {
        case "useful":
          useful++;
          break;
        case "not-useful":
          notUseful++;
          break;
        case "mixed":
          mixed++;
          break;
        case "bailed-on-me":
          bailed++;
          break;
      }
      const t = Date.parse(e.at);
      if (!Number.isNaN(t)) {
        if (t > newest) {
          newest = t;
          newestAt = e.at;
        }
        if (t < oldest) {
          oldest = t;
          oldestAt = e.at;
        }
      }
    }
    const total = list.length;
    const useful_rate = total === 0 ? 0 : useful / total;
    const top_reasons = countTop(
      list.filter((e) => e.verdict === "not-useful"),
      (e) => e.reason,
      5,
    ).map(({ value, count }) => ({ reason: value, count }));
    const tagCounts = new Map<string, number>();
    for (const e of list) {
      for (const tag of e.tags ?? []) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
    }
    const top_tags = [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));
    skills.push({
      skill,
      total,
      useful,
      not_useful: notUseful,
      mixed,
      bailed,
      useful_rate,
      top_reasons,
      top_tags,
      newest_at: newestAt,
      oldest_at: oldestAt,
    });
  }

  skills.sort((a, b) => {
    if (a.total !== b.total) return b.total - a.total;
    return a.useful_rate - b.useful_rate;
  });

  return {
    window: "",
    project: "",
    sources: [],
    total_entries: entries.length,
    skills,
  };
}
