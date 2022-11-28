const request = require("supertest");
const app = require("../index");
const User = require("../model/user");


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
