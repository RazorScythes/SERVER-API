const mongoose      = require('mongoose')
const Schema        = mongoose.Schema

const c_positionSchema = new Schema({
    position: { type: String },
    priority_value: { type: Number }
},{
    timestamps: true,
    collection: "commence_position"
})

const Commence_Position = mongoose.model('Commence_Position', c_positionSchema)

module.exports = Commence_Position