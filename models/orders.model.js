const mongoose      = require('mongoose')
const Schema        = mongoose.Schema

const orderSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    alumni_id: {
        type: Schema.Types.ObjectId,
        ref: 'Alumni'
    },
    yearbook: { type: String },
    status: { type: String },
    target_date: { type: String },
},{
    timestamps: false,
    collection: "order"
})

const Order = mongoose.model('Order', orderSchema)

module.exports = Order