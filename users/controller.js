import jwt from "jsonwebtoken";
import Joi from "joi";
import passport from "passport";
import { User } from "./schema.js";

const addUserSchema = Joi.object({
  password: Joi.string()
    .pattern(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Password must contain at least 8 characters, one uppercase letter, one digit, and one special character.",
    }),
  email: Joi.string().email().required(),
});

export const auth = (req, res, next) => {
  passport.authenticate("jwt", (err, user) => {
    if (err || !user) {
      return res.json({
        status: "Unauthorized",
        code: 401,
        message: "Not authorized",
      });
    }
    req.user = user;
    next();
  })(req, res, next);
};

export const getUsers = async (_, res, next) => {
  try {
    const users = await User.find({});
    res.json({
      status: "OK",
      code: 200,
      data: {
        users,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const signup = async (req, res, next) => {
  const { email, password, subscription } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    return res.json({
      status: "Conflict",
      code: 409,
      message: "Email in use",
    });
  }

  const { error } = addUserSchema.validate(req.body);

  if (error) {
    return res.json({
      status: "Bad Request",
      code: 400,
      message: "validation error",
    });
  }

  try {
    const newUser = new User({ email, subscription });
    newUser.setPassword(password);
    await newUser.save();
    res.json({
      status: "Created",
      code: 201,
      data: {
        user: {
          email: newUser.email,
          subscription: newUser.subscription,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.json({
      status: "Not Found",
      code: 404,
      message: "User not found",
    });
  }

  if (!user || !user.validPassword(password)) {
    return res.json({
      status: "Unauthorized",
      code: 401,
      message: "Email or password is wrong",
    });
  }
  try {
    const payload = {
      id: user.id,
      email: user.email,
      subscription: user.subscription,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({
      status: "OK",
      code: 200,
      data: {
        token,
        user: {
          email: `${payload.email}`,
          subscription: `${payload.subscription}`,
        },
      },
    });
  } catch {
    return res.json({
      status: "Bad request",
      code: 400,
      message: "validation error",
    });
  }
};

export const logout = async (req, res) => {
  const { user } = req;
  try {
    user.token = null;
    await user.save();
    return res.status(204).send();
  } catch (error) {
    return res.json({
      status: "Unauthorized",
      code: 401,
      message: "Not authorized",
    });
  }
};

export const current = (req, res) => {
  const getUser = async (id) => {
    try {
      const user = await User.findById(id);
      if (!user) {
        return null;
      } else {
        return user;
      }
    } catch (error) {
      console.log(error);
    }
  };

  const { email, subscription } = req.user;

  try {
    const id = req.user.id;
    const user = getUser(id);

    if (!user) {
      return res.json({
        status: "Unauthorized",
        code: 401,
        message: "Not authorized",
      });
    } else {
      return res.json({
        status: "OK",
        code: 200,
        data: {
          email,
          subscription,
        },
      });
    }
  } catch (error) {
    console.error(error);
  }
};
