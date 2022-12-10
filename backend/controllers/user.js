const User = require("../model/user");
const Blog = require("../model/blogs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const { avatar } = require("../utils/constant");
const { clearHash } = require('../config/cache');
require("dotenv").config();
const saltRounds = 10;

/**
 *
 * @property {object} error - contains data related to failed validation
 * @property {object} user - contains user which is fetched from DB
 * @property {string} hashedPassword - contains hash format of password
 * @returns {object} {message: string, error: array, status: string} - when validation fails
 * @returns {object} {message: string, status: string} - in case of success or any mis-matched operation
 * @returns {object} {message: string, error: object, status: string} - when any operation fails to execute
 */
module.exports.CreateUser = async (req, res) => {
  try {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json({
        message: "Validation error",
        error: error.array(),
        status: "validate-failure",
      });
    }
    const { name, email, password, confirmPassword } = req.body || {};
    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Password and Confirm password does not matched!",
        status: "failure",
      });
    }
    const user = await User.findOne({ email: email });
    if (user) {
      return res.status(400).json({
        message: "User already exists",
        status: "failure",
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
      message: "User Created Successfully",
      status: "success",
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
 * @property {object} user - contains user data, fetched from DB
 * @property {boolean} isPasswordMatched - will be true when password matched else false
 * @property {string} token - token string
 * @returns {object} {message: string, status: string, token: string} - if password matched
 * @returns {object} {message: string, status: string} - if password does not match or user doesn't exists
 * @returns {object} {message: string, status: string, error: object} - if any operation fails to execute.
 */

module.exports.SignIn = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(400).json({
        message: "You need to create an account first",
        status: "failure",
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
        status: "success",
        token,
      });
    }
    return res.status(400).json({
      message: "Email/Password is incorrect",
      status: "failure",
    });
  } catch (error) {
    return res.status(500).json({
      message: "something went wrong",
      status: "failure",
      error,
    });
  }
};

/**
 *
 * @property {object} user - contains user data fethced from DB
 * @property {object} blogs - contains blogs data, fethced from DB
 * @returns {object} {message: string, status: string, data: object} - if every operation executes successfully
 * @returns {object} {message: string, status: string, error: object} - if any operation fails to execute
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

    const blogs = await Blog.find({}).populate("user", "name avatar");

    return res.status(200).json({
      message: "User data is fetched successfully from db",
      status: "success",
      data: {
        user,
        blogs,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "something went wrong",
      status: "failure",
      error,
    });
  }
};

/**
 *
 * @property {object} user - user data, fethced from DB
 * @property {object} blogs - contains all the blogs data, fetched from DB
 * @returns {object} {message: string, status: string, data: object} - if every operation get executed successfully
 * @returns {object} {message:string, status: string, error: object} - if any operation fails to execute
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

    return res.status(200).json({
      message: "User Details is updated successfully",
      status: "success",
      data: {
        user,
        blogs,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error while updating the user details!",
      status: "failure",
      error,
    });
  }
};
