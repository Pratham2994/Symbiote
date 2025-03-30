from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Body
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import json
from dotenv import load_dotenv
from Resume_github_score import analyze_resume, analyze_github
from Eq_score import calculate_eq_score
from match_score import MatchScoreCalculator

# Load environment variables
load_dotenv()

app = FastAPI()


# Initialize the calculator once as a global variable
match_calculator = MatchScoreCalculator()

@app.post("/calculate-match")
async def calculate_match(
    candidate1_scores: dict = Body(
        ...,
        example={
            "frontend": 90,
            "backend": 20,
            "eq": 50
        },
        description="First candidate's scores"
    ),
    candidate2_scores: dict = Body(
        ...,
        example={
            "frontend": 20,
            "backend": 90,
            "eq": 50
        },
        description="Second candidate's scores"
    ),
    weights: dict = Body(
        None,
        example={
            "frontend": 0.375,
            "backend": 0.375,
            "eq": 0.25
        },
        description="Optional custom weights for each parameter"
    )
):
    try:
        # Create a new calculator with custom weights if provided
        calculator = MatchScoreCalculator(weights) if weights else match_calculator
        
        # Calculate the match score
        match_score = calculator.calculate_combined_score(
            candidate1_scores,
            candidate2_scores
        )
        
        return {
            "match_score": match_score,
            "candidate1_scores": candidate1_scores,
            "candidate2_scores": candidate2_scores,
            "weights_used": calculator.weights
        }

    except Exception as e:
        print(f"Error in calculate_match: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


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
        print("\n[DEBUG] Starting candidate analysis")
        print(f"[DEBUG] Received GitHub link: {github_link}")
        print(f"[DEBUG] Received EQ answers: {eq_answers}")

        # Save the uploaded resume temporarily
        temp_resume_path = "temp_resume.pdf"
        print(f"[DEBUG] Saving resume to temporary path: {temp_resume_path}")
        with open(temp_resume_path, "wb") as buffer:
            content = await resume.read()
            buffer.write(content)

        # Analyze resume
        print("[DEBUG] Starting resume analysis")
        resume_analysis = analyze_resume(temp_resume_path)
        print(f"[DEBUG] Resume analysis results: {resume_analysis}")
        
        # Analyze GitHub if a link is provided and extract only frontend/backend scores
        github_analysis = None
        if github_link:
            print("[DEBUG] Starting GitHub analysis")
            github_data = analyze_github(github_link)
            print(f"[DEBUG] GitHub analysis results: {github_data}")
            
            if "error" in github_data:
                print(f"[ERROR] GitHub analysis failed: {github_data['error']}")
                github_analysis = {"frontend_score": None, "backend_score": None}
            else:
                github_analysis = {
                    "frontend_score": github_data.get("frontend_score"),
                    "backend_score": github_data.get("backend_score")
                }
                print(f"[DEBUG] Extracted GitHub scores: {github_analysis}")
        
        # Compute final EQ score if EQ answers are provided
        final_eq_score = None
        if eq_answers:
            try:
                print("[DEBUG] Processing EQ answers")
                eq_dict = json.loads(eq_answers)
                # Ensure all keys are in the correct format (Q1, Q2, Q3, Q4)
                formatted_eq_dict = {}
                for key, value in eq_dict.items():
                    formatted_key = key if key.startswith('Q') else f"Q{key.replace('q', '')}"
                    formatted_eq_dict[formatted_key] = value
                
                print(f"[DEBUG] Formatted EQ answers: {formatted_eq_dict}")
                # calculate_eq_score returns a tuple: (breakdown, final_score)
                _, final_eq_score = calculate_eq_score(formatted_eq_dict)
                print(f"[DEBUG] Calculated EQ score: {final_eq_score}")
            except Exception as e:
                print(f"[ERROR] Failed to process EQ answers: {e}")
                print(f"[DEBUG] Raw EQ answers: {eq_answers}")
                final_eq_score = None

        # Clean up temporary resume file
        print("[DEBUG] Cleaning up temporary resume file")
        os.remove(temp_resume_path)
        
        # Compute combined final scores using weight: GitHub = 2, Resume = 1.
        final_frontend = None
        final_backend = None
        
        # Handle resume scores first
        if resume_analysis:
            final_frontend = resume_analysis.get("frontend_score", 0)
            final_backend = resume_analysis.get("backend_score", 0)
            print(f"[DEBUG] Initial scores from resume - Frontend: {final_frontend}, Backend: {final_backend}")
        
        # Add GitHub scores if available
        if github_analysis and not github_analysis.get("error"):
            github_frontend = github_analysis.get("frontend_score")
            github_backend = github_analysis.get("backend_score")
            
            if github_frontend is not None and github_backend is not None:
                # If we have both resume and GitHub scores, combine them
                if final_frontend is not None and final_backend is not None:
                    final_frontend = (github_frontend * 2 + final_frontend * 1) / 3
                    final_backend = (github_backend * 2 + final_backend * 1) / 3
                else:
                    # If we only have GitHub scores, use them directly
                    final_frontend = github_frontend
                    final_backend = github_backend
                
                print(f"[DEBUG] Combined scores with GitHub - Frontend: {final_frontend}, Backend: {final_backend}")
            else:
                print("[DEBUG] GitHub scores were null, keeping resume scores only")

        # Ensure we have at least 0 scores if everything failed
        if final_frontend is None:
            final_frontend = 0
        if final_backend is None:
            final_backend = 0

        # Prepare response with three scores
        response = {
            "final_frontend": round(final_frontend, 2),
            "final_backend": round(final_backend, 2),
            "final_eq_score": final_eq_score
        }
        print(f"[DEBUG] Final response: {response}")

        return response

    except Exception as e:
        print(f"[ERROR] Exception in analyze_candidate: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "_main_":
    uvicorn.run(app, host="0.0.0.0", port=8000)