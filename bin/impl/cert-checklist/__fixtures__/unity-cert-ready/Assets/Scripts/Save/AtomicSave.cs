using System.IO;

public static class AtomicSave
{
    public static void Write(string path, byte[] bytes)
    {
        var temp = path + ".tmp";
        File.WriteAllBytes(temp, bytes);
        File.Replace(temp, path, null);
    }
}
