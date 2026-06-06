# Accessibility — gamestack reference

Accessibility is launch-readiness, not a feature backlog. The single best lever for "is this game shippable?" in 2026 is the same lever it has been since the Game Accessibility Guidelines went mainstream — does the player who can't read 12-point type, can't distinguish red from green, can't reach the right thumbstick comfortably, and can't hear the audio cue still get to play the game on the same hardware everyone else does. If the answer is no, the studio either ships fewer copies and eats reviews that say so, or the build doesn't pass console cert at all.

Xbox is the strictest a11y gate of the three consoles. Microsoft enforces remappable controls, subtitles on by default, visual representation of important audio, and adjustable text size as P0 cert items — miss any one and the submission bounces. PS5 TRC and Switch lotcheck are softer on a11y specifically but still load-bearing on items that overlap (subtitle defaults, controller-disconnect handling, sleep/resume with assist features active). The Steam side is reputational rather than cert — but Steam's recent-review band moves on accessibility complaints faster than on any other category except "doesn't launch."

This document is the gamestack reference for what the [`/critique --lens=a11y`](../skills/critique/SKILL.md) skill actually walks against. It defines the Top-4 (non-negotiable for ship), the GAG basic/intermediate/advanced tiers (the rest of the floor), engine-specific implementation notes (Unity / Godot / Unreal — where things actually break), the two report formats (internal dev-TODO vs. public Steam-page report), and the platform-cert linkage. It is deliberately not a substitute for the published Game Accessibility Guidelines at [gameaccessibilityguidelines.com](https://gameaccessibilityguidelines.com/) — that document is the source of truth for the underlying checklist. When in doubt, cite GAG.

## The Top-4

These are non-negotiable. Top-4 ships or the game doesn't ship — full stop on Xbox, strongly so on PC, and the difference between a 78% and an 88% Steam recent-review band on launch week. Each is a P0 finding in [`/critique --lens=a11y`](../skills/critique/SKILL.md) when failing. The order below is the order the audit walks them.

### Remappable controls

The player can rebind every keyboard input and every controller input to any other input. Includes keyboard + every controller type the game supports (DualSense, Xbox, Pro Controller, generic XInput, generic DirectInput). The most-common implementation mistake is treating remapping as "preset selection" — three or four bundled layouts with no per-action override. That fails the audit. A player with one functional hand needs to bind two actions to the same modifier; a player with a foot pedal needs to bind `jump` to a key the game's preset never offered. Remapping is per-action, not per-preset.

Ships first because retrofitting an input layer after the rest of the game depends on hardcoded input strings is multi-week work, not multi-day.

### Adjustable text size

Every piece of player-facing text scales to at least 1.5× without UI breakage. Includes dialogue, menus, item names, tooltip text, button prompts, subtitles, tutorial overlays — every string on the screen the player needs to read to play. UI breakage means: clipping, overlap, off-screen content, or buttons that become un-clickable because their hit target stopped tracking the text bounds. The most-common implementation mistake is scaling the font size but not the container — text grows, the panel doesn't, and the last word of every line disappears at 1.4×.

Ships first because text-scale failures compound: every menu, every dialogue node, every tooltip needs to be tested at 1.0× and again at 1.5×. Catching this after the menu pass is locked in is a re-layout.

### Colorblind modes

Three protanopia/deuteranopia/tritanopia presets and a high-contrast mode. Color is *also* not used as the sole carrier of critical gameplay information — health, status effects, faction, hit indication, accept/decline UI all reach the player through shape, icon, position, or text in addition to color. The most-common implementation mistake is shipping a single "colorblind mode" toggle and calling it done — the three forms of colorblindness affect different parts of the spectrum, and a global desaturation filter solves none of them.

Ships first because color decisions ripple into every art-pass. A green-vs-red health system identified post-launch costs a UI rebuild; identified during the [`/plan-art-direction`](../skills/plan-art-direction/SKILL.md) pass it costs a palette tweak.

### Subtitles + closed captions

Subtitles for all spoken dialogue, with speaker labels, adjustable size, adjustable background opacity, and a default state of ON. Closed captions extend subtitles to non-dialogue audio — `[footsteps approaching]`, `[door creaks open]`, `[wind picks up]`. Both ship with the build, not as a patch. The most-common implementation mistake is shipping subtitles default-OFF — the assumption being that hearing players don't want them. Hearing players turn them off in one click; deaf players who load a game and hear nothing think the audio is broken and refund.

Ships first because the speaker-label and CC pipeline ties into the audio system itself — bolting it on later means walking every audio source and tagging it, which the [`/plan-audio-direction`](../skills/plan-audio-direction/SKILL.md) pass already had a structure for.

## GAG basic tier — everyone ships this

Source: [Game Accessibility Guidelines basic level](https://gameaccessibilityguidelines.com/basic/). One sentence per item; see GAG for full criteria.

- **No flickering > 3 Hz or > 3 high-contrast flashes per second.** Photosensitive seizure risk is a cert-affecting hazard, not a stylistic choice.
- **No essential information conveyed by color alone.** Pair every color signal with a shape, icon, label, or position cue.
- **Controls as simple as possible — no required button chords / QTEs without an alternative.** Hold-to-toggle and remap-to-single-key are the standard alternatives.
- **The game can be paused.** Not "pausable except in combat" — pausable in every state that isn't authoritative multiplayer.
- **Clear introduction to controls.** A reference screen that names every input and what it does, reachable from the pause menu.
- **Subtitle / CC toggle within 2 menu clicks.** Buried in a sub-sub-menu is a fail.
- **Independent volume sliders.** Music, SFX, Voice/Dialogue, Ambience — separate sliders, not a master volume and one "effects" slider.
- **Visual representation of all important audio.** Footstep indicators, damage-direction markers, ping pulses — anything the audio carries that the player must react to.
- **Controller and keyboard parity.** Every action available on one is available on the other; no PC-exclusive radial menu, no console-exclusive gesture.
- **Skip / fast-forward for unskippable text and cutscenes.** Replays exist; the second viewing should not be mandatory.

## GAG intermediate tier — aim for this

Source: [Game Accessibility Guidelines intermediate level](https://gameaccessibilityguidelines.com/intermediate/). One sentence per item.

- **Assist mode or difficulty options offered before the first hard moment.** Surfaced when it matters; not buried in a settings sub-page the player finds after their seventh death.
- **Save-anywhere or autosave granularity ≤ 5 minutes.** A player who loses 20 minutes of progress to a power-off refunds.
- **Mono-output audio option.** Single-ear players need both channels combined into one; a hard-panned stereo cue is otherwise inaudible.
- **Hold-to-press alternative for any rapid-tap mechanic.** Mash-the-button QTEs are a motor-accessibility fail; offer hold as the equivalent input.
- **Larger hit targets for menus and interactables.** Mobile guidance applies to console UI too — 44+ pt hit targets at base scale.
- **Skippable + re-watchable cutscenes.** Skippable for the first run, re-watchable from a journal for the player who skipped and now wants the context.
- **Visual cues for off-screen audio.** Damage direction, off-screen sound source, off-screen objective — show a directional indicator.
- **Camera and motion controls adjustable.** Sensitivity slider per axis, invert per axis, motion-blur and screen-shake toggles independent of each other.
- **Adjustable game speed for time-pressure mechanics.** Combat slowdown for action games; reading-pace adjuster for dense dialogue.

## GAG advanced tier — game-specific

Source: [Game Accessibility Guidelines advanced level](https://gameaccessibilityguidelines.com/advanced/). These depend on what the game actually does. Audit only the ones the mechanics demand.

- **Photosensitivity warning at launch and in settings** if the game contains strobe, lightning, explosions, screen-filling flash effects, or fast camera shake. Cert-relevant on all three consoles.
- **Dyslexic-friendly font option** for narrative-heavy games. OpenDyslexic is the publicly-cited standard; the criterion is whether a font option exists, not which specific font.
- **Reading-speed adjuster** for dense text. Includes pacing of auto-advancing dialogue and the rate at which subtitles clear.
- **Combat slowdown** for action games. A press-and-hold that drops time to 50% gives a motor-impaired player a fighting chance against frame-perfect inputs.
- **Aim-assist / auto-aim** for shooters and any game with a precision-aim verb. Adjustable, with off as a setting.
- **Audio-only or visual-only play** for genres that allow it. Rhythm games with visual-only mode; narrative games with audio descriptions of important visual events.
- **Stable-frame mode** for motion-sensitive players. Caps screen shake, FOV pulse, motion blur, and camera roll.
- **Cognitive load reduction** — objective markers that persist, journals that summarize what the player learned last session, opt-in "play hint" prompts on long puzzle holds.

## Engine-specific implementation notes

One concrete note per engine per major Top-4 feature. These are the spots where the published GAG checklist meets the actual codebase and indie projects most often slip.

### Unity

- **Remapping — Input System, not the legacy Input Manager.** The new Input System ships first-class action-rebinding APIs (`InputActionRebindingExtensions.PerformInteractiveRebinding`) and per-control-scheme overrides; the legacy Input Manager has no rebinding at runtime. Mixing both is the most-common indie pitfall — pick one and convert everything.
- **Text scale — TextMeshPro auto-size has a ceiling.** Auto-size respects the bounds of the parent RectTransform; if the parent doesn't scale, the text caps before 1.5×. Use `Vertical Layout Group` + `Content Size Fitter` on every text-containing panel and verify at 1.5× and 2.0× in the editor.
- **Colorblind modes — URP/HDRP post-processing volume per profile.** Ship three Volume Profiles (one per CVD type) and switch via a `Volume` priority override on the camera. Don't shader-graph each one separately — the per-profile approach keeps the LUT swap clean.
- **Subtitles + CC — TextMeshPro for speaker labels, AudioMixer for the per-bus VO slider.** Wire the subtitle UI to an event channel rather than directly to dialogue components so non-dialogue captions (footsteps, doors) can post to the same UI without coupling to the dialogue system.

### Godot

- **Remapping — `InputMap` actions are the unit of rebinding.** `InputMap.action_erase_events` + `action_add_event` at runtime is the rebind path. Hardcoded `Input.is_key_pressed(KEY_SPACE)` calls bypass the InputMap entirely and break rebinding — audit for them.
- **Text scale — theme `default_font_size` plus per-Control `theme_override_font_sizes`.** Theme overrides cascade; setting `default_font_size` on the root theme and resetting it on text-containing nodes is the failure mode. Use `Control.set("theme_override_font_sizes/font_size", base * scale)` from a single accessibility singleton.
- **Colorblind modes — theme variants for high-contrast, `WorldEnvironment` color correction for CVD.** Ship a high-contrast theme as a separate `.tres` and swap via `Theme` resource. CVD remap goes through `Environment.adjustment_color_correction` with three LUTs.
- **Subtitles + CC — `AudioServer.set_bus_layout` for a Voice bus and a Subtitles signal channel.** Mono-output is `AudioServer.set_bus_send` routing all SFX/Music/VO buses to a single output bus — one toggle, not a per-bus mixdown.

### Unreal

- **Remapping — Enhanced Input + `CommonUI`'s remap-action widget.** Enhanced Input's `IMC_*` Input Mapping Contexts are the rebindable unit. `CommonUI`'s `UCommonActionWidget` integrates the rebind UI with controller glyphs automatically. The legacy Input system in Unreal does not support runtime rebinding cleanly — convert.
- **Text scale — `CommonTextBlock` with an accessibility scaling subsystem.** Wire every player-facing text widget to a `UAccessibilitySubsystem` singleton that broadcasts scale changes. UMG's `Auto Wrap Text` and `Size to Content` need to be set per widget; the global DPI scale curve is not a substitute.
- **Colorblind modes — Post Process Volume with three LUT textures.** Ship three `T_LUT_CVD_*` 1024×32 lookup textures (one per CVD type) and switch the active LUT via the global Post Process Volume's `ColorGrading_Misc_BlueCorrection` slot. The shader-side branch is cheaper than dedicated materials.
- **Subtitles + CC — `USoundBase::SubtitleText` for dialogue, a separate `USubtitleManager` for non-dialogue cues.** Unreal's built-in subtitle system handles dialogue but not closed captions for ambient/event audio — write a thin `USubtitleManager` that posts captions to the same widget on a separate event bus.

### iOS native (Swift / SpriteKit / SceneKit / SwiftUI / UIKit)

iOS has the strongest accessibility-platform alignment of the engines listed here — the OS owns the assistive technologies and the game has to opt in. The mapping from GAG to iOS API is direct:

- **Remapping — `GCController` extended gamepad + custom input layer.** The system handles controller hot-swap (DualSense, Xbox, MFi); the game owns the action-to-input map. There is no shared "remap UI widget" in UIKit/SwiftUI — write one. Keyboard support is implicit via `GCKeyboard` on iOS 14+; respect `UIKeyCommand` for menu / accelerator bindings.
- **Text scale — Dynamic Type via `UIFont.preferredFont(forTextStyle:)` (UIKit) or `.font(.body)` / `.scaledFont(_:)` (SwiftUI).** The system text-size setting (including Accessibility Sizes) is exposed via `UIApplication.shared.preferredContentSizeCategory`. Test the build at `accessibility5XL` — that's the largest size a player can set. Hard-coded `.font(.system(size: 12))` breaks Dynamic Type; flag every occurrence.
- **VoiceOver labels — `accessibilityLabel`, `accessibilityHint`, `accessibilityTraits` on every interactive element.** SwiftUI: `.accessibilityLabel(_:)`, `.accessibilityHint(_:)`, `.accessibilityAddTraits(_:)`. Decorative views: `.accessibilityHidden(true)`. Walk the build with VoiceOver enabled (Settings → Accessibility → VoiceOver) — anything that reads as a generic "button" or "image" is a P0 finding. Required for App Store featuring and for Apple's Accessibility Spotlight inclusion.
- **Colorblind modes — game-side palette swap or post-processing LUT.** iOS exposes `UIAccessibility.isInvertColorsEnabled` (Smart Invert) but not direct CVD modes — the game implements them. Common pattern: ship three palette variants and a high-contrast mode, switchable from the settings menu. `accessibilityIgnoresInvertColors = true` on decorative images that should NOT be inverted under Smart Invert.
- **Reduce Motion — `UIAccessibility.isReduceMotionEnabled`.** If true: skip parallax, screen-shake, FOV pulses, decorative camera moves, particle storms. Listen to `UIAccessibility.reduceMotionStatusDidChangeNotification` to react mid-session. Critical animations that carry meaning (a transition that signals "you moved to the next room") stay; cosmetic motion goes.
- **Reduce Transparency — `UIAccessibility.isReduceTransparencyEnabled`.** Blurs and translucent overlays (`UIBlurEffect`, SwiftUI `.background(.ultraThinMaterial)`) should fall back to opaque fills.
- **Switch Control / AssistiveTouch — single-switch playability.** The game should be playable end-to-end via Switch Control's scanning mode (one switch, sequential focus traversal). Practically: no required swipe gestures, no required multi-touch, no time-pressure inputs without a setting to disable. Test with Settings → Accessibility → Switch Control enabled.
- **Closed Captions — system CC preferences via `MediaAccessibility` framework.** `MACaptionAppearanceGetDisplayType(.user)` returns whether the user has CC enabled; `MACaptionAppearanceCopyForegroundColor` / `Background` return their styling preferences. If you ship video cutscenes via `AVPlayer`, respect these. For in-game dialogue, ship CC as part of the subtitle system regardless of the OS preference.
- **Audio Descriptions — `UIAccessibility.isAudioDescriptionEnabled`.** For narrative-heavy iOS games, consider an audio-description track or audio cues that describe key visual moments. Required for VoiceOver-only play of narrative games.
- **Mono audio output.** iOS exposes `UIAccessibility.isMonoAudioEnabled`. If true, hard-panned stereo cues become inaudible — collapse to center. This is a system-wide setting; respect it instead of building a separate game-side mono toggle (or do both).

## The two report formats

[`/critique --lens=a11y`](../skills/critique/SKILL.md) emits two files. They serve different audiences and never get merged.

### Internal dev-TODO

Lives at `playtest/critique-a11y/dev-todo-YYYY-MM-DD.md`. Engineer-facing. Engine + estimated effort + priority per item. Fragment:

```
P0 — block launch
  - Text scale clips at 1.3× on the inventory grid.
    Engine: Unity 2022 LTS / TMP / Inventory.uxml
    Fix:    Wrap grid cells in a VerticalLayoutGroup + ContentSizeFitter.
    Effort: ~4 hours including 1.5× and 2.0× regression sweep.
    Cert:   Xbox P0 (adjustable text size required).

P1 — strongly recommended
  - Mono-output toggle absent.
    Engine: Unity AudioMixer / SettingsController.cs
    Fix:    Add a Mono ducking bus; route master output through it when toggle on.
    Effort: ~3 hours.

P2 — nice-to-have
  - Dyslexic font option for journal screens.
    Effort: ~1 day including OpenDyslexic license check.
```

### Public Steam-page report

Lives at `playtest/critique-a11y/public-report-v<version>.md` and at the equivalent path under the game's published `docs/accessibility.md`. Player-facing. Honest about what's in, what's coming, what doesn't apply. Drops on the Steam page per [`/steam-page-review`](../skills/steam-page-review/SKILL.md). Fragment:

```
# Lighthouse Keeper — Accessibility (v1.0.0)

## What's in v1.0
- Full keyboard and controller remapping (per-action)
- Subtitles ON by default, with speaker labels and non-dialogue captions
- Colorblind presets: Deuteranopia, Protanopia, Tritanopia, plus High-Contrast
- Text scale 1.0× to 2.0× without UI breakage
- Independent Music / SFX / Voice / Ambience volume sliders
- Mono audio output toggle
- Skippable + re-watchable cutscenes

## Coming in v1.1 (target: August 2026)
- Dyslexic font option for journal screens
- Reading-speed adjuster for dense dialogue
- Visual indicator for off-screen sound sources

## Doesn't apply to this game
- Combat slowdown (no time-pressure combat)
- Aim-assist (no precision-aim verb)

## Feedback
- Player support: accessibility@studio.example
- Researcher contact: research@studio.example
```

Model after Celeste and The Last of Us Part II — both publish accessibility reports written in this voice. Marketing-speak ("epic accessibility journey") fails. Honesty about what isn't in earns trust; vague promises about post-launch features the developer hasn't scheduled cost trust.

## Cert linkage

| Top-4 item | Xbox (TCR/XR) | PS5 (TRC) | Switch (lotcheck) | iOS (App Store Review) |
|---|---|---|---|---|
| Remappable controls | P0 — required | Strongly recommended | Strongly recommended | Recommended; required for Apple's Accessibility featuring |
| Adjustable text size | P0 — required | Not enforced | Recommended | **Dynamic Type support expected** — apps that don't scale with system text size are flagged in Guideline 4 design reviews and excluded from Accessibility featuring |
| Colorblind modes | Recommended | Not enforced | Not enforced | Not enforced by App Review but expected for featured / curated placement |
| Subtitles + CC (default ON) | P0 — required | Subtitles default ON enforced | Recommended | Respect system CC preferences (`MediaAccessibility`); subtitles default ON expected |
| VoiceOver labels | N/A | N/A | N/A | **Required for App Store featuring** and for any "Accessibility" tag in App Store Connect |

Xbox enforces the most. ID@Xbox publishes a recommended a11y list — match it or expect rework. Quick Resume failures are usually save-system bugs surfacing as accessibility regressions (the assist-mode toggle didn't survive resume) — see [`/cert-readiness`](../skills/cert-readiness/SKILL.md) for the platform-specific walk.

Switch lotcheck doesn't enforce most a11y items at P0 — but localization width clipping interacts with text-scale, and clipped strings at 1.5× on long-language locales (German, French) fail lotcheck even when 1.0× passes.

## When to audit

Run [`/critique --lens=a11y`](../skills/critique/SKILL.md):

- **Before launch.** Top-4 failures are P0 blockers; nothing ships with them unresolved.
- **Before every patch.** Patches that touch UI, controls, audio, or rendering can regress a11y silently. The audit takes under an hour; a regressed colorblind palette discovered post-patch costs days.
- **During cert prep.** Xbox in particular — feed the findings into [`/cert-readiness`](../skills/cert-readiness/SKILL.md) and reconcile.
- **After any UI or controls change.** The most-common regression vector. New screen, new control scheme, new menu — re-audit.
- **Auto-fires near the end of [`/autoplan`](../skills/autoplan/SKILL.md)** if no audit has run in 60 days.

A11y also intersects [`/critique --lens=onboarding`](../skills/critique/SKILL.md) — controller detection, subtitle defaults, skippable tutorials, and difficulty-surfaced-before-first-failure are all first-15-minute concerns even though they're framed as accessibility. Players hit them before they hit anything else; an onboarding audit that ignores them misses half the friction.

## Where to learn more

- **[Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/)** — the published checklist this document references. Source of truth for basic / intermediate / advanced criteria. When this document and GAG conflict, cite GAG.
- **[AbleGamers](https://ablegamers.org/)** — accessibility-focused nonprofit; player feedback and the APX (Accessible Player Experiences) framework.
- **[SpecialEffect](https://www.specialeffect.org.uk/)** — UK charity that works directly with disabled players on game-specific adaptation; well-cited reference for assistive-tech compatibility.
- **[CVAA / Section 508](https://www.fcc.gov/consumers/guides/21st-century-communications-and-video-accessibility-act-cvaa)** — US regulatory baseline for communication-and-video accessibility; relevant for any multiplayer / chat surface in the game.
- **[Microsoft Xbox Accessibility Guidelines (XAG)](https://learn.microsoft.com/en-us/gaming/accessibility/)** — the public-facing portion of Xbox's a11y cert requirements; matches the strictest of the three consoles.

For the gamestack-side flow:

- [`/critique --lens=a11y`](../skills/critique/SKILL.md) — the audit skill.
- [`/cert-readiness`](../skills/cert-readiness/SKILL.md) — platform cert walk; consumes Top-4 results.
- [`/critique --lens=onboarding`](../skills/critique/SKILL.md) — first-15-minute friction; overlaps with a11y on-ramp items.
- [`/steam-page-review`](../skills/steam-page-review/SKILL.md) — where the public report lands on the storefront.
