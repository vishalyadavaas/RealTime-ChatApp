const bcrypt = require('bcryptjs');
const User = require('../models/user.model')
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();



exports.signup = async (req, res) => {
    try {
        const { email, fullname, password} = req.body;
        
        // Check if all fields are provided
        if (!email || !fullname || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'All fields are required' 
            });
        }
        // password length should be greater than 6
        if (password.length < 6) {
            return res.status(400).json({ 
                success: false,
                message: 'Password length should be greater than 6' 
            });
        }

        // Check if user already exists
        const existUser = await User.findOne({ email });

        // If user exists, return error
        if (existUser) {
            return res.status(400).json({ 
                success: false,
                message: 'User already exists' 
            });
        } else {
            const hashPassword = await bcrypt.hash(password, 10);
            // Create new user
            const user = new User({
                email: email,
                fullname: fullname,
                password: hashPassword
            });
            const response = await user.save();
            if (response) {
                return res.status(201).json({
                    success: true,
                    message: 'User created successfully',
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'User not created'
                });
            }   
        } 

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
        
    }
};

exports.login = async (req, res) => {
   try {
    const { email, password } = req.body;
    // Check if all fields are provided
    if (!email || !password) {
        return res.status(400).json({ 
            success: false,
            message: 'All fields are required' 
        });
    }
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(400).json({ 
            success: false,
            message: 'User does not exist' 

        });
    }
    // Check if password is correct
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ 
            success: false,
            message: 'Invalid credentials' 
        });
    }
    else {
        const payload = {
            userId: user._id,
            email: user.email
        }
        // Generate token
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2d' });

        // set token in cookie
        res.cookie('token', token, { 
            httpOnly: true,
            sameSite: 'strict',
            secure: true,
            expires: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)  
        }).status(200).json({
            success: true,
            message: 'Login successful',
            token: token,
            user: {
                id: user._id,
                email: user.email,
                fullname: user.fullname,
                profilePicture: user.profilePicture
            }
        });
    }
   } catch (error) {
    return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
    });
   }
};

exports.logout = async (req, res) => {
    try {
        res.clearCookie('token');
        return res.status(200).json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
        
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { profilePicture } = req.body;
        const userId = req.user._id;

        if (!profilePicture) {
            return res.status(400).json({
                success: false,
                message: 'Profile picture is required'
            });
        }

        const uploadResponse = await cloudinary.uploader.upload(profilePicture);

       const updatedUser = await User.findByIdAndUpdate(userId, {profilePicture: uploadResponse.secure_url}, {new: true});
        if (updatedUser) {
            return res.status(200).json({
                success: true,
                message: 'Profile picture updated successfully',
                user : updatedUser
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Profile picture not updated'
            });
        }

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
        
    }
};

exports.checkAuth = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            message: 'User Authenticated',
            user: req.user
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};
