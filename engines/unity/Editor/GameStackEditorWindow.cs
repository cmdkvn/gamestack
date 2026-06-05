using UnityEditor;
using UnityEngine;

namespace Gamestack.Editor
{
    public class GameStackEditorWindow : EditorWindow
    {
        public static void ShowWindow()
        {
            var w = GetWindow<GameStackEditorWindow>("gamestack");
            w.minSize = new Vector2(380, 240);
            w.Show();
        }

        private void OnEnable() => EditorApplication.update += Repaint;
        private void OnDisable() => EditorApplication.update -= Repaint;

        private void OnGUI()
        {
            EditorGUILayout.LabelField("gamestack server", EditorStyles.boldLabel);
            EditorGUILayout.Space();

            var server = Object.FindFirstObjectByType<GameStackServer>();
            if (server == null)
            {
                EditorGUILayout.HelpBox(
                    "No GameStackServer in the active scene. Add one via Tools > gamestack > Add Server to Scene.",
                    MessageType.Info);
                if (GUILayout.Button("Add Server to Scene"))
                {
                    GameStackMenuItems.AddServerToScene();
                }
                return;
            }

            using (new EditorGUI.DisabledScope(true))
            {
                EditorGUILayout.ObjectField("Server GameObject", server.gameObject, typeof(GameObject), true);
            }
            EditorGUILayout.LabelField("Running", server.IsRunning ? "Yes" : "No");
            EditorGUILayout.LabelField("Status", server.Status);
            if (!string.IsNullOrEmpty(server.Endpoint))
            {
                EditorGUILayout.LabelField("Endpoint", server.Endpoint);
            }

            EditorGUILayout.Space();

            if (server.Config == null)
            {
                EditorGUILayout.HelpBox(
                    "No config asset assigned. Server will use runtime defaults.",
                    MessageType.Warning);
                if (GUILayout.Button("Create + Assign Config"))
                {
                    var cfg = GameStackMenuItems.CreateConfigAsset();
                    server.Config = cfg;
                    EditorUtility.SetDirty(server);
                }
            }
            else
            {
                using (new EditorGUI.DisabledScope(true))
                {
                    EditorGUILayout.ObjectField("Config", server.Config, typeof(GameStackConfig), false);
                }
                EditorGUILayout.LabelField("Port", server.Config.Port.ToString());
                EditorGUILayout.LabelField("Loopback only", server.Config.LoopbackOnly ? "Yes" : "No");
                EditorGUILayout.LabelField("State max depth", server.Config.StateMaxDepth.ToString());
            }

            EditorGUILayout.Space();
            EditorGUILayout.LabelField("Endpoints", EditorStyles.boldLabel);
            EditorGUILayout.LabelField("  GET  /health      — liveness check");
            EditorGUILayout.LabelField("  GET  /state       — game state snapshot");
            EditorGUILayout.LabelField("  POST /screenshot  — frame capture");
        }
    }
}
