const express = require("express");
const auth=require('../controller/auth');
const router = express.Router();

//signup route
router.post('/user/signup', auth.Signup);

module.exports = router;
