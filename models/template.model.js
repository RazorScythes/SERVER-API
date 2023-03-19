const mongoose      = require('mongoose')
const Schema        = mongoose.Schema

const templateSchema = new Schema({
    image: { type: String },
},{
    timestamps: false,
    collection: "template"
})

const Template = mongoose.model('Template', templateSchema)

module.exports = Template