const Blog = require("../model/blogs");
const PostedBlog = require("../model/UserPostedBlogs");
const SavedBlog = require("../model/userSavedLists");
require("dotenv").config();

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

const commonMethod = async (blogs, avatarUrl) => {
  for (let blog of blogs) {
    // const getParamsAvatar = {
    //   Bucket: bucketName,
    //   Key: blog.user.avatar,
    // };

    // const getCommandAvatar = new GetObjectCommand(getParamsAvatar);
    // const avatarUrl = await getSignedUrl(s3, getCommandAvatar, {
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
    // const getParams = {
    //   Bucket: bucketName,
    //   Key: originalname,
    // };

    // const getCommand = new GetObjectCommand(getParams);
    // const imageUrl = await getSignedUrl(s3, getCommand, { expiresIn: 3600 });
    const newBlog = await Blog.create({
      user,
      title,
      brief,
      image: originalname,
      category,
      estimated,
      description,
    });
    const userPostedBlog = await PostedBlog.findOne({ user });
    if (!userPostedBlog) {
      await PostedBlog.create({
        user,
        blogs: [newBlog._id],
      });
    } else {
      userPostedBlog.blogs.push(newBlog._id);
      await userPostedBlog.save();
    }

    const updatedUserPostedBlog = await PostedBlog.findOne({ user }).populate({
      path: "blogs",
      populate: {
        path: "user",
        select: "name avatar",
      },
    });

    const getParamsAvatar = {
      Bucket: bucketName,
      Key: 'commonAvatar.webp',
    };

    const getCommandAvatar = new GetObjectCommand(getParamsAvatar);
    const avatarUrl = await getSignedUrl(s3, getCommandAvatar, {
      expiresIn: 360000,
    });
    
    await commonMethod(updatedUserPostedBlog.blogs, avatarUrl);
   
    return res.status(200).json({
      message: "Blog created successfully",
      status: "success",
      blog: newBlog,
      postedBlogs: updatedUserPostedBlog,
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
    const {userId,  blogId } = req.body || {};
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
        select: "name avatar",
      },
    });

    const getParamsAvatar = {
      Bucket: bucketName,
      Key: 'commonAvatar.webp',
    };

    const getCommandAvatar = new GetObjectCommand(getParamsAvatar);
    const avatarUrl = await getSignedUrl(s3, getCommandAvatar, {
      expiresIn: 360000,
    });

    await commonMethod(allSavedBlogs.blogs, avatarUrl);
  
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
    const allBlogs = await Blog.find({}).populate("user", "name avatar");
    const updatedAllBlogs = [];

    const getParamsAvatar = {
      Bucket: bucketName,
      Key: 'commonAvatar.webp',
    };

    const getCommandAvatar = new GetObjectCommand(getParamsAvatar);
    const avatarUrl = await getSignedUrl(s3, getCommandAvatar, {
      expiresIn: 360000,
    });
    
    await commonMethod(allBlogs, avatarUrl);

    return res.status(200).json({
      message: "Successfully fetched the blogs from database",
      status: "success",
      blogs: allBlogs,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong",
      status: "failure",
      error,
    });
  }
};

module.exports.blogDetails = async (req, res) => {
  try {
    const { id } = req.params || {};
    const blogDetails = await Blog.findById(id).populate('user', "name avatar");

    const getParamsAvatar = {
      Bucket: bucketName,
      Key: 'commonAvatar.webp',
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
      message: 'Fetched blog details from db',
      status: 'success',
      blogDetails,
    })

  }catch(error){
    return res.status(500).json({
      message: "Something went wrong",
      status: "failure",
      error,
    });
  }
}
