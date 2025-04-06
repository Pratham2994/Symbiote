# Symbiote - Intelligent Team Matching Platform

Symbiote is an advanced team matching platform that leverages machine learning to analyze candidates and create optimal team compositions. The platform combines various data points including resumes, GitHub profiles, and emotional intelligence assessments to provide comprehensive candidate analysis and team matching capabilities.

## Project Structure

```
Symbiote/
├── client/                 # Frontend React application
├── server/                 # Backend Node.js server
└── ml-models/             # Python-based ML models
```

## Core Technology Stack

### Frontend
- **React** with Vite for fast development and optimized builds
- **Tailwind CSS** for responsive, utility-first styling
- **Socket.io Client** for real-time notifications and updates
- **Context API** for state management

### Backend
- **Node.js** with Express for the API server
- **MongoDB** with Mongoose for data persistence
- **Socket.io** for real-time communication
- **JWT** for secure authentication

### Machine Learning
- **Python** for ML model implementation
- **FastAPI** for ML service endpoints
- **Google Gemini AI** for resume analysis
- **GitHub API** for profile analysis
- **Custom algorithms** for team matching and scoring

## Features

### Current Features

1. **Resume Analysis**
   - PDF and DOCX parsing with PyPDF2 and python-docx
   - Gemini AI-powered skill extraction and evaluation
   - Frontend and Backend skill assessment with weighted scoring
   - Experience level evaluation based on project complexity
   - Technology stack analysis with keyword recognition

2. **GitHub Profile Analysis**
   - Repository analysis with language detection
   - Contribution patterns with recency weighting
   - Technical expertise assessment based on project complexity
   - Project classification (Frontend/Backend/Full Stack)
   - Asynchronous data fetching with aiohttp for improved performance

3. **Emotional Intelligence Assessment**
   - Multi-dimensional EQ scoring across 6 parameters:
     - Teamwork
     - Pressure Handling
     - Problem Solving
     - Adaptability
     - Temperament
     - Leadership
   - Weighted scoring matrix for nuanced evaluation
   - Normalized scoring between 0-100 for consistency

4. **Team Matching Algorithm**
   - **Advanced Match Score Calculation** with the following components:
     - Weighted parameter scoring (Frontend: 37.5%, Backend: 37.5%, EQ: 25%)
     - Variance-based penalty to ensure balanced teams
     - Mismatch penalty to account for skill gaps
     - Configurable weights for customization
   - Candidate compatibility scoring based on complementary skills
   - Skill complementarity analysis to ensure diverse teams
   - Weighted scoring system with customizable parameters
   - Real-time match score updates

### Planned Features

1. **Technical Assessment Predictor**
   - Performance prediction in technical assessments
   - Skill gap analysis
   - Learning potential estimation

2. **Team Dynamics Analysis**
   - Team compatibility prediction
   - Communication style analysis
   - Cultural fit assessment

3. **Career Development**
   - Career trajectory prediction
   - Skill development recommendations
   - Growth potential analysis

## Technical Implementation Details

### Match Score Algorithm

The core of Symbiote's team matching is the `MatchScoreCalculator` class, which implements a sophisticated algorithm for determining team compatibility:

```python
def calculate_combined_score(self, person_a_dict, person_b_dict):
    # Convert dictionaries to lists in correct order
    person_a = [person_a_dict.get(param, 0) for param in self.parameters]
    person_b = [person_b_dict.get(param, 0) for param in self.parameters]
    
    # Calculate combined scores
    combined_scores = []
    for i in range(len(self.parameters)):
        combined_scores.append((
            self.parameters[i],
            person_a[i] + person_b[i]
        ))
    
    # Calculate mismatch penalty
    self.mismatch_penalty = self._calculate_mismatch_penalty(person_a_dict, person_b_dict)

    # Calculate final weighted score with variance penalty
    return self._calculate_weighted_score(combined_scores)
```

The algorithm:
1. Combines scores from both candidates for each parameter
2. Applies configurable weights to each parameter
3. Calculates a variance penalty to ensure balanced teams
4. Applies a mismatch penalty to account for skill gaps
5. Returns a final match score between 0-100

### Data Flow Architecture

1. **Frontend** collects user data (resume, GitHub profile, EQ answers)
2. **Backend API** receives data and forwards to ML service
3. **ML Service** processes data through multiple specialized modules:
   - Resume analysis using Gemini AI
   - GitHub profile analysis with language detection
   - EQ score calculation with weighted matrix
4. **Match Score Calculator** combines all scores and applies the matching algorithm
5. **Results** are returned to the frontend for display and team formation

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- Python 3.8 or higher
- MongoDB
- Git

### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with required environment variables:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   ```

4. Start the server:
   ```bash
   npm start
   ```

### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### ML Models Setup

1. Navigate to the ml-models directory:
   ```bash
   cd ml-models
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file with required API keys:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   GITHUB_TOKEN=your_github_token
   ```

5. Start the ML service:
   ```bash
   python main.py
   ```

## API Documentation

The API documentation is available at `/api-docs` when running the server.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Gemini AI for resume analysis capabilities
- GitHub API for profile analysis
- Various open-source libraries and tools used in the project 