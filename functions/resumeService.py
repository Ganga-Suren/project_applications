import os
from datetime import datetime

def saveJD(company, role, jobDescription):
    safe_company = ''.join(c if c.isalnum() else '_' for c in company)
    safe_role = ''.join(c if c.isalnum() else '_' for c in role)
    folder_path = os.path.join('S:', 'applications', safe_company, safe_role)
    os.makedirs(folder_path, exist_ok=True)
    now = datetime.now()
    mdd = f"{now.month:02}{now.day:02}"
    jd_file_path = os.path.join(folder_path, f"jd{mdd}.txt")
    with open(jd_file_path, "w", encoding="utf-8") as f:
        f.write(jobDescription)
    return jd_file_path

def saveResumeDocx(company, role, resumeMarkdown):
    safe_company = ''.join(c if c.isalnum() else '_' for c in company)
    safe_role = ''.join(c if c.isalnum() else '_' for c in role)
    folder_path = os.path.join('S:', 'applications', safe_company, safe_role)
    os.makedirs(folder_path, exist_ok=True)
    now = datetime.now()
    mdd = f"{now.month:02}{now.day:02}"
    resume_file_name = f"resume{mdd}.docx"
    resume_file_path = os.path.join(folder_path, resume_file_name)
    # For now, just save the markdown as plain text. You can add DOCX logic later.
    with open(resume_file_path, "w", encoding="utf-8") as f:
        f.write(resumeMarkdown)
    return resume_file_path
