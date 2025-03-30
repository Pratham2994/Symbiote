from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import json
from dotenv import load_dotenv
from Resume_github_score import analyze_resume, analyze_github
from Eq_score import calculate_eq_score

# Load environment variables
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze")
async def analyze_candidate(
    resume: UploadFile = File(..., description="Upload the candidate's resume (PDF or DOCX)"),
    github_link: str = Form(None, example="https://github.com/example", description="GitHub profile link"),
    eq_answers: str = Form(
        None,
        example='{ "Q1": 3, "Q2": 2, "Q3": 4, "Q4": 1 }',
        description="JSON string with EQ answers"
    )
):
    try:
        # Save the uploaded resume temporarily
        temp_resume_path = "temp_resume.pdf"
        with open(temp_resume_path, "wb") as buffer:
            content = await resume.read()
            buffer.write(content)

        # Analyze resume
        resume_analysis = analyze_resume(temp_resume_path)
        
        # Analyze GitHub if a link is provided and extract only frontend/backend scores
        github_analysis = None
        if github_link:
            github_data = analyze_github(github_link)
            if "error" in github_data:
                github_analysis = {"frontend_score": None, "backend_score": None}
            else:
                github_analysis = {
                    "frontend_score": github_data.get("frontend_score"),
                    "backend_score": github_data.get("backend_score")
                }
        
        # Compute final EQ score if EQ answers are provided
        final_eq_score = None
        if eq_answers:
            try:
                eq_dict = json.loads(eq_answers)
                # Ensure all keys are in the correct format (Q1, Q2, Q3, Q4)
                formatted_eq_dict = {}
                for key, value in eq_dict.items():
                    formatted_key = key if key.startswith('Q') else f"Q{key.replace('q', '')}"
                    formatted_eq_dict[formatted_key] = value
                
                # calculate_eq_score returns a tuple: (breakdown, final_score)
                _, final_eq_score = calculate_eq_score(formatted_eq_dict)
                print(f"Processed EQ answers: {formatted_eq_dict}")
                print(f"Calculated EQ score: {final_eq_score}")
            except Exception as e:
                print(f"Error processing EQ answers: {e}")
                print(f"Raw EQ answers: {eq_answers}")
                final_eq_score = None

        # Clean up temporary resume file
        os.remove(temp_resume_path)
        
        # Compute combined final scores using weight: GitHub = 2, Resume = 1.
        final_frontend = None
        final_backend = None
        if github_analysis and resume_analysis:
            if github_analysis.get("frontend_score") is not None and resume_analysis.get("frontend_score") is not None:
                final_frontend = (github_analysis["frontend_score"] * 2 + resume_analysis["frontend_score"] * 1) / 3
            if github_analysis.get("backend_score") is not None and resume_analysis.get("backend_score") is not None:
                final_backend = (github_analysis["backend_score"] * 2 + resume_analysis["backend_score"] * 1) / 3

        # Prepare response with three scores
        response = {
            "final_frontend": final_frontend,
            "final_backend": final_backend,
            "final_eq_score": final_eq_score
        }

        return response

    except Exception as e:
        print(f"Error in analyze_candidate: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "_main_":
    uvicorn.run(app, host="0.0.0.0", port=8000)