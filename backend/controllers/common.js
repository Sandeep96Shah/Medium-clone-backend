const AWS = require("aws-sdk");
const uuid = require("uuid");
require("dotenv").config();

const s3 = new AWS.S3({
  accessKeyId: process.env.ACCESS_KEY,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  region: process.env.BUCKET_REGION,
});

module.exports.getSignedUrl = async (req, res) => {
  const key = `${req.user.id}/${uuid.v1()}.jpeg`;
  s3.getSignedUrl(
    "putObject",
    {
      Bucket: process.env.BUCKET_NAME,
      ContentType: "image/jpeg",
      Key: key,
    },
    (err, url) =>{
    if(err) {
        return res.status(400).json({
            message: "failure",
            status: 'failure',
        })
    }
    return res.status(200).json({
        status: 'success',
        key,
        url,
      })
    }
  );
};