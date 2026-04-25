const User = require('../models/Users');
const Rating = require('../models/Rating');
const Message = require('../models/Message');
const Shop = require('../models/Shop');
const Reservation = require('../models/Reservation');
const {
    archiveDeletedUser,
    isArchivedEmail,
    listArchivedUsers,
    restoreArchivedEmailById,
    normalizeEmail,
} = require('../utils/userArchive');

exports.register = async (req, res, next) => {
    try{
        const {name, email, password, tel, role} = req.body;
        const normalizedEmail = normalizeEmail(email);
        const selectedRole = role === 'shopowner' ? 'shopowner' : 'user';

        if (await isArchivedEmail(normalizedEmail)) {
            return res.status(403).json({
                success: false,
                msg: 'This email address cannot be used again'
            });
        }

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                msg: 'Email already registered'
            });
        }

        //Create user
        const user = await User.create({
            name,
            email: normalizedEmail,
            password,
            tel,
            role: selectedRole
        });

        sendTokenResponse(user, 201, res);
    }catch(err){
        res.status(400).json({success: false});
        console.log(err.stack);
    }
};

exports.login = async (req, res, next) => {
    try{
        const {email, password} =req.body;
        const normalizedEmail = normalizeEmail(email);
        //Validate email & password
        if(!normalizedEmail || !password){
            return res.status(400).json({
                success: false,
                msg: 'Please provide an email and password'
            });
        }

        //Check for user
        if (await isArchivedEmail(normalizedEmail)) {
            return res.status(403).json({
                success: false,
                msg: "Access to this account has been suspended due to a policy violation."
            });
        }

        const user = await User.findOne({email: normalizedEmail}).select('password status');

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
            updates.email = normalizeEmail(email);
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
            if (await isArchivedEmail(updates.email)) {
                return res.status(400).json({
                    success: false,
                    message: 'This email address cannot be used again'
                });
            }

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
    const archivedUsers = await listArchivedUsers();
    res.status(200).json({
        success: true,
        data: user,
        archivedData: archivedUsers
    })
}

exports.adminUpdateUser = async (req, res, next) => {
    try {
        if (req.params.id === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Use /me to update your own account'
            });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: `No user with the id of ${req.params.id}`
            });
        }

        const updates = {};
        const { name, email, tel, role, status, profilePicture } = req.body;

        if (name !== undefined) {
            updates.name = String(name).trim();
        }

        if (email !== undefined) {
            updates.email = normalizeEmail(email);
        }

        if (tel !== undefined) {
            updates.tel = String(tel).trim();
        }

        if (role !== undefined) {
            updates.role = role;
        }

        if (status !== undefined) {
            updates.status = status;
        }

        if (profilePicture !== undefined) {
            if (profilePicture === null || String(profilePicture).trim() === '') {
                updates.profilePicture = null;
            } else {
                const parsedProfilePicture = String(profilePicture).trim();

                try {
                    new URL(parsedProfilePicture);
                } catch (err) {
                    return res.status(400).json({
                        success: false,
                        message: 'Profile picture must be a valid URL'
                    });
                }

                updates.profilePicture = parsedProfilePicture;
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields provided'
            });
        }

        if (updates.email) {
            if (await isArchivedEmail(updates.email)) {
                return res.status(400).json({
                    success: false,
                    message: 'This email address cannot be used again'
                });
            }

            const existingUser = await User.findOne({ email: updates.email });
            if (existingUser && existingUser._id.toString() !== req.params.id) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is already in use'
                });
            }
        }

        const updatedUser = await User.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true
        });

        return res.status(200).json({
            success: true,
            data: updatedUser
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || 'Failed to update user'
        });
    }
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

        await archiveDeletedUser(user);

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

exports.restoreDeletedEmail = async (req, res, next) => {
    try {
        const archivedUser = await restoreArchivedEmailById(req.params.id);

        if (!archivedUser) {
            return res.status(404).json({
                success: false,
                message: `No archived email entry with the id of ${req.params.id}`
            });
        }

        return res.status(200).json({
            success: true,
            data: archivedUser
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Cannot restore archived email'
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
