# resume_analyzer.py
import os
import re
import string
import json
import PyPDF2
import docx
from dotenv import load_dotenv
from google import genai

# Load environment variables
load_dotenv()

# Configure Gemini API
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

def extract_text_from_pdf(pdf_path):
    text = ""
    try:
        with open(pdf_path, "rb") as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"Error reading PDF file: {e}")
    return text

def extract_text_from_docx(docx_path):
    text = ""
    try:
        doc = docx.Document(docx_path)
        for para in doc.paragraphs:
            text += para.text + "\n"
    except Exception as e:
        print(f"Error reading DOCX file: {e}")
    return text

def extract_text(file_path):
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext in [".docx", ".doc"]:
        return extract_text_from_docx(file_path)
    else:
        raise ValueError("Unsupported file format. Please use PDF or DOCX.")

def preprocess_text(text):
    text = text.lower()
    text = text.translate(str.maketrans("", "", string.punctuation))
    text = re.sub(r'\s+', ' ', text)
    return text

def extract_score(result, score_type):
    """
    Extracts the score for a specific score type (Frontend/Backend) from the result.
    Example: "Frontend Score: 80"
    """
    try:
        pattern = rf"{score_type}\s*Score\s*:\s*(\d+)"
        match = re.search(pattern, result, re.IGNORECASE)
        if match:
            return int(match.group(1))
        else:
            print(f"[ERROR] {score_type} not found in the response.")
            return 0
    except Exception as e:
        print(f"[ERROR] Error extracting score: {str(e)}")
        return 0

def analyze_with_gemini(resume_file_path):
    """
    Uses Gemini via the available 'generate' method in google-generativeai to analyze the resume text.
    """
    try:
        resume_text = extract_text(resume_file_path)

        prompt = f"""
        Analyze the following resume text and critically assess the candidate's proficiency in both Frontend and Backend development based on their demonstrated experience, technologies, projects, and methodologies. 

        ### **Scoring Criteria:**  
        - **Frontend Score (1-100)**: Evaluate based on **depth and variety** of frontend skills, including but not limited to programming languages, libraries, frameworks, UI/UX principles, performance optimization, accessibility, responsive design, and client-side development best practices. Consider both **breadth (diverse skills)** and **depth (expert-level proficiency in specific areas)**.  
        - **Backend Score (1-100)**: Evaluate based on **depth and variety** of backend skills, including but not limited to programming languages, databases, cloud infrastructure, API development, authentication, security practices, performance optimization, and system architecture. Consider both **practical implementation experience** and **advanced knowledge of backend systems**.

        ### **Important Evaluation Notes:**  
        - **Do not assume proficiency** based on keyword presence alone. Consider the **quality and depth of experience** mentioned.  
        - Assign **realistic scores**: A **junior-level candidate** should not score near 100, and even experienced professionals should have reasonable gaps.  
        - Be **objective and critical** rather than overly generous.  
        - If there is **little or no evidence** of experience in a category, assign a low score.  

        ### **Output Format (No extra text, only scores):**  
        Frontend Score: <score>  
        Backend Score: <score>  

        ### **Resume Text:**  
        {resume_text}
        """

        response = client.models.generate_content(
            model="gemini-2.0-flash",  
            contents=prompt
        )
        
        if response and response.text:
            gemini_result = response.text  
            print(f"[DEBUG] Gemini Response: {gemini_result}")
            
            gemini_frontend_score = extract_score(gemini_result, "frontend")
            gemini_backend_score = extract_score(gemini_result, "backend")
            
            return gemini_frontend_score, gemini_backend_score
        else:
            print("[ERROR] Failed to get valid response from Gemini.")
            return 0, 0
    except Exception as e:
        print(f"[ERROR] Error analyzing with Gemini: {str(e)}")
        return 0, 0

def analyze_resume(file_path):
    """
    Analyzes a resume file and returns frontend and backend scores.
    """
    print(f"\n[DEBUG] Starting resume analysis for file: {file_path}")
    
    gemini_frontend_score, gemini_backend_score = analyze_with_gemini(file_path)
    
    final_frontend_score = gemini_frontend_score
    final_backend_score = gemini_backend_score
    
    print(f"[DEBUG] Resume Analysis - Frontend Score: {final_frontend_score}/100")
    print(f"[DEBUG] Resume Analysis - Backend Score: {final_backend_score}/100")
    
    return {
        "frontend_score": final_frontend_score, 
        "backend_score": final_backend_score
    }