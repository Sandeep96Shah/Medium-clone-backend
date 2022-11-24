const User = require("../model/user");
const Blog = require("../model/blogs");
const SavedBlog = require("../model/userSavedLists");
const PostedBlog = require("../model/UserPostedBlogs");
const bcrypt = require("bcrypt");
const saltRounds = 10;
require("dotenv").config();
const jwt = require("jsonwebtoken");

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

// issue for avatar url is fetched wrong from s3 bucket
const commonMethod = async (blogs, avatarUrl) => {
  for (let blog of blogs) {
    // const getParams = {
    //   Bucket: bucketName,
    //   Key: blog.user.avatar,
    // };

    // const getCommand = new GetObjectCommand(getParams);
    // const avatarUrl = await getSignedUrl(s3, getCommand, {
    //   expiresIn: 360000,
    // });
    blog.user.avatar = avatarUrl;
    
    const getParamsImage = {
      Bucket: bucketName,
      Key: blog.image,
    };

    const getCommandImage = new GetObjectCommand(getParamsImage);
    const imageUrl = await getSignedUrl(s3, getCommandImage, {
      expiresIn: 360000,
    });
    blog.image = imageUrl;
  }

}

// 'commonAvatar.webp'
// creating new user
module.exports.CreateUser = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body || {};
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
    // const putParams = {
    //   Bucket: bucketName,
    //   Key: originalname,
    //   Body: buffer,
    //   ContentType: mimetype,
    // };

    // const putCommand = new PutObjectCommand(putParams);
    // await s3.send(putCommand);
    // const getParams = {
    //   Bucket: bucketName,
    //   Key: originalname,
    // };

    // const getCommand = new GetObjectCommand(getParams);
    // const avatarUrl = await getSignedUrl(s3, getCommand, { expiresIn: 3600 });
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      avatar: "commonAvatar.webp",
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
      const token = jwt.sign(
        {
          email: userExisting.email,
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
    const userExisting = await User.findOne({ email: email });

    const getParamsAvatar = {
      Bucket: bucketName,
      Key: 'commonAvatar.webp',
    };

    const getCommandAvatar = new GetObjectCommand(getParamsAvatar);
    const avatarUrl = await getSignedUrl(s3, getCommandAvatar, {
      expiresIn: 360000,
    });

      const allBlogs = await Blog.find({}).populate("user", "name avatar");

      await commonMethod(allBlogs, avatarUrl);
    
      const allSavedBlogs = await SavedBlog.findOne({
        user: userExisting._id,
      }).populate({
        path: "blogs",
        populate: {
          path: "user",
          select: "name",
        },
      });
      if(allSavedBlogs) {
        await commonMethod(allSavedBlogs.blogs, avatarUrl);
      }

      // todo get the following info
      const allPostedBlogs = await PostedBlog.findOne({
        user: userExisting._id,
      }).populate({
        path: "blogs",
        populate: {
          path: "user",
          select: "name avatar",
        },
      });

      if(allPostedBlogs) {
        await commonMethod(allPostedBlogs.blogs, avatarUrl);
      }

      return res.status(200).json({
        message: "User data is fetched successfully from db",
        status: "success",
        user: userExisting,
        allBlogs,
        allSavedBlogs,
        allPostedBlogs,
      });
  } catch (error) {
    return res.status(500).json({
      message: "something went wrong",
      status: "failure",
      error,
    });
  }
}
