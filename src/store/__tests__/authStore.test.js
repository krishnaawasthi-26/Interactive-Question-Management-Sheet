import { useAuthStore } from "../authStore";
import { loginUser, signUpUser, verifySignUpOtp } from "../../api/authApi";

vi.mock("../../api/authApi", () => ({
  loginUser: vi.fn(),
  signUpUser: vi.fn(),
  resendSignUpOtp: vi.fn(),
  verifySignUpOtp: vi.fn(),
  googleAuth: vi.fn(),
}));

describe("authStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      currentUser: null,
      authError: null,
      authLoading: false,
      loginBlockedUntil: 0,
      pendingSignupEmail: "",
      otpResendAvailableInSeconds: 0,
      otpInfoMessage: "",
    });
    window.localStorage.clear();
  });

  it("signUp stores pending signup email and cooldown", async () => {
    signUpUser.mockResolvedValue({
      email: "user@example.com",
      resendAvailableInSeconds: 60,
      message: "OTP sent to your email.",
    });

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
    expect(useAuthStore.getState().pendingSignupEmail).toBe("user@example.com");
    expect(useAuthStore.getState().otpInfoMessage).toBe("OTP sent to your email.");
  });

  it("verifyOtp stores returned user and clears pending signup", async () => {
    useAuthStore.setState({ pendingSignupEmail: "user@example.com" });
    verifySignUpOtp.mockResolvedValue({ id: "u1", token: "abc", username: "new_user" });

    const result = await useAuthStore.getState().verifyOtp({
      email: "user@example.com",
      otp: "123456",
    });

    expect(result).toBe(true);
    expect(useAuthStore.getState().currentUser).toMatchObject({ token: "abc", id: "u1" });
    expect(useAuthStore.getState().pendingSignupEmail).toBe("");
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
