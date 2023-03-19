const mongoose      = require('mongoose')
const Schema        = mongoose.Schema

const alumniSchema = new Schema({
    student_number: { type: String },
    full_name: {
        first_name: { type: String },
        middle_name: { type: String },
        last_name: { type: String }
    },
    quotes: { type: String },
    birthday: {
        month: { type: String },
        day: { type: Number },
        year: { type: Number }
    },
    address: { type: String },
    contact: { type: Number },
    email: { type: String },
    main: { type: String },
    img1: { type: String },
    img2: { type: String },
    img3: { type: String },
    achievement: { type: String },
    section_id: {
        type: Schema.Types.ObjectId,
        ref:'Section'
    },
    batch_id: {
        type: Schema.Types.ObjectId,
        ref: 'Academic_Year'
    }
},{
    timestamps: true,
    collection: "alumni"
})

const Alumni = mongoose.model('Alumni', alumniSchema)

module.exports = Alumni