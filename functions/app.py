
from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
import os
import sys
# Load environment variables from .env
from dotenv import load_dotenv
load_dotenv()
from masterPrompt import masterPrompt
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from resumeService import saveJD, saveResumeDocx
from masterResume import masterResume


app = Flask(__name__)
CORS(app)
client = genai.Client(api_key=os.getenv("GENAI_API_KEY"))

@app.route('/api/save-jd', methods=['POST'])
def save_jd():
    data = request.json
    job_desc = data.get('jobDescription')
    company = data.get('companyName')
    role = data.get('role')
    if not job_desc or not company or not role:
        return jsonify({"error": "Job description, company name, and role are required."}), 400
    jd_path = saveJD(company=company, role=role, jobDescription=job_desc)
    return jsonify({"message": "JD saved", "jdPath": jd_path})

@app.route('/api/generate-resume', methods=['POST'])
def generate_resume():
    data = request.json
    job_desc = data.get('jobDescription')
    company = data.get('companyName')
    role = data.get('role')
    if not job_desc or not company or not role:
        return jsonify({"error": "Job description, company name, and role are required."}), 400
    prompt = (
        f"{masterPrompt}\n"
        f"Company: {company}\n"
        f"Role: {role}\n"
        f"Job Description: {job_desc}\n"
        f"My Current Resume:\n{masterResume}"
    )
    response = client.models.generate_content(
        model="models/gemini-2.5-flash",
        contents=prompt
    )
    return jsonify({"resumeMarkdown": response.text})


# --- Save Resume Endpoint ---
# POST /api/save-resume
# Converts current resume.md to DOCX, saves to /output/resumes/<company>_<role>.docx, returns success status
@app.route('/api/save-resume', methods=['POST'])
def save_resume():
    data = request.json
    company = data.get('companyName')
    role = data.get('role')
    resume_markdown = data.get('resumeMarkdown')
    if not company or not role or not resume_markdown:
        return jsonify({"error": "companyName, role, and resumeMarkdown are required."}), 400

    # Save DOCX to disk using the same logic as saveJD
    from resumeService import saveResumeDocx
    resume_path = saveResumeDocx(company, role, resume_markdown)
    return jsonify({"message": "Resume saved", "resumePath": resume_path})

if __name__ == '__main__':
    app.run(port=3000)
