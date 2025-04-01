# github_analyzer.py
import os
import re
import math
import json
import requests
from datetime import datetime, timezone
from dotenv import load_dotenv
from google import genai

# Load environment variables
load_dotenv()

# Get GitHub token from environment variables
GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')
HEADERS = {"Authorization": f"Bearer {GITHUB_TOKEN}"}

# Configure Gemini API
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

# Define keywords lists for repository classification
FRONTEND_KEYWORDS = ["react", "vue", "angular", "css", "html", "sass", "less", "bootstrap", "tailwind", "webpack", "vite", "ui", "frontend", "jsx"]
BACKEND_KEYWORDS = ["node", "express", "django", "flask", "spring", "api", "server", "database", "sql", "nosql", "mongodb", "postgres", "mysql", "backend", "microservice"]

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

def get_user_repos(username: str, num_repos: int = 100):
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
    
def get_rank_data(username):
    url = f"http://localhost:3000/rank/{username}"
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()
    return None
    
def collect_github_information(username):
    user_data = get_user_repos(username)
    rank_data = get_rank_data(username)
    
    if not user_data:
        return None
    
    repos = user_data.get('repositories', {}).get('nodes', [])
    
    repo_data = []
    count = 0
    
    for repo in repos:
        repo_name = repo['name']
        description = repo.get('description', "")
        
        # Get language data directly from the GitHub API
        languages_dict = get_all_repo_languages(username, repo_name)
        
        commit_count = 0
        if repo.get('defaultBranchRef'):
            commit_count = repo['defaultBranchRef']['target']['history']['totalCount']
        
        pushed_at_str = repo.get('pushedAt', "")

        repo_info = {
            "name": repo_name,
            "description": description,
            "languages": languages_dict,
            "commit_count": commit_count,
            "last_pushed": pushed_at_str
        }
        repo_data.append(repo_info)
        count += 1

    print("Number of Repos: ", count)
    
    return {
        "github_data": user_data,
        "repos": repo_data,
        "rank_data": rank_data
    }

def get_gemini_analysis(github_json):
    prompt = f"""
    Based on the following GitHub profile data and ranking data, analyze the developer's skills in frontend and backend development:
    {json.dumps(github_json, indent=2)}
    
    Please provide a concise analysis with these specific outputs:
    1. Frontend skills assessment (score 0-100)
    2. Backend skills assessment (score 0-100)
    
    Format your response exactly like this:
    Frontend Score: [number]
    Backend Score: [number]
    Give no other text. Only the scores.
    """
    
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",  
            contents=prompt
        )
        
        return response.text if response else None
    except Exception as e:
        print(f"[ERROR] Error in Gemini analysis: {str(e)}")
        return None

def parse_gemini_github_analysis(analysis_text):
    """
    Parse the Gemini analysis text to extract frontend and backend scores
    """
    if not analysis_text:
        return None, None
    
    try:
        frontend_match = re.search(r"Frontend Score:\s*(\d+)", analysis_text)
        backend_match = re.search(r"Backend Score:\s*(\d+)", analysis_text)
        
        frontend_score = int(frontend_match.group(1)) if frontend_match else None
        backend_score = int(backend_match.group(1)) if backend_match else None
        
        return frontend_score, backend_score
    except Exception as e:
        print(f"[ERROR] Error parsing Gemini analysis: {str(e)}")
        return None, None
    
def evaluate_github_user(username):
    try:
        github_information = collect_github_information(username)
        if not github_information:
            return {"error": "Could not fetch GitHub data."}
        
        gemini_analysis = get_gemini_analysis(github_information)
        gemini_frontend, gemini_backend = parse_gemini_github_analysis(gemini_analysis)
        
        return {
            "github_information": github_information,
            "gemini_analysis": gemini_analysis,
            "gemini_frontend_score": gemini_frontend,
            "gemini_backend_score": gemini_backend
        }
    except Exception as e:
        print(f"[ERROR] Error in evaluate_github_user: {str(e)}")
        return {"error": str(e)}

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

        ai_evaluation = evaluate_github_user(username)
        if "error" in ai_evaluation:
            print(f"[ERROR] AI evaluation failed: {ai_evaluation['error']}")
        else:
            print(f"[DEBUG] AI evaluation successful")
        
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
        
        if "gemini_frontend_score" in ai_evaluation and ai_evaluation["gemini_frontend_score"] is not None:
            gemini_frontend = ai_evaluation["gemini_frontend_score"]
            gemini_backend = ai_evaluation["gemini_backend_score"]
            
            # Combine scores: 60% Gemini, 40% algorithmic
            frontend_score = (gemini_frontend * 0.6) + (frontend_score * 0.4)
            backend_score = (gemini_backend * 0.6) + (backend_score * 0.4)

            print(f"[DEBUG] Gemini scores - Frontend: {gemini_frontend}, Backend: {gemini_backend}")
            
            print(f"[DEBUG] Combined with Gemini scores - Frontend: {frontend_score}, Backend: {backend_score}")
        
        print(f"[DEBUG] GitHub Analysis - Frontend: {frontend_score}, Backend: {backend_score}")
        
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