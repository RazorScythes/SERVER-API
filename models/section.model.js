const mongoose      = require('mongoose')
const Schema        = mongoose.Schema

const sectionSchema = new Schema({
    section: { type: String },
    institute: { type: String },
    institute_name: { type: String },
    program: { type: String },
    program_acronym: { type: String },
    academic_year: {
        type: Schema.Types.ObjectId,
        ref: 'Academic_Year'
    },
},{
    timestamps: false,
    collection: "section"
})

const Section = mongoose.model('Section', sectionSchema)

module.exports = Section