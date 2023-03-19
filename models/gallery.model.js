const mongoose      = require('mongoose')
const Schema        = mongoose.Schema

const gallerySchema = new Schema({
    image: { type: String },
    academic_year: {
        type: Schema.Types.ObjectId,
        ref: 'Academic_Year'
    }
},{
    timestamps: false,
    collection: "gallery"
})

const Frame = mongoose.model('Gallery', gallerySchema)

module.exports = Frame