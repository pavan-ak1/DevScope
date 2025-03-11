const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Voter = require("../models/Voter");
const { sendOTP } = require("../services/otpService.js");


const signup = async(req,res)=>{
    try{
        const {name,email,phone,password}= req.body;
        const hashedPassword = await bcrypt.hash(password,10);
        const voter = new Voter({name,email,phone,password:hashedPassword});
        await voter.save();
        res.status(201).json({message:'Registration Successful'});
    }catch(error){
        res.status(500).json({error:error.message});
    }
}


const login = async (req,res)=>{
    try {
        const { email, password } = req.body;
        const voter = await Voter.findOne({ email });
        if (!voter) return res.status(404).json({ message: "User not found" });
    
        const isMatch = await bcrypt.compare(password, voter.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });
    
        const token = jwt.sign({ id: voter._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.json({ token, voter });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
};


const googleLogin = async (req, res, next) => {
  const { idToken } = req.body; // Frontend sends Google ID Token

  try {
    // Verify the Google ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    let user;
    try {
      user = await admin.auth().getUser(decodedToken.uid);
    } catch (error) {
      // If user doesn't exist, create a new one
      user = await admin.auth().createUser({
        uid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name,
        photoURL: decodedToken.picture,
      });
    }

    res.status(200).json({
      message: "Google login successful",
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
    });
  } catch (error) {
    next({ status: 401, message: "Invalid Google token" });
  }
};


const loginWithOTP = async (req,res)=>{
    try {
        const { phone } = req.body;
        const voter = await Voter.findOne({ phone });
        if (!voter) return res.status(404).json({ message: "User not found" });
    
        const otp = await sendOTP(phone);
        res.json({ message: "OTP sent", otp });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
}


const verifyOTP = async (req,res)=>{
    try {
        const { phone, otp } = req.body;
        if (otp !== "123456") return res.status(400).json({ message: "Invalid OTP" });
    
        const voter = await Voter.findOne({ phone });
        const token = jwt.sign({ id: voter._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.json({ token, voter });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
}



module.exports = { googleLogin, verifyOTP,login,loginWithOTP, register };
