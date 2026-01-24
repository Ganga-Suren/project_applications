from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from resumeService import saveJD, saveResumeDocx

app = Flask(__name__)
CORS(app)
client = genai.Client(api_key=os.getenv("GENAI_API_KEY", "AIzaSyBdp01i-FotDWLMIXKTeBOmUfHTyfVyRK0"))

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
    prompt = f"Generate a professional resume in markdown for the following job:\nCompany: {company}\nRole: {role}\nJob Description: {job_desc}"
    response = client.models.generate_content(
        model="models/gemini-2.5-flash",
        contents=prompt
    )
    return jsonify({"resumeMarkdown": response.text})

@app.route('/api/save-resume', methods=['POST'])
def save_resume():
    data = request.json
    company = data.get('companyName')
    role = data.get('role')
    resume_markdown = data.get('resumeMarkdown')
    if not company or not role or not resume_markdown:
        return jsonify({"error": "companyName, role, and resumeMarkdown are required."}), 400
    resume_path = saveResumeDocx(company=company, role=role, resumeMarkdown=resume_markdown)
    return jsonify({"message": "Resume saved", "resumePath": resume_path})

if __name__ == '__main__':
    app.run(port=3000)
