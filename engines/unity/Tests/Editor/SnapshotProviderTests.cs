using System;
using System.Collections.Generic;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.TestTools;
using Object = UnityEngine.Object;

namespace Gamestack.Tests
{
    public class SnapshotProviderTests
    {
        private class TaggedMock : MonoBehaviour
        {
            [GameStackState("hp")] public int Health = 100;
            [GameStackState("score", "match")] public int Score = 0;
        }

        private class CustomMock : MonoBehaviour, IGameStackSnapshotable
        {
            public string SnapshotKey => "custom-mock";
            public string Payload = "initial";

            public object CaptureSnapshot() => new Dictionary<string, object> { ["payload"] = Payload };

            public void RestoreSnapshot(object payload)
            {
                if (payload is Dictionary<string, object> dict
                    && dict.TryGetValue("payload", out var v))
                {
                    Payload = v?.ToString() ?? string.Empty;
                }
            }
        }

        private GameObject _go;

        [TearDown]
        public void TearDown()
        {
            if (_go != null) Object.DestroyImmediate(_go);
            SnapshotProvider.Clear();
        }

        [Test]
        public void Capture_StoresSnapshotWithGeneratedId()
        {
            _go = new GameObject("[test:tagged]");
            _go.AddComponent<TaggedMock>();

            string id = SnapshotProvider.Capture(maxDepth: 2);

            Assert.IsNotEmpty(id);
            CollectionAssert.Contains(SnapshotProvider.ListSnapshotIds(), id);
        }

        [Test]
        public void Capture_UsesExplicitIdWhenProvided()
        {
            _go = new GameObject("[test:tagged]");
            _go.AddComponent<TaggedMock>();

            string id = SnapshotProvider.Capture(maxDepth: 2, explicitId: "my-snap");

            Assert.AreEqual("my-snap", id);
        }

        [Test]
        public void Restore_TimeScale_RoundTrips()
        {
            float originalScale = Time.timeScale;
            try
            {
                _go = new GameObject("[test:tagged]");
                _go.AddComponent<TaggedMock>();

                Time.timeScale = 0.5f;
                string id = SnapshotProvider.Capture(maxDepth: 2);

                Time.timeScale = 2.0f;
                bool restored = SnapshotProvider.Restore(id);

                Assert.IsTrue(restored);
                Assert.AreEqual(0.5f, Time.timeScale, 0.001f);
            }
            finally
            {
                Time.timeScale = originalScale;
            }
        }

        [Test]
        public void Restore_TaggedField_RoundTrips()
        {
            _go = new GameObject("[test:tagged]");
            var mock = _go.AddComponent<TaggedMock>();
            mock.Health = 75;

            string id = SnapshotProvider.Capture(maxDepth: 2);
            mock.Health = 10;

            bool restored = SnapshotProvider.Restore(id);
            Assert.IsTrue(restored);
            Assert.AreEqual(75, mock.Health);
        }

        [Test]
        public void Restore_UnknownId_ReturnsFalse()
        {
            bool restored = SnapshotProvider.Restore("does-not-exist");
            Assert.IsFalse(restored);
        }

        [Test]
        public void Delete_RemovesSnapshot()
        {
            _go = new GameObject("[test:tagged]");
            _go.AddComponent<TaggedMock>();

            string id = SnapshotProvider.Capture(maxDepth: 2);
            bool removed = SnapshotProvider.Delete(id);

            Assert.IsTrue(removed);
            CollectionAssert.DoesNotContain(SnapshotProvider.ListSnapshotIds(), id);
        }

        [Test]
        public void IGameStackSnapshotable_RoundTrips()
        {
            _go = new GameObject("[test:custom]");
            var mock = _go.AddComponent<CustomMock>();
            mock.Payload = "before";

            string id = SnapshotProvider.Capture(maxDepth: 2);
            mock.Payload = "after";

            bool restored = SnapshotProvider.Restore(id);
            Assert.IsTrue(restored);
            Assert.AreEqual("before", mock.Payload);
        }
    }
}
