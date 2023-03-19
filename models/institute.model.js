const mongoose      = require('mongoose')
const Schema        = mongoose.Schema

const instituteSchema = new Schema({
    priority_value: { type: Number },
    logo: { type: String },
    background: { type: String }, 
    overwrite: { type: Boolean },
    institute: { type: String },
    institute_acronym: { type: String },
    program: { type: Array }
},{
    timestamps: true,
    collection: "institute"
})

const Institute = mongoose.model('Institute', instituteSchema)

module.exports = Institute