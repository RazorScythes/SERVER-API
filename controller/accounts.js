const Academic_Year         = require('../models/academic_year.model')
const Administrators        = require('../models/administrators.model')
const User                  = require('../models/user.model')
const bcrypt                = require("bcryptjs")
const async                 = require('async')
const nodemailer            = require('nodemailer');

require('dotenv').config()

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASS
    }
});

exports.sendGmail = async (req, res) => {
    const { id, email } = req.body

    const user = await User.findById(id)
    let hashedPassword = await bcrypt.hash(user.username, 12);

    await User.findByIdAndUpdate(id, {password: hashedPassword}, {new: true})

    var mailOptions = {
        from: process.env.NODEMAILER_USER,
        to: user.email,
        subject: 'MCC Alumni Yearbook Account',
        text: `
            Hi ${user.name} this will be your account to access our Mabalacat City College alumni websites!

            username: ${user.username}
            password: ${user.username}

            you can access the website by clicking the link below
            ${process.env.PROTOCOL}://${process.env.DOMAIN_NAME}/login
        `
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            res.status(200).json({ 
                message: `email send to "${email}"` 
            })
        }
    });
}

exports.confirmDeletion = async (req, res) => {
    const { id, password } = req.body
    try {
        const existingUser = await User.findById(id)
        
        if(!existingUser) return res.status(404).json({err_message: 'User does not exist.' })

        const isPasswordCorrect = await bcrypt.compare(password, existingUser.password)

        if(!isPasswordCorrect) return res.status(404).json({ err_message: "Invalid Password" })

        await User.findByIdAndDelete(id)

        let users = await User.find({role: req.body.role_})
        let arr = []

        users.forEach(async (x) => {
            arr.push(flattenDocumentA(x));
        })

        Promise.all(arr)
        .then((results) => {
            res.status(200).json({ 
                entry: results,
                message: `${existingUser.username} deleted` 
            })
        })
        .catch((e) => {
            res.status(409).json({ message: e.message });
        });

    } catch (error) {
        console.log(error)
    }
}

exports.getAccountRole = async (req, res) => {
    try {
        let roles = ['Admin', 'Sub Admin', 'Staff', 'Student']
        let data = []
        roles.forEach(async (x) => {
            data.push(flattenDocument(x));
        })

        Promise.all(data)
        .then((results) => {
            res.status(201).json(results);
        })
        .catch((e) => {
            res.status(409).json({ message: e.message });
        });
    } catch (error) {   
        console.log(error)
    }
}

function flattenDocument(value) {
    return new Promise(async (resolve) => {
        let user_role = await User.countDocuments({role: value})

        const jsonData = {
            role: value,
            counts: user_role,
        }

        resolve(jsonData)
    });
}

exports.getAccounts = async (req, res) => {
    try {
        let users = await User.find({role:req.body.role})
        let data = []
        users.forEach(async (x) => {
            data.push(flattenDocumentA(x));
        })

        Promise.all(data)
        .then((results) => {
            res.status(201).json(results);
        })
        .catch((e) => {
            res.status(409).json({ message: e.message });
        });
    } catch (error) {   
        console.log(error)
    }
}

function flattenDocumentA(value) {
    return new Promise(async (resolve) => {
 
        const jsonData = {
            _id: value.id,
            name: value.name,
            username: value.username,
            email: value.email ? value.email : 'n/a',
            created: getFormattedDate(value.createdAt)
        }

        resolve(jsonData)
    });
}

function getFormattedDate(date) {
    let year = date.getFullYear();
    let month = (1 + date.getMonth()).toString().padStart(2, '0');
    let day = date.getDate().toString().padStart(2, '0');
  
    return month + '/' + day + '/' + year;
}

exports.uploadAccount = async (req, res) => {
    let password = req.body.password ? req.body.password : req.body.username

    try {
        let hashedPassword = await bcrypt.hash(password, 12);
        req.body.password = hashedPassword

        const newAccount = new User({...req.body})
        await newAccount.save();

        const jsonData = {
            _id: newAccount.id,
            name: newAccount.name,
            username: newAccount.username,
            email: newAccount.email ? newAccount.email : 'n/a',
            created: getFormattedDate(newAccount.createdAt)
        }

        res.status(201).json(jsonData);
    } catch (error) {
        console.log(error)
        res.status(409).json({ message: error.message });
    }
}

exports.updateAccount = async (req, res) => {
    if(!req.body.password) delete req.body.password
    else {
        let hashedPassword = await bcrypt.hash(req.body.password, 12);
        req.body.password = hashedPassword
    }
    if(!req.body.email) delete req.body.email

    await User.findByIdAndUpdate(req.body.id, {...req.body}, {new: true})
    .then(async (updated) => {
        let users = await User.find({role: req.body.role_})
        let data = []
        users.forEach(async (x) => {
            data.push(flattenDocumentA(x));
        })

        Promise.all(data)
        .then((results) => {
            res.status(201).json({
                entry: results,
                message: `${updated.username} successfully updated`
            });
        })
        .catch((e) => {
            res.status(409).json({ message: e.message });
        });
    })
}

exports.deleteAccount = async (req, res) => {
    const {id, data} = req.body

    if(id) {
        let deleteData = await User.findOne({_id: req.body.id})

        await User.deleteOne({_id: req.body.id}).then(async() => {
                let users = await User.find({role: req.body.role_})
                let arr = []
                users.forEach(async (x) => {
                    arr.push(flattenDocumentA(x));
                })

                Promise.all(arr)
                .then((results) => {
                    res.status(201).json({
                        entry: results,
                        message: `${deleteData.username} deleted`
                    });
                })
                .catch((e) => {
                    res.status(409).json({ message: e.message });
                });
        })
    }
    else if(data){
        async.eachSeries(data, function updateObject (obj, done) {
            User.findByIdAndDelete(obj._id, done)
        }, async function allDone (err) {
            let users = await User.find({role: req.body.role_})
            let arr = []
            users.forEach(async (x) => {
                arr.push(flattenDocumentA(x));
            })

            Promise.all(arr)
            .then((results) => {
                res.status(201).json({
                    entry: results,
                    message: `${data.length} selected users successfully deleted`
                });
            })
            .catch((e) => {
                res.status(409).json({ message: e.message });
            });
        });
    }
}