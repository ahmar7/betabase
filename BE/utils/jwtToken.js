// create cookie with token in a function, taking arguments from controller
const jwtToken = (user, statusCode, res) => {
  const token = user.generateToken();

  const isProd = process.env.NODE_ENV === 'production';
  const secure = isProd || process.env.COOKIE_SECURE === 'true';
  const sameSite = secure ? 'None' : 'Lax';

  const options = {
    expires: new Date(
      Date.now() + process.env.TOKEN_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    sameSite,
    secure,
    path: '/',
  };

  res.status(statusCode).cookie('jwttoken', token, options).json({
    success: true,
    token,
    user,
    link: false,
  });
};

module.exports = jwtToken;
