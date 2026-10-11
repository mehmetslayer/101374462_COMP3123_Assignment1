const express = require("express");
const helmet = require("helmet");
const mongoose = require("mongoose");

const app = express();

app.use(helmet()); // secure HTTP headers
app.use(express.json()); // parse json bdoies into the req.body


// health check; confirms the server and DB are up
app.get("/health", (req,res)=>{
    res.status(200).json({
        status: "ok",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" //
    });

});

module.exports = app;