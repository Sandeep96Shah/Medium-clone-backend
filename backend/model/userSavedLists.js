const mongoose = require('mongoose');

const userSavedListSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
    },
    blogs: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'blog',
        }
    ],
})

const UserSavedList = mongoose.model('savedList', userSavedListSchema);

module.exports = UserSavedList;