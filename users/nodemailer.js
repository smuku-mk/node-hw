import nodemailer from "nodemailer";
import "dotenv/config";
import { nanoid } from "nanoid";

export const verificationToken = () => {
  return nanoid();
};

export const sendVerificationEmail = ({ email }) => {
  const transporter = nodemailer.createTransport({
    service: "smtp.sendgrid.net",
    port: 587,
    secure: true,
    auth: {
      user: "hapace1@wp.pl",
      pass: process.env.SENDGRID_PASS,
    },
  });

  const emailOptions = {
    from: "hapace1@wp.pl",
    to: email,
    subject: "User verification",
    text: "Click here to verify your email",
  };

  transporter
    .sendMail(emailOptions)
    .then((info) => console.log(info))
    .catch((err) => console.log(err));
};
