const User = require("../model/user");
const Blog = require("../model/blogs");
const SavedBlog = require("../model/userSavedLists");
const PostedBlog = require("../model/UserPostedBlogs");
const bcrypt = require("bcrypt");
const saltRounds = 10;

// creating new user
module.exports.CreateUser = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body || {};
    const { avatar } = req.file || {};
    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Password and Confirm password does not matched!",
        status: "failure",
      });
    }
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
        status: "failure",
      });
    }
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      avatar,
    });
    return res.status(200).json({
      message: "User Created Successfully",
      status: "success",
      user: newUser,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong!",
      status: "failure",
      error,
    });
  }
};

module.exports.SignIn = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const userExisting = await User.findOne({ email: email });
    if (!userExisting) {
      return res.status(400).json({
        message: "You need to create an account first",
        status: "failure",
      });
    }
    const isPasswordMatched = await bcrypt.compare(
      password,
      userExisting.password
    );
    if (isPasswordMatched) {
      const allBlogs = await Blog.find({}).populate("user", "name");

      const allSavedBlogs = await SavedBlog.findOne({
        user: userExisting._id,
      }).populate({
        path: 'blogs',
        populate: {
            path: 'user',
            select: 'name',
        }
      })

      // todo get the following info
      const allPostedBlogs = await PostedBlog.findOne({
        user: userExisting._id,
      }).populate({
        path: 'blogs',
        populate: {
            path: 'user',
            select: 'name',
        }
      })
      return res.status(200).json({
        message: "User data is fetched successfully from db",
        status: "success",
        user: userExisting,
        allBlogs,
        allSavedBlogs,
        allPostedBlogs,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "something went wrong",
      status: "failure",
      error,
    });
  }
};
