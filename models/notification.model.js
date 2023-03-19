const mongoose      = require('mongoose')
const Schema        = mongoose.Schema

const notificationSchema = new Schema({
    sender: { 
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    reciever: { 
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    info: { type: String },
    status: { type: String },
    color: { type: String },
},{
    timestamps: true,
    collection: "notification"
})

const Notification = mongoose.model('Notification', notificationSchema)

module.exports = Notification