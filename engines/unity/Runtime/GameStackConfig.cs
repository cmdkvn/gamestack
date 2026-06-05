using UnityEngine;

namespace Alliance.Gamestack
{
    public enum ScreenshotFormat
    {
        PNG,
        JPG,
    }

    /// <summary>
    /// Configuration ScriptableObject for the gamestack server.
    /// Create via Assets > Create > gamestack > Config or
    /// Tools > gamestack > Create Config Asset.
    /// </summary>
    [CreateAssetMenu(fileName = "GameStackConfig", menuName = "gamestack/Config", order = 100)]
    public class GameStackConfig : ScriptableObject
    {
        [Header("Server")]
        [Tooltip("TCP port the gamestack server listens on. Default 7331.")]
        public int Port = 7331;

        [Tooltip("Enable the server. Turn off in shipping builds (or guard with a build define).")]
        public bool Enabled = true;

        [Tooltip("Only accept connections from 127.0.0.1. Strongly recommended to keep ON.")]
        public bool LoopbackOnly = true;

        [Header("State")]
        [Tooltip("Maximum recursion depth when collecting [GameStackState]-tagged fields. Higher = more overhead per /state call.")]
        [Range(1, 5)]
        public int StateMaxDepth = 2;

        [Header("Screenshot")]
        [Tooltip("Resolution scale for /screenshot output. 1.0 = native; lower = smaller files, lower fidelity.")]
        [Range(0.25f, 1f)]
        public float ScreenshotScale = 1f;

        [Tooltip("Output format for /screenshot.")]
        public ScreenshotFormat ScreenshotFormat = ScreenshotFormat.PNG;
    }
}
