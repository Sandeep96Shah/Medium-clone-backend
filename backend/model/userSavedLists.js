const mongoose = require('mongoose');

//move the logic in user model and make changes in controller action accordingly
const userSavedListSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    blogs: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Blog',
        }
    ],
})

const UserSavedList = mongoose.model('SavedList', userSavedListSchema);

module.exports = UserSavedList;