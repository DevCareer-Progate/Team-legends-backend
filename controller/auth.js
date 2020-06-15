const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const User = require('../models/userModel')

//Load Input Validation
const validateRegisterInput = require('../validation/register')
const validateLoginInput = require('../validation/login')

exports.signup = (req, res, next) => {
  const { errors, isValid } = validateRegisterInput(req.body)

  //Check Validation
  if (!isValid) {
    return res.status(400).send({ response: errors })
  }

  const { fullName, email, password, confirmPassword } = req.body

  //checking if a user alredy exists
  User.findOne({ email })
    .then(user => {
      if (user) {
        errors.email = 'User already exists'
        return res.status(404).json({
          response: errors
        })
      }

      bcrypt.hash(password, 10).then(hash => {
        const newUser = new User({
          fullName,
          email,
          password: hash
        })
        newUser
          .save()
          .then(() => {
            return res.status(200).json({
              message: 'User successfully Created'
            })
          })
          .catch(err => {
            return res.status(500).json({
              error: err
            })
          })
      })
    })
    .catch(err => {
      return res.status(404).json({
        error: 'Unable to create, Try Again'
      })
    })
} //signup ends

//Login
exports.login = (req, res, next) => {
  const { errors, isValid } = validateLoginInput(req.body)

  //Check if the login is valid
  if (!isValid) {
    return res.status(400).send({
      response: errors
    })
  }

  const { email, password } = req.body

  User.findOne({ email }).then(user => {
    if (!user) {
      return res.status(423).send({
        response: 'User does not exist, kindly register!!'
      })
    }

    bcrypt
      .compare(password, user.password)
      .then(valid => {
        if (!valid) {
          return res.status(403).send({
            response: 'Incorrect username or password'
          })
        }

        const token = jwt.sign(
          {
            email,
            password
          },
          'secrettoken',
          {
            expiresIn: '4800s'
          }
        )
        return res.status(200).send({
          success: true,
          _id: user._id,
          token
        })
      })
      .catch(err => console.log(err))
  })
}
