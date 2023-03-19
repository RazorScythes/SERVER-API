const mongoose      = require('mongoose')
const Schema        = mongoose.Schema

const pdfSchema = new Schema({
    file_name: { type: String },
    target: { type: String },
    path: { type: String },
    uri: { type: String },
    status: { type: String },
    missing: { type: Array },
    generated: { type: Boolean },
    section_id: {
        type: Schema.Types.ObjectId,
        ref: 'Section'
    },
    academic_year: {
        type: Schema.Types.ObjectId,
        ref: 'Academic_Year'
    }
},{
    timestamps: true,
    collection: "pdf-yearbook"
})

const Notification = mongoose.model('PDF', pdfSchema)

module.exports = Notification