const express = require('express')
const auth = require('../controller/auth')
const router = express.Router()

//signup route
router.post('/user/signup', auth.signup)
router.post('/user/login', auth.login)

module.exports = router
