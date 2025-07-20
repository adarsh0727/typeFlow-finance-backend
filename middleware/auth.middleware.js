const { auth } = require('express-oauth2-jwt-bearer');
const dotenv = require('dotenv');
const User = require('../models/user.model'); 
const mongoose = require('mongoose'); 

dotenv.config();

const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
  tokenSigningAlg: 'RS256'
});

const protect = (req, res, next) => {
  checkJwt(req, res, async (err) => { 
    if (err) {
      return next(err); 
    }

    if (!req.auth || !req.auth.payload) {
      return res.status(401).json({ message: 'Authentication failed: Invalid token payload structure.' });
    }

    const auth0UserId = req.auth.payload.sub; 
    const auth0Email = req.auth.payload.email; 
    const auth0Name = req.auth.payload.name; 
    const auth0Nickname = req.auth.payload.nickname; 

    try {
      let userInDb = await User.findOne({ clerkUserId: auth0UserId });

      if (!userInDb) {
        console.log(`User with Auth0 ID ${auth0UserId} not found in DB. Creating new entry.`);
        userInDb = await User.create({
          clerkUserId: auth0UserId,
          email: auth0Email || `${auth0UserId}@auth0-user.com`, // Email is often present
          username: auth0Nickname || auth0Name || auth0Email?.split('@')[0] || auth0UserId, // More robust username fallback
        });
        console.log(`New user synced to DB: ${userInDb.username} (${userInDb.email})`);
      }

     
      req.user = {
        _id: userInDb._id, 
        clerkUserId: userInDb.clerkUserId, 
        username: userInDb.username,
        email: userInDb.email,
      };

      next(); 
    } catch (dbError) {
      console.error('Database error during user synchronization in middleware:', dbError);
      return next(new Error('Internal server error during user synchronization.'));
    }
  });
};

module.exports = { protect };