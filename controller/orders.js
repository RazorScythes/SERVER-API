const Order         = require('../models/orders.model')

exports.getOrders = async (req, res) => {
    Order.find({})
        .sort([['status', 'descending']])
        .populate({
            path: 'alumni_id',
            populate: [
                {
                    path: 'section_id',
                    model: 'Section'
                }
            ]
        })
        .then(result => {
            let data = []
            result.forEach((x) => {
                if(x.alumni_id)
                    data.push({
                        id: x._id,
                        name: `${x.alumni_id.full_name.first_name} ${x.alumni_id.full_name.last_name}`,
                        institute: x.alumni_id.section_id.institute,
                        yearbook: x.yearbook,
                        status: x.status,
                        action: x.status
                    })
            })
            res.status(201).json(data)
        }) 
        .catch(err => res.status(400).json(`Error: ${err}`))
}

exports.setStatusReleasing = async (req, res) => {
    await Order.findByIdAndUpdate(req.body.id, {status: "releasing"}, {new: true})
    .then(() => {
        Order.find({})
        .sort([['status', 'descending']])
        .populate({
            path: 'alumni_id',
            populate: [
                {
                    path: 'section_id',
                    model: 'Section'
                }
            ]
        })
        .then(result => {
            let data = []
            result.forEach((x) => {
                if(x.alumni_id)
                    data.push({
                        id: x._id,
                        name: `${x.alumni_id.full_name.first_name} ${x.alumni_id.full_name.last_name}`,
                        institute: x.alumni_id.section_id.institute,
                        yearbook: x.yearbook,
                        status: x.status,
                        action: x.status
                    })
            })
            res.status(201).json(data)
        }) 
        .catch(err => res.status(400).json(`Error: ${err}`))
    })
}

exports.setStatusOK = async (req, res) => {
    await Order.findByIdAndUpdate(req.body.id, {status: "ok"}, {new: true})
    .then(() => {
        Order.find({})
        .sort([['status', 'descending']])
        .populate({
            path: 'alumni_id',
            populate: [
                {
                    path: 'section_id',
                    model: 'Section'
                }
            ]
        })
        .then(result => {
            let data = []
            result.forEach((x) => {
                if(x.alumni_id)
                    data.push({
                        id: x._id,
                        name: `${x.alumni_id.full_name.first_name} ${x.alumni_id.full_name.last_name}`,
                        institute: x.alumni_id.section_id.institute,
                        yearbook: x.yearbook,
                        status: x.status,
                        action: x.status
                    })
            })
            res.status(201).json(data)
        }) 
        .catch(err => res.status(400).json(`Error: ${err}`))
    })
}