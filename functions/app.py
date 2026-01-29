from werkzeug.utils import secure_filename
import io
import os
import re
import sys

import docx
import pdfplumber
import PyPDF2
from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
from markdownify import markdownify as mdify
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


def normalize_resume(text: str) -> str:
    """Strip markdown/noise while keeping ordering for fair ATS scoring."""
    if not text:
        return ''
    ascii_text = text.encode('ascii', 'ignore').decode()
    cleaned_lines = []
    for line in ascii_text.splitlines():
        line = re.sub(r'^\s*[-*+]\s+', '', line)  # drop bullet markers
        line = re.sub(r'^\s*[#>]+\s*', '', line)  # drop headings/quotes
        line = line.replace('**', '').replace('`', '')
        line = re.sub(r'_+', ' ', line)
        line = ' '.join(line.split())  # collapse whitespace but keep line order
        cleaned_lines.append(line)
    # remove repeated blank lines to keep structure light
    result = []
    last_blank = False
    for line in cleaned_lines:
        if not line:
            if last_blank:
                continue
            last_blank = True
            result.append('')
        else:
            last_blank = False
            result.append(line)
    return '\n'.join(result).strip()


def _tokenize(text: str):
    stop = {
        'and', 'or', 'the', 'a', 'an', 'for', 'with', 'to', 'of', 'in', 'on',
        'at', 'by', 'as', 'is', 'are', 'was', 'were', 'be', 'this', 'that', 'it'
    }
    return {t for t in re.findall(r'[a-zA-Z]{3,}', text.lower()) if t not in stop}


def compute_keyword_metrics(jd_text: str, resume_text: str):
    jd_tokens = _tokenize(jd_text)
    resume_tokens = _tokenize(resume_text)
    if not jd_tokens:
        return {'coverage': 0.0, 'alignment': 0.0}
    matched = jd_tokens & resume_tokens
    coverage = len(matched) / len(jd_tokens)
    # reuse coverage as a lightweight alignment proxy for now
    return {'coverage': coverage, 'alignment': coverage}


def extract_years(text: str) -> int:
    years = [int(m) for m in re.findall(r'(\d+)\s*\+?\s*(?:years?|yrs)', text.lower())]
    return max(years) if years else 0

@app.route('/api/ats-score', methods=['POST'])
def ats_score():
    data = request.json
    jd = data.get('jobDescription')
    resume = data.get('resumeMarkdown')
    if not jd or not resume:
        return jsonify({'error': 'Job description and resume are required.'}), 400

    normalized_jd = normalize_resume(jd)
    normalized_resume = normalize_resume(resume)
    keyword_meta = compute_keyword_metrics(normalized_jd, normalized_resume)  # internal use only
    jd_years = extract_years(normalized_jd)
    resume_years = extract_years(normalized_resume)

    prompt = f"""
You are a modern ATS used by companies like Oracle, Google, and Amazon.
Evaluate the candidate resume against the job description.
Do not punish formatting, markdown, or minor keyword variations.
Treat close equivalents as matches (e.g., Java≈C#, REST≈APIs, PyTorch≈TensorFlow, AWS≈Azure≈GCP).
Score factors: core skill match, experience relevance, role alignment, and keyword coverage (semantic, not repetition).
Output: ONLY one integer from 0 to 100. No text or units.

Job Description:
{normalized_jd}

Resume:
{normalized_resume}

Score:
"""
    try:
        response = client.models.generate_content(
            model="models/gemini-2.5-flash",
            contents=prompt
        )
        raw_text = response.text if hasattr(response, 'text') else ''
        match = re.search(r'-?\d{1,3}', raw_text)
        if not match:
            return jsonify({'error': 'Could not extract ATS score from AI response.'}), 500

        score = int(match.group(0))
        score = max(0, min(100, score))

        # Guardrails: ensure fair floor when coverage is strong and reward depth of experience.
        if keyword_meta.get('coverage', 0) >= 0.75:
            score = max(score, 70)
        if resume_years and jd_years and resume_years > jd_years:
            score = min(100, max(score, score + 5))

        # Internal metadata ready for future UX (not returned now)
        _ = {
            'coverage_pct': round(keyword_meta.get('coverage', 0) * 100, 2),
            'alignment_pct': round(keyword_meta.get('alignment', 0) * 100, 2),
        }

        return jsonify({'atsScore': score})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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
