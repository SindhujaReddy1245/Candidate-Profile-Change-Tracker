# Candidate Profile Change Tracker

A full-stack application for uploading candidate resumes, extracting profile signals, comparing resume versions, and classifying detected profile changes.

## Repository

GitHub repository:

https://github.com/SindhujaReddy1245/Candidate-Profile-Change-Tracker

## Features

- User registration and login
- Supabase PostgreSQL database integration
- Resume PDF upload
- Resume text extraction using `pdfplumber`
- Rule-based and NLP-style comparison
- Change classification by severity
- User-specific dashboard and upload history
- Login audit tracking

## Tech Stack

- Frontend: React, React Router, Axios
- Backend: FastAPI, SQLAlchemy
- Database: Supabase PostgreSQL
- Resume parsing: pdfplumber
- Comparison: rule-based extraction, text similarity, section comparison

## Database Tables

The application uses these tables:

- `users`
- `login_audit`
- `candidates`
- `resumes`
- `changes`

The SQL schema is available in:

```text
database/init.sql
```

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/SindhujaReddy1245/Candidate-Profile-Change-Tracker.git
cd Candidate-Profile-Change-Tracker
```

### 2. Backend setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create a local `.env` file inside the `backend` folder:

```env
DATABASE_URL=your_supabase_postgres_connection_url
SUPABASE_URL=your_supabase_project_url
SUPABASE_REST_URL=your_supabase_rest_url
```

Run the backend:

```bash
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Backend URL:

```text
http://127.0.0.1:8000
```

### 3. Frontend setup

Open a new terminal:

```bash
cd frontend
npm install
npm start
```

Frontend URL:

```text
http://localhost:3000
```

## How To Use

1. Open the frontend.
2. Create a new account using the Sign Up tab.
3. Log in with the created account.
4. Upload the first resume. This becomes the baseline.
5. Upload another resume for the same user.
6. View extracted resume details, comparison changes, and overall status on the dashboard.

## Resume Comparison Approach

The application uses a combination of rule-based and NLP-style techniques:

- Regex extraction for email and phone number
- Keyword matching for technical skills
- Section detection for summary, experience, education, projects, and certifications
- Text similarity using sequence matching
- Word-level added/removed summary
- Rule-based severity classification

Change classifications include:

- Critical
- Important
- Moderate
- Minor

The dashboard also shows an overall comparison status, such as:

- Baseline Created
- Critical Review Required
- Important Changes Found
- No Differences Detected

## Assumptions and Trade-offs

- The first uploaded resume for a user is treated as the baseline.
- Comparison happens between the latest resume and the previous resume uploaded by the same user.
- Resume files are currently stored locally by the backend, while resume metadata and extracted data are stored in Supabase PostgreSQL.
- The extraction logic is explainable and rule-based, which is easier to evaluate and debug.
- A full AI/LLM-based classifier can be added later for deeper semantic comparison.
- Authentication is simplified for project/demo use and does not use JWT/session cookies yet.
- Passwords are hashed before storing in the database.

## AI Tools Used

AI assistance was used during development to:

- Design the full-stack project structure
- Implement FastAPI endpoints
- Build React screens and dashboard UI
- Create the Supabase/PostgreSQL schema
- Improve resume comparison logic
- Add rule-based and NLP-style change classification
- Debug login, database, and GitHub setup issues
- Prepare this submission README

AI was used as a coding assistant. The final implementation was tested locally before submission.

## Automated Tests and Verification

Automated test coverage is limited in the current version. The following verification commands were run:

```bash
python -m compileall backend
```

```bash
cd frontend
npm run build
```

Verified manually:

- User signup saves data in Supabase
- Login works and writes to `login_audit`
- Resume upload saves metadata in `resumes`
- Comparison results save in `changes`
- Dashboard changes based on the logged-in user
- Frontend builds successfully
- Backend starts successfully

## Optional Deployment

Deployment is optional. The application currently runs locally.

Recommended deployment approach:

- Frontend: Vercel or Netlify
- Backend: Render, Railway, or Fly.io
- Database: Supabase PostgreSQL

## Submission

Submit the GitHub repository link:

```text
https://github.com/SindhujaReddy1245/Candidate-Profile-Change-Tracker
```
