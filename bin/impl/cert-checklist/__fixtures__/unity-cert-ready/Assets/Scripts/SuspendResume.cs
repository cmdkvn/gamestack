using UnityEngine;

public class SuspendResume : MonoBehaviour
{
    void OnApplicationPause(bool paused)
    {
        if (paused) AtomicSave.Write("save.dat", new byte[0]);
    }

    void OnApplicationFocus(bool hasFocus) { }
}
