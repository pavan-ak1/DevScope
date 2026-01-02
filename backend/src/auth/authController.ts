import type { Request, Response } from "express";
import { User } from "../models/User.js";
import { signAccessToken } from "./jwt.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: false,
  maxAge: 24 * 60 * 60 * 1000,
};

export async function signup(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  const existinguser = await User.findOne({ email });

  if (existinguser) {
    return res.status(409).json({ error: "User already exists" });
  }

  const user = await User.create({ email, password });

  const token = signAccessToken({ userId: user._id.toString() });

  res
    .cookie("access_token", token, COOKIE_OPTIONS)
    .status(201)
    .json({ message: "Signup successful" });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "Both email and password is required" });
  }

  const user = await User.findOne({email});
  if(!user){
     return res.status(401).json({ error: "Invalid credentials" });
  }

  const isValid = await user.comparePassword(password);
  if (!isValid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = signAccessToken({ userId: user._id.toString() });
   res
    .cookie("access_token", token, COOKIE_OPTIONS)
    .status(200)
    .json({ message: "Login successful" });
}
