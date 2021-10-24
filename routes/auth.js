import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import verifyToken from "../middleware/auth.js";
import User from "../models/User.js";
import dotenv from "dotenv";
//--------------------------------------------------------------
const saltRounds = 10;
const router = express.Router();
dotenv.config();
//--------------------------------------------------------------
router.get("/", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});
//--------------------------------------------------------------
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  // Simple validation
  if (!name || !email || !password)
    return res
      .status(400)
      .json({ success: false, message: "Missing name and/or password" });
  try {
    // Check for existing user or email
    const userOrEmail = await User.findOne({ $or: [{ name }, { email }] });
    if (userOrEmail)
      return res
        .status(400)
        .json({ success: false, message: "name or email already taken" });
    // All good
    const hashedPassword = bcrypt.hashSync(password, saltRounds);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();
    // Return token
    const accessToken = jwt.sign({ userId: newUser._id },process.env.ACCESS_TOKEN_SECRET);
    res.json({
      success: true,
      message: "User created successfully",
      accessToken,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});
//--------------------------------------------------------------
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  // Simple validation
  if (!email || !password)
    return res.status(400).json({
      success: false,
      message: "Missing email and/or password",
    });
  try {
    // Check for existing user
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "Incorrect email or password" });
    // email found -> verify password
    //user.password get from db, password get from req
    const passwordValid = bcrypt.compareSync(password, user.password); // true
    if (!passwordValid)
      return res
        .status(400)
        .json({ success: false, message: "Incorrect email or password" });
    // All good
    // Return token, set expires on 60 seccond 
    // const accessToken = jwt.sign({ userId: user._id },process.env.ACCESS_TOKEN_SECRET,{expiresIn: '60s'});
    const accessToken = jwt.sign({ userId: user._id },process.env.ACCESS_TOKEN_SECRET);
    res.json({
      success: true,
      message: "User logged in successfully",
      accessToken,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});
//--------------------------------------------------------------
router.post("/logout",async(req,res)=>{

});


export default router;
