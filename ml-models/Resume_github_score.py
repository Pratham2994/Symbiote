#pip install PyPDF2 python-docx requests numpy


import os
import re
import string
import base64
import json
import requests
from collections import Counter
from datetime import datetime, timezone
from dotenv import load_dotenv

import PyPDF2
import docx


# Load environment variables
load_dotenv()

# Get GitHub token from environment variables
GITHUB_TOKEN = os.getenv('GITHUB_API_TOKEN')
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

def calculate_score(keyword_counter, scale_factor=2):
    """
    A scoring function that multiplies the total frequency by a lower scale factor.
    With a scale_factor of 2, more keyword matches are needed to reach 100.
    """
    raw_score = sum(keyword_counter.values()) * scale_factor
    return min(raw_score, 100)


def analyze_resume(file_path):
    text = extract_text(file_path)
    processed_text = preprocess_text(text)
    
    frontend_counts = count_keywords(processed_text, FRONTEND_KEYWORDS)
    backend_counts = count_keywords(processed_text, BACKEND_KEYWORDS)
    
    frontend_score = calculate_score(frontend_counts, scale_factor=2)
    backend_score = calculate_score(backend_counts, scale_factor=2)
    
    print("Resume Analysis")
    print("Frontend keyword counts:", dict(frontend_counts))
    print("Backend keyword counts:", dict(backend_counts))
    print(f"Frontend score: {frontend_score}/100")
    print(f"Backend score: {backend_score}/100")
 
    
    return {"frontend_score": frontend_score, "backend_score": backend_score}


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

def get_package_json(owner: str, repo: str) -> dict:
    url = f"https://api.github.com/repos/{owner}/{repo}/contents/package.json"
    response = requests.get(url, headers=HEADERS)
    if response.status_code == 200:
        content = response.json().get('content')
        if content:
            try:
                decoded = base64.b64decode(content).decode('utf-8')
                return json.loads(decoded)
            except Exception as e:
                print(f"Error parsing package.json for {repo}: {e}")
    return {}

def classify_repo_with_package_json(languages: list, repo_name: str = "", repo_description: str = "", owner: str = "") -> str:
    package_data = get_package_json(owner, repo_name)
    dependencies = package_data.get("dependencies", {})
    dev_dependencies = package_data.get("devDependencies", {})
    
    dependency_keys = list(dependencies.keys()) + list(dev_dependencies.keys())
    combined_text = " ".join(languages + [repo_name, repo_description] + dependency_keys).lower()

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
        # Remove trailing slash before extracting the username
        username = github_link.rstrip('/').split('/')[-1]
        
        # Use the GitHub API token if provided
        token = os.getenv('GITHUB_API_TOKEN')
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        
        # Single API call to get user data
        response = requests.get(f"https://api.github.com/users/{username}", headers=headers)
        if response.status_code != 200:
            return {"error": f"Failed to fetch GitHub data: {response.status_code} {response.text}"}
        
        user_data = response.json()
        
        # Calculate scores based on user data
        followers_score = min(user_data.get('followers', 0) / 100, 1)  # Normalize followers
        public_repos_score = min(user_data.get('public_repos', 0) / 50, 1)  # Normalize public repos
        
        # Calculate backend score (weighted average)
        backend_score = (followers_score * 0.4 + public_repos_score * 0.6) * 100
        
        # Calculate frontend score (weighted average)
        frontend_score = (followers_score * 0.3 + public_repos_score * 0.7) * 100
        
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


if __name__ == "__main__":
 
    resume_file = "ml-models\Resume_varnika.pdf"  
    
    github_profile_url = "https://github.com/VarnikaBajpai4" 
    
    combined_analysis(resume_file, github_profile_url)
