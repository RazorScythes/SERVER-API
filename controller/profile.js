const User          = require('../models/user.model')
const bcrypt        = require('bcryptjs')
exports.changePassword = async (req, res) => {
    let user = await User.findOne({_id: req.body.id})
    
    try {
        const isPasswordMatch = await bcrypt.compare(req.body.old, user.password)
    
        if(!isPasswordMatch) return res.status(404).json({ 
            variant: "danger",
            heading: "Password Not Match",
            message: "Looks like you inputed wrong password, Please try again" 
        })

        const isNewConfirmMatch = req.body.confirm === req.body.new

        if(!isNewConfirmMatch) return res.status(404).json({ 
            variant: "danger",
            heading: "New and Confirm Password not Match",
            message: "Looks like you mismatch password, Please try again" 
        })
        let hashedPassword = await bcrypt.hash(req.body.new, 12);
        await User.findByIdAndUpdate(req.body.id, {password: hashedPassword}, {new: true})

        return res.status(200).json({ 
            variant: "success",
            heading: "Password Updated",
            message: "Password successfuly updated, Relogin to take effect" 
        })
    } catch (error) {
        console.log(error)
    }

    //console.log(isPasswordMatch)
}

exports.updateName = async (req, res) => {
    let user = await User.findOne({_id: req.body.id})

    if(!user)
        return res.status(404).json({ 
            variant: "danger",
            heading: "User not Found",
            message: "Reload or relogin if error still exists." 
        })
    try {
        await User.findByIdAndUpdate(req.body.id, {name: req.body.name}, {new: true})
        .then(() => {
            res.status(200).json({ 
                variant: "success",
                heading: "Name Updated",
                message: "Relogin to take effect" 
            })
        })
    } catch (err) {
        console.log(err)
    }
}