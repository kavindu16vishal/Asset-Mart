# Asset Mart

Smart IT Asset Management System.

## Forgot Password (Recovery Code) – Full Walkthrough

This project supports password recovery **without email** using **one-time recovery codes**, plus an **admin reset** fallback.

### What are Recovery Codes?

- Each user gets **10 recovery codes**.
- Each code works **only once**.
- Codes are shown **one time** after registration (UI popup). Save them somewhere safe.
- If codes are lost, an **admin must reset** the account.

---

## User flow: Reset password using a Recovery Code (no email)

### 1) Register and save your codes (first-time setup)

1. On the login screen, click **Register**.
2. Create your account.
3. After registration, you will see a popup titled **“Save your Recovery Codes”**.
4. Click **Copy codes** and store them securely (password manager / printed copy / secure notes).

### 2) Use “Forgot password?” to reset your password

1. On the login screen, click **Forgot password?**
2. Enter:
   - **Email**
   - **Recovery code** (example: `ABCD-EF12-3456`)
   - **New password**
   - **Confirm new password**
3. Click **Reset**.
4. Login using your email and the new password.

### 3) What happens to the recovery code?

- The code you used is **consumed** and cannot be used again.
- You can continue using the remaining codes for future resets.

---

## API flow (optional): Reset password via HTTP request

Endpoint:

- `POST /api/users/recovery/reset`

Body:

```json
{
  "email": "user@example.com",
  "recoveryCode": "ABCD-EF12-3456",
  "newPassword": "newpass123"
}
```

Success response:

```json
{ "message": "Password reset successful" }
```

---

## Admin flow: Reset a user (temporary password + new recovery codes)

Use this when a user:
- lost all recovery codes, or
- needs immediate access restored.

### 1) Reset from the Admin UI

1. Login as an admin.
2. Go to **User Management**.
3. Find the user.
4. Click the **Reset Password** (key icon) action.
5. A modal will show:
   - **Temporary password**
   - **New recovery codes (10)**
6. Share these securely with the user.

### 2) User logs in with the temporary password

The user can login using:
- their email
- the temporary password provided by the admin

They should then change the password from Settings (or you can add a forced “change password” step if desired).

---

## Notes / Security

- Recovery codes are stored in the database as **hashed values** (not plain text).
- The `/api/users/login` response does **not** return recovery codes.

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