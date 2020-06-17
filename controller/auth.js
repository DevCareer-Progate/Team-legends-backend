const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const MailerUtil = require('../util/email')
const TokenUtil = require('../util/token')

const User = require('../models/userModel')

//Load Input Validation
const validateRegisterInput = require('../validation/register')
const validateLoginInput = require('../validation/login')
const validateResetInput = require('../validation/reset')
const validateForgetInput = require('../validation/forget')
const validateChangeInput = require('../validation/change')

exports.signup = (req, res, next) => {
  const { errors, isValid } = validateRegisterInput(req.body)

  //Check Validation
  if (!isValid) {
    return res.status(400).json({ response: errors })
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
    return res.status(400).json({
      response: errors
    })
  }

  const { email, password } = req.body

  //Check if user exists
  User.findOne({ email }).then(user => {
    if (!user) {
      return res.status(423).json({
        response: 'User does not exist, kindly register!!'
      })
    }

    bcrypt
      .compare(password, user.password)
      .then(valid => {
        if (!valid) {
          return res.status(403).json({
            response: 'Incorrect username or password'
          })
        }
        //Get token
        const token = TokenUtil.signedJWT(email)
        return res.status(200).json({
          success: true,
          _id: user._id,
          password: user.password,
          token
        })
      })
      .catch(err => console.log(err))
  })
}

exports.checkToken = (req, res, next) => {
  const header = req.headers['authorization']
  //Check for token for authorization
  if (typeof header !== 'undefined') {
    const token = header.split(' ')[1]

    req.token = token
    next()
  } else {
    return res.status(403)
  }
}

exports.resetPassword = (req, res) => {
  const { errors, isValid } = validateResetInput(req.body)

  //Check Validation
  if (!isValid) {
    return res.status(400).json({ response: errors })
  }

  const { old_password, new_password, confirm_password } = req.body
  //Verify User Token
  jwt.verify(req.token, process.env.SECRET_TOKEN, (err, userData) => {
    if (err) {
      res.status(403).json({ response: 'Unable to reset password' })
      console.log(err)
    } else {
      const { email } = userData
      //Find User by Email and compare if the old password is equal to the user password
      User.findOne({ email }, (err, user) => {
        bcrypt.compare(old_password, user.password, function (err, result) {
          if (!result)
            return res.status(403).json({ response: 'Incorrect password' })
          if (new_password !== confirm_password)
            return res.status(403).json({ response: 'Passwords do not match.' })
          bcrypt.hash(new_password, 10, (err, pwHash) => {
            if (err) throw err
            user.password = pwHash
            user.save((err, data) => {
              const msg = `<b>Hello ${email}<b><br /><p> Your password was succefully changed, if you did't initialize this, please contact us</p><br /> <p><i> Team Avengers </i></p>`
              MailerUtil.sendMail(email, 'Password Changed', msg)
                .then(e => {
                  return res.status(200).json({
                    success: true,
                    response: 'Password successfully reset'
                  })
                })
                .catch(() => {
                  return res.status(200).json({
                    success: true,
                    response: 'Password successfully reset'
                  })
                })
            })
          })
        })
      })
    }
  })
}

exports.forgetPassword = async (req, res, next) => {
  const { errors, isValid } = validateForgetInput(req.body)

  //Check Validation
  if (!isValid) {
    return res.status(400).json({ response: errors })
  }

  const { email } = req.body
  const token = await TokenUtil.generateEmailToken()

  User.findOne({ email }, (err, user) => {
    //If user does not exist
    if (!user) {
      return res
        .status(400)
        .json({ response: 'No account with that email address exists.' })
    } else {
      //Call the reset password token of the user
      user.resetPasswordToken = token
      user.resetPasswordExpires = Date.now() + 3600000

      const urll = `${req.headers.host}/api/v1/user/change-password/${token}`
      console.log(urll)

      //send Password Link Message
      user.save((err, data) => {
        const subject = 'Password Reset Link'
        const msg = `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\nPlease click on the following link, or paste this into your browser to complete the process:\n\n
      <a>  ${urll}</a>
        \n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n`
        MailerUtil.sendMail(user.email, subject, msg)
          .then(e => {
            return res.status(200).json({ success: true, url: urll, msg })
          })
          .catch(() => {
            return res.status(200).json({ success: true, url: urll, msg })
          })
      })
    }
  })
}

exports.changePassword = (req, res, next) => {
  const { errors, isValid } = validateChangeInput(req.body)

  //Check Validation
  if (!isValid) {
    return res.status(403).json({ response: errors })
  }

  const { password } = req.body
  const { token } = req.params

  User.findOne(
    { resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } },

    (err, user) => {
      if (err) {
        return res.status(400).json({ response: 'Error changing password' })
      }
      //Check if user exist
      if (!user) {
        return res.status(400).json({
          response: 'Password reset token is invalid or has expired.'
        })
      }

      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, (err, hash) => {
          if (err) {
            return res.status(400).json({ response: 'Error changing password' })
          }

          user.resetPasswordToken = null
          user.resetPasswordExpires = null
          user.password = hash

          user.save((err, data) => {
            const subject = 'Password Changed'
            const msg = `Hello,\n\nThis is a confirmation that the password for your account ${user.email} has just been changed.\n`
            MailerUtil.sendMail(user.email, subject, msg) //Send confimation changed password Mail
              .then(e => {
                res
                  .status(200)
                  .json({ success: true, response: 'Password changed' })
              })
              .catch(() => {
                res
                  .status(200)
                  .json({ success: true, response: 'Password changed' })
              })
          })
        })
      })
    }
  )
}
