# React Router migration note

- Replaced the custom hash-based router with `react-router-dom` and `BrowserRouter`.
- Routes now use standard path URLs (e.g., `/profile`, `/app/:sheetId`) instead of hash fragments.
- Auth gating moved to route guards:
  - `ProtectedRoute` for authenticated pages.
  - `PublicOnlyRoute` for `/login` and `/signup` redirects when already logged in.
- Existing route behaviors were preserved for shared/public profile and sheet URLs.
- `src/services/hashRouter.js` was retired and replaced by `src/services/routes.js` for route constants and lightweight navigation helpers used by existing UI components.
