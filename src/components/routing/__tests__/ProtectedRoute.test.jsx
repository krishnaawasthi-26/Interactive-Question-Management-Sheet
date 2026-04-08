import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../ProtectedRoute";
import { useAuthStore } from "../../../store/authStore";
import { ROUTES } from "../../../services/routes";

describe("ProtectedRoute", () => {
  beforeEach(() => {
    useAuthStore.setState({
      currentUser: null,
      authError: null,
      authLoading: false,
      loginBlockedUntil: 0,
    });
  });

  it("redirects unauthenticated users to login", () => {
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<div>Sheet</div>} />
          </Route>
          <Route path={ROUTES.LOGIN} element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Login page")).toBeInTheDocument();
    expect(screen.queryByText("Sheet")).not.toBeInTheDocument();
  });

  it("renders protected content when user has a token", () => {
    useAuthStore.setState({ currentUser: { token: "token-1", id: "u1" } });

    render(
      <MemoryRouter initialEntries={["/app"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<div>Sheet</div>} />
          </Route>
          <Route path={ROUTES.LOGIN} element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Sheet")).toBeInTheDocument();
  });
});
