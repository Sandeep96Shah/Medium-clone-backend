const request = require("supertest");
const app = require("../index");
const User = require("../model/user");
const Blog = require("../model/blogs");
const SavedBlog = require("../model/userSavedLists");
const PostedBlog = require("../model/UserPostedBlogs");
const bcrypt = require("bcrypt");
const mockingoose = require("mockingoose");
const passport = require("passport");
const MockStrategy = require("passport-mock-strategy");

// import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
// import { mockClient } from 'aws-sdk-client-mock';

//PostedBlog
// first write all the negative test cases and then positive
describe("Sign-Up", () => {
  test("should not create user as password is not in format", async () => {
    const response = await request(app).post("/sign-up").send({
      name: "Test",
      email: "testing@test.com",
      password: "",
      confirmPassword: "",
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: "Validation error",
      status: "validate-failure",
      error: [
        {
          msg: "Password must be atleast 8 characters",
          param: "password",
        },
        {
          msg: "Password must contain a Number",
          param: "password",
        },
        {
          msg: "Password must contain an upperCase letter",
          param: "password",
        },
      ],
    });
  });

  test("should not create user as password is not in format - no  number", async () => {
    const response = await request(app).post("/sign-up").send({
      name: "Test",
      email: "testing@test.com",
      password: "Testing@",
      confirmPassword: "Testing@",
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: "Validation error",
      status: "validate-failure",
      error: [
        {
          msg: "Password must contain a Number",
          param: "password",
        },
      ],
    });
  });

  test("should not create user as password is not in format - less than 8 character", async () => {
    const response = await request(app).post("/sign-up").send({
      name: "Test",
      email: "testing@test.com",
      password: "Ta12345",
      confirmPassword: "Ta12345",
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: "Validation error",
      status: "validate-failure",
      error: [
        {
          msg: "Password must be atleast 8 characters",
          param: "password",
        },
      ],
    });
  });

  test("should not create user as password is not in format - no UpperCase letter", async () => {
    const response = await request(app).post("/sign-up").send({
      name: "Test",
      email: "testing@test.com",
      password: "testing@12345",
      confirmPassword: "testing@12345",
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: "Validation error",
      status: "validate-failure",
      error: [
        {
          msg: "Password must contain an upperCase letter",
          param: "password",
        },
      ],
    });
  });

  test("should not create user as password don't match", async () => {
    const response = await request(app).post("/sign-up").send({
      name: "Test",
      email: "testing@test.com",
      password: "Testing@12345",
      confirmPassword: "Testing@123456789",
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: "Password and Confirm password does not matched!",
      status: "failure",
    });
  });

  test("should not create user as user already exist", async () => {
    mockingoose(User).toReturn(
      {
        _id: "637de4c47370e9a0d625e8fd22",
        name: "Test",
        email: "testing@test.com",
      },
      "findOne"
    );
    const response = await request(app).post("/sign-up").send({
      name: "Test",
      email: "testing@test.com",
      password: "Testing@12345",
      confirmPassword: "Testing@12345",
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: "User already exists",
      status: "failure",
    });
  });

  test("should create a user", async () => {
    mockingoose(User).toReturn(null, "findOne");
    User.create = jest.fn().mockResolvedValue({
      avatar: "avatar.png",
      name: "Test",
      email: "testing@test.com",
      password: "637de4c47370e9a0d625e8fd637de4c47370e9a0d625e8fd",
    });
    const response = await request(app).post("/sign-up").send({
      name: "Test",
      email: "Testing@test.com",
      password: "Testing@12345",
      confirmPassword: "Testing@12345",
    });

    expect(response.status).toBe(200);

    expect(response.body).toMatchObject({
      message: "User Created Successfully",
      status: "success",
    });
  });
});

describe("sign-in", () => {
  test("sign-in Failed as user does not exist in db", async () => {
    mockingoose(User).toReturn(null, "findOne");
    const response = await request(app).post("/sign-in").send({
      email: "testing@test.com",
      password: "Testing@12345",
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: "You need to create an account first",
      status: "failure",
    });
  });

  test("sign-in Failed as password is wrong", async () => {
    mockingoose(User).toReturn(
      {
        _id: "637de4c47370e9a0d625e8fd22",
        name: "Test",
        email: "testing@test.com",
      },
      "findOne"
    );
    bcrypt.compare = jest.fn().mockResolvedValue(false);
    const response = await request(app).post("/sign-in").send({
      email: "testing@test.com",
      password: "Testing@12345",
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: "Email/Password is incorrect",
      status: "failure",
    });
  });

  test("sign-in successfully", async () => {
    mockingoose(User).toReturn(
      {
        _id: "637de4c47370e9a0d625e8fd33",
        name: "Test",
        email: "testing@test.com",
      },
      "findOne"
    );
    bcrypt.compare = jest.fn().mockResolvedValue(true);
    const response = await request(app).post("/sign-in").send({
      email: "testing@test.com",
      password: "Testing@12345",
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      message: "User data is fetched successfully from db",
      status: "success",
    });
    expect(response.body.token && typeof response.body.token === "string");
  });
});

describe("public api", () => {
  test("get all posts", async () => {
    Blog.schema.path("user", Object);
    mockingoose(Blog).toReturn(
      [
        {
          _id: "637de860f024eefeae209efa",
          user: {
            _id: "637de4c47370e9a0d625e8fd",
            avatar: "test.png",
            name: "Test",
          },
          title: "Sandeep-React-1",
          brief: "Test",
          image: "test.png",
          category: "Sandeep-React-1",
          estimated: 5,
          description: "Test",
          createdAt: "2022-11-23T09:28:38.222Z",
          __v: 0,
        },
      ],
      "find"
    );
    GetObjectCommand = jest.fn().mockResolvedValue({});
    getSignedUrl = jest.fn().mockResolvedValue("testingUrl");
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      message: "Successfully fetched the blogs from database",
      status: "success",
    });
  });
});

describe("After user has successfully signed in", () => {
  // let token = "";
  // let blogId = "";
  // let userId = "";

  // beforeAll(async () => {
  //   mockingoose(User).toReturn(
  //     {
  //       _id: "234wertyucvbn",
  //       name: "Test",
  //       avatar: "avatar.png",
  //       password: "qwerty234567dfgh",
  //       email: "testing@test.com",
  //       interests: [],
  //       following: [],
  //     },
  //     "findOne"
  //   );
  //   bcrypt.compare = jest.fn().mockResolvedValue(true);
  //   const response = await request(app)
  //     .post("/sign-in")
  //     .send({
  //       email: "testing@test.com",
  //       password: "Testing@12345",
  //     })
  //     .expect(200);
  //   token = response.body.token;
  // });

  const token = "1werf345678";

  test("do not get as user details as no token is missing", async () => {
    const response = await request(app).get("/user-details");
    expect(response.status).toBe(401);
  });

  test("user details", async () => {
    passport.use(
      new MockStrategy(
        {
          name: "jwt",
          user: {
            _id: "637de4c47370e9a0d625e8fd",
            name: "Test",
            email: "testing@test.com",
          },
        },
        (user, done) => {
          return done(null, user);
        }
      )
    );
    mockingoose(User).toReturn(
      {
        _id: "234wertyucvbn",
        name: "Test123",
        avatar: "avatar.png",
        password: "qwerty234567dfgh",
        email: "testing@test.com",
        interests: [],
        following: [],
      },
      "findOne"
    );
    GetObjectCommand = jest.fn().mockResolvedValue({});
    getSignedUrl = jest.fn().mockResolvedValue("image-url");

    Blog.schema.path("user", Object);
    mockingoose(Blog).toReturn(
      [
        {
          _id: "637de860f024eefeae209efa",
          user: {
            _id: "637de4c47370e9a0d625e8fd",
            avatar: "test.png",
            name: "Test",
          },
          title: "Sandeep-React-1",
          brief: "Test",
          image: "test.png",
          category: "Sandeep-React-1",
          estimated: 5,
          description: "Test",
          createdAt: "2022-11-23T09:28:38.222Z",
          __v: 0,
        },
      ],
      "find"
    );

    SavedBlog.schema.path("user", Object);
    PostedBlog.schema.path("user", Object);
    mockingoose(SavedBlog).toReturn(null, "findOne");
    mockingoose(PostedBlog).toReturn(null, "findOne");

    const response = await request(app)
      .get("/user-details", passport.authenticate("jwt"))
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(response.body).toMatchObject({
      message: "User data is fetched successfully from db",
      status: "success",
    });

    expect(response.body.user && typeof response.body.user === "object").toBe(
      true
    );
    expect(Array.isArray(response.body.allBlogs)).toBe(true);
    expect(
      response.body.allSavedBlogs &&
        typeof response.body.allSavedBlogs === "object"
    ).toBe(true);
    expect(
      response.body.allPostedBlogs &&
        typeof response.body.allPostedBlogs === "object"
    ).toBe(true);
  });
});

describe("Get blog details", () => {

  test("do not get as user details as no token is missing", async () => {
    const response = await request(app)
      .get("/blog-details/637de860f024eefeae209efa")
      
      expect(response.status).toBe(500)
  });
  test("receives blog details", async () => {
    const token = "rtydf345";
    passport.use(
      new MockStrategy(
        {
          name: "jwt",
          user: {
            _id: "637de4c47370e9a0d625e8fd",
            name: "Test",
            email: "testing@test.com",
          },
        },
        (user, done) => {
          return done(null, user);
        }
      )
    );
    Blog.schema.path("user", Object);
    mockingoose(Blog).toReturn(
      {
        _id: "qwertyuisdfghj123456",
        user: {
          _id: "qwsdfvpokijnhbwerty",
          name: "Test",
          avatar: "test.png",
        },
        title: "Demo",
        brief: "Demo testing",
        estimated: 5,
        image: "test.png",
        category: "demo",
        description: "demo description",
        createdAt: "02/12/2022",
      },
      "findOne"
    );
    const response = await request(app)
      .get(
        "/blog-details/qwertyuisdfghj123456",
        passport.authenticate("jwt")
      )
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      message: "Fetched blog details from db",
      status: "success",
    });
  });
});

// // todo later
// // const poster = `${__dirname}/assets/image.png`;
// // console.log("poster", poster);;

// // describe('create blog', () => {
// //   test('blog created successfully',async () => {
// //     const response = await request(app)
// //     .post("/create-blog")
// //     .send({
// //       user: userId,
// //       title: "test",
// //       brief: "test-brief",
// //       category: "testing",
// //       estimated: 5,
// //       description: "testing purpose",
// //       image: poster,
// //     })
// //     .set("Authorization", `Bearer ${token}`)
// //     .expect(200);
// //   })
// // })

// // const poster = `${__dirname}/assets/image.png`;
// // console.log("poster", poster);;

// // describe('create blog', () => {
// //   test('blog created successfully',async () => {
// //     const response = await request(app)
// //     .post("/create-blog")
// //     .send({
// //       user: userId,
// //       title: "test",
// //       brief: "test-brief",
// //       category: "testing",
// //       estimated: 5,
// //       description: "testing purpose",
// //       image: poster,
// //     })
// //     .set("Authorization", `Bearer ${token}`)
// //     .expect(200);
// //   })
// // })

// describe("save blog", () => {

//   // test("do not save as token is missing", async () => {
//   //   const response = await request(app)
//   //     .post("/save-blog")
//   //     .send({
//   //       userId: "6385a124815630dccabcbdc7",
//   //       blogId: "637de860f024eefeae209efa",
//   //     })
      
//   //     expect(response.status).toBe(500);
//   // });
//   test("save successfully", async () => {

//     passport.use(
//       new MockStrategy(
//         {
//           name: "jwt",
//           user: {
//             _id: "637de4c47370e9a0d625e8fd",
//             name: "Test",
//             email: "testing@test.com",
//           },
//         },
//         (user, done) => {
//           return done(null, user);
//         }
//       )
//     );

//     const token = "qwertyxcvb456";


//     // mockingoose(SavedBlog).toReturn(
//     //   {
//     //     _id: "234wertyucvbn",
//     //     user: "qqwert234567",
//     //     blogs: [],
//     //   },
//     //   "findOne"
//     // );

//     SavedBlog.schema.path('blogs', Object);
//     mockingoose(SavedBlog).toReturn({
//       // _id: "2345678wert",
//       user: "234567qwertkjnbv",
//       blogs: [
//         {
//           _id: "qwertyuisdfghj123456",
//           user: {
//             _id: "qwsdfvpokijnhbwerty",
//             name: "Test",
//             avatar: "test.png",
//           },
//           title: "Demo",
//           brief: "Demo testing",
//           estimated: 5,
//           image: "test.png",
//           category: "demo",
//           description: "demo description",
//           createdAt: "02/12/2022",
//         }
//       ], 
//     }, 'findOne')
    
//     SavedBlog.schema.path('blogs', Object);
//     mockingoose(SavedBlog).toReturn( {
//       // _id: "2345678wert",
//       user: "234567qwertkjnbv",
//       blogs: [
//         {
//           _id: "qwertyuisdfghj123456",
//           user: {
//             _id: "qwsdfvpokijnhbwerty",
//             name: "Test",
//             avatar: "test.png",
//           },
//           title: "Demo",
//           brief: "Demo testing",
//           estimated: 5,
//           image: "test.png",
//           category: "demo",
//           description: "demo description",
//           createdAt: "02/12/2022",
//         },
//         {
//           _id: "qwertyuisdfghj123456",
//           user: {
//             _id: "qwsdfvpokijnhbwerty",
//             name: "Test",
//             avatar: "test.png",
//           },
//           title: "Demo",
//           brief: "Demo testing",
//           estimated: 5,
//           image: "test.png",
//           category: "demo",
//           description: "demo description",
//           createdAt: "02/12/2022",
//         }
//       ]
//     }, 'save');

//     // mockingoose(SavedBlog).toReturn(
//     //   {
//     //     // _id: "234wertyucvbn",
//     //     user: "qqwert234567",
//     //     blogs: [],
//     //   },
//     //   "findOne"
//     // )
//     // .toReturn( {
//     //   _id: "234wertyucvbn",
//     //   user: "qqwert234567",
//     //   blogs: ['qqwert234567'],
//     // }, 'save');
   

//     const response = await request(app)
//       .post("/save-blog", passport.authenticate("jwt"))
//       .send({
//         userId: "6385a124815630dccabcbdc7",
//         blogId: "637de860f024eefeae209efa",
//       })
//       .set("Authorization", `Bearer ${token}`)
//       .expect(200);

//     expect(response.body).toMatchObject({
//       message: "Blog Saved in list successfully",
//       status: "success",
//     });

//     expect(
//       response.body.savedList && typeof response.body.savedList === "object"
//     ).toBe(true);

//     expect(Array.isArray(response.body.savedList.blogs)).toBe(true);
//   });

// });
