using UnityEngine;
using UnityEngine.InputSystem.Users;

public class ControllerDisconnect : MonoBehaviour
{
    void OnEnable()
    {
        InputUser.onChange += OnInputUserChange;
    }

    void OnDisable()
    {
        InputUser.onChange -= OnInputUserChange;
    }

    void OnInputUserChange(InputUser user, InputUserChange change, UnityEngine.InputSystem.InputDevice device)
    {
        if (change == InputUserChange.DeviceLost)
        {
            // Pause the game and show "controller disconnected" UI.
        }
    }
}
