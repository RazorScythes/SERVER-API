const Message           = require("../models/message.model")
const async             = require('async')
const nodemailer        = require('nodemailer');
require('dotenv').config()

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.NODEMAILER_USER,
      pass: process.env.NODEMAILER_PASS
    }
  });

exports.getAllMessage = async (req, res) => {
    Message.find({}).sort([['status', 'ascending']])
    .then((results) => {
        if(results.length > 0)
            res.status(200).json({
                response: "ok",
                data: results,
            })
        else
            res.status(404).json({
                message: "No new concern/messages",
                variant: 'warning'
            })
    })
    .catch(err => res.status(400).json(`Error: ${err}`))
}

exports.updateAllMessage = async (req, res) => {
    var arr = []
    
    req.body.forEach((i) => {
        arr.push({
            _id: i._id,
            status: i.status === '1_new' ?  '2_read' : i.status,
        })
    })

    async.eachSeries(arr, function updateObject (obj, done) {
        Message.findByIdAndUpdate(obj._id, obj, done)
    }, async function allDone (err) {
        if(err) res.status(400).json(`Error: ${err}`)

        res.status(200).json("OK")
    });
}

exports.replyMessage = async (req, res) => {
    const { id, reply } = req.body
    
    let recipient = await Message.findById(id)

    var mailOptions = {
        from: process.env.NODEMAILER_USER,
        to: recipient.email,
        subject: 'Suggestions / Issue',
        text: reply
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });

    Message.findByIdAndUpdate(id, {reply: reply, status: "3_done"}, {new: true})
    .then(async (result) => {
        let message_list = await Message.find({}).sort([['status', 'ascending']])

        res.status(200).json({
            message: `Reply successfully sent to ${result.email}`,
            data: message_list
        })
    })
    .catch(err => console.log(err))
}

exports.removeMessage = async (req, res) => {
    const { id } = req.body
    if(!id) return res.status(404).json()

    Message.findByIdAndDelete(id)
    .then(async () => {
        let message_list = await Message.find({}).sort([['status', 'ascending']])

        res.status(200).json(message_list)
    })
    .catch(err => console.log(err))
}