
from google import genai
import os

client = genai.Client(api_key=os.getenv("GENAI_API_KEY"))

# models = client.models.list()

# print("AVAILABLE MODELS FOR THIS API KEY:\n")
# for model in models:
#     print(f"- {model.name}")
#     if hasattr(model, "supported_generation_methods"):
#         print(f"  supported methods: {model.supported_generation_methods}")

response = client.models.generate_content(
    model="models/gemini-2.5-flash",
    contents="""
Generate a professional resume in markdown for the following job:
Company: Example Company
Role: Software Engineer
Job Description: We are looking for a skilled software engineer with experience in full-stack development, cloud services, and agile methodologies.
"""
)

print(response.text)