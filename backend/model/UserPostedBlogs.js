const mongoose = require('mongoose');

const userPostedSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
    },
    blogs: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'blog',
        }
    ]
});

const UserPostedBlogs = mongoose.model('postedBlog', userPostedSchema);

module.exports = UserPostedBlogs;