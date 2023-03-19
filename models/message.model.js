const mongoose      = require('mongoose')
const Schema        = mongoose.Schema

const messageSchema = new Schema({
    student_number: { type: String },
    name: { type: String },
    issue: { type: String },
    email: { type: String },
    message: { type: String },
    notification_status: { type: String },
    status: { type: String },
    color: { type: String },
    reply: { type: String }
},{
    timestamps: true,
    collection: "message"
})

const Message = mongoose.model('Message', messageSchema)

module.exports = Message