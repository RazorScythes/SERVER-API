const mongoose      = require('mongoose')
const Schema        = mongoose.Schema

const honorTitleSchema = new Schema({
    title: { type: String },
    desc: { type: String },
    enabled: { type: Boolean },
    priority_value: { type: Number }
},{
    timestamps: false,
    collection: "honor_title"
})

const Honor_Title = mongoose.model('Honor_Title', honorTitleSchema)

module.exports = Honor_Title