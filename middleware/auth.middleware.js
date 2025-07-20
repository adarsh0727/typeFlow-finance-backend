const { auth } = require('express-oauth2-jwt-bearer');
const dotenv = require('dotenv');

dotenv.config();

const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`, 
  tokenSigningAlg: 'RS256' 
});

const protect = (req, res, next) => {
  checkJwt(req, res, (err) => {
    if (err) {
      return next(err);
    }

    if (req.auth && req.auth.payload) {
      req.user = {
        _id: req.auth.payload.sub, 
        email: req.auth.payload.email, 
        username: req.auth.payload.nickname || req.auth.payload.name || req.auth.payload.email?.split('@')[0] || req.auth.payload.sub // Fallback for username
      };

      
      next();
    } else {
      res.status(401).json({ message: 'Authentication failed: Invalid token payload structure.' });
    }
  });
};

module.exports = { protect };