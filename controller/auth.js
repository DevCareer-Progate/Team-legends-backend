const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const { database } = require("../config");
const { User }=require("../models/userModel");

exports.Signup = (req, res) => {
    const {fullName, email, password, confirmPassword}= req.body;
    try{
    
    let user = User.findOne({email});
    if (user){
        return res.status(400).json({
            message:"user already exists"
        })
    }  

    user = new User({
            fullName,
            email,
            password,
            confirmPassword
        });

        const salt = bcrypt.genSalt(10);
        user.password = bcrypt.hash(password, salt);
        user.save();
        const payload = {
            user:{
                id:user._id
            }
        };
        jwt.sign(
            payload,
            database.secret,{expiresIn:10000},
            (err, token)=>{
                if (err) throw err;
                res.status(200).json({
                    data:user,
                    auth:true,
                    token
                });
            }
        )
    }catch(err){
        res.send(err);
    }
};