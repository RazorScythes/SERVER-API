const mongoose = require('mongoose')
const Schema = mongoose.Schema

const exerciseSchema = new Schema({
    creator: {
        type: String,
    },
    name: {
        type: String,
    },
    title: {
        type: String,
    },
    message: {
        type: String,
    },
    tags: {
        type: String,
    },
    selectedFile: {
        type: String
    }
},{
    timestamps: true
})

const Exercise = mongoose.model('Exercise', exerciseSchema)

module.exports = Exercise