using System;
using System.Collections.Generic;
using UnityEngine;

namespace Gamestack
{
    /// <summary>
    /// Device class of a synthesized input event.
    /// </summary>
    public enum InputDevice
    {
        Keyboard,
        Mouse,
        Gamepad,
        Touch,
        Custom,
    }

    /// <summary>
    /// Action type. "Press" / "Release" are momentary; "Value" carries an axis value;
    /// "Move" carries a position (mouse / touch); "Custom" is whatever the developer wires up.
    /// </summary>
    public enum InputAction
    {
        Press,
        Release,
        Value,
        Move,
        Custom,
    }

    /// <summary>
    /// A single synthesized input event from POST /input.
    /// Fields are intentionally generic so the same payload shape works across devices.
    /// </summary>
    [Serializable]
    public class InputEvent
    {
        /// <summary>Device class (Keyboard, Mouse, Gamepad, Touch, Custom).</summary>
        public InputDevice device = InputDevice.Keyboard;

        /// <summary>Action type (Press, Release, Value, Move, Custom).</summary>
        public InputAction action = InputAction.Press;

        /// <summary>
        /// Symbolic name of the control. Examples: "Space", "MouseLeft", "DPadUp",
        /// "Horizontal", "TouchPrimary". Convention is up to the developer's adapter,
        /// but lowercase-friendly + no separators is recommended.
        /// </summary>
        public string control = string.Empty;

        /// <summary>Float value for axis / trigger / analog inputs (range typically -1..1 or 0..1).</summary>
        public float value = 0f;

        /// <summary>X coordinate for positional inputs (mouse, touch).</summary>
        public float x = 0f;

        /// <summary>Y coordinate for positional inputs.</summary>
        public float y = 0f;

        /// <summary>Optional duration in seconds for repeat-style events; 0 = single tick.</summary>
        public float durationSeconds = 0f;

        /// <summary>Free-form metadata for Custom events.</summary>
        public string custom = string.Empty;
    }

    /// <summary>
    /// Batched payload accepted by POST /input. Allows multiple events per request.
    /// </summary>
    [Serializable]
    public class InputEventBatch
    {
        public List<InputEvent> events = new List<InputEvent>();
    }

    /// <summary>
    /// Static dispatcher for synthesized input. The HTTP server calls
    /// <see cref="Dispatch"/> on the main thread; subscribers translate
    /// events into in-game actions for THEIR game's input model.
    ///
    /// Typical adapter (drop into any MonoBehaviour):
    /// <code>
    /// private void OnEnable()  => InputInjector.OnInput += Handle;
    /// private void OnDisable() => InputInjector.OnInput -= Handle;
    /// private void Handle(InputEvent e) { /* map to your game's input */ }
    /// </code>
    /// </summary>
    public static class InputInjector
    {
        /// <summary>
        /// Fires once per dispatched event on the main thread.
        /// Subscribers should be cheap and non-throwing.
        /// </summary>
        public static event Action<InputEvent> OnInput;

        /// <summary>
        /// Receipt of dispatch. Returned to the caller of POST /input so they
        /// know how many subscribers handled the event.
        /// </summary>
        public struct DispatchResult
        {
            public int eventsAccepted;
            public int subscriberCount;
            public int errorCount;
        }

        /// <summary>
        /// Dispatch a batch of input events to subscribers. Each event runs through
        /// every subscriber; exceptions in one subscriber don't block the others.
        /// </summary>
        public static DispatchResult Dispatch(InputEventBatch batch)
        {
            var result = new DispatchResult();
            if (batch == null || batch.events == null) return result;

            int subs = OnInput == null ? 0 : OnInput.GetInvocationList().Length;
            result.subscriberCount = subs;

            foreach (var evt in batch.events)
            {
                if (evt == null) continue;
                result.eventsAccepted++;

                Action<InputEvent> handler = OnInput;
                if (handler == null) continue;

                foreach (var d in handler.GetInvocationList())
                {
                    try { ((Action<InputEvent>)d).Invoke(evt); }
                    catch (Exception e)
                    {
                        result.errorCount++;
                        Debug.LogWarning($"[gamestack] input subscriber threw: {e.Message}");
                    }
                }
            }

            return result;
        }

        /// <summary>
        /// Convenience for tests / sample code: dispatch a single event.
        /// </summary>
        public static DispatchResult Dispatch(InputEvent evt)
        {
            if (evt == null) return default;
            return Dispatch(new InputEventBatch { events = new List<InputEvent> { evt } });
        }
    }
}
