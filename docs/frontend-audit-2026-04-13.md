# Frontend audit notes (2026-04-13)

This document captures a static audit pass over the React + Vite frontend.

Highlights:
- Route topology is centralized in `src/App.jsx` and `src/services/routes.js`.
- Global auth state is handled in `src/store/authStore.js`.
- Sheet editing and persistence state is handled in `src/store/sheetStore.js` plus slice modules under `src/store/sheetStore/`.
- Notification experiences are split across reminder polling (`ReminderNotificationCenter`), bell drawer (`NotificationBell`), and full inbox (`NotificationsPage`).
- Legacy/unused UI components and helper files exist and should be cleaned up.

See chat response for full inventory and risk analysis.
