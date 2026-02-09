# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Interactive Question Management Sheet — Assignment Details

### Introduction
This document outlines the design for an interactive, single-page web application that enables users to manage a hierarchical set of questions categorized by topics and sub-topics. The application will allow users to add new topics, sub-topics, and questions, as well as reorder these elements through a drag-and-drop interface. The design emphasizes a clean and intuitive user interface to enhance user experience.

### Functional Requirements
- **Add Topic:** Users can create/edit/delete new topics.
- **Add Sub-topic:** Users can create/edit/delete sub-topics under existing topics.
- **Add Question:** Users can create/edit/delete questions under specific topics and sub-topics.
- **Reorder Elements:** Users can change the order of topics, sub-topics, and questions by dragging and dropping them to the desired position.

### Assumptions
- The application will be a single-page web app.
- The user interface will be clean and intuitive, focusing on ease of use.
- Developers have the liberty to design the UI, provided it meets the functional requirements. (Reference: Codolio website)

### Technical Requirements
#### Frameworks and Libraries
- Use a modern front-end framework (e.g., React).
- Utilize CSS frameworks or libraries (e.g., Tailwind CSS, Bootstrap) for responsive design.

#### State Management
- Implement proper state management for handling transactions (e.g., Zustand for React).

#### API Integration
- Implement basic CRUD APIs (without a database is acceptable).  
  Reference curl for data:
  `curl --location 'https://node.codolio.com/api/question-tracker/v1/sheet/public/get-sheet-by-slug/striver-sde-sheet'`

### Sample Data
- Use the attached dataset as a sample dataset to populate the initial state of the application.

### Bonus Points
- Implement any improvement in the functionality of sheets which you feel is currently missing on the platform.

### Submission Details
- **Deadline:** Please submit your completed assignment by February 10th, 11:59 PM.
- **Submission Format:** Share a link to your code repository (e.g., GitHub) along with any necessary instructions to run the application.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
