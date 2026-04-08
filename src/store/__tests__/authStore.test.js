import { useAuthStore } from "../authStore";
import { loginUser, signUpUser } from "../../api/authApi";

vi.mock("../../api/authApi", () => ({
  loginUser: vi.fn(),
  signUpUser: vi.fn(),
}));

describe("authStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      currentUser: null,
      authError: null,
      authLoading: false,
      loginBlockedUntil: 0,
    });
    window.localStorage.clear();
  });

  it("signUp stores returned user and clears auth error", async () => {
    signUpUser.mockResolvedValue({ id: "u1", token: "abc", username: "new_user" });

    const result = await useAuthStore.getState().signUp({
      name: " New User ",
      email: "USER@Example.com ",
      username: " New_User ",
      password: " password123 ",
    });

    expect(result).toBe(true);
    expect(signUpUser).toHaveBeenCalledWith({
      name: "New User",
      email: "user@example.com",
      username: "new_user",
      password: "password123",
    });
    expect(useAuthStore.getState().currentUser).toMatchObject({ token: "abc", id: "u1" });
  });

  it("login handles lock response and stores blocked timestamp", async () => {
    const disabledUntilEpochMs = Date.now() + 60_000;
    loginUser.mockRejectedValue({
      message: "Too many wrong attempts. Try after 1 minutes.",
      code: "LOGIN_LOCKED",
      disabledUntilEpochMs,
    });

    const result = await useAuthStore.getState().login({
      identifier: "USER",
      password: "wrongpass",
    });

    expect(result).toBe(false);
    expect(useAuthStore.getState().loginBlockedUntil).toBe(disabledUntilEpochMs);
    expect(useAuthStore.getState().authError).toContain("Too many wrong attempts");
  });
});
