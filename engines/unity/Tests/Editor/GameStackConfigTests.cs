using NUnit.Framework;
using UnityEngine;

namespace Gamestack.Tests
{
    public class GameStackConfigTests
    {
        [Test]
        public void Defaults_AreReasonable()
        {
            var c = ScriptableObject.CreateInstance<GameStackConfig>();
            Assert.AreEqual(7331, c.Port, "Default port should be 7331.");
            Assert.IsTrue(c.LoopbackOnly, "Default must be loopback-only for safety.");
            Assert.IsTrue(c.Enabled, "Default should be enabled.");
            Assert.GreaterOrEqual(c.StateMaxDepth, 1);
            Assert.LessOrEqual(c.StateMaxDepth, 5);
            Assert.GreaterOrEqual(c.ScreenshotScale, 0.25f);
            Assert.LessOrEqual(c.ScreenshotScale, 1f);
            Assert.AreEqual(ScreenshotFormat.PNG, c.ScreenshotFormat);
        }
    }

    public class GameStackStateAttributeTests
    {
        private class MockComponent : MonoBehaviour
        {
            [GameStackState("hp")] public int Health = 100;
            [GameStackState("score", "match")] public int Score { get; set; } = 0;
        }

        [Test]
        public void Attribute_IsAppliedToField()
        {
            var field = typeof(MockComponent).GetField("Health");
            var attr = System.Attribute.GetCustomAttribute(field, typeof(GameStackStateAttribute))
                as GameStackStateAttribute;
            Assert.IsNotNull(attr);
            Assert.AreEqual("hp", attr.Key);
            Assert.AreEqual(string.Empty, attr.Namespace);
        }

        [Test]
        public void Attribute_IsAppliedToProperty_WithNamespace()
        {
            var prop = typeof(MockComponent).GetProperty("Score");
            var attr = System.Attribute.GetCustomAttribute(prop, typeof(GameStackStateAttribute))
                as GameStackStateAttribute;
            Assert.IsNotNull(attr);
            Assert.AreEqual("score", attr.Key);
            Assert.AreEqual("match", attr.Namespace);
        }

        [Test]
        public void Attribute_RejectsNullKey()
        {
            Assert.Throws<System.ArgumentNullException>(() => new GameStackStateAttribute(null));
        }
    }
}
