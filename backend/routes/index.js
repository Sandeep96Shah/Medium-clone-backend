const express = require("express");
const router = express.Router();
const passport = require("passport");

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const userController = require("../controllers/user");
const blogController = require("../controllers/blog");

const { check } = require("express-validator");
const SignUpValidator = [
  check("email", "Email should be in proper format")
    .trim()
    .normalizeEmail()
    .isEmail(),
  check("password")
    .isLength({ min: 8 })
    .withMessage("Password must be atleast 8 characters")
    .matches("[0-9]")
    .withMessage("Password must contain a Number")
    .matches("[A-Z]")
    .withMessage("Password must contain an upperCase letter"),
];

router.get("/", blogController.getAllBlogs);

router.post("/sign-up", SignUpValidator, userController.CreateUser);

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

router.get(
  "/user-details",
  passport.authenticate("jwt", { session: false }),
  userController.userDetails
);

router.get(
  "/blog-details/:id",
  passport.authenticate("jwt", { session: false }),
  blogController.blogDetails
);

router.post(
  "/update-user",
  passport.authenticate("jwt", { session: false }),
  upload.single("avatar"),
  userController.updateUser
);

module.exports = router;
