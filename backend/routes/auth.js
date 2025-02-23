const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const router = express.Router();
const jwt = require("jsonwebtoken");
const { body, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/authMiddleware');

// Simplified validation middleware
const signupValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .matches(/^[^\s@]+@[^\s@]+$/)
    .withMessage('Email format is invalid'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];


// Token verification route
router.get('/verify', authMiddleware, async (req, res) => {
  try {
    // If authMiddleware passes, the token is valid
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    res.json({ valid: true, user });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ message: 'Token invalid' });
  }
});

// Sign Up Route
router.post('/signup', signupValidation, async (req, res) => {
  try {
    console.log('Received signup request:', {
      username: req.body.username,
      email: req.body.email,
      hasPassword: !!req.body.password
    });

    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ 
        message: errors.array()[0].msg,
        errors: errors.array() 
      });
    }

    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword
    });

    await newUser.save();
    console.log('New user created:', email);
    
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Sign In Route
router.post("/signin", [
  body('email').trim().notEmpty().withMessage('Email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    console.log('Received signin request for:', req.body.email);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: errors.array()[0].msg,
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { 
        expiresIn: "1h",
        algorithm: 'HS256'
      }
    );

    // Set token in httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000 // 1 hour
    });

    console.log('User signed in successfully:', email);

    res.json({ 
      token,
      user: { 
        id: user._id, 
        email: user.email 
      } 
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ message: "Server error during sign in" });
  }
});

module.exports = router;