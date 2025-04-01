# combined_analyzer.py
import os
from dotenv import load_dotenv
from resume_analysis import analyze_resume
from github_analysis import analyze_github, extract_username

# Load environment variables
load_dotenv()

def combined_analysis(resume_file: str, github_url: str, weight_github: int = 2, weight_resume: int = 1):
    """
    Combines the resume and GitHub analysis to provide a comprehensive skill assessment.
    
    Args:
        resume_file: Path to the resume file (PDF or DOCX)
        github_url: URL to the GitHub profile
        weight_github: Weight given to GitHub scores (default 2)
        weight_resume: Weight given to resume scores (default 1)
        
    Returns:
        Dict containing the final frontend and backend scores
    """
    try:
        # Extract GitHub username
        username = extract_username(github_url)
        print(f"Analyzing GitHub profile for user: {username}")
        
        # Analyze resume
        print(f"Analyzing resume file: {resume_file}")
        resume_results = analyze_resume(resume_file)
        
        # Analyze GitHub profile
        github_results = analyze_github(github_url)
        
        if "error" in github_results:
            print(f"[ERROR] GitHub analysis failed: {github_results['error']}")
            return {"error": github_results["error"]}
        
        # Calculate weighted average scores
        final_frontend = (github_results["frontend_score"] * weight_github + resume_results["frontend_score"] * weight_resume) / (weight_github + weight_resume)
        final_backend = (github_results["backend_score"] * weight_github + resume_results["backend_score"] * weight_resume) / (weight_github + weight_resume)
        
        print("\nCombined Final Scores")
        print(f"Combined Frontend Score: {final_frontend:.1f}/100")
        print(f"Combined Backend Score: {final_backend:.1f}/100")
        
        # Add detailed breakdown to the results
        results = {
            "final_frontend": round(final_frontend, 1),
            "final_backend": round(final_backend, 1),
            "resume_frontend": resume_results["frontend_score"],
            "resume_backend": resume_results["backend_score"],
            "github_frontend": github_results["frontend_score"],
            "github_backend": github_results["backend_score"],
            "github_info": {
                "followers": github_results.get("followers", 0),
                "public_repos": github_results.get("public_repos", 0),
                "bio": github_results.get("bio", ""),
                "location": github_results.get("location", ""),
                "company": github_results.get("company", "")
            }
        }
        
        return results
    
    except Exception as e:
        print(f"[ERROR] Exception in combined_analysis: {str(e)}")
        return {"error": str(e)}

# # Example usage
# if __name__ == "__main__":
#     # Set up appropriate input values for testing
#     resume_file = "path/to/your/resume.pdf"
#     github_url = "https://github.com/yourusername"
    
#     # Check if files exist before running
#     if os.path.exists(resume_file):
#         results = combined_analysis(resume_file, github_url)
#         print("\nFinal Results:")
#         print(results)
#     else:
#         print(f"[ERROR] Resume file not found: {resume_file}")