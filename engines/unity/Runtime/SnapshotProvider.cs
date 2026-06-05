using System;
using System.Collections.Generic;
using System.Reflection;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace Alliance.Gamestack
{
    /// <summary>
    /// Implement on any MonoBehaviour that owns state needing custom snapshot/restore beyond
    /// what reflection over [GameStackState]-tagged fields can capture (large lists, nested
    /// objects, transient runtime state, etc.).
    ///
    /// SnapshotProvider invokes <see cref="CaptureSnapshot"/> when building a snapshot and
    /// <see cref="RestoreSnapshot"/> when restoring one. Both are called on the main thread.
    /// </summary>
    public interface IGameStackSnapshotable
    {
        /// <summary>Stable identifier for this snapshotable. Used to route restore data back.</summary>
        string SnapshotKey { get; }

        /// <summary>
        /// Produce a serializable representation of this object's state. Returned value
        /// will be JSON-serialized by gamestack. Keep it free of Unity-specific reference
        /// types (Transform, GameObject) — use values, IDs, or serialized identifiers.
        /// </summary>
        object CaptureSnapshot();

        /// <summary>
        /// Restore from a previously-captured snapshot. The payload type matches what
        /// <see cref="CaptureSnapshot"/> returned for this key, deserialized.
        /// </summary>
        void RestoreSnapshot(object payload);
    }

    /// <summary>
    /// In-process snapshot store. Snapshots are kept in memory only; the host process
    /// loses them on shutdown (intentional — snapshots are for live test sessions, not
    /// for the player's save system).
    /// </summary>
    public static class SnapshotProvider
    {
        private static readonly Dictionary<string, Dictionary<string, object>> _store
            = new Dictionary<string, Dictionary<string, object>>();

        private static int _autoIdCounter = 0;

        /// <summary>
        /// Capture a snapshot of the current world. Returns the snapshot ID.
        /// MUST be called on the main thread.
        /// </summary>
        public static string Capture(int maxDepth, string explicitId = null)
        {
            string id = string.IsNullOrEmpty(explicitId)
                ? $"snap-{++_autoIdCounter:D4}"
                : explicitId;

            var snap = new Dictionary<string, object>
            {
                ["__meta__"] = new Dictionary<string, object>
                {
                    ["id"] = id,
                    ["timestamp"] = DateTime.UtcNow.ToString("O"),
                    ["scene"] = SceneManager.GetActiveScene().name,
                    ["sceneBuildIndex"] = SceneManager.GetActiveScene().buildIndex,
                    ["timeScale"] = Time.timeScale,
                    ["realtimeSinceStartup"] = Time.realtimeSinceStartup,
                },
            };

            // Capture all [GameStackState]-tagged fields/properties by namespace.key.
            var tagged = new Dictionary<string, object>();
            foreach (var mb in UnityEngine.Object.FindObjectsByType<MonoBehaviour>(
                FindObjectsInactive.Include, FindObjectsSortMode.None))
            {
                if (mb == null) continue;
                CollectStateForSnapshot(mb, mb.GetType(), tagged, maxDepth);
            }
            snap["tagged"] = tagged;

            // Capture all IGameStackSnapshotable implementations.
            var customs = new Dictionary<string, object>();
            foreach (var mb in UnityEngine.Object.FindObjectsByType<MonoBehaviour>(
                FindObjectsInactive.Include, FindObjectsSortMode.None))
            {
                if (mb is IGameStackSnapshotable s)
                {
                    try { customs[s.SnapshotKey] = s.CaptureSnapshot(); }
                    catch (Exception e)
                    {
                        Debug.LogWarning(
                            $"[gamestack] snapshot capture failed for {mb.GetType().Name}: {e.Message}");
                    }
                }
            }
            snap["custom"] = customs;

            _store[id] = snap;
            return id;
        }

        /// <summary>
        /// Restore a previously-captured snapshot by ID. Returns true on success.
        /// MUST be called on the main thread.
        /// </summary>
        public static bool Restore(string id)
        {
            if (string.IsNullOrEmpty(id) || !_store.TryGetValue(id, out var snap))
                return false;

            // Restore time state from meta.
            if (snap.TryGetValue("__meta__", out var metaObj)
                && metaObj is Dictionary<string, object> meta)
            {
                if (meta.TryGetValue("timeScale", out var tsObj))
                {
                    Time.timeScale = Convert.ToSingle(tsObj);
                }
            }

            // Restore [GameStackState] tagged values (best-effort).
            if (snap.TryGetValue("tagged", out var taggedObj)
                && taggedObj is Dictionary<string, object> tagged)
            {
                foreach (var mb in UnityEngine.Object.FindObjectsByType<MonoBehaviour>(
                    FindObjectsInactive.Include, FindObjectsSortMode.None))
                {
                    if (mb == null) continue;
                    RestoreStateFromSnapshot(mb, mb.GetType(), tagged);
                }
            }

            // Restore IGameStackSnapshotable payloads.
            if (snap.TryGetValue("custom", out var customsObj)
                && customsObj is Dictionary<string, object> customs)
            {
                foreach (var mb in UnityEngine.Object.FindObjectsByType<MonoBehaviour>(
                    FindObjectsInactive.Include, FindObjectsSortMode.None))
                {
                    if (mb is IGameStackSnapshotable s
                        && customs.TryGetValue(s.SnapshotKey, out var payload))
                    {
                        try { s.RestoreSnapshot(payload); }
                        catch (Exception e)
                        {
                            Debug.LogWarning(
                                $"[gamestack] snapshot restore failed for {mb.GetType().Name}: {e.Message}");
                        }
                    }
                }
            }

            return true;
        }

        /// <summary>Returns the IDs of currently-stored snapshots.</summary>
        public static IReadOnlyCollection<string> ListSnapshotIds() => _store.Keys;

        /// <summary>Delete a snapshot by ID. Returns true if removed.</summary>
        public static bool Delete(string id) => _store.Remove(id);

        /// <summary>Clear all stored snapshots.</summary>
        public static void Clear() => _store.Clear();

        /// <summary>Retrieve a snapshot's full data dictionary (for debugging / GET endpoints).</summary>
        public static Dictionary<string, object> Get(string id)
            => _store.TryGetValue(id, out var snap) ? snap : null;

        // --- internals ---

        private static void CollectStateForSnapshot(
            object obj, Type type, Dictionary<string, object> output, int maxDepth)
        {
            if (obj == null || maxDepth < 0) return;
            const BindingFlags flags =
                BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance;

            foreach (var field in type.GetFields(flags))
            {
                var attr = field.GetCustomAttribute<GameStackStateAttribute>();
                if (attr == null) continue;
                try
                {
                    output[FullKey(attr)] = field.GetValue(obj);
                }
                catch (Exception e)
                {
                    Debug.LogWarning(
                        $"[gamestack] snapshot capture read {type.Name}.{field.Name}: {e.Message}");
                }
            }

            foreach (var prop in type.GetProperties(flags))
            {
                var attr = prop.GetCustomAttribute<GameStackStateAttribute>();
                if (attr == null || !prop.CanRead || !prop.CanWrite) continue;
                try
                {
                    output[FullKey(attr)] = prop.GetValue(obj);
                }
                catch (Exception e)
                {
                    Debug.LogWarning(
                        $"[gamestack] snapshot capture read {type.Name}.{prop.Name}: {e.Message}");
                }
            }
        }

        private static void RestoreStateFromSnapshot(
            object obj, Type type, Dictionary<string, object> tagged)
        {
            if (obj == null) return;
            const BindingFlags flags =
                BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance;

            foreach (var field in type.GetFields(flags))
            {
                var attr = field.GetCustomAttribute<GameStackStateAttribute>();
                if (attr == null) continue;
                if (!tagged.TryGetValue(FullKey(attr), out var v)) continue;
                try
                {
                    field.SetValue(obj, Convert.ChangeType(v, field.FieldType));
                }
                catch (Exception e)
                {
                    Debug.LogWarning(
                        $"[gamestack] snapshot restore set {type.Name}.{field.Name}: {e.Message}");
                }
            }

            foreach (var prop in type.GetProperties(flags))
            {
                var attr = prop.GetCustomAttribute<GameStackStateAttribute>();
                if (attr == null || !prop.CanWrite) continue;
                if (!tagged.TryGetValue(FullKey(attr), out var v)) continue;
                try
                {
                    prop.SetValue(obj, Convert.ChangeType(v, prop.PropertyType));
                }
                catch (Exception e)
                {
                    Debug.LogWarning(
                        $"[gamestack] snapshot restore set {type.Name}.{prop.Name}: {e.Message}");
                }
            }
        }

        private static string FullKey(GameStackStateAttribute attr)
        {
            var ns = string.IsNullOrEmpty(attr.Namespace) ? "default" : attr.Namespace;
            return $"{ns}.{attr.Key}";
        }
    }
}
