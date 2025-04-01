import os
import re
import math
import json
import requests
import asyncio
import aiohttp
from datetime import datetime, timezone
from dotenv import load_dotenv
from google import genai
from functools import lru_cache
from concurrent.futures import ThreadPoolExecutor
import nest_asyncio

# Load environment variables
load_dotenv()

# Get GitHub token from environment variables
GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')
HEADERS = {"Authorization": f"Bearer {GITHUB_TOKEN}"}
GRAPHQL_URL = 'https://api.github.com/graphql'

# Configure Gemini API
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

# Define keywords lists for repository classification
FRONTEND_KEYWORDS = ["react", "vue", "angular", "css", "html", "sass", "less", "bootstrap", "tailwind", "webpack", "vite", "ui", "frontend", "jsx"]
BACKEND_KEYWORDS = ["node", "express", "django", "flask", "spring", "api", "server", "database", "sql", "nosql", "mongodb", "postgres", "mysql", "backend", "microservice"]

# Define language mappings for byte-based evaluation
FRONTEND_LANGUAGES = {"html", "css", "typescript"}
BACKEND_LANGUAGES = {"python", "ruby", "java", "php", "c#", "go", "c++", "c", "rust", "nodejs", "node"}

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

async def get_all_repo_languages_batch(session, owner: str, repos: list) -> dict:
    """
    Fetches languages for multiple repositories in parallel
    """
    async def fetch_languages(repo):
        url = f"https://api.github.com/repos/{owner}/{repo}"
        async with session.get(url, headers=HEADERS) as response:
            if response.status == 200:
                return repo, await response.json()
            else:
                print(f"Error fetching languages for {repo}: {response.status}")
                return repo, {}
    
    tasks = [fetch_languages(repo["name"]) for repo in repos]
    results = await asyncio.gather(*tasks)
    return {repo: languages for repo, languages in results}

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

async def get_user_repos_batched(session, username: str, batch_size=50, max_repos=300):
    """
    Fetch repositories in batches using cursors for pagination
    """
    query = """
    query($username: String!, $batchSize: Int!, $cursor: String) {
      user(login: $username) {
        repositories(first: $batchSize, after: $cursor, orderBy: {field: UPDATED_AT, direction: DESC}) {
          pageInfo {
            hasNextPage
            endCursor
          }
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
            languages(first: 10) {
              edges {
                size
                node {
                  name
                }
              }
            }
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
    
    all_repos = []
    contributions = None
    cursor = None
    repo_count = 0
    
    while repo_count < max_repos:
        variables = {
            "username": username, 
            "batchSize": batch_size,
            "cursor": cursor
        }
        
        async with session.post(
            GRAPHQL_URL,
            headers=HEADERS,
            json={'query': query, 'variables': variables}
        ) as response:
            if response.status != 200:
                raise Exception(f"GitHub query failed with code {response.status}: {await response.text()}")
            
            data = await response.json()
            
            if 'errors' in data:
                raise Exception(f"GraphQL query error: {data['errors']}")
                
            user_data = data.get('data', {}).get('user')
            if not user_data:
                break
                
            repos = user_data.get('repositories', {})
            nodes = repos.get('nodes', [])
            
            if not contributions and 'contributionsCollection' in user_data:
                contributions = user_data['contributionsCollection']['contributionCalendar']['totalContributions']
            
            all_repos.extend(nodes)
            repo_count += len(nodes)
            
            page_info = repos.get('pageInfo', {})
            if not page_info.get('hasNextPage', False) or not nodes:
                break
                
            cursor = page_info.get('endCursor')
    
    print(f"Retrieved {len(all_repos)} repositories for {username}")
    return all_repos, contributions

@lru_cache(maxsize=100)
async def get_rank_data_async(session, username):
    url = f"http://localhost:3000//api/github/rank/{username}"
    async with session.get(url) as response:
        if response.status == 200:
            return await response.json()
    return None

async def collect_github_information_async(username, max_repos=300):
    async with aiohttp.ClientSession() as session:
        repos, contributions = await get_user_repos_batched(session, username, batch_size=50, max_repos=max_repos)
        rank_data = await get_rank_data_async(session, username)
        
        if not repos:
            return None
        
        # Fetch user profile data
        async with session.get(f"https://api.github.com/users/{username}", headers=HEADERS) as response:
            if response.status != 200:
                print(f"Error fetching user profile: {response.status}")
                user_profile = {}
            else:
                user_profile = await response.json()
        
        # Get language data in parallel for all repos
        languages_batch = {}
        
        # Process repositories in chunks to avoid overwhelming the GitHub API
        chunk_size = 25
        for i in range(0, len(repos), chunk_size):
            chunk = repos[i:i+chunk_size]
            
            # Extract language data directly from GraphQL response
            for repo in chunk:
                repo_name = repo['name']
                languages_dict = {}
                
                if 'languages' in repo and 'edges' in repo['languages']:
                    for edge in repo['languages']['edges']:
                        lang_name = edge['node']['name']
                        size = edge['size']
                        languages_dict[lang_name] = size
                
                languages_batch[repo_name] = languages_dict
        
        repo_data = []
        for repo in repos:
            repo_name = repo['name']
            description = repo.get('description', "")
            
            languages_dict = languages_batch.get(repo_name, {})
            
            commit_count = 0
            if repo.get('defaultBranchRef'):
                commit_count = repo['defaultBranchRef']['target']['history']['totalCount']
            
            pushed_at_str = repo.get('pushedAt', "")

            repo_info = {
                "name": repo_name,
                "description": description,
                "languages": languages_dict,
                "commit_count": commit_count,
                "last_pushed": pushed_at_str,
                "stargazerCount": repo.get('stargazerCount', 0)
            }
            repo_data.append(repo_info)

        print("Number of Repos processed: ", len(repo_data))
        
        return {
            "github_data": {
                "repositories": {"nodes": repos},
                "contributionsCollection": {
                    "contributionCalendar": {
                        "totalContributions": contributions
                    }
                }
            },
            "repos": repo_data,
            "rank_data": rank_data,
            "user_profile": user_profile
        }

async def analyze_github_async(github_link, max_repos=300):
    """
    Improved GitHub analysis that uses:
      - Weighted commit activity (with recency)
      - Detailed language breakdown from the languages API
      - Bonus weighting from repository stars
      - Overall profile signals (followers, public repos, contributions)
      - Asynchronous API calls for better performance
      - Batched repository fetching
      
    Special handling: JavaScript is split equally between frontend and backend.
    """
    try:
        print(f"\n[DEBUG] Starting GitHub analysis for link: {github_link}")
        username = extract_username(github_link)
        print(f"[DEBUG] Extracted username: {username}")

        # Collect all GitHub information asynchronously
        github_information = await collect_github_information_async(username, max_repos=max_repos)
        if not github_information:
            return {"error": "Could not fetch GitHub data."}
        
        # Run Gemini analysis in a separate thread to not block async operations
        with ThreadPoolExecutor() as executor:
            gemini_future = executor.submit(get_gemini_analysis, github_information)
        
        # Process repository data while Gemini is running
        repos = github_information['repos']
        contributions = github_information['github_data']['contributionsCollection']['contributionCalendar']['totalContributions']
        user_profile = github_information['user_profile']
        
        print("[DEBUG] GitHub Analysis")
        print(f"[DEBUG] Number of repos analyzed: {len(repos)}")
        print(f"[DEBUG] Total contributions: {contributions}")
        
        frontend_points = 0.0
        backend_points = 0.0
        
        # Process all repositories in parallel using threads
        def process_repo(repo):
            repo_name = repo['name']
            description = repo.get('description') or ""
            
            languages_dict = repo.get('languages', {})
            
            commit_count = repo.get('commit_count', 0)
            pushed_at_str = repo.get('last_pushed')
            recency = datetime.strptime(pushed_at_str, '%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=timezone.utc) if pushed_at_str else None
            weight = recency_weight(recency) if recency else 0.5
            
            # Base repository score from commit activity and recency
            repo_score = commit_count * weight
            
            # Incorporate repository popularity (stargazerCount)
            stars = repo.get('stargazerCount', 0)
            star_multiplier = 1 + (stars / 50)  # Increase score for every 50 stars
            repo_score *= star_multiplier
            
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
                    elif lang_lower in FRONTEND_LANGUAGES:
                        frontend_bytes += byte_count
                    elif lang_lower in BACKEND_LANGUAGES:
                        backend_bytes += byte_count
                total_relevant = frontend_bytes + backend_bytes
                if total_relevant > 0:
                    frontend_ratio = frontend_bytes / total_relevant
                    backend_ratio = backend_bytes / total_relevant
                else:
                    frontend_ratio = 0.5
                    backend_ratio = 0.5
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
            
            # Return points allocated based on the computed ratios
            return repo_score * frontend_ratio, repo_score * backend_ratio
        
        # Process repositories in parallel
        with ThreadPoolExecutor(max_workers=10) as executor:
            results = list(executor.map(process_repo, repos))
        
        # Sum up all points
        for f_points, b_points in results:
            frontend_points += f_points
            backend_points += b_points
        
        # Incorporate contributions from the contributions calendar (small bonus)
        contributions_bonus = contributions * 0.02
        frontend_points += contributions_bonus
        backend_points += contributions_bonus
        
        # Incorporate additional user profile statistics
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
        
        # Get Gemini analysis results
        gemini_analysis = gemini_future.result()
        gemini_frontend, gemini_backend = parse_gemini_github_analysis(gemini_analysis)
        
        if gemini_frontend is not None and gemini_backend is not None:
            # Combine scores: 60% Gemini, 40% algorithmic
            frontend_score = (gemini_frontend * 0.6) + (frontend_score * 0.4)
            backend_score = (gemini_backend * 0.6) + (backend_score * 0.4)
            
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
        print(f"[ERROR] Exception in analyze_github_async: {str(e)}")
        return {"error": str(e)}

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

# Main entry point for synchronous code
def analyze_github(github_link, max_repos=300):
    """Synchronous wrapper for the asynchronous GitHub analysis"""
    nest_asyncio.apply()
    return asyncio.run(analyze_github_async(github_link, max_repos))