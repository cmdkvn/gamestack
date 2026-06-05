using System;
using System.Collections.Generic;
using NUnit.Framework;
using UnityEngine;

namespace Gamestack.Tests
{
    public class InputInjectorTests
    {
        private int _receivedCount;
        private InputEvent _lastReceived;

        [SetUp]
        public void SetUp()
        {
            _receivedCount = 0;
            _lastReceived = null;
            // Clear any subscribers from previous tests that might have leaked.
            // (No public API for that; tests should be tolerant of stray subscribers.)
        }

        [Test]
        public void Dispatch_WithNoSubscribers_ReportsZero()
        {
            var batch = new InputEventBatch
            {
                events = new List<InputEvent> { new InputEvent { control = "Space" } }
            };
            var result = InputInjector.Dispatch(batch);
            Assert.AreEqual(1, result.eventsAccepted);
            Assert.AreEqual(0, result.errorCount);
        }

        [Test]
        public void Dispatch_WithSubscriber_InvokesIt()
        {
            Action<InputEvent> sub = e => { _receivedCount++; _lastReceived = e; };
            InputInjector.OnInput += sub;
            try
            {
                var evt = new InputEvent
                {
                    device = InputDevice.Keyboard,
                    action = InputAction.Press,
                    control = "Space",
                };
                var result = InputInjector.Dispatch(evt);

                Assert.AreEqual(1, result.eventsAccepted);
                Assert.GreaterOrEqual(result.subscriberCount, 1);
                Assert.AreEqual(1, _receivedCount);
                Assert.IsNotNull(_lastReceived);
                Assert.AreEqual("Space", _lastReceived.control);
            }
            finally
            {
                InputInjector.OnInput -= sub;
            }
        }

        [Test]
        public void Dispatch_ExceptionInSubscriber_DoesNotAbortBatch()
        {
            Action<InputEvent> throwingSub = e => throw new InvalidOperationException("test");
            int laterCalls = 0;
            Action<InputEvent> normalSub = e => laterCalls++;

            InputInjector.OnInput += throwingSub;
            InputInjector.OnInput += normalSub;
            try
            {
                var batch = new InputEventBatch
                {
                    events = new List<InputEvent>
                    {
                        new InputEvent { control = "A" },
                        new InputEvent { control = "B" },
                    }
                };
                var result = InputInjector.Dispatch(batch);

                Assert.AreEqual(2, result.eventsAccepted);
                Assert.GreaterOrEqual(result.errorCount, 2, "Throwing subscriber should be counted per event.");
                Assert.AreEqual(2, laterCalls, "Normal subscriber should still receive every event.");
            }
            finally
            {
                InputInjector.OnInput -= throwingSub;
                InputInjector.OnInput -= normalSub;
            }
        }

        [Test]
        public void Dispatch_NullBatchOrEvents_ReturnsZero()
        {
            var nullBatchResult = InputInjector.Dispatch((InputEventBatch)null);
            Assert.AreEqual(0, nullBatchResult.eventsAccepted);

            var nullEventResult = InputInjector.Dispatch((InputEvent)null);
            Assert.AreEqual(0, nullEventResult.eventsAccepted);
        }
    }
}
