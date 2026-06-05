using System;
using System.IO;
using System.Net;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Newtonsoft.Json;
using UnityEngine;

namespace Gamestack
{
    /// <summary>
    /// Hosts a loopback HTTP server exposing /state, /screenshot, and /health
    /// for the gamestack /playtest, /game-feel-audit, and /perf-benchmark skills.
    ///
    /// Drop this MonoBehaviour into a scene root and assign a <see cref="GameStackConfig"/>.
    /// The server starts on enable and stops on disable. Editor-only by default.
    /// </summary>
    [DefaultExecutionOrder(-99)]
    [AddComponentMenu("gamestack/Server")]
    [DisallowMultipleComponent]
    public sealed class GameStackServer : MonoBehaviour
    {
        [Tooltip("Configuration asset. Create via Tools > gamestack > Create Config Asset.")]
        public GameStackConfig Config;

        private HttpListener _listener;
        private CancellationTokenSource _cts;
        private Task _serverTask;

        public bool IsRunning { get; private set; }
        public string Status { get; private set; } = "Stopped";
        public string Endpoint { get; private set; } = string.Empty;

        private void OnEnable()
        {
            if (Config == null)
            {
                Debug.LogWarning(
                    "[gamestack] GameStackServer has no Config assigned; using runtime defaults. " +
                    "Create one via Tools > gamestack > Create Config Asset.");
                Config = ScriptableObject.CreateInstance<GameStackConfig>();
            }

            if (!Config.Enabled)
            {
                Status = "Disabled in config";
                return;
            }

            // Ensure dispatcher exists before any background work tries to use it.
            var _ = MainThreadDispatcher.Instance;

            StartServer();
        }

        private void OnDisable() => StopServer();

        private void StartServer()
        {
            try
            {
                _listener = new HttpListener();
                string host = Config.LoopbackOnly ? "localhost" : "+";
                Endpoint = $"http://{host}:{Config.Port}/";
                _listener.Prefixes.Add(Endpoint);
                _listener.Start();
                _cts = new CancellationTokenSource();
                _serverTask = Task.Run(() => ListenLoopAsync(_cts.Token));
                IsRunning = true;
                Status = $"Running on {Endpoint}";
                Debug.Log($"[gamestack] Server started on {Endpoint} (loopback={Config.LoopbackOnly})");
            }
            catch (Exception e)
            {
                IsRunning = false;
                Status = $"Failed: {e.Message}";
                Debug.LogError($"[gamestack] Failed to start server: {e}");
            }
        }

        private void StopServer()
        {
            if (!IsRunning && _listener == null) return;
            try
            {
                _cts?.Cancel();
                _listener?.Stop();
                _listener?.Close();
                _listener = null;
            }
            catch (Exception e)
            {
                Debug.LogWarning($"[gamestack] error during shutdown: {e.Message}");
            }
            IsRunning = false;
            Status = "Stopped";
            Endpoint = string.Empty;
        }

        private async Task ListenLoopAsync(CancellationToken ct)
        {
            while (!ct.IsCancellationRequested && _listener != null && _listener.IsListening)
            {
                HttpListenerContext ctx = null;
                try
                {
                    ctx = await _listener.GetContextAsync();
                }
                catch (HttpListenerException) { break; }
                catch (ObjectDisposedException) { break; }
                catch (Exception e)
                {
                    Debug.LogError($"[gamestack] listener error: {e}");
                    break;
                }

                if (ctx == null) continue;
                _ = HandleAsync(ctx);
            }
        }

        private async Task HandleAsync(HttpListenerContext ctx)
        {
            try
            {
                var req = ctx.Request;
                var resp = ctx.Response;
                resp.Headers["Cache-Control"] = "no-store";

                string route = $"{req.HttpMethod} {req.Url.AbsolutePath}";

                switch (route)
                {
                    case "GET /health":
                    case "GET /":
                        await WriteJsonAsync(resp, new
                        {
                            ok = true,
                            status = Status,
                            endpoint = Endpoint,
                            version = "0.2.0",
                            endpoints = new[]
                            {
                                "GET /health",
                                "GET /state",
                                "POST /screenshot",
                                "POST /input",
                                "POST /snapshot",
                                "GET /snapshots",
                                "POST /restore",
                                "POST /breakpoint",
                            },
                        });
                        break;

                    case "GET /state":
                        await HandleStateAsync(resp);
                        break;

                    case "POST /screenshot":
                        await HandleScreenshotAsync(resp);
                        break;

                    case "POST /input":
                        await HandleInputAsync(req, resp);
                        break;

                    case "POST /snapshot":
                        await HandleSnapshotAsync(req, resp);
                        break;

                    case "GET /snapshots":
                        await HandleSnapshotsListAsync(resp);
                        break;

                    case "POST /restore":
                        await HandleRestoreAsync(req, resp);
                        break;

                    case "POST /breakpoint":
                        await HandleBreakpointAsync(req, resp);
                        break;

                    default:
                        resp.StatusCode = 404;
                        await WriteJsonAsync(resp, new { error = "not found", route });
                        break;
                }
            }
            catch (Exception e)
            {
                try
                {
                    ctx.Response.StatusCode = 500;
                    await WriteJsonAsync(ctx.Response, new { error = e.Message });
                }
                catch { /* response already closed */ }
            }
            finally
            {
                try { ctx.Response.Close(); }
                catch { /* ignore */ }
            }
        }

        private async Task HandleStateAsync(HttpListenerResponse resp)
        {
            int depth = Config != null ? Config.StateMaxDepth : 2;
            var state = MainThreadDispatcher.Instance.RunOnMainThread(
                () => StateProvider.Collect(depth));
            await WriteJsonAsync(resp, state);
        }

        private async Task HandleScreenshotAsync(HttpListenerResponse resp)
        {
            byte[] bytes = MainThreadDispatcher.Instance.RunOnMainThread(
                () => ScreenshotProvider.Capture(Config));
            resp.ContentType = Config != null && Config.ScreenshotFormat == ScreenshotFormat.JPG
                ? "image/jpeg"
                : "image/png";
            resp.ContentLength64 = bytes.Length;
            await resp.OutputStream.WriteAsync(bytes, 0, bytes.Length);
        }

        private async Task HandleInputAsync(HttpListenerRequest req, HttpListenerResponse resp)
        {
            var batch = await ReadJsonBodyAsync<InputEventBatch>(req);
            if (batch == null)
            {
                resp.StatusCode = 400;
                await WriteJsonAsync(resp, new { error = "missing or invalid JSON body" });
                return;
            }
            var result = MainThreadDispatcher.Instance.RunOnMainThread(
                () => InputInjector.Dispatch(batch));
            await WriteJsonAsync(resp, new
            {
                ok = true,
                eventsAccepted = result.eventsAccepted,
                subscriberCount = result.subscriberCount,
                errorCount = result.errorCount,
            });
        }

        private async Task HandleSnapshotAsync(HttpListenerRequest req, HttpListenerResponse resp)
        {
            // Optional body: { "id": "explicit-id" }
            SnapshotRequest sr = null;
            if (req.ContentLength64 > 0)
            {
                sr = await ReadJsonBodyAsync<SnapshotRequest>(req);
            }
            int depth = Config != null ? Config.StateMaxDepth : 2;
            string id = MainThreadDispatcher.Instance.RunOnMainThread(
                () => SnapshotProvider.Capture(depth, sr?.id));
            await WriteJsonAsync(resp, new
            {
                ok = true,
                id,
            });
        }

        private async Task HandleSnapshotsListAsync(HttpListenerResponse resp)
        {
            var ids = MainThreadDispatcher.Instance.RunOnMainThread(
                () => new System.Collections.Generic.List<string>(SnapshotProvider.ListSnapshotIds()));
            await WriteJsonAsync(resp, new { ok = true, snapshots = ids });
        }

        private async Task HandleRestoreAsync(HttpListenerRequest req, HttpListenerResponse resp)
        {
            var sr = await ReadJsonBodyAsync<SnapshotRequest>(req);
            if (sr == null || string.IsNullOrEmpty(sr.id))
            {
                resp.StatusCode = 400;
                await WriteJsonAsync(resp, new { error = "missing id in JSON body" });
                return;
            }
            bool restored = MainThreadDispatcher.Instance.RunOnMainThread(
                () => SnapshotProvider.Restore(sr.id));
            if (!restored)
            {
                resp.StatusCode = 404;
                await WriteJsonAsync(resp, new { error = "snapshot not found", id = sr.id });
                return;
            }
            await WriteJsonAsync(resp, new { ok = true, id = sr.id });
        }

        private async Task HandleBreakpointAsync(HttpListenerRequest req, HttpListenerResponse resp)
        {
            var br = await ReadJsonBodyAsync<BreakpointRequest>(req);
            if (br == null)
            {
                resp.StatusCode = 400;
                await WriteJsonAsync(resp, new { error = "missing or invalid JSON body" });
                return;
            }

            MainThreadDispatcher.Instance.RunOnMainThread<bool>(() =>
            {
                switch (br.action)
                {
                    case "add-pause":   BreakpointProvider.AddPauseTag(br.tag); break;
                    case "remove-pause": BreakpointProvider.RemovePauseTag(br.tag); break;
                    case "clear-pause": BreakpointProvider.ClearPauseTags(); break;
                    case "resume":      BreakpointProvider.Resume(); break;
                    case "step":        BreakpointProvider.Step(); break;
                    case "pause-now":   BreakpointProvider.PauseNow(string.IsNullOrEmpty(br.tag) ? "manual" : br.tag); break;
                    case "status":      /* falls through to read state */ break;
                    default:
                        throw new InvalidOperationException($"unknown breakpoint action: {br.action}");
                }
                return true;
            });

            await WriteJsonAsync(resp, new
            {
                ok = true,
                isPaused = BreakpointProvider.IsPaused,
                lastPausedAt = BreakpointProvider.LastPausedAt,
                pauseOnTags = new System.Collections.Generic.List<string>(BreakpointProvider.PauseOnTags),
                recentHits = new System.Collections.Generic.List<string>(BreakpointProvider.RecentHits),
            });
        }

        private static async Task<T> ReadJsonBodyAsync<T>(HttpListenerRequest req) where T : class
        {
            try
            {
                using var reader = new StreamReader(req.InputStream, req.ContentEncoding ?? Encoding.UTF8);
                string body = await reader.ReadToEndAsync();
                if (string.IsNullOrWhiteSpace(body)) return null;
                return JsonConvert.DeserializeObject<T>(body);
            }
            catch (Exception e)
            {
                Debug.LogWarning($"[gamestack] body parse failed: {e.Message}");
                return null;
            }
        }

        private static async Task WriteJsonAsync(HttpListenerResponse resp, object payload)
        {
            resp.ContentType = "application/json";
            string json = JsonConvert.SerializeObject(payload);
            byte[] bytes = Encoding.UTF8.GetBytes(json);
            resp.ContentLength64 = bytes.Length;
            await resp.OutputStream.WriteAsync(bytes, 0, bytes.Length);
        }
    }

    /// <summary>JSON body type for POST /snapshot and POST /restore.</summary>
    [Serializable]
    public class SnapshotRequest
    {
        public string id = string.Empty;
    }
}
