const express = require('express');
const cors = require('cors');
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
  console.log("Listening on port 8080");
});
