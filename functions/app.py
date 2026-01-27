from werkzeug.utils import secure_filename
import io
import pdfplumber
import PyPDF2
import docx
from markdownify import markdownify as mdify

from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
import os
import sys
# Load environment variables from .env
from dotenv import load_dotenv
load_dotenv()

def read_md_file(filename):
    with open(filename, encoding='utf-8') as f:
        return f.read()

masterPrompt = read_md_file(os.path.join(os.path.dirname(__file__), 'masterPrompt.md'))
masterResume = read_md_file(os.path.join(os.path.dirname(__file__), 'masterResume.md'))
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from resumeService import saveJD, saveResumeDocx


app = Flask(__name__)
CORS(app)
client = genai.Client(api_key=os.getenv("GENAI_API_KEY"))

# --- Upload Resume Endpoint ---
# POST /api/upload-resume
# Accepts PDF or DOC/DOCX file, converts to Markdown, saves to masterResume.md
@app.route('/api/upload-resume', methods=['POST'])
def upload_resume():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    filename = secure_filename(file.filename)
    ext = os.path.splitext(filename)[1].lower()
    text = ''
    try:
        if ext == '.pdf':
            with pdfplumber.open(io.BytesIO(file.read())) as pdf:
                text = '\n'.join(page.extract_text() or '' for page in pdf.pages)
        elif ext in ['.doc', '.docx']:
            doc = docx.Document(io.BytesIO(file.read()))
            text = '\n'.join([p.text for p in doc.paragraphs])
        else:
            return jsonify({'error': 'Unsupported file type'}), 400
        # Convert to Markdown
        md = mdify(text)
        md_path = os.path.join(os.path.dirname(__file__), 'masterResume.md')
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write(md)
        return jsonify({'message': 'Resume uploaded and converted to Markdown.'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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
