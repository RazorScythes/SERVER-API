const mongoose      = require('mongoose')
const Schema        = mongoose.Schema

const nametagSchema = new Schema({
    image: { type: String },
    text_color: { type: String },
    margin_name: { type: String },
    margin_quotes: { type: String },
    quotes: { type: Boolean },
},{
    timestamps: false,
    collection: "nametags"
})

const Nametags = mongoose.model('Nametags', nametagSchema)

module.exports = Nametags