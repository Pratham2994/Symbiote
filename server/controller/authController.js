const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const FormData = require('form-data');
const multer = require('multer');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

const evaluateCandidate = async (resumeBuffer, githubLink, eqAnswers) => {
    try {
        // Prepare the data for ML service
        const formData = new FormData();
        
        // Append the resume buffer directly
        formData.append('resume', resumeBuffer, {
            filename: 'resume.pdf',
            contentType: 'application/pdf'
        });
        
        // Add other fields
        formData.append('github_link', githubLink);
        
        // Format eqAnswers for ML service
        let formattedEqAnswers;
        if (typeof eqAnswers === 'string') {
            formattedEqAnswers = JSON.parse(eqAnswers);
        } else if (eqAnswers instanceof Map) {
            formattedEqAnswers = Object.fromEntries(eqAnswers);
        } else {
            formattedEqAnswers = eqAnswers;
        }

        // Ensure the keys are in the correct format (Q1, Q2, Q3, Q4)
        const finalEqAnswers = {};
        for (const [key, value] of Object.entries(formattedEqAnswers)) {
            const formattedKey = key.startsWith('Q') ? key : `Q${key.replace(/^q/i, '')}`;
            finalEqAnswers[formattedKey] = value;
        }

        formData.append('eq_answers', JSON.stringify(finalEqAnswers));

        // Send to ML FastAPI service
        const response = await axios.post('http://localhost:8000/analyze', formData, {
            headers: {
                ...formData.getHeaders()
            }
        });

        // Map the response to match our expected format
        return {
            frontendScore: response.data.final_frontend,
            backendScore: response.data.final_backend,
            eqScore: response.data.final_eq_score
        };
    } catch (error) {
        console.error('ML Service Error:', error.response?.data || error.message);
        throw new Error('Failed to evaluate candidate');
    }
};

const registerUser = async (req, res) => {
    try {
        // Validate required fields
        const { email, password, role } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }
        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long' });
        }

        if (role === 'Student') {
            const requiredFields = ['username', 'githubLink', 'aboutMe', 'eqAnswers', 'skills'];
            for (const field of requiredFields) {
                if (!req.body[field]) {
                    return res.status(400).json({ message: `${field} is required for student registration` });
                }
            }

            // Update GitHub link regex to accept both profile and repo links if needed
            // Validate GitHub link format
            const githubRegex = /^https:\/\/github\.com\/[a-zA-Z0-9-]+(\/[a-zA-Z0-9-]+)?$/;

            if (!githubRegex.test(req.body.githubLink)) {
                return res.status(400).json({ message: 'Invalid GitHub link format' });
            }

            // Validate social links if provided
            // Check if socialLinks is provided
            if (req.body.socialLinks) {
                try {
                    req.body.socialLinks = JSON.parse(req.body.socialLinks);
                } catch (err) {
                    return res.status(400).json({ message: 'Invalid format for socialLinks' });
                }
            }

            // Now do the array check
            if (req.body.socialLinks && !Array.isArray(req.body.socialLinks)) {
                return res.status(400).json({ message: 'Social links must be an array' });
            }

            // Validate resume file (should be available via multer)
            if (!req.file) {
                return res.status(400).json({ message: 'Resume PDF is required for student registration' });
            }

            // Get scores from ML service using the resume buffer
            const scores = await evaluateCandidate(req.file.buffer, req.body.githubLink, req.body.eqAnswers);

            // Hash the password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Convert eqAnswers string to Map
            let eqAnswersMap;
            try {
                const eqAnswersObj = typeof req.body.eqAnswers === 'string' 
                    ? JSON.parse(req.body.eqAnswers) 
                    : req.body.eqAnswers;
                
                eqAnswersMap = new Map();
                for (const [key, value] of Object.entries(eqAnswersObj)) {
                    eqAnswersMap.set(key, value);
                }
            } catch (err) {
                return res.status(400).json({ message: 'Invalid format for eqAnswers' });
            }

            // Create the student user
            const newUser = await User.create({
                username: req.body.username,
                email,
                password: hashedPassword,
                role: 'Student',
                aboutMe: req.body.aboutMe,
                githubLink: req.body.githubLink,
                socialLinks: req.body.socialLinks || [],
                skills: req.body.skills,
                eqAnswers: eqAnswersMap,
                frontendScore: scores.frontendScore,
                backendScore: scores.backendScore,
                eqScore: scores.eqScore
            });

        
            return res.status(201).json({
                message: 'Student registered successfully',
                user: {
                    id: newUser._id,
                    username: newUser.username,
                    email: newUser.email,
                    role: newUser.role,
                    eqScore: newUser.eqScore,
                    frontendScore: newUser.frontendScore,
                    backendScore: newUser.backendScore
                }
            });
        } else if (role === 'Admin') {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            const newUser = await User.create({
                email,
                password: hashedPassword,
                role: 'Admin'
            });

            const token = generateToken(newUser._id);
            return res.status(201).json({
                message: 'Admin registered successfully',
                token,
                user: {
                    id: newUser._id,
                    email: newUser.email,
                    role: newUser.role
                }
            });
        } else {
            return res.status(400).json({ message: 'Invalid role' });
        }
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ message: 'Server error during registration' });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        const token = generateToken(user._id);
        return res.status(200).json({
            message: "User logged in successfully",
            token,
            user: {
                id: user._id,
                name: user.username, // using username as name
                email: user.email,
                eqScore: user.eqScore,
                frontendScore: user.frontendScore,
                backendScore: user.backendScore
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const logoutUser = async (req, res) => {
    return res.status(200).json({ message: 'Logged out successfully' });
};

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    upload
};
