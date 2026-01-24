
# ResumeTailor.AI

A local-first, AI-powered resume generator that helps you craft professional, ATS-optimized resumes tailored to any job description. Built with a React (Vite) frontend and a Python (Flask) backend using Google Gemini (GenAI) for AI resume generation.

---

## Features
- **AI Resume Generation:** Uses Google Gemini (GenAI) to rewrite and optimize your resume for any job description.
- **Live Markdown Preview:** See your AI-generated resume in a clean, professional preview before saving.
- **Local File Storage:** Saves job descriptions and resumes to your local drive (S:/applications/...)( Note: change the drive in your code as per your need )
- **Modular Backend:** Easily switch between GenAI and ChatGPT/OpenAI in the future.
- **No Cloud Storage:** All data stays on your machine.

---

## Project Structure
```
project_applications/
├── functions/           # Backend (Python Flask)
│   ├── app.py           # Main Flask API server
│   ├── resumeService.py # File save helpers (Python)
│   ├── masterPrompt.py  # AI prompt template (Python)
│   ├── masterResume.py  # (Optional) Master resume data (Python)
│   └── ...
├── src/                # Frontend (React)
│   ├── App.jsx          # Main React app
│   └── ...
├── public/             # Static assets
├── .env                # Environment variables (API keys, etc.)
└── README.md           # This file
```

---

## Prerequisites
- **Python 3.8+** (for backend)
- **Node.js 16+** (for frontend)
- **Google Gemini API Key** (for GenAI)

---

## Setup & Run

### 1. Backend (Python Flask)
1. Open a terminal in `project_applications/functions`.
2. Install dependencies:
	```
	pip install flask flask-cors google-genai
	```
3. Set your Gemini API key in `.env` (or directly in `app.py`):
	```
	GENAI_API_KEY=your-google-genai-api-key
	```
4. Run the backend:
	```
	python app.py
	```
	The backend will start on [http://localhost:3000](http://localhost:3000)

### 2. Frontend (React)
1. Open a terminal in `project_applications`.
2. Install dependencies:
	```
	npm install
	```
3. Start the frontend:
	```
	npm run dev
	```
	The frontend will start on [http://localhost:5173](http://localhost:5173)

---

## How It Works
- Enter the company, role, and job description in the React UI.
- The frontend sends your data to the Flask backend (`/api/generate-resume`).
- The backend uses Google Gemini (GenAI) to generate a tailored resume in markdown.
- The frontend displays a live, professional preview.
- You can save the resume locally for future use.

---

## Switching to ChatGPT/OpenAI (Future)
- The backend is modular: you can swap out the GenAI logic for OpenAI/ChatGPT by updating the backend implementation.
- The frontend API contract will remain the same.

---

## Notes
- All files are saved locally (S:/applications/...).
- No data is sent to any cloud storage except for AI API calls.
- For best results, use a valid Google Gemini API key.

---
