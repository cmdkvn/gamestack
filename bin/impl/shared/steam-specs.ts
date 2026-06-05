// Steam page specs, mirroring skills/steam-page-review/SKILL.md.

export interface CapsuleSpec {
  slot: string;
  width: number;
  height: number;
  where: string;
  filenameHints: string[];
}

export const CAPSULE_SPECS: CapsuleSpec[] = [
  {
    slot: "header",
    width: 460,
    height: 215,
    where: "Featured banner, search results, library",
    filenameHints: ["header", "header-capsule"],
  },
  {
    slot: "small",
    width: 231,
    height: 87,
    where: "Search results, similar games",
    filenameHints: ["small", "small-capsule"],
  },
  {
    slot: "main",
    width: 1232,
    height: 706,
    where: "Top of the store page",
    filenameHints: ["main", "main-capsule", "page-capsule"],
  },
  {
    slot: "library-capsule",
    width: 600,
    height: 900,
    where: "User library (vertical)",
    filenameHints: ["library", "library-capsule", "library-vertical"],
  },
  {
    slot: "library-hero",
    width: 3840,
    height: 1240,
    where: "Library banner",
    filenameHints: ["library-hero", "hero"],
  },
  {
    slot: "library-logo",
    width: 1280,
    height: 720,
    where: "Overlaid on hero (transparent)",
    filenameHints: ["library-logo", "logo"],
  },
  {
    slot: "page-background",
    width: 1438,
    height: 810,
    where: "Behind the page",
    filenameHints: ["page-background", "background"],
  },
];

export const SHORT_DESC_MAX = 300;
export const TAG_COUNT_MIN = 5;
export const TAG_COUNT_MAX = 15;
export const TRAILER_SWEET_MIN_SEC = 60;
export const TRAILER_SWEET_MAX_SEC = 90;
export const TRAILER_HARD_MAX_SEC = 120;
export const SCREENSHOT_COUNT_MIN = 5;
export const NEXT_FEST_DEMO_SWEET_MIN_MIN = 15;
export const NEXT_FEST_DEMO_SWEET_MAX_MIN = 30;

// Phrases the marketing skill calls out as wishlist-killing clichés.
export const CLICHE_PATTERNS: { pattern: RegExp; flag: string }[] = [
  { pattern: /epic adventure/i, flag: "epic adventure" },
  { pattern: /embark on a journey/i, flag: "embark on a journey" },
  { pattern: /vast world/i, flag: "vast world" },
  { pattern: /unforgettable journey/i, flag: "unforgettable journey" },
  { pattern: /immerse yourself/i, flag: "immerse yourself" },
  { pattern: /breathtaking visuals?/i, flag: "breathtaking visuals" },
  { pattern: /stunning graphics?/i, flag: "stunning graphics" },
  { pattern: /epic battle/i, flag: "epic battle" },
  { pattern: /uncover the mysteries?/i, flag: "uncover the mysteries" },
];

// Bullet-list / "feature checklist" anti-pattern.
export const FEATURE_LIST_HINTS: RegExp[] = [
  /✓|✔|☑|⭐/,
  /\n\s*[-•*]\s+/g,
];

// Common Steam genre/vibe tags. Used to detect that at least one tag *looks*
// like a genre word and that the description names the genre.
export const STEAM_GENRE_TAGS = [
  "Action", "Adventure", "Casual", "Indie", "Massively Multiplayer", "Racing",
  "RPG", "Simulation", "Sports", "Strategy",
  "Roguelike", "Roguelite", "Platformer", "Metroidvania", "Soulslike",
  "Shoot 'Em Up", "Visual Novel", "Walking Simulator", "Puzzle", "Survival",
  "Horror", "Bullet Hell", "Card Game", "Deckbuilder", "Auto Battler",
  "Tower Defense", "Tactical RPG", "JRPG", "CRPG", "Twin Stick Shooter",
  "Pixel Graphics", "2D Platformer", "3D Platformer", "Open World",
];

export const STEAM_VIBE_TAGS = [
  "Atmospheric", "Story Rich", "Difficult", "Singleplayer", "Multiplayer",
  "Co-op", "Local Co-Op", "Online Co-Op", "Online PvP", "First-Person",
  "Third Person", "Top-Down", "Side Scroller", "Hand-Drawn", "Pixel Art",
  "Retro", "Surreal", "Psychological Horror", "Dark", "Cute",
  "Cozy", "Relaxing", "Funny", "Comedy", "Dystopian",
];

export function isGenreTag(tag: string): boolean {
  return STEAM_GENRE_TAGS.some((g) => g.toLowerCase() === tag.toLowerCase());
}

export function isVibeTag(tag: string): boolean {
  return STEAM_VIBE_TAGS.some((v) => v.toLowerCase() === tag.toLowerCase());
}
