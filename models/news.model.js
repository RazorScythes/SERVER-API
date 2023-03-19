const mongoose      = require('mongoose')
const Schema        = mongoose.Schema

const newsSchema = new Schema({
    header: { type: String },
    content: { type: String },
    image: { type: String },
    academic_year: {
        type: Schema.Types.ObjectId,
        ref: 'Academic_Year'
    }
},{
    timestamps: true,
    collection: "news"
})

const News = mongoose.model('News', newsSchema)

module.exports = News