"use strict";

const express = require("express");
const app = express();

const http = require("http");

var PORT = 3000;

var server = http.createServer(app);

app.use("/", express.static("src"));
// app.use("/conference/", express.static("src"));

server.listen(PORT, () => console.log("listening"));
