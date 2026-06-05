using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;

namespace Alliance.Gamestack.Editor
{
    public static class GameStackMenuItems
    {
        private const string MenuRoot = "Tools/gamestack/";

        [MenuItem(MenuRoot + "Open Status Window", priority = 100)]
        public static void OpenStatusWindow() => GameStackEditorWindow.ShowWindow();

        [MenuItem(MenuRoot + "Create Config Asset", priority = 110)]
        public static GameStackConfig CreateConfigAsset()
        {
            var asset = ScriptableObject.CreateInstance<GameStackConfig>();
            string path = AssetDatabase.GenerateUniqueAssetPath("Assets/GameStackConfig.asset");
            AssetDatabase.CreateAsset(asset, path);
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            Selection.activeObject = asset;
            EditorGUIUtility.PingObject(asset);
            return asset;
        }

        [MenuItem(MenuRoot + "Add Server to Scene", priority = 120)]
        public static GameStackServer AddServerToScene()
        {
            var existing = Object.FindFirstObjectByType<GameStackServer>();
            if (existing != null)
            {
                Selection.activeGameObject = existing.gameObject;
                EditorGUIUtility.PingObject(existing.gameObject);
                Debug.Log("[gamestack] A GameStackServer already exists in the scene.");
                return existing;
            }

            var go = new GameObject("[gamestack:Server]");
            var server = go.AddComponent<GameStackServer>();
            Selection.activeGameObject = go;
            EditorSceneManager.MarkSceneDirty(go.scene);
            Undo.RegisterCreatedObjectUndo(go, "Add gamestack server");
            return server;
        }

        [MenuItem(MenuRoot + "Open Docs", priority = 200)]
        public static void OpenDocs() => Application.OpenURL("https://github.com/alliance/gamestack");
    }
}
