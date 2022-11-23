const express = require("express");
const router = express.Router();
const passport = require("passport");

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const userController = require("../controllers/user");
const blogController = require("../controllers/blog");

router.get("/", blogController.getAllBlogs);

router.post("/sign-up", userController.CreateUser);

router.post("/sign-in", userController.SignIn);

router.post(
  "/create-blog",
  passport.authenticate("jwt", { session: false }),
  upload.single("image"),
  blogController.createBlog
);

router.post(
  "/save-blog",
  passport.authenticate("jwt", { session: false }),
  blogController.saveBlog
);

router.get('/user-details', passport.authenticate("jwt", { session: false }), userController.userDetails);

router.get('/blog-details/:id', passport.authenticate("jwt", { session: false }), blogController.blogDetails);

module.exports = router;