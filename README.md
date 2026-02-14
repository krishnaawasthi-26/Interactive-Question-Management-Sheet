# Interactive Question Management Sheet
deployment link : https://interactive-question-management-she-gamma.vercel.app/

A modern single-page web application to manage a hierarchical question bank using:

- **Topics**
- **Sub-topics**
- **Questions**

The app supports full in-app CRUD operations, drag-and-drop reordering, API-based initial loading, and local persistence.

---

## 1) Assignment Context

This project is built for the **Interactive Question Management Sheet** assignment with focus on:

- Creating, editing, deleting topics
- Creating, editing, deleting sub-topics
- Creating, editing, deleting questions
- Reordering topics/sub-topics/questions using drag-and-drop
- Keeping UX clean and intuitive
- Using React + state management
- Integrating API data using provided curl reference

---

## 2) Tech Stack

- **React** (UI framework)
- **Zustand** (state management)
- **@hello-pangea/dnd** (drag-and-drop)
- **Vite** (dev/build tooling)
- **TailwindCSS** utility-first classes for styling

---

## 3) Features Implemented

### Topic Management
- Add topic
- Edit topic
- Delete topic

### Sub-topic Management
- Add sub-topic under topic
- Edit sub-topic
- Delete sub-topic

### Question Management
- Add question under sub-topic
- Edit question
- Delete question
- Add external link to question

###  Drag-and-Drop Reordering
- Reorder topics
- Move/reorder sub-topics
- Move/reorder questions
  - same sub-topic reorder
  - cross-sub-topic move
  - cross-topic move

###  Sheet API Integration
- Fetch initial sheet by slug from:
  - `https://node.codolio.com/api/question-tracker/v1/sheet/public/get-sheet-by-slug/striver-sde-sheet`
- Normalize payload safely
- Fallback to local storage if API fails

###  Local Persistence (No Database)
- All mutations persist to local storage to preserve state across refreshes

### Better UX
- Edit/View mode toggle
- Expand/collapse topic and sub-topic blocks
- Dynamic header title from API sheet data

---

## 4) How Features Are Implemented in Code

### `src/App.jsx`
- App entry layout
- Loads sheet data on mount (`fetchSheetBySlug("striver-sde-sheet")`)
- Reads `sheetTitle` from Zustand and passes it to header
- Handles add-topic input and submit

### `src/components/Header.jsx`
- Displays dynamic sheet title from store
- Edit/View mode toggle button

### `src/components/AddTopicForm.jsx`
- Controlled input for topic title
- Submit via button and Enter key

### `src/components/TopicList.jsx`
- Renders nested topic/sub-topic/question structure
- Inline edit/delete controls
- Expand/collapse behavior
- Full drag-and-drop wiring via `DragDropContext`

### `src/store/sheetStore.js`
- Central state source (`topics`, `sheetTitle`)
- All CRUD actions (topics, sub-topics, questions)
- DnD actions (`reorderTopics`, `moveSubTopic`, `moveQuestion`)
- Local persistence call after mutations
- API load action (`fetchSheetBySlug`)

### `src/api/questionSheetApi.js`
- Encapsulates API + local storage behavior
- `fetchSheetBySlug(slug)`
- `persistSheet(sheet)`
- Payload normalization and fallback strategy

---

## 5) Project Structure

```text
Interactive-Question-Management-Sheet/
├── README.md
├── package.json
├── index.html
├── public/
└── src/
    ├── App.jsx
    ├── main.jsx
    ├── index.css
    ├── App.css
    ├── assets/
    ├── api/
    │   └── questionSheetApi.js
    ├── components/
    │   ├── AddTopicForm.jsx
    │   ├── Header.jsx
    │   └── TopicList.jsx
    └── store/
        └── sheetStore.js
```

---

## 6) Setup & Run Instructions

### Prerequisites
- Node.js (LTS recommended)
- npm

### Install dependencies
```bash
npm install
```

### Run in development
```bash
npm run dev
```

### Build for production
```bash
npm run build
```

### Preview production build
```bash
npm run preview
```

### Lint
```bash
npm run lint
```

---

## 7) NPM Scripts

From `package.json`:

- `dev` → starts Vite dev server
- `build` → creates production build
- `preview` → previews production build
- `lint` → runs ESLint checks

---

## 8) API Reference Used

Provided assignment reference:

```bash
curl --location 'https://node.codolio.com/api/question-tracker/v1/sheet/public/get-sheet-by-slug/striver-sde-sheet'
```

In the app, this is consumed through `fetchSheetBySlug` in `src/api/questionSheetApi.js`.

---

## 9) Requirement Coverage Summary

### Functional Requirements
- Add Topic 
- Add Sub-topic 
- Add Question 
- Reorder Elements 

### Technical Requirements
- React-based SPA 
- State management with Zustand 
- API integration with provided endpoint reference 
- Works without database using local persistence 

### Bonus Improvements Included
- Edit/View mode toggle
- Expand/collapse sections
- Question link attachment
- API title shown in header

---

## 10) Notes

- The application is designed to work even if API is unavailable by using localStorage fallback.
- Existing features are preserved while modular components and store logic keep code maintainable.
