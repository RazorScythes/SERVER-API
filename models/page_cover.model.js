const mongoose      = require('mongoose')
const Schema        = mongoose.Schema

const coverSchema = new Schema({
    image: { type: String },
},{
    timestamps: false,
    collection: "page_cover"
})

const Cover = mongoose.model('Cover', coverSchema)

module.exports = Cover