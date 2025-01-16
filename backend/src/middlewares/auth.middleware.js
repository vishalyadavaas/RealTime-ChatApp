import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import dotenv from 'dotenv';
dotenv.config();

export const protectRoute = async (req, res, next) => {
    try {
        // Get the token from the cookie
        const token = req.cookies.token;
        // Check if token exists
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized - No token'  
            });
        }
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized - Token verification failed'
            });
        }

        // Check if user exists
        const user = await User.findById(decoded.userId).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized'
        });
    }
};