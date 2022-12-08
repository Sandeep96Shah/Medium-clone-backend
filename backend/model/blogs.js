const {blogCategories} = require('../utils/constant');
const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    title: {
        type: String,
        required: true,
    },
    blogImage: {
        type: String,
    },
    category: {
        type: String,
        default: 'Not Declared',
        // enum: blogCategories
    },
    readingTime: {
        type: Number,
    },
    description: {
        type: String,
        required: true,
    },
},{
    timestamps: true
});

const Blogs = mongoose.model('Blog', blogSchema);

module.exports = Blogs;