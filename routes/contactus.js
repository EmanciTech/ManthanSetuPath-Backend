var express = require("express");
var router = express.Router();
var async = require("async");
var httpUtil = require("../utilities/http-messages");
var nodemailer = require("nodemailer");

router.post("/", async function (req, res, next) {
  let name = req.body.name ? req.body.name : "";
  let email = req.body.email ? req.body.email : "";
  let contact = req.body.contact ? req.body.contact : "";
  let message = req.body.message ? req.body.message : "";
  let transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: "manthansetupath@gmail.com",
      pass: "manthansetu",
    },
  });
  let mailBody = {
    from: "manthansetupath@gmail.com",
    to: "manthansetupath@gmail.com",
    subject: "Website - contact request from " + name,
    text: `
    Name - ${name}
    Email - ${email}
    Contact - ${contact}
    Message - ${message}
    `,
  };
  transport.sendMail(mailBody, function (err, info) {
    if (err) {
      console.log(err);
      res.err("Mail not sent");
    } else {
      console.log(info);
      res.send("Mail Sent");
    }
  });
});

module.exports = router;
