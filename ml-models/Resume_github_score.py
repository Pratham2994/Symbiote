# pip install PyPDF2 python-docx requests pdfplumber python-dotenv google-generativeai

import os
import re
import string
import math
import requests
from collections import Counter
from datetime import datetime, timezone
from dotenv import load_dotenv
from google import genai


import PyPDF2
import docx
import pdfplumber

# Load environment variables
load_dotenv()

# Get GitHub token from environment variables
GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')
HEADERS = {"Authorization": f"Bearer {GITHUB_TOKEN}"}

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

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


FRONTEND_KEYWORDS = {
    "html", "css", "javascript", "react", "angular", "vue", "jquery", "bootstrap",
    "sass", "less", "tailwind", "ember", "backbone", "responsive", "ux", "ui",
    "material", "semantic", "pug", "handlebars", "front-end", "ajax"
}

BACKEND_KEYWORDS = {
    "node", "django", "flask", "express", "ruby", "rails", "php", "laravel", "spring",
    "aspnet", "golang", "java", "csharp", "rust", "docker", "graphql", "rest",
    "microservices", "kubernetes", "postgres", "mysql", "mongodb", "redis", "elasticsearch",
    "ci", "cd", "jenkins", "aws", "azure", "gcp", "backend", "server", "api",
    "python"  
}

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

def count_keywords(text, keywords):
    pattern = r'\b(?:' + '|'.join(re.escape(word) for word in keywords) + r')\b'
    matches = re.findall(pattern, text)
    return Counter(matches)

def calculate_score(keyword_counter, max_possible=50):
    """
    Percentile-normalized scoring based on max_possible keyword matches.
    """
    raw_score = sum(keyword_counter.values())
    scaled_score = min((raw_score / max_possible) * 100, 100)
    return scaled_score

def analyze_resume(file_path):
    print(f"\n[DEBUG] Starting resume analysis for file: {file_path}")
    text = extract_text(file_path)
    processed_text = preprocess_text(text)
    
    frontend_counts = count_keywords(processed_text, FRONTEND_KEYWORDS)
    backend_counts = count_keywords(processed_text, BACKEND_KEYWORDS)
    
    frontend_score = calculate_score(frontend_counts)
    backend_score = calculate_score(backend_counts)
    
    print("[DEBUG] Resume Analysis Results:")
    print("Frontend keyword counts:", dict(frontend_counts))
    print("Backend keyword counts:", dict(backend_counts))
    print(f"Frontend score: {frontend_score}/100")
    print(f"Backend score: {backend_score}/100")

    gemini_frontend_score, gemini_backend_score = analyze_with_gemini(file_path)
    
    final_frontend_score = (frontend_score + gemini_frontend_score) / 2
    final_backend_score = (backend_score + gemini_backend_score) / 2
    
    print(f"[DEBUG] Combined Frontend Score (Avg): {final_frontend_score}/100")
    print(f"[DEBUG] Combined Backend Score (Avg): {final_backend_score}/100")
    
    return {"frontend_score": final_frontend_score, "backend_score": final_backend_score}

def normalize_score(raw_score, scale):
    """
    Logarithmically normalize raw_score to a value between 0 and 100.
    For base scores below 75, the function is lenient;
    above 75, additional points are scaled at 15% to avoid saturating at 100.
    """
    base = 100 * math.log(raw_score + 1) / math.log(scale + 1)
    if base <= 75:
         return base
    else:
         # For each point above 75, only 15% is added.
         return min(75 + (base - 75) * 0.15, 100)

def extract_username(github_url: str) -> str:
    match = re.search(r"github\.com/([^/]+)", github_url)
    if match:
        return match.group(1)
    raise ValueError("Invalid GitHub URL provided.")

def get_all_repo_languages(owner: str, repo: str) -> dict:
    """
    Returns a dictionary of languages used in the repository with their respective byte counts.
    """
    url = f"https://api.github.com/repos/{owner}/{repo}/languages"
    response = requests.get(url, headers=HEADERS)
    if response.status_code == 200:
        languages_dict = response.json()  # e.g. {"Python": 10000, "JavaScript": 5000}
        return languages_dict
    else:
        print(f"Error fetching languages for {repo}: {response.status_code}")
        return {}

def classify_repo_with_package_json(languages: list, repo_name: str = "", repo_description: str = "", owner: str = "") -> str:
    combined_text = " ".join(languages + [repo_name, repo_description]).lower()
    has_frontend = any(kw in combined_text for kw in FRONTEND_KEYWORDS)
    has_backend = any(kw in combined_text for kw in BACKEND_KEYWORDS)
    if has_frontend and has_backend:
        return "Full Stack"
    elif has_frontend:
        return "Front End"
    elif has_backend:
        return "Back End"
    else:
        return "Other"

def recency_weight(pushed_at):
    now = datetime.now(timezone.utc)
    days_diff = (now - pushed_at).days
    if days_diff <= 180:
        return 1.0
    elif days_diff <= 365:
        return 0.75
    else:
        return 0.5

def get_user_repos(username: str, num_repos: int = 20):
    query = """
    query($username: String!, $num_repos: Int!) {
      user(login: $username) {
        repositories(first: $num_repos, orderBy: {field: UPDATED_AT, direction: DESC}) {
          nodes {
            name
            description
            stargazerCount
            defaultBranchRef {
              target {
                ... on Commit {
                  history {
                    totalCount
                  }
                }
              }
            }
            pushedAt
          }
        }
        contributionsCollection {
          contributionCalendar {
            totalContributions
          }
        }
      }
    }
    """
    variables = {"username": username, "num_repos": num_repos}
    response = requests.post('https://api.github.com/graphql',
                             headers=HEADERS,
                             json={'query': query, 'variables': variables})
    
    if response.status_code == 200:
        return response.json()['data']['user']
    else:
        raise Exception(f"GitHub query failed with code {response.status_code}: {response.text}")

def analyze_github(github_link):
    """
    Improved GitHub analysis that uses:
      - Weighted commit activity (with recency)
      - Detailed language breakdown from the languages API
      - Bonus weighting from repository stars
      - Overall profile signals (followers, public repos, contributions)
      
    Special handling: JavaScript is split equally between frontend and backend.
    """
    try:
        print(f"\n[DEBUG] Starting GitHub analysis for link: {github_link}")
        username = extract_username(github_link)
        print(f"[DEBUG] Extracted username: {username}")
        
        user_data = get_user_repos(username, num_repos=5)
        print("[DEBUG] Retrieved user data from GitHub API")
        
        repos = user_data['repositories']['nodes']
        contributions = user_data['contributionsCollection']['contributionCalendar']['totalContributions']
        
        print("[DEBUG] GitHub Analysis")
        print(f"[DEBUG] Number of repos analyzed: {len(repos)}")
        print(f"[DEBUG] Total contributions: {contributions}")
        
        frontend_points = 0.0
        backend_points = 0.0
        
        # Define language mappings for byte-based evaluation.
        # Note: 'javascript' will be treated specially.
        frontend_languages = {"html", "css", "typescript"}
        backend_languages = {"python", "ruby", "java", "php", "c#", "go", "c++", "c", "rust", "nodejs", "node"}
        
        for repo in repos:
            repo_name = repo['name']
            print(f"\n[DEBUG] Analyzing repo: {repo_name}")
            description = repo.get('description') or ""
            
            # Retrieve full language statistics (bytes)
            languages_dict = get_all_repo_languages(username, repo_name)
            print(f"[DEBUG] Languages data: {languages_dict}")
            
            commit_count = 0
            if repo.get('defaultBranchRef'):
                commit_count = repo['defaultBranchRef']['target']['history']['totalCount']
            
            pushed_at_str = repo.get('pushedAt')
            recency = datetime.strptime(pushed_at_str, '%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=timezone.utc) if pushed_at_str else None
            weight = recency_weight(recency) if recency else 0.5
            
            # Base repository score from commit activity and recency
            repo_score = commit_count * weight
            
            # Incorporate repository popularity (stargazerCount)
            stars = repo.get('stargazerCount', 0)
            star_multiplier = 1 + (stars / 50)  # Increase score for every 50 stars
            repo_score *= star_multiplier
            print(f"[DEBUG] Commit count: {commit_count}, Weight: {weight}, Stars: {stars}, Repo score: {repo_score}")
            
            # Evaluate language distribution based on byte counts
            total_bytes = sum(languages_dict.values()) if languages_dict else 0
            if total_bytes > 0:
                frontend_bytes = 0
                backend_bytes = 0
                for lang, byte_count in languages_dict.items():
                    lang_lower = lang.lower()
                    if lang_lower == "javascript":
                        # Split JavaScript equally between frontend and backend
                        frontend_bytes += byte_count / 2
                        backend_bytes += byte_count / 2
                    elif lang_lower in frontend_languages:
                        frontend_bytes += byte_count
                    elif lang_lower in backend_languages:
                        backend_bytes += byte_count
                total_relevant = frontend_bytes + backend_bytes
                if total_relevant > 0:
                    frontend_ratio = frontend_bytes / total_relevant
                    backend_ratio = backend_bytes / total_relevant
                else:
                    frontend_ratio = 0.5
                    backend_ratio = 0.5
                print(f"[DEBUG] Language Bytes - Frontend: {frontend_bytes}, Backend: {backend_bytes}, Total Relevant: {total_relevant}")
            else:
                # Fallback using description-based classification if no language data is available
                classification = classify_repo_with_package_json(list(languages_dict.keys()), repo_name, description, username)
                if classification == "Front End":
                    frontend_ratio = 1.0
                    backend_ratio = 0.0
                elif classification == "Back End":
                    frontend_ratio = 0.0
                    backend_ratio = 1.0
                elif classification == "Full Stack":
                    frontend_ratio = 0.5
                    backend_ratio = 0.5
                else:
                    frontend_ratio = 0.5
                    backend_ratio = 0.5
                print(f"[DEBUG] Fallback classification used: {classification}")
            
            # Allocate points based on the computed ratios
            frontend_points += repo_score * frontend_ratio
            backend_points += repo_score * backend_ratio
            
            print(f"[DEBUG] Accumulated points - Frontend: {frontend_points}, Backend: {backend_points}")
        
        # Incorporate contributions from the contributions calendar (small bonus)
        contributions_bonus = contributions * 0.02
        frontend_points += contributions_bonus
        backend_points += contributions_bonus
        
        # Incorporate additional user profile statistics
        response = requests.get(f"https://api.github.com/users/{username}", headers=HEADERS)
        if response.status_code != 200:
            print(f"[ERROR] Failed to fetch GitHub user data: {response.status_code} {response.text}")
            return {"error": f"Failed to fetch GitHub data: {response.status_code} {response.text}"}
        
        user_profile = response.json()
        followers_score = min(user_profile.get('followers', 0) / 100, 1)
        public_repos_score = min(user_profile.get('public_repos', 0) / 50, 1)
        
        # Adjust weights for frontend and backend slightly differently
        frontend_points += (followers_score * 0.3 + public_repos_score * 0.7)
        backend_points += (followers_score * 0.4 + public_repos_score * 0.6)
        
        print(f"[DEBUG] Points after adding profile stats - Frontend: {frontend_points}, Backend: {backend_points}")
        
        # Normalize the points using the updated normalization function
        GITHUB_SCALE = 5000  
        frontend_score = normalize_score(frontend_points, GITHUB_SCALE)
        backend_score = normalize_score(backend_points, GITHUB_SCALE)
        
        print(f"[DEBUG] Final normalized scores - Frontend: {frontend_score}, Backend: {backend_score}")
        
        return {
            "backend_score": round(backend_score, 2),
            "frontend_score": round(frontend_score, 2),
            "followers": user_profile.get('followers', 0),
            "public_repos": user_profile.get('public_repos', 0),
            "bio": user_profile.get('bio', ''),
            "location": user_profile.get('location', ''),
            "company": user_profile.get('company', '')
        }
        
    except Exception as e:
        print(f"[ERROR] Exception in analyze_github: {str(e)}")
        return {"error": str(e)}
    
def get_github_rank(username: str):
    try:
        response = requests.get(f"http://localhost:3000/rank/{username}")
        if response.status_code == 200:
            # Extract the percentile from the response JSON
            rank_data = response.json().get('rank', {})
            percentile = rank_data.get('percentile', -1)
            return percentile  
        else:
            print(f"Failed to fetch rank for {username}, status code: {response.status_code}")
            return -1 
    except Exception as e:
        print(f"Error fetching rank for {username}: {str(e)}")
        return -1  

def normalize_using_rank(raw_score, percentile, max_possible_score=100):
    """
    Normalize the score based on the percentile provided.
    A higher percentile indicates worse performance, so we need to adjust for that.
    """
    if percentile > 0: 
        normalized = raw_score * (1 - percentile / 100)
    else:
        normalized = raw_score 
    return min(normalized, max_possible_score)

def combined_analysis(resume_file: str, github_url: str, weight_github: int = 2, weight_resume: int = 1):
    username = extract_username(github_url)
    
    rank = get_github_rank(username)
    print(f"[DEBUG] GitHub rank for {username}: {rank}")
    
    resume_results = analyze_resume(resume_file)
    github_results = analyze_github(github_url)
    
    final_frontend = (github_results["frontend_score"] * weight_github + resume_results["frontend_score"] * weight_resume) / (weight_github + weight_resume)
    final_backend = (github_results["backend_score"] * weight_github + resume_results["backend_score"] * weight_resume) / (weight_github + weight_resume)
    
    print("Combined Final Scores")
    print(f"Combined Frontend Score: {final_frontend:.1f}/100")
    print(f"Combined Backend Score: {final_backend:.1f}/100")
  
    return {"final_frontend": final_frontend, "final_backend": final_backend}

# Debug
if __name__ == "__main__":
    scores = combined_analysis("ml-models/Resume_varnika.pdf", "https://github.com/CLONER786")
    print(scores)
