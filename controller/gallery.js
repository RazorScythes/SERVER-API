const Academic_Year = require('../models/academic_year.model')
const Gallery       = require('../models/gallery.model')
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

exports.getAllYear = async (req, res) => {
    Academic_Year.find({})
    .sort([['academic_year', 'descending']])
    .then((result) => {
        res.status(201).json(result)
    })
    .catch((err) => res.status(401).json({message: err}))
}

exports.getLatestGallery = async (req, res) => {
    const channel = await Academic_Year.findOne({}, {}, { sort: { 'academic_year' : -1 } })

    if(!channel) return
    
    Gallery.find({academic_year: channel._id})
    .then((result) => {
        if(result.length > 0)
            res.status(201).json(result)
        else
            res.status(404).json({
                variant: 'danger',
                message: 'No Image Found'
            })
    })
    .catch((err) => res.status(401).json({message: err}))
}

exports.getGallery = async (req, res) => {
    Gallery.find({academic_year: req.body.id})
    .then((result) => {
        if(result.length > 0)
            res.status(201).json(result)
        else
            res.status(404).json({
                variant: 'danger',
                message: 'No Image Found'
            })
    })
    .catch((err) => res.status(401).json({message: err}))
}

exports.uploadOnDrop = async (req, res) => {
    let rawDocuments = req.body.images;
    let gallery_json = []
    try {
        for(var i in rawDocuments) {
            var jsonObj = new Object();

            let image = filename(rawDocuments[i])
            ba64.writeImageSync(`${process.env.GALLERY_IMAGE_FOLDER}/${image}`, rawDocuments[i], function(err){
                if (err) throw err;     
                console.log(`${image} saved successfully`);
            });
            
            jsonObj.academic_year = req.body.id
            jsonObj.image = `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.GALLERY_FOLDER_NAME}/${image}.${getExtensionName(rawDocuments[i])}`
            gallery_json.push(jsonObj);
        }

        await Gallery.insertMany(gallery_json)
        .then(async (result) => {
            let updatePDF = await PDF_YEARBOOK.findOne({academic_year: req.body.id})
            updatePDF.missing = updatePDF.missing.filter(e => e !== 'Exercise Gallery');
            await PDF_YEARBOOK.findByIdAndUpdate(updatePDF._id, {missing: updatePDF.missing}, {new: true})
            res.status(201).json(result)
        })
        .catch(function(err) {
            console.log(err)
            res.status(400).json(`Error: ${err}`)
        });
    } catch (error) {
        console.log(error)
        res.status(409).json({ message: error.message });
    }
}

exports.removeImage = async(req, res) => {
    let deleteData = await Gallery.findOne({_id: req.body.id})

    if(deleteData.image){
        fs.unlink(path.join(`${process.env.GALLERY_IMAGE_FOLDER}/${deleteData.image.split('/').pop()}`), (err) => {
            if (err) {
                console.error(err)
                return
            }
            console.log("removed: "+deleteData.image)
        })
    }

    await Gallery.deleteOne({_id: req.body.id}).then(async() => {
        await Gallery.find({academic_year: req.body.academic_year})
            .then(results => res.json(results))
            .catch(err => res.status(400).json(`Error: ${err}`))
    })

    let check_data = await Gallery.find({academic_year: deleteData.academic_year})
    let updatePDF = await PDF_YEARBOOK.findOne({academic_year: deleteData.academic_year})
    if(check_data.length < 1){
    await PDF_YEARBOOK.findByIdAndUpdate(updatePDF._id, {
        $push: { "missing": "Exercise Gallery" }
        }, {new: true})
    }

}