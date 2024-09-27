import jwt from 'jsonwebtoken';

/**
 * Middleware to authenticate a JWT token.
 *
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @param {function} next - The next middleware function to call if authentication is successful.
 * @returns {void} - Sends a response and does not return anything.
 */
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) return res.status(401).json({ success: false, message: 'Access denied, no token provided.' });

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ success: false, message: 'Invalid token.' });
  }
};

export default authenticateToken;
