const mongoose      = require('mongoose')
const Schema        = mongoose.Schema

const bannerSchema = new Schema({
    image: { type: String },
},{
    timestamps: false,
    collection: "banner"
})

const Banner = mongoose.model('Banner', bannerSchema)

module.exports = Banner