const User = require('../models/Users');

exports.register = async (req, res, next) => {
    try{
        const {name, email, password, tel, role} = req.body;

        //Create user
        const user = await User.create({
            name,
            email,
            password,
            tel,
            role
        });

        //Create token
        // const token = user.getSignedJwtToken();

        // res.status(200).json({success: true, token});
        //use cookie
        sendTokenResponse(user, 201, res);
    }catch(err){
        res.status(400).json({success: false});
        console.log(err.stack);
    }
};

exports.login = async (req, res, next) => {
    try{
        const {email, password} =req.body;
        //Validate email & password
        if(!email || !password){
            return res.status(400).json({
                success: false,
                msg: 'Please provide an email and password'
            });
        }

        //Check for user
        const user = await User.findOne({email}).select('password');

        if(!user){
            return res.status(401).json({
                success: false,
                msg: 'Invalid credentials'
            });
        }

        //Check if password matches
        const isMatch = await user.matchPassword(password);

        if(!isMatch){
            return res.status(401).json({
                success:false,
                msg: 'Invalid credentials'
            });
        }

        //Create token
        // const token = user.getSignedToken();

        // res.status(200).json({success: true, token});
        //use cookie
        sendTokenResponse(user, 200, res);
    }catch(err){
        return res.status(401).json({
            success: false,
            msg:'Cannot convert email or password to string'
        })
    }
    
};

//Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    //create token
    const token = user.getSignedJwtToken();

    const option = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true
    };

    if(process.env.NODE_ENV === 'production'){
        option.secure = true;
    }
    res.status(statusCode).cookie('token', token, option).json({
        success: true,
        token
    })
}

exports.uploadAvatar = async (req, res) => {
    try {
        const { profilePictureUrl } = req.body;
        if (!profilePictureUrl) {
            return res.status(400).json({ success: false, message: 'No URL provided' });
        }

        await User.findByIdAndUpdate(req.user.id, { profilePicture: profilePictureUrl });

        res.status(200).json({ success: true, profilePicture: profilePictureUrl });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getMe = async (req, res, next) => {
    const user = await User.findById(req.user.id);
    res.status(200).json({
        success: true,
        data: user
    })
}

exports.getAll = async (req, res, next) => {
    const user = await User.find();
    res.status(200).json({
        success: true,
        data: user
    })
}

exports.logout = async (req, res, next) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10*1000),// expire in 10 seconds
        httpOnly: true
    });

    res.status(200).json({
        success: true,
        data:{}
    })
}