using System;
using System.Collections.Concurrent;
using System.Threading;
using UnityEngine;

namespace Gamestack
{
    /// <summary>
    /// Marshals work from background threads (the HTTP listener) back to the Unity main thread.
    /// Created on demand by GameStackServer; survives scene loads via DontDestroyOnLoad.
    /// </summary>
    [DefaultExecutionOrder(-100)]
    internal sealed class MainThreadDispatcher : MonoBehaviour
    {
        private static MainThreadDispatcher _instance;
        private static readonly object _instanceLock = new object();
        private readonly ConcurrentQueue<Action> _queue = new ConcurrentQueue<Action>();
        private const int RunOnMainThreadTimeoutMs = 5_000;

        public static MainThreadDispatcher Instance
        {
            get
            {
                if (_instance != null) return _instance;
                lock (_instanceLock)
                {
                    if (_instance != null) return _instance;
                    var go = new GameObject("[gamestack:MainThreadDispatcher]");
                    DontDestroyOnLoad(go);
                    go.hideFlags = HideFlags.HideAndDontSave;
                    _instance = go.AddComponent<MainThreadDispatcher>();
                    return _instance;
                }
            }
        }

        /// <summary>Queue an action for execution on the next main-thread Update.</summary>
        public void Enqueue(Action action)
        {
            if (action == null) return;
            _queue.Enqueue(action);
        }

        /// <summary>
        /// Run a delegate on the main thread and block until it returns (or until timeout).
        /// Callers MUST be on a background thread; calling this from the main thread will deadlock.
        /// </summary>
        public T RunOnMainThread<T>(Func<T> func)
        {
            if (func == null) throw new ArgumentNullException(nameof(func));

            using var done = new ManualResetEventSlim(false);
            T result = default;
            Exception caught = null;

            Enqueue(() =>
            {
                try { result = func(); }
                catch (Exception e) { caught = e; }
                finally { done.Set(); }
            });

            if (!done.Wait(RunOnMainThreadTimeoutMs))
            {
                throw new TimeoutException(
                    $"[gamestack] main-thread action did not complete within {RunOnMainThreadTimeoutMs} ms.");
            }
            if (caught != null) throw caught;
            return result;
        }

        private void Update()
        {
            while (_queue.TryDequeue(out var action))
            {
                try { action(); }
                catch (Exception e) { Debug.LogError($"[gamestack] dispatcher action threw: {e}"); }
            }
        }

        private void OnDestroy()
        {
            if (_instance == this) _instance = null;
        }
    }
}
