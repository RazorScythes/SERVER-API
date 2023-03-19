const Users         = require('../models/user.model')
const bcrypt        = require('bcryptjs')
const jwt           = require('jsonwebtoken')
const User          = require('../models/user.model')
const nodemailer    = require('nodemailer');

require('dotenv').config()
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.NODEMAILER_USER,
      pass: process.env.NODEMAILER_PASS
    }
});

exports.SignIn = async (req, res) => {
    const { username, password } = req.body

    try {
        const existingUser = await Users.findOne({ username }).populate('alumni_id')
        
        if(!existingUser) return res.status(404).json({ message: 'User does not exist.' })

        let userObj = {
            _id: existingUser._id,
            username: existingUser.username,
            role: existingUser.role,
            name: existingUser.name
        }

        if(existingUser.alumni_id) {
            userObj.alumni_id = existingUser.alumni_id._id
            userObj.student_number = existingUser.alumni_id.student_number
        }

        const isPasswordCorrect = await bcrypt.compare(password, existingUser.password)

        if(!isPasswordCorrect) return res.status(404).json({ message: "Invalid credentials" })
        
        const token = jwt.sign({ email: userObj.username, id: userObj._id }, `${process.env.SECRET_KEY}`, { expiresIn: '9999years' } )
        
        res.status(200).json({ result: userObj, token })
    } catch (error) {
        console.log(error)
    }
}

exports.ResetPassword = async (req, res) => {
    const { email } = req.body

    let existing = await User.findOne({email: email})

    if(!existing) return res.status(404).json({ message: 'Email does not exists' })

    res.status(200).json({ message: 'ok' })

    var mailOptions = {
        from: process.env.NODEMAILER_USER,
        to: existing.email,
        subject: 'Reset Password',
        html: `
            <h4> Hi ${existing.name}, </h4>
            <p>You are recieving this email because we recieved a password required for your account</p>
            <button><a style="text-decoration:none; padding: 10px; display: block;" href="${process.env.PROTOCOL}://${process.env.DOMAIN_NAME}/reset_password/${existing._id}">Click here to Reset Password</a></button>
            <p>If you did not reset your password, no further action is required</p>
            <p> Regards, <br/> Alumni Devs </p>
        `
    };

    transporter.sendMail(mailOptions, async function(error, info){
        if (error) {
            console.log(error);
        } else {
            await User.findByIdAndUpdate(existing, {reset_password: true}, {new: true})
            console.log('Email sent: ' + info.response);
        }
    });
}

exports.checkResetConfirmation = async (req, res) => {
    const { id } = req.body

    try {
        let user = await User.findById(id)

        if(!user) return res.status(404).json({ message: 'User does not exists' })
        
        if(!user.reset_password) return res.status(404).json({ message: 'This user did not recieved any email regards to password reset.' })

        return res.status(200).json()
    }
    catch(err){
        return res.status(404).json({ message: 'User does not exists' })
    }

}

exports.newPassword = async (req, res) => {
    const { new_, confirm, id } = req.body

    if(!id) return res.status(404).json({ message: 'User not found, Please reload the page and try again.' })

    if(new_ !== confirm) return res.status(404).json({ message: 'New and Confirm Password not Match!, Please reload the page and try again.' })
    
    let hashedPassword = await bcrypt.hash(new_, 12);

    User.findByIdAndUpdate(id, {password: hashedPassword, reset_password: false}, {new: true}).then(() => {
        res.status(200).json({ message: 'ok' })
    })
    .catch((err) => res.status(404).json({ message: 'User not found, Please reload the page and try again.' }))
}
