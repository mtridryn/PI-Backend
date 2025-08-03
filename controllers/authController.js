const pb = require('../pocketbase/pbClient');

exports.register = async (req, res) => {
  try {
    const user = await pb.collection('users').create(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const auth = await pb.collection('users').authWithPassword(req.body.email, req.body.password);
    res.status(200).json({
      token: auth.token,
      user: auth.record,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.logout = async (req, res) => {
  try {
    pb.authStore.clear();
    res.status(200).json({ message: 'Logout successful' });
  } catch {
    res.status(500).json({ message: 'Logout failed' });
  }
};
