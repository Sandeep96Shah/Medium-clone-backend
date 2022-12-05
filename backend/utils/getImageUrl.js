require("dotenv").config();
// agent to interact with aws s3 bucket
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
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

const getUrls = async (blogs) => {
  for (let blog of blogs) {
    if (!blog.user.avatar.includes("https")) {
      const getParamsAvatar = {
        Bucket: bucketName,
        Key: blog.user.avatar,
      };

      const getCommandAvatar = new GetObjectCommand(getParamsAvatar);
      const avatarUrl = await getSignedUrl(s3, getCommandAvatar, {
        expiresIn: 360000,
      });
      blog.user.avatar = avatarUrl;
    }

    if (!blog.image.includes("https")) {
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
};

module.exports = { getUrls };
