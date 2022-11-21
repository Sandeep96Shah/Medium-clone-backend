const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
    },
    title: {
        type: String,
    },
    brief: {
        type: String,
    },
    image: {
        type: String,
    },
    category: {
        type: String,
    },
    estimated: {
        type: Number,
    },
    description: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: new Date(),
    }
});

const Blogs = mongoose.model('blog', blogSchema);

module.exports = Blogs;