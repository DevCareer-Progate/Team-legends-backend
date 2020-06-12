const express = require("express");
const auth = require("../controller/auth");
const router = express.Router();

//signup route
router.post("/user/signup", auth.signup);

module.exports = router;
