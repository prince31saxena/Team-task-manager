# Team Task Manager (Full-Stack)

A modern, responsive, and professional full-stack project dashboard and task workspace. Built with React (Vite) on the frontend and Node.js/Express + SQLite on the backend. This project features role-based access control (RBAC), a polished light-slate workspace UI, interactive Kanban boards, and project analytics.

---

## 🚀 Key Features

1. **Authentication (Signup/Login)**
   - Secure authentication via JSON Web Tokens (JWT) and bcrypt hashing.
   - Smart **Quick Demo Sign-In** portal: allows immediate, one-click evaluation as either an **Administrator** or a **Team Member**.

2. **Dashboard Overview & Analytics**
   - Summary statistics cards: *Active Projects*, *Total Tasks*, *Pending Tasks*, and *Overdue Tasks*.
   - Dynamic **Project Completion Tracker**: includes progress bars reflecting completion percentage (`Done` vs `Total`) and warning badges for overdue tasks.
   - **Recent Work Activity Feed**: shows real-time updates for recently modified tasks with color-coded status badges.

3. **Project & Team Workspace Management**
   - **Administrator Role**: Create and delete projects, write and edit descriptions, and manage team memberships (assign/remove members).
   - **Team Member Role**: View assigned projects, access task lists, and track progress.

4. **Interactive Kanban Task Board**
   - Visual columns representing task lifecycles: **To Do**, **In Progress**, and **Completed**.
   - Overdue tasks are styled automatically with red icons (`📅 YYYY-MM-DD ⚠️`).
   - Role-based interaction:
     - **Admins** can add tasks, delete tasks, and edit details (title, description, assignee, due date, status).
     - **Members** can update the status of tasks *assigned to them* (transitioning between columns), while all other edits remain read-only.

---

## 🛠️ Technology Stack

- **Frontend**: React (Vite), React Router DOM, Context API, Vanilla CSS (harmonized custom color system with HSL slate-light elements, interactive transitions, and responsive layout).
- **Backend**: Node.js, Express, REST APIs, JSON Web Tokens (JWT).
- **Database**: SQLite (SQL database) managed via Sequelize ORM for relationships, schema migrations, and validations.

---

## 📂 Project Architecture

```text
team-task-manager/
├── backend/
│   ├── config/          # Database connection
│   ├── middleware/      # Auth tokens & role validation
│   ├── models/          # Sequelize schemas (User, Project, Task, ProjectMember)
│   ├── routes/          # Express REST controllers (Auth, Projects, Tasks, Users, Dashboard)
│   ├── seed.js          # Pre-populated demo database setup script
│   └── server.js        # Main entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # Layout elements (Sidebar, ProtectedRoute)
│   │   ├── contexts/    # Auth state management
│   │   ├── pages/       # React page modules (Dashboard, ProjectsList, ProjectDetail, TaskBoard, Login, Signup)
│   │   ├── services/    # Axios HTTP client configuration
│   │   ├── index.css    # Unified typography & responsive design tokens
│   │   └── main.jsx
│   └── package.json
└── README.md
```

---

## 🔌 REST API Endpoints

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/signup` - Register a new user (role: `member` or `admin`).
- `POST /api/auth/login` - Authenticate user credentials and return a JWT.
- `GET /api/auth/me` - Retrieve authenticated user info.

### 📁 Projects (`/api/projects`)
- `GET /api/projects` - List all projects. (Admins see all; Members see projects they belong to).
- `POST /api/projects` - Create a new project. (*Admin only*)
- `GET /api/projects/:id` - Fetch project details, members list, and task statistics.
- `PUT /api/projects/:id` - Modify name/description. (*Admin only*)
- `DELETE /api/projects/:id` - Delete project and cascade-delete tasks. (*Admin only*)
- `POST /api/projects/:id/members` - Add a member to a project. (*Admin only*)
- `DELETE /api/projects/:id/members/:userId` - Remove a member from a project. (*Admin only*)

### 📋 Tasks (`/api/tasks`)
- `GET /api/tasks/projects/:projectId` - Fetch tasks for a project.
- `POST /api/tasks/projects/:projectId` - Create a task. (*Admin only*)
- `PUT /api/tasks/:id` - Edit task details. (*Admin only*)
- `PATCH /api/tasks/:id/status` - Update status of assigned task. (*Admin or Assigned Member*)
- `DELETE /api/tasks/:id` - Delete a task. (*Admin only*)

### ⚡ Dashboard (`/api/dashboard`)
- `GET /api/dashboard/stats` - Fetch overall stats, project progress percentages, and recent activities.

---

## 💻 Local Setup & Installation

### Prerequisites
- Node.js (v18+)
- npm

### 1. Database Setup & Seeding (Backend)
Navigate to the `backend` directory, install packages, and seed:
```bash
cd backend
npm install
npm run seed     # Sets up database.sqlite with prefilled projects, users, & tasks
npm start        # Launches backend server on http://localhost:5000
```

### 2. Frontend Development Server Setup
Open a new terminal window, navigate to the `frontend` directory, install packages, and run:
```bash
cd frontend
npm install
npm run dev      # Launches Vite server on http://localhost:5173
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## ☁️ Deployment Instructions (Railway)

To fulfill the mandatory deployment criteria, deploy the app on Railway:

### 1. Split Deployment Configuration
Since this is a monorepo structure containing separate frontend and backend directories, the cleanest strategy is to deploy them separately or configure Railway to build from subfolders.

#### Option A: Deploying Backend
1. Initialize a Git repository in `team-task-manager` and push to GitHub.
2. In Railway, click **New Project** -> **Deploy from GitHub repo**.
3. Select your repository.
4. Under **Settings** -> **Root Directory**, set it to `backend`.
5. Under **Environment Variables**, add:
   - `PORT=5000`
   - `JWT_SECRET=your_custom_jwt_secret_here`
6. Railway will automatically detect the Node environment and start `server.js`.

#### Option B: Deploying Frontend
1. On Railway, deploy the same GitHub repo.
2. Under **Settings** -> **Root Directory**, set it to `frontend`.
3. Set the build command to `npm run build` and output directory to `dist`.
4. Under **Environment Variables**, add:
   - `VITE_API_URL=https://your-backend-railway-url.railway.app` (This points your frontend axios requests to your live backend).
5. Deploy.

---

## 📹 Demo Video Outline

To prepare your 2–5 minute demo video:
1. **Introduction**: Introduce the role-based design and tech stack (React + Node.js + Express + SQLite).
2. **Demo Access Showcase**: Click the **Administrator** Quick Sign-in card. Show creating a project, assigning members, adding tasks on the Kanban board, and checking stats on the Dashboard.
3. **Role-Based Restriction Showcase**: Log out and click the **Team Member** Quick Sign-in card. Navigate to the Kanban board, show that members can only update task statuses for tasks assigned to them, and that admin panels/creation buttons are hidden.
4. **Contrast & Theme Review**: Scroll through the clean light theme and responsive grid layout.
