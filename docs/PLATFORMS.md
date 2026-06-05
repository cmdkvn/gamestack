# gamestack platform reference

Per-platform planning, budgets, and gotchas. The reader is an indie dev choosing which platforms to target, or troubleshooting why an asset / cert / store decision is failing on platform X.

Solo devs default to "build for PC, port later." That's how you end up with a 4 GB Switch build, an audio mix that doesn't fit in 4 MB of streaming budget, and a localization clipping bug discovered three days before lotcheck submission. Platforms aren't variations of the same game; they're contracts with different memory ceilings, certification authorities, store conventions, and player expectations. Picking PC + Switch on day one shapes the asset pipeline differently from picking PC + mobile. Picking PC + every console at launch shapes nothing at all — you won't ship.

This doc is the planning surface. Pick targets early. Match asset budgets to the *tightest* target. Lock cert-affecting systems (save format, sleep/resume, controller disconnect, localization) before content production starts, not after. Run [`/asset-audit`](../skills/asset-audit/SKILL.md) against the tightest target before every milestone gate. Run [`/cert-readiness`](../skills/cert-readiness/SKILL.md) before every console submission.

## Budgets at a glance

All numbers below mirror [`bin/impl/shared/platforms.ts`](../bin/impl/shared/platforms.ts) — the source of truth that [`gamestack-asset-audit`](../bin/impl/asset-audit/README.md) enforces in CI. If your `design/tech-design.md` has overrides, apply them via flags (`--texture-max`, `--audio-max-kbps`); don't fork the defaults.

| Platform | Texture max | Atlas MB | Audio kbps | Env tris | Char tris | Build cap |
|---|---|---|---|---|---|---|
| **PC hi-end** (`pc-hi`, aka `steam`) | 4096 | 1024 | 192–320 | 100,000 | 20,000 | — |
| **PC mid-range** (`pc-mid`, aka `pc`) | 2048 | 512 | 128–192 | 50,000 | 10,000 | — |
| **Switch handheld** (`switch-handheld`, aka `switch`) | 1024 | 256 | 96–192 | 20,000 | 8,000 | — |
| **Switch docked** (`switch-docked`) | 1024 | 256 | 96–192 | 30,000 | 10,000 | — |
| **PS5** (`ps5`) | 4096 | 2048 | 192–320 | 200,000 | 30,000 | — |
| **Xbox Series X/S** (`xbox-series-x`, aka `xbox`) | 4096 | 2048 | 192–320 | 200,000 | 30,000 | — |
| **Mobile hi-end** (`mobile-hi`, aka `mobile` / `ios` / `android`) | 1024 | 256 | 64–128 | 30,000 | 8,000 | — |
| **Mobile low-end** (`mobile-lo`) | 512 | 128 | 64–128 | 15,000 | 5,000 | — |
| **Web** (`web`, aka `itch`) | 512 | 50 | 64–96 | 10,000 | 4,000 | **50 MB total** |

Two things to internalize:

- **Web is the smallest budget by an order of magnitude** and is the only platform with a hard total-build cap. If you're shipping a web build, the asset pipeline is built around that 50 MB ceiling. Retrofitting it later is not a sprint — it's a re-skin.
- **Switch handheld and mobile low-end share the same texture and atlas ceiling.** If you build for both, audit once against the tighter audio target (mobile-lo).

Cap numbers are runtime asset budgets, not source-file budgets. `.psd`, `.blend`, and `.aseprite` sources go in Git LFS and don't count.

## PC (Steam, hi-end)

**Resolves to:** `pc-hi`. Texture max 4096, atlas 1024 MB, audio 192–320 kbps, env 100k tris, char 20k tris.

**Cert authority.** None. Steam is open-platform; you click "release" when you're ready. That freedom is a trap — there's no external forcing function for save-system robustness, sleep/resume, or controller disconnect. Steam Deck Verified is the closest thing, and it's worth pursuing for narrative indies (see "Picking your launch platforms" below).

**Steamworks setup.** Allow 30 days before launch for Steamworks setup if you've never done it: app ID purchase, depot configuration, build branches, store page draft, and demo branch (separate app ID). The store page draft can live in `coming soon` state for months while you build wishlist; flip to live only when the trailer + capsules are launch-ready.

**Capsule slots.** Steam wants seven, and `/steam-page-review` enforces them: Header 460×215, Small 231×87, Main 1232×706, Library capsule 600×900, Library hero 3840×1240, Library logo 1280×720 (transparent), Page background 1438×810. The Library hero and Library logo are the most-skipped pair; without them, the game looks unfinished in player libraries post-purchase. See [`/steam-page-review`](../skills/steam-page-review/SKILL.md) for the full capsule + trailer + tag audit.

**Refund window.** Steam refunds anything under 2 hours of play. That window is half your onboarding budget — the player decides whether to keep your game inside it. Run [`/critique --lens=onboarding`](../skills/critique/SKILL.md) before launch and before Next Fest; refund rates over 12% mean onboarding is broken, not pricing.

**Next Fest fit.** Demo length 15–30 minutes converts best. Trailer recut to 30 seconds with verb in the first 3 seconds. Coordinate the demo publish date ahead of your announced slot — Steam pushes demos that publish early.

**ESRB rating.** Optional on Steam (you can self-rate via IARC). Required if you also publish to console — match the rating across all stores and the in-game splash. Inconsistency is a [`/cert-readiness`](../skills/cert-readiness/SKILL.md) failure on every console.

## PC (Steam, mid-range)

**Resolves to:** `pc-mid`. Texture max 2048, atlas 512 MB, audio 128–192 kbps, env 50k tris, char 10k tris.

What changes from hi-end: halve every budget except audio (which drops one tier). This is the target for the laptop GPU audience and Steam Deck — both significant. If you support Steam Deck Verified, audit against `pc-mid` and validate at 1280×800 with a 30 fps lock as the fallback. The Deck is the largest single SKU shipping a "PC" game these days; don't audit against `pc-hi` and call Deck users "out of scope."

Everything else (cert, capsules, refunds, Next Fest) is identical to hi-end. The same store page covers both.

## Switch (handheld + docked)

**Resolves to:** `switch-handheld` or `switch-docked`. Texture max 1024 (both), atlas 256 MB (both), audio 96–192 kbps (both), env 20k handheld / 30k docked, char 8k handheld / 10k docked.

**Cert authority.** Nintendo Developer Portal (NDP). The cert process is called **lotcheck**.

**Lead time.** Typically 4–6 weeks for indie titles, longer in Q4. Plan accordingly: if your launch is December 1, your "code complete" date is mid-October at the latest. Failed lotcheck adds another 2–4 week round-trip.

**The most-failed lotcheck item: sleep / resume.** You will fail it once. The fix is not "I tested it." The fix is: hit the home button during *every* state — gameplay, every cutscene, every loading screen, the title menu, the pause menu, mid-save. If any of those resume into a corrupted state, you fail. Save atomicity (write-to-temp + rename) is the foundation; without it, sleep-during-save corrupts the player's file and they lose progress.

**The second-most-failed item: localization width clipping.** German strings overflow. Russian strings overflow. CJK glyphs miss baselines. If you ship in any language other than English, you need a UI pass where every menu button and every dialog box is tested at the longest expected string width. The strings don't have to be final translations — placeholder strings of the right *width* catch the bug.

**Memory ceiling.** 4 GB total, with OS reservation eating into it. A real-world indie budget is ~3 GB of game memory. Test peak memory with [`/critique --lens=perf`](../skills/critique/SKILL.md) in the worst scenario you ship (largest scene + every effect firing + max save state). Switch builds that hit 3.5 GB pass cert and OOM in week two when players visit a scene the dev didn't profile.

**Asset budget gotcha.** Switch handheld and docked share the same texture / atlas ceiling. The triangle budget is the only thing that changes between modes. Audit once against handheld; if you pass handheld, you pass docked.

**eShop submission flow.** Build → upload to NDP → lotcheck queue → response (PASS / NEEDS-WORK with specific category fails) → fix → resubmit. The eShop page is a separate setup: product description, screenshots, age rating, regional pricing. The lotcheck queue and eShop page approve independently; getting one approved doesn't approve the other.

Cross-link: see Switch section in [`/cert-readiness`](../skills/cert-readiness/SKILL.md) for the full category walk.

## PS5

**Resolves to:** `ps5`. Texture max 4096, atlas 2048 MB, audio 192–320 kbps, env 200k tris, char 30k tris.

PS5 has the most generous budgets of the consoles. That doesn't mean ship a 4096 texture for every prop — it means your hero assets get the headroom that Switch handheld denies them.

**Cert authority.** Sony PartnerNet, against the Technical Requirements Checklist (TRC).

**Lead time.** Typically 2–4 weeks; faster than Switch lotcheck in practice. Sony's bar is high on platform integration (trophies, DualSense, PSN) and lower on raw stability than Switch.

**Trophy structure.** If your game has any notion of "100% completion," a platinum trophy is expected. Skipping the platinum is technically allowed but lowers your game's PSN weighting and disappoints completionists. The trophy set design should happen during Production, not at cert — retrofitting trophies into shipped progression breaks save-data assumptions.

**DualSense expectations.** "Default rumble on hit" is not enough. Cert checks for *meaningful* use of haptics + adaptive triggers. Meaningful means: a different haptic signature per surface type, or adaptive trigger resistance that maps to in-fiction tension (bowstring draw, trigger pull, lock-pick tumble). Narrative indies often skip this and pass cert with a P1 comment; combat indies can't.

**Sleep / resume.** Same discipline as Switch. PS5's rest mode is more forgiving (it tends to suspend the whole process rather than calling lifecycle hooks), but the cert test still walks every state.

Cross-link: see PS5 section in [`/cert-readiness`](../skills/cert-readiness/SKILL.md).

## Xbox Series X/S

**Resolves to:** `xbox-series-x`. Texture max 4096, atlas 2048 MB, audio 192–320 kbps, env 200k tris, char 30k tris. Same numbers as PS5.

But the SKU split matters. The Series S has less GPU and 8 GB usable RAM (vs Series X 16 GB). The budget table covers Series X; the audit you should actually be running for both SKUs is Series S, which performs closer to `pc-mid` in practice. Lock the Series S target during planning or skip Xbox.

**Cert authority.** Microsoft Partner Center, typically via the ID@Xbox program for indies.

**Quick Resume gate.** Xbox-unique. The console suspends arbitrary state and restores it later without your game knowing it happened. If your save / load assumes a fresh process, you fail. Quick Resume failures almost always trace back to save-system bugs in disguise — atomic writes, schema versions, cloud-save round-trip. If [`/playtest`](../skills/playtest/SKILL.md)'s `05-cert-save-fuzz` scenario passes, Quick Resume usually does.

**Accessibility strictness.** Xbox has the strictest a11y cert of the three consoles. The [`/critique --lens=a11y`](../skills/critique/SKILL.md) top-4 (remappable controls, 1.5× text scale without UI break, colorblind presets, subtitles default ON with speaker labels) are not "nice to have" on Xbox — they are P0 cert blockers. Plan accessibility into the UI from the start; retrofitting it is months of work.

**Achievement requirements.** Full set required. Achievements unlock offline, sync online when connectivity returns. The same retrofit warning as PS5 trophies applies — design the achievement set during Production.

**Profile switching.** Mid-session profile switch must not crash or corrupt save data. Tested in cert; passes if your save system is keyed by user ID.

Cross-link: see Xbox section in [`/cert-readiness`](../skills/cert-readiness/SKILL.md).

## Mobile (high-end)

**Resolves to:** `mobile-hi`. Texture max 1024, atlas 256 MB, audio 64–128 kbps, env 30k tris, char 8k tris.

**Cert authority.** Apple App Store Review (iOS) and Google Play Store policy review (Android). Both are policy / content reviews more than technical cert — there's no sleep/resume audit. The technical bar is implicit (your app crashes, you get pulled).

**App Store conventions.** Privacy nutrition label, age rating, screenshot localization per language. App Store screenshots and the App Preview video have separate specs per device class (iPhone 6.7", iPhone 5.5", iPad). Localize the screenshots for every language you ship.

**Play Store conventions.** Slightly looser content policy, stricter on metadata quality (the listing's first sentence is indexed for search, just like Steam). Internal testing tracks via Play Console are useful — closed beta → open beta → production with the same APK.

**IAP / ads.** gamestack v1 stays out of monetization tooling. If your game is paid-up-front, the App Store / Play Store flow is straightforward. If your game uses IAP or ads, you need a billing integration (StoreKit / Play Billing) and an analytics surface that gamestack doesn't ship. Plan that pipeline outside this doc.

**Portrait vs landscape.** Pick one. Supporting both means two UI passes, two onboarding flows, two screenshot sets. For a narrative indie, portrait is almost always wrong unless the game is designed around it (interactive fiction, reading-heavy).

**OS-version targets.** iOS supports the last 2 major versions reasonably. Android fragmentation is real — target API 26+ (Android 8.0) at minimum, test on at least one mid-range device from 2022 or older. Don't ship a build that only works on flagship devices and call it "supports Android."

## Mobile (low-end)

**Resolves to:** `mobile-lo`. Texture max 512, atlas 128 MB, audio 64–128 kbps, env 15k tris, char 5k tris.

What changes from high-end: the **512×512 texture max**. This is a hard constraint, not a soft one — it changes art direction. Pixel art ships clean here. Hand-painted 2D ships clean. Realistic 3D textures do not — at 512×512 they read as blurry. If your art direction needs sharper, you don't ship to low-end mobile, or you ship a low-end-specific texture set.

Atlas drops to 128 MB. Audio drops slightly (same bitrate band, but you're using shorter loops and fewer simultaneous streams in practice). Triangle budget is half of high-end; LOD chains are mandatory on any environment object visible from distance.

Other than the budget, conventions match high-end mobile. Same App Store / Play Store flow, same policy review.

## Web (itch, portals)

**Resolves to:** `web`. Texture max 512, atlas 50 MB, audio 64–96 kbps, env 10k tris, char 4k tris. **Total build cap: 50 MB.**

Web is the smallest budget you'll ship to, and the only one with a hard total-build cap.

**No store-submission cert.** itch.io is a publish-when-ready surface — you upload and players load it in the browser. Portals (Newgrounds, Kongregate-era, Poki) have content guidelines but no platform cert.

**Browser quirks.** WebGL 2 is the safe target (well-supported across Chromium, Firefox, Safari). WebGPU is newer, faster, and not universally supported yet — ship WebGL 2 unless you have a specific perf justification. Mobile browsers are stricter than desktop browsers; if you support mobile-web, audit against the tighter constraint (typically Safari on iOS).

**Audio autoplay restrictions.** Modern browsers block audio playback until the user has interacted with the page. Your title screen needs a "click to start" gate that triggers the first audio context resume. Without it, music doesn't play and the player blames your game.

**Engine implications.** Unity WebGL builds are large; if you ship to itch with a 50 MB cap, you're using Godot (HTML5 export is well-supported and smaller), Bevy (with the WASM target), or a hand-rolled WebGL/Canvas stack. Unity WebGL builds typically start at 30–50 MB before any content — the runtime alone fills the budget.

**Asset budgets for web are not negotiable.** Every texture is 512 or smaller. Audio is short loops, 96 kbps Vorbis maximum. If your design calls for a 30-minute orchestral score, you don't ship to web, or you stream the audio from a CDN (which most portals don't allow). Plan around the cap from day one — retrofitting "make this fit in 50 MB" after content production is a re-skin, not a port.

## Picking your launch platforms

There's no universal answer, but there is a decision tree most indie narrative games should follow.

**Default launch slate: PC (Steam) + Switch + Steam Deck Verified.**

- **PC (Steam)** is the lowest-friction surface and the wishlist economy. You're shipping here whether you want to or not.
- **Steam Deck Verified** is a free badge that significantly broadens your audience and forces you to validate against `pc-mid` budgets early. Pursue it.
- **Switch** is the indie-narrative platform. The audience exists, the discoverability is better than Xbox or PlayStation for small games, and the lotcheck discipline (sleep/resume, save atomicity, localization) makes your game more robust everywhere. The 4-to-6-week cert lead time is real budget cost.

**Defer console-but-not-Switch (PS5 / Xbox) to v1.1+.** PS5 and Xbox audiences for indie narrative are smaller relative to the cert work. Ship them as ports after v1.0 has earned reviews and you've validated your save / sleep / controller code on Switch. Exception: if your game is design-led toward DualSense (haptics-driven puzzles, controller-as-protagonist) or Quick Resume (an explicit "pick up and play" pitch), then PS5 or Xbox earns day-one inclusion.

**Defer mobile entirely unless designed for it.** Mobile is its own discipline: touch UI from the start, session lengths of 5 minutes (not 60), portrait-or-landscape decided at the design jam. Porting a PC narrative game to mobile is almost always a worse version of the same game. Either design mobile-native from day one or skip it.

**Defer web unless your design hits the 50 MB cap natively.** Web is excellent for short demos, prototype playtests, and game-jam pieces. It's a poor fit for a full narrative game unless your asset direction (pixel art, vector art, sparse audio) already fits the budget. itch.io supports downloadable PC builds too — that's often the better itch surface for indie narrative.

**The decision is reversible.** Adding a platform after launch costs porting time and cert lead time, but you ship the same game with more validation. Removing a platform after launch costs nothing. Bias toward fewer platforms at v1.0 and more after the game has earned reviews and refined the engine code paths cert pressure-tests.

## Cross-links

- [`/asset-audit`](../skills/asset-audit/SKILL.md) — per-platform budget audit. Run against the tightest target.
- [`/cert-readiness`](../skills/cert-readiness/SKILL.md) — PS5 / Xbox / Switch cert category walk.
- [`/steam-page-review`](../skills/steam-page-review/SKILL.md) — capsule, trailer, tag, screenshot audit.
- [`/critique --lens=perf`](../skills/critique/SKILL.md) — peak-memory and frame-time validation against the platform ceiling.
- [`/critique --lens=a11y`](../skills/critique/SKILL.md) — Xbox-strict top-4 and the GAG checklist.
- [`/critique --lens=onboarding`](../skills/critique/SKILL.md) — refund-window critical for Steam.
- [`gamestack-asset-audit`](../bin/impl/asset-audit/README.md) — CLI for CI gating.
- [`bin/impl/shared/platforms.ts`](../bin/impl/shared/platforms.ts) — authoritative budget table.
