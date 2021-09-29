const express = require('express');
const router = express.Router();
const config = require('./config');

// Can use routers as well
const longpoll = require("express-longpoll")(router);

longpoll.create("/routerpoll");

router.get("/", (req, res) => {
  longpoll.publish("/routerpoll", {
      text: "Some data"
  });
  res.send({
    message: `v${config.api.VERSION}`,
    status: 'up'
  });
});

module.exports = router;
