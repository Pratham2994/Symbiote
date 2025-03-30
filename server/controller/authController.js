const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

const evaluateCandidate = async (resumeUrl, githubLink, eqAnswers) => {
    // Your logic to process the inputs through your ML model.
    // For now, we return dummy values.
    return {
      eqScore: 85,
      frontendScore: 75,
      backendScore: 80
    };
  };

const registerUser = async (req, res) => {
    const { username, email, password, resumeUrl, githubLink, eqAnswers, aboutMe, socialLinks, skills } = req.body;
    try {
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ message: "User already exists" });
      }
  
      // Process inputs through your ML model
      const scores = await evaluateCandidate(resumeUrl, githubLink, eqAnswers);
  
      // Create user record with scores and any additional data
      const newUser = await User.create({
        name: username, 
        email,
        password,
        github: githubLink,
       
        eqScore: scores.eqScore,
        frontendScore: scores.frontendScore,
        backendScore: scores.backendScore,

        aboutMe,
        socialLinks,
        skills

      });
  


      // Optionally generate token and return user info
      const token = generateToken(newUser._id);
      res.status(201).json({ message: "User registered successfully", token });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Server error" });
    }
  };



  
  const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
      // Find the user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "Invalid email or password" });
      }
  
      // Compare provided password with stored hashed password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid email or password" });
      }
  
      // Generate a token for the authenticated user
      const token = generateToken(user._id);
  
      // Respond with the user data and token
      res.status(200).json({
        message: "User logged in successfully",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          eqScore: user.eqScore,
          frontendScore: user.frontendScore,
          backendScore: user.backendScore
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Server error" });
    }
  };