const mongoose      = require('mongoose')
const Schema        = mongoose.Schema

const administrationSchema = new Schema({
    title: { type: String }
},{
    timestamps: false,
    collection: "administration"
})

const Administration = mongoose.model('Administration', administrationSchema)

module.exports = Administration