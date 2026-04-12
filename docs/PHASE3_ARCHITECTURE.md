# Phase 3 Architecture Notes

## Collaboration
- `Sheet` now supports visibility (`private/public/unlisted/team`), collaborator roles (`owner/editor/viewer`), comments toggle, and remix attribution.
- New collections:
  - `sheet_comments`
  - `sheet_activity_events`
- `SheetCollaborationService` is the single authority for collaboration permissions and activity tracking.
- API additions under `/api/sheets/{sheetId}`:
  - `POST /invite`
  - `PUT /sharing`
  - `GET|POST /comments`
  - `GET /activity`
  - `GET /ai/suggest-next`
  - `POST /remix`

## Team / Classroom mode
- New collection: `study_teams` with embedded membership roles (`admin/mentor/student`), plus assigned sheet ids.
- New collection: `team_sheet_progress` for per-member progress snapshots.
- `StudyTeamService` enforces role checks and powers admin/member dashboards.
- API under `/api/teams` for create, invite, assign, and dashboards.

## AI suggestions
- `AiSuggestionService` provides a modular provider layer entrypoint.
- Current implementation is deterministic from user sheet data and returns explainable reasons.
- Graceful fallback: if insufficient data, returns explicit “not enough data” message.

## Premium entitlement model
- Added `EntitlementService` as centralized feature gating.
- Added user fields: `planTier`, `subscriptionStatus`.
- Premium API now includes `/api/premium/status` and non-placeholder plan amounts.

## Creator ecosystem
- Added `/api/discovery` endpoint via `CreatorDiscoveryService` for:
  - trending creators
  - trending sheets
  - recently published sheets
- Public profile payload now includes creator aggregate stats and remix attribution fields.

## Security and auth
- Existing token auth remains in interceptors.
- Added auth protection for `/api/teams/**` and `/api/premium/status`.
- API edit operations now verify collaborator permissions server-side.
