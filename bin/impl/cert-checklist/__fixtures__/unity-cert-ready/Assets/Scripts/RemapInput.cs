using UnityEngine.InputSystem;

public class RemapInput
{
    public void StartRebind(InputAction action)
    {
        var op = action.PerformInteractiveRebinding();
        op.Start();
        // RebindingOperation in use.
    }
}
