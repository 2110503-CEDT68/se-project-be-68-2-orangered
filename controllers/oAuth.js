const crypto = require('crypto');
const User = require('../models/Users');
const { isArchivedEmail, normalizeEmail } = require('../utils/userArchive');

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
        const { idToken, role } = req.body;

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

        const email = normalizeEmail(payload.email);
        const googleId = payload.sub;
        const name = payload.name || email.split('@')[0];
        const tel = payload.tel;
        const selectedRole = role === 'shopowner' ? 'shopowner' : 'user';

        if (await isArchivedEmail(email)) {
            return res.status(403).json({
                success: false,
                msg: 'This email address cannot be used again'
            });
        }

        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({
                name,
                email,
                role: selectedRole,
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
        } else if (user.status === 'inactive') {
            return res.status(403).json({
                success: false,
                msg: 'This account is inactive'
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
