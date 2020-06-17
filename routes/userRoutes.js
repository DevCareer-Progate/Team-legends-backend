const express = require('express')
const auth = require('../controller/auth')
const router = express.Router()

//signup route
router.post('/user/signup', auth.signup)
router.post('/user/login', auth.login)
router.post('/user/reset-password', auth.checkToken, auth.resetPassword)
router.post('/user/forget-password', auth.forgetPassword)
router.post('/user/change-password/:token', auth.changePassword)

module.exports = router
