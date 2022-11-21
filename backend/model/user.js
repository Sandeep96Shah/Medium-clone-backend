const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    email: {
        type: String,
        unique: true,
        required: true,
    },
    avatar: {
        type: String,
    },
    password: {
        type: String,
    },
    interests: [
        {
            type: String,
        }
    ],
    following: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
        }
    ]
});

const Users = mongoose.model('user', userSchema);

module.exports = Users;