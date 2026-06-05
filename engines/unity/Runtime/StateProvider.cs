using System;
using System.Collections.Generic;
using System.Reflection;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace Alliance.Gamestack
{
    /// <summary>
    /// Builds the JSON-serializable game-state snapshot returned by GET /state.
    /// MUST be called on the main thread (uses Unity APIs throughout).
    /// </summary>
    internal static class StateProvider
    {
        public static Dictionary<string, object> Collect(int maxDepth)
        {
            var scene = SceneManager.GetActiveScene();
            var state = new Dictionary<string, object>
            {
                ["scene"] = scene.name,
                ["sceneBuildIndex"] = scene.buildIndex,
                ["fps"] = Time.smoothDeltaTime > 0f
                    ? Mathf.RoundToInt(1f / Time.smoothDeltaTime)
                    : 0,
                ["frameTimeMs"] = Time.smoothDeltaTime * 1000f,
                ["realtimeSinceStartup"] = Time.realtimeSinceStartup,
                ["timeScale"] = Time.timeScale,
                ["unityVersion"] = Application.unityVersion,
                ["platform"] = Application.platform.ToString(),
                ["isEditor"] = Application.isEditor,
                ["isPlaying"] = Application.isPlaying,
            };

            var monos = UnityEngine.Object.FindObjectsByType<MonoBehaviour>(
                FindObjectsInactive.Exclude, FindObjectsSortMode.None);

            var tagged = new Dictionary<string, Dictionary<string, object>>();
            foreach (var mb in monos)
            {
                if (mb == null) continue;
                CollectMembers(mb, mb.GetType(), tagged, 0, maxDepth);
            }
            if (tagged.Count > 0) state["tagged"] = tagged;

            return state;
        }

        private static void CollectMembers(
            object obj,
            Type type,
            Dictionary<string, Dictionary<string, object>> output,
            int depth,
            int maxDepth)
        {
            if (obj == null || depth > maxDepth) return;

            const BindingFlags flags =
                BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance;

            foreach (var field in type.GetFields(flags))
            {
                var attr = field.GetCustomAttribute<GameStackStateAttribute>();
                if (attr == null) continue;
                try { AddTagged(output, attr, field.GetValue(obj)); }
                catch (Exception e)
                {
                    Debug.LogWarning($"[gamestack] reading {type.Name}.{field.Name}: {e.Message}");
                }
            }

            foreach (var prop in type.GetProperties(flags))
            {
                var attr = prop.GetCustomAttribute<GameStackStateAttribute>();
                if (attr == null || !prop.CanRead) continue;
                try { AddTagged(output, attr, prop.GetValue(obj)); }
                catch (Exception e)
                {
                    Debug.LogWarning($"[gamestack] reading {type.Name}.{prop.Name}: {e.Message}");
                }
            }
        }

        private static void AddTagged(
            Dictionary<string, Dictionary<string, object>> output,
            GameStackStateAttribute attr,
            object value)
        {
            var ns = string.IsNullOrEmpty(attr.Namespace) ? "default" : attr.Namespace;
            if (!output.TryGetValue(ns, out var bucket))
            {
                bucket = new Dictionary<string, object>();
                output[ns] = bucket;
            }
            bucket[attr.Key] = Serializable(value);
        }

        private static object Serializable(object value)
        {
            switch (value)
            {
                case null: return null;
                case bool _:
                case int _:
                case long _:
                case float _:
                case double _:
                case string _:
                    return value;
                case Vector2 v: return new { x = v.x, y = v.y };
                case Vector3 v: return new { x = v.x, y = v.y, z = v.z };
                case Vector4 v: return new { x = v.x, y = v.y, z = v.z, w = v.w };
                case Quaternion q: return new { x = q.x, y = q.y, z = q.z, w = q.w };
                case Color c: return new { r = c.r, g = c.g, b = c.b, a = c.a };
                case Color32 c: return new { r = (int)c.r, g = (int)c.g, b = (int)c.b, a = (int)c.a };
                case Rect r: return new { x = r.x, y = r.y, w = r.width, h = r.height };
                case Bounds b: return new { c = new { x = b.center.x, y = b.center.y, z = b.center.z }, s = new { x = b.size.x, y = b.size.y, z = b.size.z } };
                case Enum e: return e.ToString();
                default: return value.ToString();
            }
        }
    }
}
