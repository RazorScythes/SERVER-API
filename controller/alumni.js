const Alumni        = require('../models/alumni.model')
const Academic_Year = require('../models/academic_year.model')
const Order         = require(('../models/orders.model.js'))
const Message       = require('../models/message.model')
const path          = require('path')
const ba64          = require("ba64")
const uniqid        = require('uniqid');
const async           = require('async')

function filename(base64String){
    return (uniqid() + path.extname(getExtensionName(base64String)))
}

function getExtensionName(base64String){
    return base64String.substring("data:image/".length, base64String.indexOf(";base64"))
}

function search(nameKey, prop, prop2 = '', arr){
    if(!nameKey) return []
    return arr.filter(keyword => keyword[prop].toLowerCase().includes(nameKey.toLowerCase()) || (keyword[prop2] && keyword[prop2].toLowerCase().includes(nameKey)))
}

exports.getStudentQuery = async (req, res) => {
    Alumni.find({}).populate('section_id')
    .then(async(results) => {
        let sorted = []
        results.forEach((x) => {
            sorted.push({
                id: x._id,
                student_number: x.student_number ? x.student_number : "No # Available",
                name: `${x.full_name.first_name} ${x.full_name.last_name}`,
                searchKey : {
                    student_number: x.student_number,
                    first_name: x.full_name.first_name,
                    last_name: x.full_name.last_name
                }
            })
        })
        sorted = search(req.body.keyword, 'name', 'student_number', sorted)
        if(sorted !== undefined) res.status(201).json(sorted)
        else res.status(404).json({message: "not found"})
    })
    .catch((e) => {
        console.log(e)
        res.status(409).json({ message: e.message });
    });
}

exports.getOverviewData = async (req, res) => {
    const channel = await Academic_Year.findOne({}, {}, { sort: { 'academic_year' : -1 } })
    //if(!channel) return res.status(409).json({ message: "not found" });
    
    let total_graduates = await Alumni.countDocuments()
    let total_batchYear = await Academic_Year.countDocuments()
    let total_sold = await Order.countDocuments({status: 'ok'})
    let pending_order = await Order.find({status: 'pending'})
                            .populate({
                                path: 'alumni_id',
                                populate: [
                                    {
                                        path: 'section_id',
                                        model: 'Section'
                                    }
                                ]
                            })
    
    let organized = []
    pending_order.forEach((x) => {
        if(!x.alumni_id) return
        organized.push({
            name: `${x.alumni_id.full_name.first_name} ${x.alumni_id.full_name.last_name}`,
            institute: x.alumni_id.section_id.institute,
            yearbook: x.yearbook,
            status: x.status
        })
    })          

    let alumni_list = await Alumni.find({ batch_id: channel ? channel._id : null }).populate('batch_id').populate('section_id')

    let data = []
        
    alumni_list.forEach(async (x) => {
        data.push(flattenDocument(x));
    })

    Promise.all(data)
    .then((results) => {
        res.status(201).json({
            academic_year: channel ? channel.academic_year : 'No Result ',
            total_graduates: total_graduates ? total_graduates : 0,
            total_sold_yearbook: total_sold ? total_sold : 0,
            total_batchYear: total_batchYear ? total_batchYear: 0,
            pending_orders: organized,
            new_graduates: results
        });
    })
    .catch((e) => {
        console.log(e)
        res.status(409).json({ message: e.message });
    });

}

function flattenDocument(value) {
    return new Promise(async (resolve) => {    
        const jsonData = {
            academic_year: value.batch_id.academic_year,
            student_number: value.student_number ? value.student_number : "n/a",
            name: `${value.full_name.first_name} ${value.full_name.last_name}`,
            institute: value.section_id.institute,
            program: value.section_id.program,
        }
        resolve(jsonData)
    });
}

exports.postAlumni = async (req, res) => {
    const data = req.body;
    const newAlumni = new Alumni(data)

    try {
        await newAlumni.save();

        res.status(201).json(newAlumni);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
}

exports.csvAlumni = async (req, res) => {

}

exports.getNotification = async (req, res) => {
    let count = 0
    let notification = await Message.find({}).or([{ notification_status: "new" }, { notification_status: "read" }]).sort([['notification_status', 'ascending']])
    notification.forEach((i) => { if(i.notification_status === 'new') count ++ })
    
    res.status(200).json({
        count: count,
        data: notification
    })
}

exports.updateNotification = async (req, res) => {
    var arr = []
    
    req.body.forEach((i) => {
        arr.push({
            _id: i._id,
            notification_status: i.notification_status === 'new' ?  'read' : i.notification_status,
        })
    })

    async.eachSeries(arr, function updateObject (obj, done) {
        Message.findByIdAndUpdate(obj._id, obj, done)
    }, async function allDone (err) {
        if(err) res.status(400).json(`Error: ${err}`)

        res.status(200).json("OK")
    });
}