# 🌱 CleanCity

> A community-driven waste management platform that enables citizens to report waste issues, locate recycling centers, and help municipalities monitor, prioritize, and resolve waste management problems through an interactive mapping system.

---

## 📖 About the Project

CleanCity is a collaborative full-stack web application developed to improve waste management and environmental awareness. Users can report waste issues with images and geolocation, while administrators manage reports through an analytics dashboard.

This repository is intended for both contributors and new team members joining the project.

> **Project Type:** Team Project

> **Development Style:** This project was **AI-assisted (Vibe Coded)**. AI tools accelerated development, while the team handled system design, implementation, debugging, testing, and validation.

---

# 🚀 Technologies Used

## Frontend

- React
- Tailwind CSS
- Leaflet.js

## Backend

- Supabase
- PostgreSQL
- Supabase Authentication
- Supabase Storage

## Development Tools

- Git
- GitHub
- VS Code

---

# ✨ Features

## User Features

- User Registration & Login
- Report waste with location
- Upload waste images
- Interactive waste map
- Recycling center locator
- Track report status

## Admin Features

- Admin dashboard
- Manage waste reports
- Update report status
- View analytics
- Monitor user reports
- Generate waste insights

---

# 🏗️ System Workflow

```text
User
 │
 ▼
Login / Register
 │
 ▼
Create Waste Report
 │
 ▼
Upload Image
 │
 ▼
Save Report to Supabase
 │
 ▼
Display on Interactive Map
 │
 ▼
Admin Reviews Report
 │
 ▼
Update Status
 │
 ▼
Dashboard Analytics
```

---

# 📂 Project Structure

```text
CleanCity/
│
├── public/
│
├── src/
│   │
│   ├── components/
│   │   ├── AdminDashboard.jsx
│   │   ├── Auth.jsx
│   │   ├── AuthModal.jsx
│   │   ├── CameraPermissionGuide.jsx
│   │   ├── ImageUpload.jsx
│   │   └── Map.jsx
│   │
│   ├── contexts/
│   │   └── AuthContext.jsx
│   │
│   ├── hooks/
│   │   └── useAdmin.js
│   │
│   ├── lib/
│   │   └── supabase.js
│   │
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
│
├── .gitignore
├── README.md
├── eslint.config.js
├── index.html
├── netlify.toml
├── package.json
├── package-lock.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

```
Architecture Overview

Frontend
├── components → UI components
├── contexts   → Global state management
├── hooks      → Reusable custom hooks
├── lib        → Supabase configuration
├── App.jsx    → Root component
└── main.jsx   → Application entry

Backend
└── Supabase
    ├── Authentication
    ├── PostgreSQL Database
    └── Storage
```
  ---


# 📚 What We Learned

Throughout this project, the team gained practical experience in:

- Full-stack web development
- React application architecture
- Backend development using Supabase
- Database design
- Authentication workflows
- Interactive maps using Leaflet
- Git collaboration
- Deploying production-ready applications
- AI-assisted software development

---

# ⚙️ Getting Started

## Prerequisites

Before running the project, install:

- Node.js (18+)
- npm
- Git

---

## Clone the Repository

```bash
git clone <repository-url>
```

---

## Navigate to the Project

```bash
cd CleanCity/frontend
```

---

## Install Dependencies

```bash
npm install
```

---

## Environment Variables

Create a `.env` file inside the frontend directory.

```env
VITE_SUPABASE_URL=your_supabase_url

VITE_SUPABASE_ANON_KEY=your_supabase_key
```

---

## Run the Project

```bash
npm run dev
```

Open your browser:

```
http://localhost:5173
```

---

# 🤝 Contributing

If you're a new contributor:

1. Fork the repository.
2. Create a feature branch.

```bash
git checkout -b feature/feature-name
```

3. Commit your changes.

```bash
git commit -m "Added new feature"
```

4. Push your branch.

```bash
git push origin feature/feature-name
```

5. Create a Pull Request.

---

# 📝 Future Improvements

- Mobile application
- AI waste classification
- Push notifications
- Route optimization
- Smart analytics
- IoT integration
- Multi-language support

---

# 📄 License

This project was developed for educational and demonstration purposes.

---

## 💚 Acknowledgements

Special thanks to the open-source community and the technologies that made this project possible.

- React
- Tailwind CSS
- Supabase
- Leaflet

---

## ⭐ Support

If you found this project useful, consider giving it a ⭐ on GitHub.
