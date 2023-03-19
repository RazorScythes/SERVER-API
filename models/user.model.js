const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = Schema({
    name: { type: String },
    username: { type: String },
    email: { type: String },
    password: { type: String },
    role: { type: String },
    alumni_id: {
        type: Schema.Types.ObjectId,
        ref: 'Alumni'
    },
    reset_password: { type: Boolean }
},{
    timestamps: true
})

const User = mongoose.model('User', userSchema)

module.exports = User


// const mongoose = require('mongoose')
// const Schema = mongoose.Schema

// const userSchema = Schema({
//     name: {type: String, required: true},
//     email: {type: String, required: true},
//     password: {type: String, required: true},
//     id:{type: String}
// },{
//     timestamps: true
// })

// const User = mongoose.model('User', userSchema)

// module.exports = User