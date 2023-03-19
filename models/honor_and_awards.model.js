const mongoose      = require('mongoose')
const Schema        = mongoose.Schema

const haSchema = new Schema({
    name: { type: String },
    image: { type: String },
    title: {
        type: Schema.Types.ObjectId,
        ref: 'Honor_Title'
    },
    quotes: { type: String },
    message: {type: String },
    academic_year: {
        type: Schema.Types.ObjectId,
        ref: 'Academic_Year'
    }
},{
    timestamps: false,
    collection: "honor_and_awards"
})

const HA = mongoose.model('HA', haSchema)

module.exports = HA