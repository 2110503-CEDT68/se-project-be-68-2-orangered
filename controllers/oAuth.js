const crypto = require('crypto');
const User = require('../models/Users');

const getTokenInfo = async (idToken) => {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);

    if (!response.ok) {
        throw new Error('Invalid Google id token');
    }

    return response.json();
};

const sendTokenResponse = (user, statusCode, res) => {
    const token = user.getSignedJwtToken();

    const option = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
        option.secure = true;
    }

    res.status(statusCode).cookie('token', token, option).json({
        success: true,
        token,
        data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            tel: user.tel || ''
        }
    });
};

exports.googleLogin = async (req, res, next) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({
                success: false,
                msg: 'Google idToken is required'
            });
        }

        const payload = await getTokenInfo(idToken);
        const expectedAudience = process.env.GOOGLE_CLIENT_ID;

        if (!expectedAudience || payload.aud !== expectedAudience) {
            return res.status(401).json({
                success: false,
                msg: 'Google token audience mismatch'
            });
        }

        if (payload.email_verified !== 'true') {
            return res.status(401).json({
                success: false,
                msg: 'Google account email is not verified'
            });
        }

        const email = payload.email;
        const googleId = payload.sub;
        const name = payload.name || email.split('@')[0];
        const tel = payload.tel;

        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({
                name,
                email,
                authProvider: 'google',
                googleId,
                tel,
                password: crypto.randomBytes(24).toString('hex')
            });
        } else if (user.authProvider !== 'google') {
            return res.status(409).json({
                success: false,
                msg: 'Email is already in use. Please sign in with email/password.'
            });
        } else if (!user.googleId) {
            user.googleId = googleId;
            await user.save();
        }

        sendTokenResponse(user, 200, res);
    } catch (err) {
        console.log(err.stack);
        res.status(401).json({
            success: false,
            msg: 'Google authentication failed'
        });
    }
};
