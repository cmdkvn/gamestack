import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import imageSize from "image-size";
import {
  CAPSULE_SPECS,
  type CapsuleSpec,
  CLICHE_PATTERNS,
  FEATURE_LIST_HINTS,
  NEXT_FEST_DEMO_SWEET_MAX_MIN,
  NEXT_FEST_DEMO_SWEET_MIN_MIN,
  SCREENSHOT_COUNT_MIN,
  SHORT_DESC_MAX,
  STEAM_GENRE_TAGS,
  TAG_COUNT_MAX,
  TAG_COUNT_MIN,
  TRAILER_HARD_MAX_SEC,
  TRAILER_SWEET_MAX_SEC,
  TRAILER_SWEET_MIN_SEC,
  isGenreTag,
  isVibeTag,
} from "../shared/steam-specs.ts";
import { isoDate } from "../shared/format.ts";

export interface CapsuleFinding {
  slot: string;
  expectedWidth: number;
  expectedHeight: number;
  file: string | null;
  actualWidth?: number;
  actualHeight?: number;
  verdict: "PASS" | "FAIL" | "MISSING";
  reason: string;
}

export interface TrailerFinding {
  lengthSec: number | null;
  firstSixSecondVerb: boolean | null;
  studioCardAtStart: boolean | null;
  hasSubtitles: boolean | null;
  withinSweetSpot: boolean;
  reasons: string[];
}

export interface ShortDescriptionFinding {
  characterCount: number;
  withinLimit: boolean;
  clicheFlags: string[];
  featureListFlag: boolean;
  genreWordPresent: boolean;
}

export interface TagsFinding {
  count: number;
  withinRange: boolean;
  genreTagCount: number;
  vibeTagCount: number;
  unknownTags: string[];
  recommendedAdditions: string[];
}

export interface ScreenshotsFinding {
  count: number;
  withinMinimum: boolean;
}

export interface NextFestFinding {
  planned: boolean;
  demoLengthOk: boolean | null;
  demoEndsOnHook: boolean | null;
  reasons: string[];
}

export interface SteamPageReport {
  generatedAt: string;
  projectRoot: string;
  steamDir: string;
  pageStateRaw: string | null;
  appId: number | null;
  capsules: CapsuleFinding[];
  trailer: TrailerFinding;
  shortDescription: ShortDescriptionFinding | null;
  tags: TagsFinding | null;
  screenshots: ScreenshotsFinding;
  nextFest: NextFestFinding | null;
  topEdits: TopEdit[];
  wishlistRisk: "LOW" | "MEDIUM" | "HIGH";
  wishlistRiskReason: string;
}

export interface TopEdit {
  rank: number;
  edit: string;
  expectedEffect: string;
}

export interface CheckInput {
  projectRoot: string;
  steamDir?: string;
}

export interface PageManifest {
  appId?: number;
  pageState?: string;
  shortDescription?: string;
  longDescription?: string;
  tags?: string[];
  trailerSeconds?: number;
  trailerHasSubtitles?: boolean;
  trailerHasStudioCardAtStart?: boolean;
  trailerFirstSixSecondVerb?: boolean;
  screenshotsCount?: number;
  nextFest?: {
    planned?: boolean;
    demoMinutes?: number;
    demoEndsOnHook?: boolean;
  };
}

export function runSteamPageCheck(input: CheckInput): SteamPageReport {
  const steamDir = input.steamDir ?? findSteamDir(input.projectRoot);
  const manifest = readManifest(steamDir);
  const capsules = auditCapsules(steamDir);
  const trailer = auditTrailer(manifest);
  const shortDescription = manifest?.shortDescription ? auditShortDescription(manifest.shortDescription, manifest.tags ?? []) : null;
  const tags = manifest?.tags ? auditTags(manifest.tags) : null;
  const screenshots = auditScreenshots(steamDir, manifest);
  const nextFest = manifest?.nextFest ? auditNextFest(manifest.nextFest) : null;

  const topEdits = collectTopEdits({ capsules, trailer, shortDescription, tags, screenshots, nextFest });
  const { risk, reason } = computeRisk({ capsules, trailer, shortDescription, tags, screenshots });

  return {
    generatedAt: isoDate(),
    projectRoot: input.projectRoot,
    steamDir,
    pageStateRaw: manifest?.pageState ?? null,
    appId: manifest?.appId ?? null,
    capsules,
    trailer,
    shortDescription,
    tags,
    screenshots,
    nextFest,
    topEdits,
    wishlistRisk: risk,
    wishlistRiskReason: reason,
  };
}

function findSteamDir(projectRoot: string): string {
  const candidates = [
    join(projectRoot, "marketing", "steam"),
    join(projectRoot, "marketing"),
    join(projectRoot, "steam"),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return candidates[0]!;
}

function readManifest(steamDir: string): PageManifest | null {
  for (const name of ["page.json", "steam-page.json", "page.steam.json"]) {
    const path = join(steamDir, name);
    if (existsSync(path)) {
      try {
        return JSON.parse(readFileSync(path, "utf8")) as PageManifest;
      } catch {
        return null;
      }
    }
  }
  return null;
}

function auditCapsules(steamDir: string): CapsuleFinding[] {
  const findings: CapsuleFinding[] = [];
  if (!existsSync(steamDir)) {
    for (const spec of CAPSULE_SPECS) {
      findings.push({
        slot: spec.slot,
        expectedWidth: spec.width,
        expectedHeight: spec.height,
        file: null,
        verdict: "MISSING",
        reason: `marketing/steam directory not found`,
      });
    }
    return findings;
  }

  const allFiles = listImageFiles(steamDir);

  for (const spec of CAPSULE_SPECS) {
    const match = findCapsuleFile(allFiles, spec);
    if (!match) {
      findings.push({
        slot: spec.slot,
        expectedWidth: spec.width,
        expectedHeight: spec.height,
        file: null,
        verdict: "MISSING",
        reason: `No image with name hint matching ${spec.filenameHints.join(" | ")}`,
      });
      continue;
    }
    let width: number | undefined;
    let height: number | undefined;
    try {
      const buf = readFileSync(match);
      const result = imageSize(buf);
      width = result.width;
      height = result.height;
    } catch {
      // fall through
    }
    if (width === spec.width && height === spec.height) {
      findings.push({
        slot: spec.slot,
        expectedWidth: spec.width,
        expectedHeight: spec.height,
        file: relativeTo(steamDir, match),
        actualWidth: width,
        actualHeight: height,
        verdict: "PASS",
        reason: "dimensions match Steam spec",
      });
    } else {
      findings.push({
        slot: spec.slot,
        expectedWidth: spec.width,
        expectedHeight: spec.height,
        file: relativeTo(steamDir, match),
        actualWidth: width,
        actualHeight: height,
        verdict: "FAIL",
        reason:
          width !== undefined && height !== undefined
            ? `expected ${spec.width}×${spec.height}, got ${width}×${height}`
            : "Could not read image dimensions",
      });
    }
  }

  return findings;
}

function relativeTo(base: string, absPath: string): string {
  return relative(base, absPath).split("\\").join("/");
}

function listImageFiles(dir: string): string[] {
  const out: string[] = [];
  const stack = [dir];
  while (stack.length > 0) {
    const cur = stack.pop()!;
    let entries: string[];
    try {
      entries = readdirSync(cur);
    } catch {
      continue;
    }
    for (const e of entries) {
      const abs = join(cur, e);
      let st;
      try { st = statSync(abs); } catch { continue; }
      if (st.isDirectory()) {
        stack.push(abs);
      } else if (st.isFile() && /\.(png|jpg|jpeg)$/i.test(e)) {
        out.push(abs);
      }
    }
  }
  return out;
}

function findCapsuleFile(imageFiles: string[], spec: CapsuleSpec): string | null {
  const hints = spec.filenameHints.map((h) => h.toLowerCase());
  for (const path of imageFiles) {
    const name = path.split("/").pop()!.toLowerCase();
    for (const hint of hints) {
      if (name.includes(hint)) return path;
    }
  }
  return null;
}

function auditTrailer(manifest: PageManifest | null): TrailerFinding {
  const length = manifest?.trailerSeconds ?? null;
  const reasons: string[] = [];

  let withinSweetSpot = false;
  if (length === null) {
    reasons.push("trailerSeconds missing from page.json — cannot validate length");
  } else if (length > TRAILER_HARD_MAX_SEC) {
    reasons.push(`length ${length}s exceeds hard max ${TRAILER_HARD_MAX_SEC}s — nobody watches past 2 minutes`);
  } else if (length < TRAILER_SWEET_MIN_SEC) {
    reasons.push(`length ${length}s under sweet spot ${TRAILER_SWEET_MIN_SEC}–${TRAILER_SWEET_MAX_SEC}s (OK for Next Fest)`);
  } else if (length > TRAILER_SWEET_MAX_SEC) {
    reasons.push(`length ${length}s above sweet spot ${TRAILER_SWEET_MIN_SEC}–${TRAILER_SWEET_MAX_SEC}s`);
  } else {
    withinSweetSpot = true;
  }

  if (manifest?.trailerFirstSixSecondVerb === false) {
    reasons.push("verb not landed in first 6 seconds — auto-play viewers bounce");
  }
  if (manifest?.trailerHasStudioCardAtStart === true) {
    reasons.push("studio card at start — move to end, viewers think the video hasn't started");
  }
  if (manifest?.trailerHasSubtitles === false) {
    reasons.push("subtitles off by default — Steam auto-plays muted, captions matter");
  }

  return {
    lengthSec: length,
    firstSixSecondVerb: manifest?.trailerFirstSixSecondVerb ?? null,
    studioCardAtStart: manifest?.trailerHasStudioCardAtStart ?? null,
    hasSubtitles: manifest?.trailerHasSubtitles ?? null,
    withinSweetSpot,
    reasons,
  };
}

function auditShortDescription(text: string, tags: string[]): ShortDescriptionFinding {
  const clicheFlags: string[] = [];
  for (const { pattern, flag } of CLICHE_PATTERNS) {
    if (pattern.test(text)) clicheFlags.push(flag);
  }
  const featureListFlag = FEATURE_LIST_HINTS.some((p) => p.test(text));
  const genreWordPresent =
    tags.some((t) => isGenreTag(t) && new RegExp(`\\b${escapeRegex(t.toLowerCase())}\\b`).test(text.toLowerCase())) ||
    STEAM_GENRE_TAGS.some((g) => new RegExp(`\\b${escapeRegex(g.toLowerCase())}\\b`).test(text.toLowerCase()));
  return {
    characterCount: text.length,
    withinLimit: text.length <= SHORT_DESC_MAX,
    clicheFlags,
    featureListFlag,
    genreWordPresent,
  };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function auditTags(tags: string[]): TagsFinding {
  const withinRange = tags.length >= TAG_COUNT_MIN && tags.length <= TAG_COUNT_MAX;
  let genreTagCount = 0;
  let vibeTagCount = 0;
  const unknownTags: string[] = [];
  for (const tag of tags) {
    if (isGenreTag(tag)) genreTagCount += 1;
    else if (isVibeTag(tag)) vibeTagCount += 1;
    else unknownTags.push(tag);
  }
  const recommendedAdditions: string[] = [];
  if (genreTagCount < 3) recommendedAdditions.push("Add more genre-leading tags (aim for 3–5).");
  if (vibeTagCount < 2) recommendedAdditions.push("Add 2–3 vibe tags (Atmospheric, Story Rich, Difficult, Cozy, etc.).");
  if (tags.length < TAG_COUNT_MIN) recommendedAdditions.push(`Tag count ${tags.length} below recommended floor ${TAG_COUNT_MIN}.`);
  if (tags.length > TAG_COUNT_MAX) recommendedAdditions.push(`Tag count ${tags.length} above recommended ceiling ${TAG_COUNT_MAX}.`);
  return { count: tags.length, withinRange, genreTagCount, vibeTagCount, unknownTags, recommendedAdditions };
}

function auditScreenshots(steamDir: string, manifest: PageManifest | null): ScreenshotsFinding {
  let count = manifest?.screenshotsCount ?? 0;
  if (!count) {
    const screenshotsDir = join(steamDir, "screenshots");
    if (existsSync(screenshotsDir)) {
      try {
        count = readdirSync(screenshotsDir).filter((f) => /\.(png|jpg|jpeg)$/i.test(f)).length;
      } catch {
        // ignore
      }
    }
  }
  return { count, withinMinimum: count >= SCREENSHOT_COUNT_MIN };
}

function auditNextFest(nf: NonNullable<PageManifest["nextFest"]>): NextFestFinding {
  const reasons: string[] = [];
  const planned = nf.planned ?? false;
  if (!planned) {
    return { planned: false, demoLengthOk: null, demoEndsOnHook: null, reasons: [] };
  }
  let demoLengthOk: boolean | null = null;
  if (nf.demoMinutes === undefined) {
    reasons.push("nextFest.demoMinutes missing");
  } else if (nf.demoMinutes < NEXT_FEST_DEMO_SWEET_MIN_MIN) {
    demoLengthOk = false;
    reasons.push(`demo ${nf.demoMinutes} min below sweet spot ${NEXT_FEST_DEMO_SWEET_MIN_MIN}–${NEXT_FEST_DEMO_SWEET_MAX_MIN} min`);
  } else if (nf.demoMinutes > NEXT_FEST_DEMO_SWEET_MAX_MIN) {
    demoLengthOk = false;
    reasons.push(`demo ${nf.demoMinutes} min above sweet spot ${NEXT_FEST_DEMO_SWEET_MIN_MIN}–${NEXT_FEST_DEMO_SWEET_MAX_MIN} min — long demos underperform`);
  } else {
    demoLengthOk = true;
  }
  const demoEndsOnHook = nf.demoEndsOnHook ?? null;
  if (demoEndsOnHook === false) {
    reasons.push("demo doesn't end on a hook — cliffhanger drives wishlist-on-end");
  }
  return { planned: true, demoLengthOk, demoEndsOnHook, reasons };
}

function collectTopEdits(parts: {
  capsules: CapsuleFinding[];
  trailer: TrailerFinding;
  shortDescription: ShortDescriptionFinding | null;
  tags: TagsFinding | null;
  screenshots: ScreenshotsFinding;
  nextFest: NextFestFinding | null;
}): TopEdit[] {
  const edits: { edit: string; expectedEffect: string; impact: number }[] = [];

  for (const c of parts.capsules) {
    if (c.verdict === "MISSING") {
      edits.push({
        edit: `Ship the ${c.slot} capsule (${c.expectedWidth}×${c.expectedHeight})`,
        expectedEffect: c.slot === "main" || c.slot === "header"
          ? "high — these are the first impressions in browse view"
          : "medium — players notice missing library art post-purchase",
        impact: c.slot === "main" || c.slot === "header" ? 100 : 60,
      });
    } else if (c.verdict === "FAIL") {
      edits.push({
        edit: `Resize ${c.slot} capsule to ${c.expectedWidth}×${c.expectedHeight} (currently ${c.actualWidth}×${c.actualHeight})`,
        expectedEffect: "Steam crops or rejects mismatched sizes",
        impact: c.slot === "main" || c.slot === "header" ? 90 : 50,
      });
    }
  }

  if (!parts.trailer.withinSweetSpot && parts.trailer.lengthSec !== null) {
    edits.push({
      edit: `Re-cut trailer to ${TRAILER_SWEET_MIN_SEC}–${TRAILER_SWEET_MAX_SEC}s (currently ${parts.trailer.lengthSec}s)`,
      expectedEffect: "Sweet-spot trailers outperform overlong cuts on Steam",
      impact: 80,
    });
  }
  if (parts.trailer.firstSixSecondVerb === false) {
    edits.push({
      edit: "Move primary gameplay verb into the first 3 seconds of the trailer",
      expectedEffect: "Auto-play viewers bounce on logo cards",
      impact: 95,
    });
  }
  if (parts.trailer.studioCardAtStart === true) {
    edits.push({
      edit: "Move studio card from trailer intro to outro",
      expectedEffect: "Reduces perceived 'broken video' bounces",
      impact: 70,
    });
  }

  if (parts.shortDescription) {
    if (!parts.shortDescription.withinLimit) {
      edits.push({
        edit: `Trim short description to ≤${SHORT_DESC_MAX} characters (currently ${parts.shortDescription.characterCount})`,
        expectedEffect: "Steam truncates over the limit",
        impact: 60,
      });
    }
    if (parts.shortDescription.clicheFlags.length > 0) {
      edits.push({
        edit: `Cut clichés: ${parts.shortDescription.clicheFlags.join(", ")}`,
        expectedEffect: "Clichés read as low-effort and waste characters",
        impact: 50,
      });
    }
    if (parts.shortDescription.featureListFlag) {
      edits.push({
        edit: "Replace bullet-list / checkmark feature list with a single concrete promise",
        expectedEffect: "Feature checklists read as desperate; concrete hooks convert",
        impact: 50,
      });
    }
    if (!parts.shortDescription.genreWordPresent) {
      edits.push({
        edit: "Name the genre explicitly in the short description",
        expectedEffect: "Steam search ranks pages where the genre appears in the description",
        impact: 65,
      });
    }
  }

  if (parts.tags) {
    if (parts.tags.recommendedAdditions.length > 0) {
      for (const r of parts.tags.recommendedAdditions) {
        edits.push({
          edit: `Tag strategy: ${r}`,
          expectedEffect: "Tags drive Steam discovery — undertagging suppresses the page",
          impact: 55,
        });
      }
    }
  }

  if (!parts.screenshots.withinMinimum) {
    edits.push({
      edit: `Add screenshots to reach at least ${SCREENSHOT_COUNT_MIN} (currently ${parts.screenshots.count})`,
      expectedEffect: "Steam pages with few screenshots underperform",
      impact: 55,
    });
  }

  if (parts.nextFest && parts.nextFest.planned) {
    if (parts.nextFest.demoLengthOk === false) {
      edits.push({
        edit: `Adjust Next Fest demo to ${NEXT_FEST_DEMO_SWEET_MIN_MIN}–${NEXT_FEST_DEMO_SWEET_MAX_MIN} min`,
        expectedEffect: "Long Next Fest demos correlate with lower wishlist conversion",
        impact: 60,
      });
    }
    if (parts.nextFest.demoEndsOnHook === false) {
      edits.push({
        edit: "End the Next Fest demo on a cliffhanger to drive wishlist-on-end",
        expectedEffect: "Cliffhanger demos convert better at the wishlist prompt",
        impact: 65,
      });
    }
  }

  return edits
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 5)
    .map((e, i) => ({ rank: i + 1, edit: e.edit, expectedEffect: e.expectedEffect }));
}

function computeRisk(parts: {
  capsules: CapsuleFinding[];
  trailer: TrailerFinding;
  shortDescription: ShortDescriptionFinding | null;
  tags: TagsFinding | null;
  screenshots: ScreenshotsFinding;
}): { risk: "LOW" | "MEDIUM" | "HIGH"; reason: string } {
  const highImpactSlots = new Set(["main", "header"]);
  const missingHighImpactCapsule = parts.capsules.some((c) => c.verdict !== "PASS" && highImpactSlots.has(c.slot));
  const trailerBad = parts.trailer.firstSixSecondVerb === false || (parts.trailer.lengthSec !== null && !parts.trailer.withinSweetSpot && parts.trailer.lengthSec > TRAILER_HARD_MAX_SEC);
  const descBad = parts.shortDescription !== null && (!parts.shortDescription.withinLimit || !parts.shortDescription.genreWordPresent || parts.shortDescription.clicheFlags.length > 1);
  const tagsBad = parts.tags !== null && !parts.tags.withinRange;
  const screenshotsBad = !parts.screenshots.withinMinimum;

  const issues = [missingHighImpactCapsule, trailerBad, descBad, tagsBad, screenshotsBad].filter(Boolean).length;

  if (issues >= 3) {
    return { risk: "HIGH", reason: `${issues} of 5 high-impact lanes need work — wishlist conversion will lag genre baseline` };
  }
  if (issues >= 1) {
    return { risk: "MEDIUM", reason: `${issues} high-impact lane${issues === 1 ? "" : "s"} need work — within recoverable range before launch` };
  }
  return { risk: "LOW", reason: "All high-impact lanes pass — focus on iteration, not rescue" };
}
