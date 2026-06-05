using UnityEngine;

namespace Alliance.Gamestack
{
    /// <summary>
    /// Captures the current frame as a PNG or JPEG byte stream.
    /// MUST be called on the main thread.
    /// </summary>
    internal static class ScreenshotProvider
    {
        public static byte[] Capture(GameStackConfig config)
        {
            float scale = Mathf.Clamp(config != null ? config.ScreenshotScale : 1f, 0.25f, 1f);
            ScreenshotFormat format = config != null ? config.ScreenshotFormat : ScreenshotFormat.PNG;

            int targetW = Mathf.Max(1, Mathf.RoundToInt(Screen.width * scale));
            int targetH = Mathf.Max(1, Mathf.RoundToInt(Screen.height * scale));

            var raw = ScreenCapture.CaptureScreenshotAsTexture();
            Texture2D output = raw;

            if (Mathf.Abs(scale - 1f) > 0.001f)
            {
                output = ResampleTo(raw, targetW, targetH);
                Object.Destroy(raw);
            }

            byte[] bytes = format == ScreenshotFormat.PNG
                ? output.EncodeToPNG()
                : output.EncodeToJPG(85);

            Object.Destroy(output);
            return bytes;
        }

        private static Texture2D ResampleTo(Texture2D source, int width, int height)
        {
            var rt = RenderTexture.GetTemporary(width, height, 0, RenderTextureFormat.ARGB32);
            try
            {
                Graphics.Blit(source, rt);
                var prev = RenderTexture.active;
                RenderTexture.active = rt;
                var result = new Texture2D(width, height, TextureFormat.RGBA32, mipChain: false);
                result.ReadPixels(new Rect(0, 0, width, height), 0, 0);
                result.Apply();
                RenderTexture.active = prev;
                return result;
            }
            finally
            {
                RenderTexture.ReleaseTemporary(rt);
            }
        }
    }
}
