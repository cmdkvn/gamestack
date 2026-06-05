using System;

namespace Alliance.Gamestack
{
    /// <summary>
    /// Tag a field or property on a MonoBehaviour to expose it through GET /state.
    /// The first argument is the key shown in the JSON response; the optional second
    /// argument groups multiple keys under a named namespace.
    ///
    /// Usage:
    ///   [GameStackState("hp")] public int health;                       // tagged.default.hp
    ///   [GameStackState("score", "match")] public int Score { get; }    // tagged.match.score
    /// </summary>
    [AttributeUsage(AttributeTargets.Field | AttributeTargets.Property, AllowMultiple = false)]
    public sealed class GameStackStateAttribute : Attribute
    {
        public string Key { get; }
        public string Namespace { get; }

        public GameStackStateAttribute(string key, string @namespace = "")
        {
            Key = key ?? throw new ArgumentNullException(nameof(key));
            Namespace = @namespace ?? string.Empty;
        }
    }
}
