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

## Admin flow: New recovery codes (login password unchanged)

Use the key icon in **User Management** when a user **lost their recovery codes** and needs a fresh set.

### 1) Regenerate codes from the Admin UI

1. Login as an admin.
2. Go to **User Management**.
3. Find the user.
4. Click **New recovery codes** (key icon).
5. A modal shows **10 new one-time recovery codes**. Share them securely with the user.

The user’s **account password is not changed**; they keep signing in with the same password as before.

### 2) Creating users in the Admin UI

**Add User** requires you to set an initial **password** (min. 6 characters). After the user is created, a one-time popup lists their **recovery codes** — same as self-registration.

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
- **Predictive risk (optional)**: Python 3, pandas, scikit-learn — trains from `data/training_snapshots_5000_VALIDATED.csv`, serves scores via `ml/predict_risk.py`

---

## 🚀 Setup Instructions

To get the project fully running locally, you will need to start both the Frontend application and the Backend API server in **two separate terminal windows**.

### Prerequisites
- [Node.js](https://nodejs.org/) (frontend + backend)  
- **Python 3.9+** (optional but recommended) for **predictive maintenance ML** scores. Without Python, the API still returns predictions using a built-in fallback.

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
3. Set up the Environment Variables in the `backend` folder (create a file named `.env` if it does not exist). You can start from `backend/.env.example`.
   - **AI Assistant** (optional but recommended for chat/issue analysis):
     ```env
     GEMINI_API_KEY=your_google_gemini_api_key_here
     ```
     *Alternatively, you can provide an OpenAI key (`OPENAI_API_KEY=your_openai_key`), and the backend will prioritize using ChatGPT.*
   - **Transactional email** (optional): see [Transactional email (SMTP)](#transactional-email-smtp) below. Until SMTP is configured, the API works normally and emails are skipped (a warning is logged).
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

## Transactional email (SMTP)

The backend can send **transactional** messages via **Nodemailer** when SMTP environment variables are set. If they are missing (or email is turned off), **nothing breaks**—the server logs that email is disabled and continues.

### What gets sent

| Event | Recipient | Content |
|--------|-----------|---------|
| Successful **sign-in** | The user who logged in | Confirmation with date/time and a short security note |
| **New issue** submitted | Every user with role `admin`, plus optional `ADMIN_NOTIFY_EMAILS` | Issue number, asset, type, priority, description, reporter details |
| Issue marked **Resolved** | The **reporter** (linked user) | Original report summary and resolution notice |

**Resolved** emails are sent only when:

- The issue’s status changes **to** `Resolved` (not already resolved), and  
- The issue has a **`reportedBy`** user with a valid **`users.email`** (the normal flow when a logged-in user submits a report).

### Configuration

1. Copy `backend/.env.example` to `backend/.env` (or merge the variables into your existing `.env`).
2. Set SMTP and sender (example for Gmail—use an [App password](https://support.google.com/accounts/answer/185833), not your normal login password):

   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-address@gmail.com
   SMTP_PASS=your-app-password
   MAIL_FROM="Saranga <your-address@gmail.com>"
   APP_NAME=Saranga
   ```

3. Optional — extra inboxes notified on **new issues only** (comma or semicolon separated):

   ```env
   ADMIN_NOTIFY_EMAILS=ops@company.com,lead@company.com
   ```

4. Restart the backend. On startup you should see either `Transactional email (SMTP) is enabled.` or a message that SMTP is not configured.

### Disabling email without removing variables

```env
EMAIL_ENABLED=false
```

---

## Features
- **Dashboard Overview**: View total assets, health status, and recent issues.
- **AI Chatbot**: Intelligent chatbot powered by Gemini/OpenAI capable of context-aware interaction.
- **Asset Management**: Full tracking of hardware inventory, warranty dates, and performance.
- **Predictive Maintenance**: Risk scores and timelines driven by a **trained ML model** (30‑day risk), with a rule-based fallback if Python or the model file is missing.
- **Issue Tracking**: Submit tickets for broken hardware and upload screenshots.
- **Email notifications** (optional SMTP): sign-in alert, new-issue alerts to admins, resolved-issue notice to the reporter.

---

## Predictive maintenance risk model (ML)

The **Predictive Maintenance** screen uses `GET /api/maintenance/predictions`. The backend loads asset data plus issue and maintenance history from SQLite, builds the same feature shape as the training CSV, and runs a **scikit-learn** model to estimate **30‑day risk** (returned as `confidenceScore` 0–99). Each item includes `mlPowered: true` when the model ran, or `false` when a heuristic fallback is used.

### Training data and layout

- **Dataset (reference copy):** `data/training_snapshots_5000_VALIDATED.csv`  
- **Scripts:** `ml/train_risk_model.py` (trains) · `ml/predict_risk.py` (inference, JSON stdin → probabilities)  
- **Saved model (after training):** `ml/models/risk_30d.joblib` · metadata: `ml/models/risk_30d_meta.json`  
- **Python dependencies:** `ml/requirements-ml.txt` (pandas, scikit-learn, joblib)

### Train or refresh the model

From the **repository root** (not `backend/`):

```bash
python -m pip install -r ml/requirements-ml.txt
python ml/train_risk_model.py
```

This reads the CSV in `data/`, fits a **RandomForest** pipeline, and overwrites the joblib in `ml/models/`. Retrain when you change the training file or want to improve on real production data.

### Runtime (Node + Python)

- The API resolves the project root, runs `python ml/predict_risk.py` with a JSON array of feature rows, and maps **class-1 probability** to the UI score.  
- If the model file is missing or Python fails, responses still work using the **heuristic** path (`mlPowered: false`).  
- On Windows, if `python` is not on `PATH`, set the **`PYTHON_PATH`** environment variable to your Python executable (e.g. `C:\Python311\python.exe`) when starting the backend.