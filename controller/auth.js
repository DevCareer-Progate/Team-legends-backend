const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/userModel");

exports.signup = (req, res, next) => {
  const { fullName, email, password, confirmPassword } = req.body;

  //error checking starts
  //check to make sure there's input from the front end

  if (!fullName || !email || !password || !confirmPassword) {
    return res.status(404).json({
      error: "Fields cannot be blank",
    });
  }
  //adding a regex to make sure the name field,email and password are clean
  //fullName should have spaces and be not less than 2 and more that 30 letters
  let regexNameCheck = /^[a-zA-Z ]{2,30}$/;

  let regexEmailCheck = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
  if (!regexNameCheck.test(fullName)) {
    return res.status(404).json({
      error:
        "Incorrect Name pattern,Full Name should have spaces and be more than 2and less than 30",
    });
  }
  if (!regexEmailCheck.test(email)) {
    return res.status(404).json({
      error: "Incorrect Email",
    });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({
      error: "Passwords do not Match",
    });
  }
  //error checking ends

  //checking if a user alredy exists
  User.findOne({ email })
    .then((person) => {
      if (person) {
        return res.status(404).json({
          error: "User already exists",
        });
      }

      bcrypt.hash(password, 10).then((hash) => {
        const user = new User({
          fullName,
          email,
          password: hash,
        });
        user
          .save()
          .then(() => {
            return res.status(200).json({
              message: "User successfully Created",
            });
          })
          .catch((err) => {
            return res.status(500).json({
              error: err,
            });
          });
      });
    })
    .catch((err) => {
      return res.status(404).json({
        error: "Unable to create, Try Again",
      });
    });
}; //signup ends
