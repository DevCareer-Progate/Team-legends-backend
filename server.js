const express = require("express");

const mongooose = require("mongoose");

const app = express();

//require config.js and destructure
const { database } = require("./config");

// initialize database

mongooose
  .connect(database, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((result) => {
    console.log("Mongo Db is connected .......");
  })
  .catch((err) => {
    console.log(err);
  });

// testing routes/endpoint
app.get("/", function (req, res) {
  res.send("hello");
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
