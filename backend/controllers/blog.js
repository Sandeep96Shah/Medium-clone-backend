const Blog = require("../model/blogs");
const PostedBlog = require("../model/UserPostedBlogs");
const SavedBlog = require("../model/userSavedLists");

module.exports.createBlog = async (req, res) => {
  try {
    const { title, brief, category, estimated, description, user } =
      req.body || {};
    const { image } = req.file || {};
    const newBlog = await Blog.create({
      user,
      title,
      brief,
      image,
      category,
      estimated,
      description,
    });
    const userPostedBlog = await PostedBlog.findOne({ user });
    if (!userPostedBlog) {
      const newPostedBlog = await PostedBlog.create({
        user,
        blogs: [newBlog._id],
      });
      return res.status(200).json({
        message: "Blog created successfully",
        status: "success",
        blog: newBlog,
        postedBlogs: newPostedBlog,
      });
    }
    await userPostedBlog.blogs.push(newBlog._id);
    return res.status(200).json({
      message: "Blog created successfully",
      status: "success",
      blog: newBlog,
      postedBlogs: userPostedBlog,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong!",
      status: "failure",
      error,
    });
  }
};

module.exports.saveBlog = async (req, res) => {
  try {
    const { userId, blogId } = req.body || {};
    const existingUser = await SavedBlog.findOne({ user: userId });
    if (!existingUser) {
      const newSavedList = await SavedBlog.create({
        user: userId,
        blogs: [blogId],
      });
    } else {
      existingUser.blogs.push(blogId);
      await existingUser.save();
    }
    const allSavedBlogs = await SavedBlog.findOne({ user: userId }).populate({
      path: "blogs",
      populate: {
        path: "user",
        select: "name",
      },
    });
    return res.status(200).json({
      message: "Blog Saved in list successfully",
      status: "success",
      savedList: allSavedBlogs,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong!",
      status: "failure",
      error,
    });
  }
};

module.exports.getAllBlogs = async (req, res) => {
  try {
    const allBlogs = await Blog.find({}).populate('user', 'name');
    console.log('allBlogs', allBlogs);
    return res.status(200).json({
        message: 'Successfully fetched the blogs from database',
        status: 'success',
        blogs: allBlogs,
    })
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong",
      status: "failure",
      error,
    });
  }
};
