const mongoose      = require('mongoose')
const Schema        = mongoose.Schema

const administratorsSchema = new Schema({
    administration: {
        type: Schema.Types.ObjectId,
        ref: 'Administration'
    },
    name: { type: String },
    position: { type: Array },
    image: { type: String },
    academic_year: {
        type: Schema.Types.ObjectId,
        ref: 'Academic_Year'
    }
},{
    timestamps: false,
    collection: "administrators"
})

const Administrators = mongoose.model('Administrators', administratorsSchema)

module.exports = Administrators