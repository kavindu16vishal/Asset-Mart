# Asset Mart 🏢

Asset Mart is a comprehensive IT Asset Management application designed to track hardware assets, report issues, schedule predictive maintenance, and assist users through a built-in AI Chatbot.

## Technology Stack
- **Frontend**: React, Vite, Tailwind CSS, Radix UI 
- **Backend**: Node.js, Express.js, SQLite
- **AI Integration**: Google Gemini API & OpenAI 

---

## 🚀 Setup Instructions

To get the project fully running locally, you will need to start both the Frontend application and the Backend API server in **two separate terminal windows**.

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### 1. Backend Setup (Database & API)
The backend uses SQLite. When you start the server for the first time, it will automatically create the database (`database.sqlite`) and seed it with dummy data.

1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install the backend dependencies:
   ```bash
   npm install
   ```
3. Set up the Environment Variables for the **AI Assistant**:
   - Inside the `backend` folder, create a file named `.env`
   - Add your preferred AI provider's API key:
     ```env
     GEMINI_API_KEY=your_google_gemini_api_key_here
     ```
     *Alternatively, you can provide an OpenAI key (`OPENAI_API_KEY=your_openai_key`), and the backend will prioritize using ChatGPT.*
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The backend should now run on `http://localhost:5000`.*

### 2. Frontend Setup (React App)
1. Open a **new, separate terminal** in the root directory (`Asset Mart`).
2. Install the frontend dependencies:
   ```bash
   npm install
   ```
3. Start the frontend application:
   ```bash
   npm run dev
   ```
   *Your browser will usually open automatically to `http://localhost:5173`.*

---

## Features
- **Dashboard Overview**: View total assets, health status, and recent issues.
- **AI Chatbot**: Intelligent chatbot powered by Gemini/OpenAI capable of context-aware interaction.
- **Asset Management**: Full tracking of hardware inventory, warranty dates, and performance.
- **Predictive Maintenance**: Identifies battery degradations, overheating risks, and parts wear based on AI scores.
- **Issue Tracking**: Submit tickets for broken hardware and upload screenshots.