const mongoose = require('mongoose');

//move the logic in user model and make changes in controller action accordingly
const userPostedSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    blogs: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Blog',
        }
    ]
});

const UserPostedBlogs = mongoose.model('PostedBlog', userPostedSchema);

module.exports = UserPostedBlogs;