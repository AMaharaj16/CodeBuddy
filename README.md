# 🚀 CodeBuddy

**CodeBuddy** is a full-stack web application that analyzes the **time and memory complexity** of JavaScript functions.

It allows users to:
- 🧠 Paste in custom JavaScript code
- 🧪 Provide custom test inputs
- 🔁 Automatically scale input sizes
- 📈 Visualize runtime performance
- 📊 Visualize memory usage
- ⚡ Benchmark performance dynamically

Built with a modern dark-themed UI and real-time graph visualization. The backend executes functions inside a sandboxed virtual machine (VM) to safely measure execution time and memory usage for each test input.

---

## ✨ Features

- Runtime benchmarking
- Memory usage tracking
- Scatter plot visualization (Input Size vs Time)
- Scatter plot visualization (Input Size vs Memory)
- Dynamic input scaling
- Clean, responsive dark UI

---

## 🛠 Tech Stack

### Frontend
- React
- Chart.js (Scatter plots)
- Modern CSS styling

### Backend
- Node.js
- Express

---


- **frontend/** → React application (UI + graph rendering)
- **backend/** → Node/Express API for executing and benchmarking code

---

## ▶️ How to Run CodeBuddy

You must run both the frontend and backend servers simultaneously.

---

### Step 1 — Start the Frontend

Open a terminal in the root directory and run:

```bash
cd frontend
npm install
npm run dev
```

### Step 2 — Start the Backend

Open another terminal in the root directory and run:

```bash
cd backend
npm start
```

Both terminals must run synchronously.

### Step 3 - Open CodeBuddy

Click on the link in the frontend terminal to open CodeBuddy in your browser. CodeBuddy will now be fully running and ready to analyze your JavaScript functions!
