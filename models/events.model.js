const mongoose      = require('mongoose')
const Schema        = mongoose.Schema

const eventSchema = new Schema({
    header: { type: String },
    content: { type: String },
    image: { type: String },
    academic_year: {
        type: Schema.Types.ObjectId,
        ref: 'Academic_Year'
    }
},{
    timestamps: true,
    collection: "events"
})

const Events = mongoose.model('Events', eventSchema)

module.exports = Events