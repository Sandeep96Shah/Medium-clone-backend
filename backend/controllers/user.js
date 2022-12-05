const User = require("../model/user");
const Blog = require("../model/blogs");
const SavedBlog = require("../model/userSavedLists");
const PostedBlog = require("../model/UserPostedBlogs");
const bcrypt = require("bcrypt");
const saltRounds = 10;
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const { getUrls } = require("../utils/getImageUrl");

// agent to interact with aws s3 bucket
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const accessKey = process.env.ACCESS_KEY;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;
const bucketRegion = process.env.BUCKET_REGION;
const bucketName = process.env.BUCKET_NAME;
const s3 = new S3Client({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey,
  },
  region: bucketRegion,
});

// creating new user
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
      avatar: "commonAvatar.webp",
    });
    // pass only user-id
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
        { expiresIn: "5h" }
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

module.exports.userDetails = async (req, res) => {
  try {
    const { email } = req.user || {};
    const user = await User.findOne({ email: email });

    const getParamsAvatar = {
      Bucket: bucketName,
      Key: user.avatar,
    };

    const getCommandAvatar = new GetObjectCommand(getParamsAvatar);

    const avatarUrl = await getSignedUrl(s3, getCommandAvatar, {
      expiresIn: 360000,
    });

    user.avatar = avatarUrl;

    const blogs = await Blog.find({}).populate("user", "name avatar");

    await getUrls(blogs);

    const savedBlogs = await SavedBlog.findOne({
      user: user._id,
    }).populate({
      path: "blogs",
      populate: {
        path: "user",
        select: "name avatar",
      },
    });
    if (savedBlogs) {
      await getUrls(savedBlogs.blogs);
    }

    // todo get the following info
    const postedBlogs = await PostedBlog.findOne({
      user: user._id,
    }).populate({
      path: "blogs",
      populate: {
        path: "user",
        select: "name avatar",
      },
    });

    if (postedBlogs) {
      await getUrls(postedBlogs.blogs);
    }

    return res.status(200).json({
      message: "User data is fetched successfully from db",
      status: "success",
      data: {
        user,
        blogs,
        savedBlogs: savedBlogs || {},
        postedBlogs: postedBlogs || {},
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

module.exports.updateUser = async (req, res) => {
  try {
    const { userId, name } = req.body || {};
    const { originalname, buffer, mimetype } = req.file || {};
    const user = await User.findById(userId);
    if (name) {
      user.name = name;
    }
    if (originalname) {
      user.avatar = originalname;
    }

    await user.save();

    const putParams = {
      Bucket: bucketName,
      Key: originalname,
      Body: buffer,
      ContentType: mimetype,
    };

    const putCommand = new PutObjectCommand(putParams);
    await s3.send(putCommand);
    const getParams = {
      Bucket: bucketName,
      Key: originalname,
    };

    const getCommand = new GetObjectCommand(getParams);
    const avatarUrl = await getSignedUrl(s3, getCommand, { expiresIn: 3600 });
    user.avatar = avatarUrl;

    const blogs = await Blog.find({}).populate("user", "name avatar");

    await getUrls(blogs);

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
      message: "Error while uploading the user details!",
      status: "failure",
      error,
    });
  }
};
