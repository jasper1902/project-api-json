import { NextFunction, Response, Request } from "express";
import nodemailer from "nodemailer";

export const contact = async (
  request: Request,
  response: Response,
  nextFunction: NextFunction
) => {
  try {
    const { name, email, subject, message } = request.body;
    console.log({ name, email, subject, message });
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL,
      subject: subject,
      text: `name: ${name}, email: ${email} - message: ${message}`,
    };

    await transporter.sendMail(mailOptions);

    response.status(200).json(mailOptions);
  } catch (error) {
    nextFunction(error);
  }
};
