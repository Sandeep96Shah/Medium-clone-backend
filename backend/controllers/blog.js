const Blog = require("../model/blogs");
const User = require("../model/user");
require("dotenv").config();

/**
 *
 * @property {object} putParams - contains data related to the bucket and the item to be saved in s3 bucket
 * @property {object} newBlog - contains data related to the newly created blog
 * @property {object} userPostedList - contains data related to user and array of blogs id which he/she has posted
 * @property {object} postedBlogs - contains blogs whcih the user has posted
 * @returns {object} {message: string, status: string} - if every operation executes successfully
 * @returns {object} {message: string, status: string, error: object} - if any operation fails to execute
 */

module.exports.createBlog = async (req, res) => {
  try {
    const { title, category, description, userId, blogImage } = req.body || {};

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
    console.log("updatedUser", updatedUser);

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
 * @property {object} userSavedList = contains data related to current userId and array of blogsId
 * @property {object} savedList - contains data related to blogs which the current user has saved
 * @returns {object} {message: string, status: string, data: object} - if every operation gets eecuted successfully
 * @returns {object} {message: string, status: string, error: object} - if any operation fails to execute
 */

module.exports.saveBlog = async (req, res) => {
  try {
    const { userId, blogId } = req.body || {};
    const user = await User.findById(userId, "savedBlogs");
    console.log("user", user);
    user.savedBlogs.push(blogId);
    await user.save();

    const updatedUser = await User.findById(userId, "savedBlogs").populate({
      path: "savedBlogs",
      populate: {
        path: "user",
        select: "name avatar",
      },
    });
    console.log("updatedUser", updatedUser);

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
    const blogs = await Blog.find({}).populate("user", "name avatar");
    console.log('blogs', blogs)

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
 * @property {object} getParamsAvatar - contains the data by which user avatar url is fetched from aws s3 bucket
 * @property {string} avatarUrl - contains the avatar url received from aws s3 bucket
 * @property {object} getParamsImage - contains the data by which the blog image url is fetched from aws s3 bucket
 * @property {string} imageUrl - contains the blog image url received from aws s3 bucket
 * @returns {object} {message: string, status: string, data: object} - if every operations executes successfully
 * @returns {object} {message: string, status: string, error: object} - if any operation fails to execute
 * @returns
 */

module.exports.blogDetails = async (req, res) => {
  try {
    const { id } = req.params || {};
    const blogDetails = await Blog.findById(id).populate("user", "name avatar");

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
