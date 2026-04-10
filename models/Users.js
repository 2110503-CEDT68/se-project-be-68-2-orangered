const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please add a valid email'
        ]
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    authProvider: {
        type: String,
        enum: ['local', 'google'],
        default: 'local'
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    tel: {
        type: String,
        required: function () {
            return this.authProvider === 'local';
        },
        match: [/^[0-9]{10}$/, 'Telephone number must be exactly 10 digits'],
    },
    password: {
        type: String,
        required: function () {
            return this.authProvider === 'local';
        },
        minlength: 6,
        select: false
    },
    
    profilePicture: {
        type: String,
        default: null
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }

});

//Encrypt password
UserSchema.pre('save', async function () {
    if (!this.password || !this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
})

//Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
    return jwt.sign({id:this._id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
}

//Match user entered password
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}

module.exports = mongoose.model('MS_Users', UserSchema);
