const Blog = require("../model/blogs");
const User = require("../model/user");
require("dotenv").config();
const { clearHash } = require("../config/cache");

/**
 * 
 * @param {*} req 
 * @param {*} res 
 *  @returns {response} {message: string, data: object} 
 */

module.exports.createBlog = async (req, res) => {
  try {
    const { title, category, description, blogImage } = req.body || {};
    const { _id: userId } = req.user || {};

    const newBlog = await Blog.create({
      user: userId,
      title,
      blogImage,
      category,
      readingTime: 5,
      description,
    });

    const user = await User.findById(userId);
    user.postedBlogs.push(newBlog._id);
    await user.save();
    const updatedUser = await User.findById(userId).populate({
      path: "postedBlogs",
      populate: {
        path: "user",
        select: "name avatar",
      },
    });

    clearHash("all");
    clearHash(userId);

    return res.status(200).json({
      message: "Blog created successfully",
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong!",
      error,
    });
  }
};

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns {response} {message: string, data: object} 
 */

module.exports.saveBlog = async (req, res) => {
  try {
    const { blogId } = req.body || {};
    const { _id: userId } = req.user || {};
    const user = await User.findById(userId, "savedBlogs");
    user.savedBlogs.push(blogId);
    await user.save();

    const updatedUser = await User.findById(userId, "savedBlogs").populate({
      path: "savedBlogs",
      populate: {
        path: "user",
        select: "name avatar",
      },
    });

    clearHash(userId);

    return res.status(200).json({
      message: "Blog Saved in list successfully",
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong!",
      data: error,
    });
  }
};

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns {response} {message: string, data: object} 
 */

module.exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({})
      .populate("user", "name avatar")
      .cache({ key: "all" });
    return res.status(200).json({
      message: "Successfully fetched the blogs from database",
      data: {
        blogs,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong",
      data: error,
    });
  }
};

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns {response} {message: string, data: object} 
 */

module.exports.blogDetails = async (req, res) => {
  try {
    const { id } = req.params || {};
    const blogDetails = await Blog.findById(id)
      .populate("user", "name avatar")
      .cache({ key: id });

    return res.status(200).json({
      message: "Fetched blog details from db",
      data: {
        blogDetails,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong",
      data: error,
    });
  }
};
