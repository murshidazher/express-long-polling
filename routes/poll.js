const express = require('express');
const router = express.Router();

// Can use routers as well
const longpoll = require("express-longpoll")(router);

longpoll.create("/routerpoll");

router.get("/", (req, res) => {
  longpoll.publish("/routerpoll", {
      text: "Some data"
  });
  res.send({
    message: `v${process.env.npm_package_version}`,
    status: 'up'
  });
});

module.exports = router;
