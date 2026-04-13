const User = require('../models/Users');
const Rating = require('../models/Rating');
const Message = require('../models/Message');
const Shop = require('../models/Shop');
const Reservation = require('../models/Reservation');

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
        const user = await User.findOne({email}).select('password status');

        if(!user){
            return res.status(401).json({
                success: false,
                msg: 'Invalid credentials'
            });
        }

        if (user.status === 'inactive') {
            return res.status(403).json({
                success: false,
                msg: 'This account is inactive'
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

exports.updateMe = async (req, res, next) => {
    try {
        const updates = {};
        const { name, email, tel } = req.body;

        if (name !== undefined) {
            updates.name = String(name).trim();
        }

        if (email !== undefined) {
            updates.email = String(email).trim().toLowerCase();
        }

        if (tel !== undefined) {
            updates.tel = String(tel).trim();
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields provided'
            });
        }

        if (updates.email) {
            const existingUser = await User.findOne({ email: updates.email });
            if (existingUser && existingUser._id.toString() !== req.user.id) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is already in use'
                });
            }
        }

        const user = await User.findByIdAndUpdate(req.user.id, updates, {
            new: true,
            runValidators: true
        });

        return res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || 'Failed to update profile'
        });
    }
}

exports.getAll = async (req, res, next) => {
    const user = await User.find();
    res.status(200).json({
        success: true,
        data: user
    })
}

exports.deactivateUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: `No user with the id of ${req.params.id}`
            });
        }

        const ratings = await Rating.find({ user: user._id }).select('shop');
        const shopIdsByString = buildShopIdMap(ratings);
        const affectedShopIds = [...shopIdsByString.keys()];

        await Promise.all([
            User.findByIdAndUpdate(user._id, { status: 'inactive' }, { new: true, runValidators: true }),
            Rating.deleteMany({ user: user._id }),
            Message.deleteMany({ user: user._id })
        ]);

        await recalculateShopRatings(shopIdsByString);

        const updatedUser = await User.findById(user._id);

        res.status(200).json({
            success: true,
            data: updatedUser
        });
    } catch (err) {
        console.log(err.stack);
        res.status(500).json({
            success: false,
            message: 'Cannot deactivate user'
        });
    }
}

exports.hardDeleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: `No user with the id of ${req.params.id}`
            });
        }

        const reservations = await Reservation.find({ user: user._id }).select('_id');
        const reservationIds = reservations.map((reservation) => reservation._id);

        const ratings = await Rating.find({
            $or: [
                { user: user._id },
                { reservation: { $in: reservationIds } }
            ]
        }).select('shop');

        const shopIdsByString = buildShopIdMap(ratings);

        await Promise.all([
            Rating.deleteMany({
                $or: [
                    { user: user._id },
                    { reservation: { $in: reservationIds } }
                ]
            }),
            Message.deleteMany({ user: user._id }),
            Reservation.deleteMany({ user: user._id }),
            User.findByIdAndDelete(user._id)
        ]);

        await recalculateShopRatings(shopIdsByString);

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        console.log(err.stack);
        res.status(500).json({
            success: false,
            message: 'Cannot permanently delete user'
        });
    }
}

const buildShopIdMap = (ratings) => {
    return new Map(ratings.map((rating) => [rating.shop.toString(), rating.shop]));
};

const recalculateShopRatings = async (shopIdsByString) => {
    await Promise.all(
        [...shopIdsByString.keys()].map(async (shopId) => {
            const result = await Rating.aggregate([
                { $match: { shop: shopIdsByString.get(shopId) } },
                { $group: { _id: '$shop', avgScore: { $avg: '$score' }, count: { $sum: 1 } } }
            ]);

            if (result.length > 0) {
                await Shop.findByIdAndUpdate(shopId, {
                    averageRating: Math.round(result[0].avgScore * 10) / 10,
                    ratingCount: result[0].count
                });
            } else {
                await Shop.findByIdAndUpdate(shopId, {
                    averageRating: 0,
                    ratingCount: 0
                });
            }
        })
    );
};

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
