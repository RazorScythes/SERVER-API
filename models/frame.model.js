const mongoose      = require('mongoose')
const Schema        = mongoose.Schema

const frameSchema = new Schema({
    image: { type: String },
},{
    timestamps: false,
    collection: "frame"
})

const Frame = mongoose.model('Frame', frameSchema)

module.exports = Frame