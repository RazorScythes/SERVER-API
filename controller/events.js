const Academic_Year = require('../models/academic_year.model')
const Events        = require('../models/events.model')
const News          = require('../models/news.model')
const PDF_YEARBOOK  = require('../models/pdf.model')
const path          = require('path')
const ba64          = require("ba64")
const uuid          = require('uuid');
const fs            = require("fs");

require('dotenv').config()

function filename(base64String){
    return (uuid.v4() + path.extname(getExtensionName(base64String)))
}

function getExtensionName(base64String){
    return base64String.substring("data:image/".length, base64String.indexOf(";base64"))
}
exports.getAcademicYear = async (req, res) => {
    try {
        let data = []
        let academic_year = await Academic_Year.find({})
        academic_year.forEach(async (x) => {
            data.push(flattenDocument(x));
        })

        Promise.all(data)
        .then((results) => {
            res.status(201).json(results);
        })
        .catch((e) => {
            res.status(409).json({ message: e.message });
        });
    } catch (error) {   
        console.log(error)
    }
}

function flattenDocument(value) {
    return new Promise(async (resolve) => {
        let events = await Events.countDocuments({academic_year: value._id})

        const jsonData = {
            _id: value._id,
            academic_year: value.academic_year,
            counts: events,
        }

        resolve(jsonData)
    });
}

exports.getEvents = async (req, res) => {
    await Events.find({})
    .sort([['position', 'descending']])
    .populate('academic_year')
    .exec((err, data) => {
        if(err) return res.status(400).json(`Error: ${err}`)
        res.json(data)
    })
}

exports.uploadEvents = async (req, res) => {
    let image = filename(req.body.image)
    ba64.writeImageSync(`${process.env.EVENTS_PHOTOS_FOLDER}/${image}`, req.body.image, function(err){
        if (err) throw err;     
        console.log(`${image} saved successfully`);
    });

    req.body.image = `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.EVENTS_PHOTOS_NAME}/${image}.${getExtensionName(req.body.image)}`
    const newEvents = new Events(req.body)
    try {
        await newEvents.save().then(async (result) => {
            let updatePDF = await PDF_YEARBOOK.findOne({academic_year: result.academic_year})
            updatePDF.missing = updatePDF.missing.filter(e => e !== 'Events');
            await PDF_YEARBOOK.findByIdAndUpdate(updatePDF._id, {missing: updatePDF.missing}, {new: true})
        });

        await Events.findById(newEvents._id)
        .populate('academic_year')
        .exec((err, data) => {
            if(err) return res.status(400).json(`Error: ${err}`)
            res.status(201).json({
                entry: data,
                message: `${newEvents.header} successfully created`
            });
        })
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
}

exports.updateEvents = async (req, res) => {
    let data = await Events.findById(req.body.id)
    if(req.body.image){
        if(data.image){
            fs.unlink(path.join(`${process.env.EVENTS_PHOTOS_FOLDER}/${data.image.split('/').pop()}`), (err) => {
                if (err) {
                    console.error(err)
                    return
                }
                console.log("removed: "+data.image)
            })
        }

        let image = filename(req.body.image)
        ba64.writeImageSync(`${process.env.EVENTS_PHOTOS_FOLDER}/${image}`, req.body.image, function(err){
            if (err) throw err;     
            console.log(`${image} saved successfully`);
        });

        req.body.image = `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.EVENTS_PHOTOS_NAME}/${image}.${getExtensionName(req.body.image)}`
    }
    else{
        req.body.image = data.image
    }
    await Events.findByIdAndUpdate(req.body.id, req.body, {new: true})
    .then(async (data) => {
        let updatedEntry = await Academic_Year.findOne({academic_year: req.body.academic_year})
        await Events.find({})
        .sort([['position', 'descending']])
        .populate('academic_year')
        .exec((err, data) => {
            if(err) return res.status(400).json(`Error: ${err}`)
            res.json({
                entry: data,
                message: `${req.body.header} successfully updated`
            })
        })
    })
}

exports.deleteEvents = async (req, res) => {
    let deleteData = await Events.findOne({_id: req.body.id})

    if(deleteData.image){
        fs.unlink(path.join(`${process.env.EVENTS_PHOTOS_FOLDER}/${deleteData.image.split('/').pop()}`), (err) => {
            if (err) {
                console.error(err)
                return
            }
            console.log("removed: "+deleteData.image)
        })
    }

    await Events.deleteOne({_id: req.body.id}).then(async() => {
        await Events.find({})
            .then(results => res.json({
                entry: results,
                message: `${deleteData.header} deleted`
            }))
            .catch(err => res.status(400).json(`Error: ${err}`))
    })

    let check_data = await Events.find({academic_year: deleteData.academic_year})
    let updatePDF = await PDF_YEARBOOK.findOne({academic_year: deleteData.academic_year})
    console.log(check_data)
    if(check_data.length < 1){
    await PDF_YEARBOOK.findByIdAndUpdate(updatePDF._id, {
        $push: { "missing": "Events" }
        }, {new: true})
    }
}


exports.getNews = async (req, res) => {
    await News.find({})
    .sort([['position', 'descending']])
    .populate('academic_year')
    .exec((err, data) => {
        if(err) return res.status(400).json(`Error: ${err}`)
        res.json(data)
    })
}

exports.uploadNews = async (req, res) => {

    let image = filename(req.body.image)
    ba64.writeImageSync(`${process.env.NEWS_PHOTOS_FOLDER}/${image}`, req.body.image, function(err){
        if (err) throw err;     
        console.log(`${image} saved successfully`);
    });

    req.body.image = `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.NEWS_PHOTOS_NAME}/${image}.${getExtensionName(req.body.image)}`
    const newNews = new News(req.body)
    try {
        await newNews.save();

        await News.findById(newNews._id)
        .populate('academic_year')
        .exec((err, data) => {
            if(err) return res.status(400).json(`Error: ${err}`)
            res.status(201).json({
                entry: data,
                message: `${newNews.header} successfully created`
            });
        })
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
}

exports.updateNews = async (req, res) => {
    let data = await News.findById(req.body.id)
    if(req.body.image){

        if(data.image){
            fs.unlink(path.join(`${process.env.NEWS_PHOTOS_FOLDER}/${data.image.split('/').pop()}`), (err) => {
                if (err) {
                    console.error(err)
                    return
                }
                console.log("removed: "+data.image)
            })
        }

        let image = filename(req.body.image)
        ba64.writeImageSync(`${process.env.NEWS_PHOTOS_FOLDER}/${image}`, req.body.image, function(err){
            if (err) throw err;     
            console.log(`${image} saved successfully`);
        });

        req.body.image = `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.NEWS_PHOTOS_NAME}/${image}.${getExtensionName(req.body.image)}`
    }
    else{
        req.body.image = data.image
    }
    await News.findByIdAndUpdate(req.body.id, req.body, {new: true})
    .then(async (data) => {
        let updatedEntry = await Academic_Year.findOne({academic_year: req.body.academic_year})
        await News.find({})
        .sort([['position', 'descending']])
        .populate('academic_year')
        .exec((err, data) => {
            if(err) return res.status(400).json(`Error: ${err}`)
            res.json({
                entry: data,
                message: `${req.body.header} successfully updated`
            })
        })
    })
}

exports.deleteNews = async (req, res) => {
    let deleteData = await News.findOne({_id: req.body.id})

    if(deleteData.image){
        fs.unlink(path.join(`${process.env.NEWS_PHOTOS_FOLDER}/${deleteData.image.split('/').pop()}`), (err) => {
            if (err) {
                console.error(err)
                return
            }
            console.log("removed: "+deleteData.image)
        })
    }

    await News.deleteOne({_id: req.body.id}).then(async() => {
        await News.find({})
            .then(results => res.json({
                entry: results,
                message: `${deleteData.header} deleted`
            }))
            .catch(err => res.status(400).json(`Error: ${err}`))
    })
}
