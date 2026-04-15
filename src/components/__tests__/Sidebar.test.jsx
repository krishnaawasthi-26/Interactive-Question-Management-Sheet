import { fireEvent, render, screen } from "@testing-library/react";
import Sidebar from "../Sidebar";
import { useAuthStore } from "../../store/authStore";
import { ROUTES, navigateTo } from "../../services/routes";

vi.mock("../../services/routes", async () => {
  const actual = await vi.importActual("../../services/routes");
  return {
    ...actual,
    navigateTo: vi.fn(),
    getCurrentRoute: vi.fn(() => ({ route: actual.ROUTES.APP })),
    getUserProfileRoute: vi.fn(() => actual.ROUTES.PROFILE),
  };
});

describe("Sidebar inbox navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      currentUser: { token: "token-1", username: "demo-user" },
      authError: null,
      authLoading: false,
      loginBlockedUntil: 0,
    });
  });

  it("navigates to unified inbox without logging out", () => {
    const logoutSpy = vi.spyOn(useAuthStore.getState(), "logout");

    render(<Sidebar isSidebarOpen onToggle={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: "Inbox" }));

    expect(navigateTo).toHaveBeenCalledWith(ROUTES.NOTIFICATIONS);
    expect(logoutSpy).not.toHaveBeenCalled();
  });
});
