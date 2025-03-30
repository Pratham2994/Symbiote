#pip install PyPDF2 python-docx requests numpy

import os
import re
import string
import base64
import json
import requests
import math
from collections import Counter
from datetime import datetime, timezone
from dotenv import load_dotenv

import PyPDF2
import docx

# Load environment variables
load_dotenv()

# Get GitHub token from environment variables
GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')
HEADERS = {"Authorization": f"Bearer {GITHUB_TOKEN}"}

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
    
    return {"frontend_score": frontend_score, "backend_score": backend_score}

def normalize_score(raw_score, scale):
    """
    Logarithmically normalize raw_score to a value between 0 and 100.
    If raw_score equals the scale, the result will be 100.
    Scores above the scale will be gradually compressed.
    """
    # Adding 1 to avoid math domain error when raw_score is 0.
    normalized = 100 * math.log(raw_score + 1) / math.log(scale + 1)
    return min(normalized, 100)

def extract_username(github_url: str) -> str:
    match = re.search(r"github\.com/([^/]+)", github_url)
    if match:
        return match.group(1)
    raise ValueError("Invalid GitHub URL provided.")

def get_all_repo_languages(owner: str, repo: str) -> list:
    url = f"https://api.github.com/repos/{owner}/{repo}/languages"
    response = requests.get(url, headers=HEADERS)
    if response.status_code == 200:
        languages_dict = response.json()
        return list(languages_dict.keys())
    else:
        print(f"Error fetching languages for {repo}: {response.status_code}")
        return []

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
        
        for repo in repos:
            repo_name = repo['name']
            print(f"\n[DEBUG] Analyzing repo: {repo_name}")
            description = repo.get('description') or ""
            all_languages = get_all_repo_languages(username, repo_name)
            print(f"[DEBUG] Languages found: {all_languages}")
            
            commit_count = 0
            if repo.get('defaultBranchRef'):
                commit_count = repo['defaultBranchRef']['target']['history']['totalCount']
            
            pushed_at_str = repo.get('pushedAt')
            recency = datetime.strptime(pushed_at_str, '%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=timezone.utc) if pushed_at_str else None
            weight = recency_weight(recency) if recency else 0.5
            
            classification = classify_repo_with_package_json(all_languages, repo_name, description, username)
            print(f"[DEBUG] Repo classification: {classification}")
            
            commit_points = commit_count * weight
            print(f"[DEBUG] Commit points: {commit_points} (count: {commit_count}, weight: {weight})")
            
            if classification == "Front End":
                frontend_points += commit_points
            elif classification == "Back End":
                backend_points += commit_points
            elif classification == "Full Stack":
                frontend_points += commit_points * 0.5
                backend_points += commit_points * 0.5
            else:
                for language in all_languages:
                    lang_lower = language.lower()
                    if lang_lower in FRONTEND_KEYWORDS:
                        frontend_points += commit_points * 0.2
                    if lang_lower in BACKEND_KEYWORDS:
                        backend_points += commit_points * 0.2

            print(f"[DEBUG] Current points - Frontend: {frontend_points}, Backend: {backend_points}")

        response = requests.get(f"https://api.github.com/users/{username}", headers=HEADERS)
        if response.status_code != 200:
            print(f"[ERROR] Failed to fetch GitHub user data: {response.status_code} {response.text}")
            return {"error": f"Failed to fetch GitHub data: {response.status_code} {response.text}"}
        
        user_data = response.json()
        print("[DEBUG] Retrieved user profile data")

        followers_score = min(user_data.get('followers', 0) / 100, 1)
        public_repos_score = min(user_data.get('public_repos', 0) / 50, 1)
        
        print(f"[DEBUG] Additional scores - Followers: {followers_score}, Public repos: {public_repos_score}")
        
        frontend_points += contributions * 0.02
        backend_points += contributions * 0.02

        frontend_points += (followers_score * 0.3 + public_repos_score * 0.7)
        backend_points += (followers_score * 0.4 + public_repos_score * 0.6)
        
        print(f"[DEBUG] Final points before normalization - Frontend: {frontend_points}, Backend: {backend_points}")
        
        GITHUB_SCALE = 5000  
        frontend_score = normalize_score(frontend_points, GITHUB_SCALE)
        backend_score = normalize_score(backend_points, GITHUB_SCALE)
        
        print(f"[DEBUG] Final normalized scores - Frontend: {frontend_score}, Backend: {backend_score}")
        
        return {
            "backend_score": round(backend_score, 2),
            "frontend_score": round(frontend_score, 2),
            "followers": user_data.get('followers', 0),
            "public_repos": user_data.get('public_repos', 0),
            "bio": user_data.get('bio', ''),
            "location": user_data.get('location', ''),
            "company": user_data.get('company', '')
        }
        
    except Exception as e:
        print(f"[ERROR] Exception in analyze_github: {str(e)}")
        return {"error": str(e)}

def combined_analysis(resume_file: str, github_url: str, weight_github: int = 2, weight_resume: int = 1):
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
    scores = combined_analysis("C:/Users/makwa/VS-code/web_dev/symbiote/ml-models/Resume_varnika.pdf", "https://github.com/CLONER786")
    print(scores)
