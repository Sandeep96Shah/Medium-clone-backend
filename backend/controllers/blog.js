const Blog = require("../model/blogs");
const User = require("../model/user");
require("dotenv").config();
const { clearHash } = require("../config/cache");

/**
 *
 * @property {object} newBlog - contains data related to the newly created blog
 * @property {object} user - user data fetched from db to add the newBlog id into postedBlogs array
 * @property {object} updatedUser - user data fetched again from db so that it will have the newBlog data in its postedBlogs array
 * @returns {object} {message: string, status: string} - if every operation executes successfully
 * @returns {object} {message: string, status: string, error: object} - if any operation fails to execute
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

    return res.status(200).json({
      message: "Blog created successfully",
      status: "success",
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong!",
      status: "failure",
      error,
    });
  }
};

/**
 *
 * @property {object} user - user data fetched from db to add the blog id in savedBlogs array
 * @property {object} updatedUser - user data fetched again from db so that the savedBlogs will have newly added blog details
 * @returns {object} {message: string, status: string, data: object} - if every operation gets eecuted successfully
 * @returns {object} {message: string, status: string, error: object} - if any operation fails to execute
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
      status: "success",
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong!",
      status: "failure",
      error,
    });
  }
};

/**
 *
 * @property {object} blogs - contains data related tp all blogs fetched from DB
 * @returns {object} {message: string, status: string, data: string} - if every operation executes successfully
 * @returns {object} {message: string, status: string, error: object} - if any operation fails to execute
 */

module.exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({})
      .populate("user", "name avatar")
      .cache({ key: "all" });
    return res.status(200).json({
      message: "Successfully fetched the blogs from database",
      status: "success",
      data: {
        blogs,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong",
      status: "failure",
      error,
    });
  }
};

/**
 *
 * @property {object} blogDetails - contains the details data related to the blog
 * @returns {object} {message: string, status: string, data: object} - if every operations executes successfully
 * @returns {object} {message: string, status: string, error: object} - if any operation fails to execute
 * @returns
 */

module.exports.blogDetails = async (req, res) => {
  try {
    const { id } = req.params || {};
    const blogDetails = await Blog.findById(id)
      .populate("user", "name avatar")
      .cache({ key: id });

    return res.status(200).json({
      message: "Fetched blog details from db",
      status: "success",
      data: {
        blogDetails,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong",
      status: "failure",
      error,
    });
  }
};
