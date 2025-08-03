const pb = require('../pocketbase/pbClient');

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token required' });

    const authData = await pb.collection('users').authRefresh(token);
    req.user = authData.record;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
