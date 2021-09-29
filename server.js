const express = require('express');
const cors = require('cors');
const fabObj = require("./math-logic/fibonacci-series");
const app = express();


app.use(cors({
  origin: '*'
}));

app.use((req, res, next) => {
    console.log("URL: " + req.url);
    next();
});

app.use("/", require("./routes/poll.js"));

app.listen(8080, function () {
  // simulate time to connect to other services
  let number = fabObj.calculateFibonacciValue(Number.parseInt(40));
  console.log("Listening on port 8080");
});
