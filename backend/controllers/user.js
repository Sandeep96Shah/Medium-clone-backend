const User = require("../model/user");
const Blog = require("../model/blogs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const { avatar } = require("../utils/constant");
const { clearHash } = require("../config/cache");
require("dotenv").config();
const saltRounds = 10;

/**
 *
 * @param {*} req
 * @param {*} res
 * @returns {response} {message: string, data: object}
 */
module.exports.CreateUser = async (req, res) => {
  try {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(404).json({
        message: "Please enter valid data",
        data: error.array(),
      });
    }
    const { name, email, password, confirmPassword } = req.body || {};
    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Password and Confirm password does not matched!",
        data: {},
      });
    }
    const user = await User.findOne({ email: email });
    if (user) {
      return res.status(400).json({
        message: "Please signIn",
        data: {},
      });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    await User.create({
      name,
      email,
      password: hashedPassword,
      avatar: avatar,
    });

    return res.status(200).json({
      message: "Registration successful",
      data: {},
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

module.exports.SignIn = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(400).json({
        message: "You need to create an account first",
        data: {},
      });
    }
    const isPasswordMatched = await bcrypt.compare(password, user.password);

    if (isPasswordMatched) {
      const token = jwt.sign(
        {
          email: user.email,
        },
        process.env.PASSPORT_SECRET_KEY,
        { expiresIn: "50h" }
      );
      return res.status(200).json({
        message: "User data is fetched successfully from db",
        data: {token},
      });
    }
    return res.status(400).json({
      message: "Email/Password is incorrect",
      data: {},
    });
  } catch (error) {
    return res.status(500).json({
      message: "something went wrong",
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

module.exports.userDetails = async (req, res) => {
  try {
    const { email, _id: userId } = req.user || {};
    const user = await User.findOne(
      { email: email },
      "name email avatar following interests postedBlogs savedBlogs"
    )
      .populate([
        {
          path: "postedBlogs",
          populate: {
            path: "user",
            select: "name avatar",
          },
        },
        {
          path: "savedBlogs",
          populate: {
            path: "user",
            select: "name avatar",
          },
        },
      ])
      .cache({ key: userId });

    const blogs = await Blog.find({}).populate("user", "name avatar").cache({ key: "all" });

    return res.status(200).json({
      message: "User data is fetched successfully from db",
      data: {
        user,
        blogs,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "something went wrong",
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

module.exports.updateUser = async (req, res) => {
  try {
    const { name, avatar } = req.body || {};
    const { _id: userId } = req.user || {};
    const user = await User.findById(
      userId,
      "name email avatar interests following"
    );
    if (name) {
      user.name = name;
      await user.save();
    }
    if (avatar) {
      user.avatar = avatar;
      await user.save();
    }

    const blogs = await Blog.find({}).populate("user", "name avatar");

    clearHash(userId);
    clearHash("all");

    return res.status(200).json({
      message: "User Details is updated successfully",
      data: {
        user,
        blogs,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error while updating the user details!",
      data: error,
    });
  }
};
