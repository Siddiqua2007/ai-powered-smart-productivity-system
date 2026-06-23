const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            return next();
        } catch (error) {
            res.statusCode = 401;
            return next(new Error('Not authorized, token failed'));
        }
    }

    if (!token) {
        res.statusCode = 401;
        return next(new Error('Not authorized, no token provided'));
    }
};

module.exports = { protect };