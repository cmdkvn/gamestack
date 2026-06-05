using NUnit.Framework;
using UnityEngine;

namespace Alliance.Gamestack.Tests
{
    public class BreakpointProviderTests
    {
        private float _originalTimeScale;

        [SetUp]
        public void SetUp()
        {
            _originalTimeScale = Time.timeScale;
            BreakpointProvider.Reset();
        }

        [TearDown]
        public void TearDown()
        {
            BreakpointProvider.Reset();
            Time.timeScale = _originalTimeScale;
        }

        [Test]
        public void Hit_WithoutPauseTag_DoesNotPause()
        {
            BreakpointProvider.Hit("any-tag");
            Assert.IsFalse(BreakpointProvider.IsPaused);
            Assert.AreNotEqual(0f, Time.timeScale);
        }

        [Test]
        public void Hit_MatchingPauseTag_Pauses()
        {
            BreakpointProvider.AddPauseTag("after-boss");
            BreakpointProvider.Hit("after-boss");

            Assert.IsTrue(BreakpointProvider.IsPaused);
            Assert.AreEqual(0f, Time.timeScale);
            Assert.AreEqual("after-boss", BreakpointProvider.LastPausedAt);
        }

        [Test]
        public void Hit_Wildcard_PausesOnAnyTag()
        {
            BreakpointProvider.AddPauseTag("*");
            BreakpointProvider.Hit("anything");

            Assert.IsTrue(BreakpointProvider.IsPaused);
        }

        [Test]
        public void Resume_RestoresOriginalTimeScale()
        {
            Time.timeScale = 0.5f;
            BreakpointProvider.AddPauseTag("checkpoint");
            BreakpointProvider.Hit("checkpoint");
            Assert.AreEqual(0f, Time.timeScale);

            BreakpointProvider.Resume();
            Assert.IsFalse(BreakpointProvider.IsPaused);
            Assert.AreEqual(0.5f, Time.timeScale, 0.001f);
        }

        [Test]
        public void RemovePauseTag_StopsFutureMatches()
        {
            BreakpointProvider.AddPauseTag("tag-A");
            BreakpointProvider.RemovePauseTag("tag-A");
            BreakpointProvider.Hit("tag-A");

            Assert.IsFalse(BreakpointProvider.IsPaused);
        }

        [Test]
        public void PauseNow_PausesWithReasonTag()
        {
            BreakpointProvider.PauseNow("manual-from-test");
            Assert.IsTrue(BreakpointProvider.IsPaused);
            Assert.AreEqual("manual-from-test", BreakpointProvider.LastPausedAt);
        }

        [Test]
        public void RecentHits_CollectsTagsInOrder()
        {
            BreakpointProvider.Hit("first");
            BreakpointProvider.Hit("second");
            BreakpointProvider.Hit("third");

            var hits = new System.Collections.Generic.List<string>(BreakpointProvider.RecentHits);
            CollectionAssert.AreEqual(new[] { "first", "second", "third" }, hits);
        }

        [Test]
        public void OnHit_FiresForEveryHit()
        {
            int count = 0;
            System.Action<string> handler = _ => count++;
            BreakpointProvider.OnHit += handler;
            try
            {
                BreakpointProvider.Hit("a");
                BreakpointProvider.Hit("b");
                Assert.AreEqual(2, count);
            }
            finally
            {
                BreakpointProvider.OnHit -= handler;
            }
        }

        [Test]
        public void OnPause_OnResume_FireInOrder()
        {
            string pausedAt = null;
            bool resumedFired = false;
            System.Action<string> pause = tag => pausedAt = tag;
            System.Action resume = () => resumedFired = true;
            BreakpointProvider.OnPause += pause;
            BreakpointProvider.OnResume += resume;
            try
            {
                BreakpointProvider.AddPauseTag("checkpoint");
                BreakpointProvider.Hit("checkpoint");
                Assert.AreEqual("checkpoint", pausedAt);

                BreakpointProvider.Resume();
                Assert.IsTrue(resumedFired);
            }
            finally
            {
                BreakpointProvider.OnPause -= pause;
                BreakpointProvider.OnResume -= resume;
            }
        }
    }
}
