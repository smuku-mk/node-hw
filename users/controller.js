import jwt from "jsonwebtoken";
import Joi from "joi";
import passport from "passport";
import gravatar from "gravatar";
import jimp from "jimp";
import path from "path";
import fs from "fs/promises";
import User from "./schema.js";
import { sendVerificationEmail, verificationToken } from "./nodemailer.js";

const addUserSchema = Joi.object({
  password: Joi.string().required(),
  email: Joi.string().email().required(),
});

const addEmailSchema = Joi.object({
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
      message: "Validation error",
    });
  }

  try {
    const avatarURL = gravatar.url(email);
    const newUser = new User({ email, subscription, avatarURL });
    newUser.setPassword(password);
    newUser.verificationToken = verificationToken();
    await newUser.save();
    sendVerificationEmail({
      email,
      verificationToken: newUser.verificationToken,
    });
    res.json({
      status: "Created",
      code: 201,
      data: {
        user: {
          email: newUser.email,
          subscription: newUser.subscription,
          avatarURL: newUser.avatarURL,
          password: newUser.password
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
  if (!user.verify) {
    return res.json({
      status: "Unauthorized",
      code: 401,
      message: "Email is not verified",
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

export const current = (req, res) => {
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

const storeAvatar = path.join(process.cwd(), "public/avatars");

export const avatar = async (req, res, next) => {
  const { path: temporaryName, originalname } = req.file;
  const newAvatarFileName = `${req.user._id.toString()}.jpg`;
  const newAvatarPath = path.join(storeAvatar, newAvatarFileName);
  newAvatarPath;
  try {
    const avatar = await jimp.read(temporaryName);
    avatar.cover(250, 250).quality(60).write(newAvatarPath);
    await fs.unlink(temporaryName);
  } catch (err) {
    return next(err);
  }

  try {
    const id = req.user.id;
    const user = getUser(id);
    if (!user) {
      return res.json({
        status: "Unauthorized",
        code: 401,
        message: `Unauthorized`,
      });
    } else {
      user.avatarURL = `/avatars/${newAvatarFileName}`;
      return res.json({
        status: "OK",
        code: 200,
        data: { avatarURL: user.avatarURL },
      });
    }
  } catch (error) {
    console.error(error);
  }
};

export const verification = async (req, res, next) => {
  try {
    const { verificationToken } = req.params;
    const user = await User.findOne({ verificationToken });

    if (!user) {
      return res.json({
        status: "Not Found",
        code: 404,
        message: "User not found",
      });
    }

    await User.findByIdAndUpdate(user._id, {
      verificationToken: "",
      verify: true,
    });
    res.json({
      status: "OK",
      code: 200,
      message: "Verification successful",
    });
  } catch (err) {
    res.json({
      status: "Internal Server Error",
      code: 500,
      message: "Verification process failed",
    });
  }
};

export const sendEmailAgain = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({
        status: "Not Found",
        code: 404,
        message: "User not found",
      });
    }

    const { error } = addEmailSchema.validate(req.body);
    if (error) {
      return res.json({
        status: "Bad Request",
        code: 400,
        message: "validation error",
      });
    }

    if (user.verify) {
      return res.json({
        status: "Bad Request",
        code: 400,
        message: "Verification has already been passed",
      });
    }

    sendVerificationEmail({
      email,
      verificationToken: user.verificationToken,
    });
    res.json({
      status: "OK",
      code: 200,
      message: "Verification email sent",
    });
  } catch (err) {
    res.json({
      status: "Internal Server Error",
      code: 500,
      message: "Email Sending Failure",
    });
  }
};
