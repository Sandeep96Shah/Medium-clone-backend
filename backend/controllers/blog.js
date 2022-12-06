const Blog = require("../model/blogs");
const PostedBlog = require("../model/UserPostedBlogs");
const SavedBlog = require("../model/userSavedLists");
require("dotenv").config();
const { getUrls, s3 } = require("../utils/getImageUrl");
const {
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const bucketName = process.env.BUCKET_NAME;

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
    const { title, brief, category, estimated, description, user } =
      req.body || {};
    const { originalname, buffer, mimetype } = req.file || {};
    const putParams = {
      Bucket: bucketName,
      Key: originalname,
      Body: buffer,
      ContentType: mimetype,
    };

    const putCommand = new PutObjectCommand(putParams);
    await s3.send(putCommand);

    const newBlog = await Blog.create({
      user,
      title,
      brief,
      image: originalname,
      category,
      estimated,
      description,
    });
    const userPostedList = await PostedBlog.findOne({ user });
    if (!userPostedList) {
      await PostedBlog.create({
        user,
        blogs: [newBlog._id],
      });
    } else {
      userPostedList.blogs.push(newBlog._id);
      await userPostedList.save();
    }

    const postedBlogs = await PostedBlog.findOne({ user }).populate({
      path: "blogs",
      populate: {
        path: "user",
        select: "name avatar",
      },
    });

    await getUrls(postedBlogs.blogs);

    return res.status(200).json({
      message: "Blog created successfully",
      status: "success",
      // data: {
      //   blog: newBlog,
      //   postedBlogs: postedBlogs,
      // },
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
    const userSavedList = await SavedBlog.findOne({ user: userId });
    if (!userSavedList) {
      await SavedBlog.create({
        user: userId,
        blogs: [blogId],
      });
    } else {
      userSavedList.blogs.push(blogId);
      await userSavedList.save();
    }
    const savedList = await SavedBlog.findOne({ user: userId }).populate({
      path: "blogs",
      populate: {
        path: "user",
        select: "name avatar",
      },
    });

    await getUrls(savedList.blogs);

    return res.status(200).json({
      message: "Blog Saved in list successfully",
      status: "success",
      data: {
        savedList,
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

    await getUrls(blogs);

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
    const getParamsAvatar = {
      Bucket: bucketName,
      Key: blogDetails.user.avatar,
    };

    const getCommandAvatar = new GetObjectCommand(getParamsAvatar);
    const avatarUrl = await getSignedUrl(s3, getCommandAvatar, {
      expiresIn: 360000,
    });

    const getParamsImage = {
      Bucket: bucketName,
      Key: blogDetails.image,
    };

    const getCommandImage = new GetObjectCommand(getParamsImage);
    const imageUrl = await getSignedUrl(s3, getCommandImage, {
      expiresIn: 360000,
    });

    blogDetails.image = imageUrl;
    blogDetails.user.avatar = avatarUrl;
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
