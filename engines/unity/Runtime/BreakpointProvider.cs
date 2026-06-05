using System;
using System.Collections.Generic;
using UnityEngine;

namespace Alliance.Gamestack
{
    /// <summary>
    /// Tag-based breakpoint API. The developer's game calls
    /// <see cref="Hit(string)"/> at semantic checkpoints (e.g. "after-boss-spawn",
    /// "before-save", "on-death") and gamestack decides whether to pause the game
    /// based on the active tag filter.
    ///
    /// POST /breakpoint controls the filter and the pause/resume state.
    /// </summary>
    public static class BreakpointProvider
    {
        private static readonly HashSet<string> _pauseOnTags = new HashSet<string>();
        private static readonly Queue<string> _recentHits = new Queue<string>(capacity: 64);
        private const int RecentHitsCapacity = 64;

        private static bool _isPaused = false;
        private static float _timeScaleBeforePause = 1f;
        private static bool _stepRequested = false;
        private static string _lastPausedAt = string.Empty;

        /// <summary>
        /// Raised once per hit, on the main thread. Subscribers can use this for logging
        /// or telemetry without affecting pause behavior.
        /// </summary>
        public static event Action<string> OnHit;

        /// <summary>Raised when the game enters the paused state via a breakpoint.</summary>
        public static event Action<string> OnPause;

        /// <summary>Raised when the game leaves the paused state.</summary>
        public static event Action OnResume;

        public static bool IsPaused => _isPaused;
        public static string LastPausedAt => _lastPausedAt;
        public static IReadOnlyCollection<string> PauseOnTags => _pauseOnTags;
        public static IReadOnlyCollection<string> RecentHits => _recentHits;

        /// <summary>
        /// Called by the developer's game code at semantic checkpoints. If the tag
        /// matches an active pause filter, the game pauses (timeScale = 0) until
        /// <see cref="Resume"/> is called.
        /// </summary>
        public static void Hit(string tag)
        {
            if (string.IsNullOrEmpty(tag)) return;

            EnqueueRecent(tag);
            OnHit?.Invoke(tag);

            if (_pauseOnTags.Contains(tag) || _pauseOnTags.Contains("*"))
            {
                PauseInternal(tag);
            }
        }

        /// <summary>Add a tag to the pause filter. Wildcard "*" pauses on every hit.</summary>
        public static void AddPauseTag(string tag)
        {
            if (string.IsNullOrEmpty(tag)) return;
            _pauseOnTags.Add(tag);
        }

        /// <summary>Remove a tag from the pause filter.</summary>
        public static void RemovePauseTag(string tag)
        {
            if (string.IsNullOrEmpty(tag)) return;
            _pauseOnTags.Remove(tag);
        }

        /// <summary>Clear all pause tags.</summary>
        public static void ClearPauseTags() => _pauseOnTags.Clear();

        /// <summary>
        /// Resume from a paused state. Restores the timeScale that was active at the
        /// time of the pause. No-op if not paused.
        /// </summary>
        public static void Resume()
        {
            if (!_isPaused) return;
            Time.timeScale = _timeScaleBeforePause;
            _isPaused = false;
            OnResume?.Invoke();
        }

        /// <summary>
        /// Request a "step" — resume for one frame, then pause again on the next
        /// breakpoint hit (any tag). Useful for slow-stepping through gameplay.
        /// </summary>
        public static void Step()
        {
            _stepRequested = true;
            if (_isPaused) Resume();
        }

        /// <summary>Force a pause now, without waiting for a tag hit. Reason for telemetry.</summary>
        public static void PauseNow(string reason = "manual")
        {
            PauseInternal(reason);
        }

        /// <summary>Clear all state — pause filter, recent hits, paused flag. Intended for tests.</summary>
        public static void Reset()
        {
            if (_isPaused) Resume();
            _pauseOnTags.Clear();
            _recentHits.Clear();
            _lastPausedAt = string.Empty;
            _stepRequested = false;
        }

        // --- internals ---

        private static void PauseInternal(string tag)
        {
            if (_isPaused && !_stepRequested)
            {
                // Already paused; just update the hit record.
                _lastPausedAt = tag;
                return;
            }

            if (_stepRequested)
            {
                _stepRequested = false;
            }

            _timeScaleBeforePause = Time.timeScale;
            Time.timeScale = 0f;
            _isPaused = true;
            _lastPausedAt = tag;
            OnPause?.Invoke(tag);
        }

        private static void EnqueueRecent(string tag)
        {
            _recentHits.Enqueue(tag);
            while (_recentHits.Count > RecentHitsCapacity)
                _recentHits.Dequeue();
        }
    }

    /// <summary>
    /// Request payload for POST /breakpoint.
    /// </summary>
    [Serializable]
    public class BreakpointRequest
    {
        /// <summary>One of: add-pause, remove-pause, clear-pause, resume, step, pause-now, status.</summary>
        public string action = "status";

        /// <summary>Tag (required for add-pause / remove-pause; ignored otherwise).</summary>
        public string tag = string.Empty;
    }
}
