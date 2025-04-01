# Symbiote - Intelligent Team Matching Platform

Symbiote is an advanced team matching platform that leverages machine learning to analyze candidates and create optimal team compositions. The platform combines various data points including resumes, GitHub profiles, and emotional intelligence assessments to provide comprehensive candidate analysis and team matching capabilities.

## Project Structure

```
Symbiote/
├── client/                 # Frontend React application
├── server/                 # Backend Node.js server
└── ml-models/             # Python-based ML models
```

## Features

### Current Features

1. **Resume Analysis**
   - PDF and DOCX parsing
   - Frontend and Backend skill assessment
   - Experience level evaluation
   - Technology stack analysis

2. **GitHub Profile Analysis**
   - Repository analysis
   - Contribution patterns
   - Technical expertise assessment
   - Project complexity evaluation

3. **Emotional Intelligence Assessment**
   - EQ score calculation
   - Behavioral pattern analysis
   - Team compatibility insights

4. **Team Matching**
   - Candidate compatibility scoring
   - Skill complementarity analysis
   - Weighted scoring system
   - Customizable matching criteria

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