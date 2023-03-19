const mongoose      = require('mongoose')
const Schema        = mongoose.Schema

const messageSchema = new Schema({
    name: { type: String },
    position: {
        type: Schema.Types.ObjectId,
        ref: 'Commence_Position'
    },
    quotes: { type: String },
    message: { type: String },
    image: { type: String },
    signature: { type: String },
    academic_year: {
        type: Schema.Types.ObjectId,
        ref: 'Academic_Year'
    }
},{
    timestamps: true,
    collection: "graduation_message"
})

const Message = mongoose.model('Graduation_Message', messageSchema)

module.exports = Message