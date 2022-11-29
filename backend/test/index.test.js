const request = require("supertest");
const app = require("../index");
const User = require("../model/user");

// first write all the negative test cases and then positive
describe("Sign-Up", () => {
  test("should create a user", async () => {
    const response = await request(app)
      .post("/sign-up")
      .send({
        name: "Sandeep",
        email: "Shah88@gmail.com",
        password: "1234567890S",
        confirmPassword: "1234567890S",
      })
      .expect(200);
    //Assert that the database was changed correctly
    const user = await User.findById(response.body.user._id);
    expect(response.body).toMatchObject({
      message: "User Created Successfully",
      status: "success",
      user: {
        name: "Sandeep",
        email: "shah88@gmail.com",
      },
    });
    expect(user.password).not.toBe("1234567890S");
  });

  test("should not create user as password don't match", async () => {
    const response = await request(app)
      .post("/sign-up")
      .send({
        name: "Sandeep",
        email: "Shah88@gmail.com",
        password: "1234567890S",
        confirmPassword: "1234567890S123",
      })
      .expect(400);

    expect(response.body).toMatchObject({
      message: "Password and Confirm password does not matched!",
      status: "failure",
    });
  });

  test("should not create user as password is not in format - less than 8 character", async () => {
    const response = await request(app)
      .post("/sign-up")
      .send({
        name: "Sandeep",
        email: "Shah88@gmail.com",
        password: "12345S",
        confirmPassword: "12345S",
      })
      .expect(400);

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
    const response = await request(app)
      .post("/sign-up")
      .send({
        name: "Sandeep",
        email: "Shah88@gmail.com",
        password: "123456789",
        confirmPassword: "123456789",
      })
      .expect(400);

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

  test("should not create user as password is not in format - no  number", async () => {
    const response = await request(app)
      .post("/sign-up")
      .send({
        name: "Sandeep",
        email: "Shah88@gmail.com",
        password: "Sandeep@Shah",
        confirmPassword: "Sandeep@Shah",
      })
      .expect(400);

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

  test("should not create user as user already exist", async () => {
    const response = await request(app)
      .post("/sign-up")
      .send({
        name: "Sandeep",
        email: "Shah88@gmail.com",
        password: "Sandeep@12345",
        confirmPassword: "Sandeep@12345",
      })
      .expect(400);

    expect(response.body).toMatchObject({
      message: "User already exists",
      status: "failure",
    });
  });
});

describe("sign-in", () => {
  test("sign-in successfully", async () => {
    const response = await request(app)
      .post("/sign-in")
      .send({
        email: "shah88@gmail.com",
        password: "1234567890S",
      })
      .expect(200);

    expect(response.body).toMatchObject({
      message: "User data is fetched successfully from db",
      status: "success",
    });
    expect(response.body.token && typeof response.body.token === "string");
  });

  test("sign-in Failed as user does not exist in db", async () => {
    const response = await request(app)
      .post("/sign-in")
      .send({
        email: "shah99@gmail.com",
        password: "1234567890S",
      })
      .expect(400);

    expect(response.body).toMatchObject({
      message: "You need to create an account first",
      status: "failure",
    });
  });

  test("sign-in Failed as password is wrong", async () => {
    const response = await request(app)
      .post("/sign-in")
      .send({
        email: "shah88@gmail.com",
        password: "1234567890S111",
      })
      .expect(400);

    expect(response.body).toMatchObject({
      message: "Email/Password is incorrect",
      status: "failure",
    });
  });
});

describe("public api", () => {
  test("get all posts", async () => {
    const response = await request(app).get("/").expect(200);
    expect(response.body).toMatchObject({
      message: "Successfully fetched the blogs from database",
      status: "success",
    });
    expect(Array.isArray(response.body.blogs)).toBe(true);
  });
});

let token = "";
let blogId = "";
let userId = "";

beforeAll(async () => {
  const response = await request(app)
    .post("/sign-in")
    .send({
      email: "testing@test.com",
      password: "Testing@12345",
    })
    .expect(200);
  token = response.body.token;
});

describe("After user has successfully signed in", () => {
  test("user details", async () => {
    const response = await request(app)
      .get("/user-details")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(response.body).toMatchObject({
      message: "User data is fetched successfully from db",
      status: "success",
    });
    expect(response.body.user && typeof response.body.user === "object").toBe(
      true
    );
    userId = response.body.user._id;
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
  test("do not get as user details as no token is missing", async () => {
    const response = await request(app).get("/user-details").expect(401);
  });
});

describe("Get blog details", () => {
  test("receives blog details", async () => {
    const response = await request(app)
      .get("/blog-details/637de860f024eefeae209efa")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(response.body).toMatchObject({
      message: "Fetched blog details from db",
      status: "success",
    });
    expect(
      response.body.blogDetails && typeof response.body.blogDetails === "object"
    ).toBe(true);
    expect(
      response.body.blogDetails.title && typeof response.body.blogDetails.title
    ).toBe("string");
    expect(
      response.body.blogDetails.brief && typeof response.body.blogDetails.brief
    ).toBe("string");
    expect(
      response.body.blogDetails.image && typeof response.body.blogDetails.image
    ).toBe("string");
    expect(
      response.body.blogDetails.category &&
        typeof response.body.blogDetails.category
    ).toBe("string");
    expect(
      response.body.blogDetails.estimated &&
        typeof response.body.blogDetails.estimated
    ).toBe("number");
    expect(
      response.body.blogDetails.description &&
        typeof response.body.blogDetails.description
    ).toBe("string");
    expect(
      response.body.blogDetails.description &&
        typeof response.body.blogDetails.description
    ).toBe("string");
    expect(
      response.body.blogDetails.createdAt &&
        typeof response.body.blogDetails.createdAt
    ).toBe("string");

    expect(
      response.body.blogDetails.user &&
        typeof response.body.blogDetails.user === "object"
    ).toBe(true);
    expect(
      response.body.blogDetails.user.name &&
        typeof response.body.blogDetails.user.name
    ).toBe("string");
    expect(
      response.body.blogDetails.user.avatar &&
        typeof response.body.blogDetails.user.avatar
    ).toBe("string");
  });
  test("do not get as user details as no token is missing", async () => {
    const response = await request(app)
      .get("/blog-details/637de860f024eefeae209efa")
      .expect(401);
  });
});

// todo later
// const poster = `${__dirname}/assets/image.png`;
// console.log("poster", poster);;

// describe('create blog', () => {
//   test('blog created successfully',async () => {
//     const response = await request(app)
//     .post("/create-blog")
//     .send({
//       user: userId,
//       title: "test",
//       brief: "test-brief",
//       category: "testing",
//       estimated: 5,
//       description: "testing purpose",
//       image: poster,
//     })
//     .set("Authorization", `Bearer ${token}`)
//     .expect(200);
//   })
// })

describe("save blog", () => {
  test("save successfully", async () => {
    const response = await request(app)
      .post("/save-blog")
      .send({
        userId: "6385a124815630dccabcbdc7",
        blogId: "637de860f024eefeae209efa",
      })
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      message: "Blog Saved in list successfully",
      status: "success",
    });

    expect(
      response.body.savedList && typeof response.body.savedList === "object"
    ).toBe(true);

    expect(Array.isArray(response.body.savedList.blogs)).toBe(true);
  });

  test("do not save as token is missing", async () => {
    const response = await request(app)
      .post("/save-blog")
      .send({
        userId: "6385a124815630dccabcbdc7",
        blogId: "637de860f024eefeae209efa",
      })
      .expect(401);
  });
});
