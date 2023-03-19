const Academic_Year         = require('../models/academic_year.model')
const Commence              = require('../models/graduation_message.model')
const Commence_Position     = require('../models/commence-position.model')
const PDF_YEARBOOK          = require('../models/pdf.model')
const path                  = require('path')
const ba64                  = require("ba64")
const uuid                  = require('uuid');
const fs                    = require("fs");

require('dotenv').config()

function filename(base64String){
    return (uuid.v4() + path.extname(getExtensionName(base64String)))
}

function getExtensionName(base64String){
    return base64String.substring("data:image/".length, base64String.indexOf(";base64"))
}

exports.getPosition = async (req, res) => {
    Commence_Position.find({})
    .then((position) => {
        if(position.length > 0) {
            position.sort(function(a, b) {
                return b.priority_value - a.priority_value;
            });

            res.status(200).json(position)
        }
        else res.status(404).json()
    })
    .catch((err) => res.status(409).json({message: err}))
}

exports.addPosition = async (req, res) => {
    const newPosition = new Commence_Position(req.body)
    try {
        await newPosition.save()

        res.status(201).json({
            position_list: newPosition,
            message: `New position "${newPosition.position}" created`
        });
    } catch (error) {
        console.log(error)
        res.status(409).json({ message: error.message });
    }
}

exports.editPosition = async (req, res) => {
    await Commence_Position.findByIdAndUpdate(req.body.id, req.body, {new: true})
    .then(async (data) => {
        Commence_Position.find({})
        .then((position) => {
            if(position.length > 0) {
                position.sort(function(a, b) {
                    return b.priority_value - a.priority_value;
                });

                res.status(200).json({message: 'Position Updated!', position_list: position})
            }
            else res.status(404).json()
        })
        .catch((err) => res.status(409).json({message: err}))
    })
}

exports.deletePosition = async (req, res) => {
    let commence_message = await Commence.find({position: req.body.id})

    commence_message.forEach((item) => {
        if(commence_message.image){
            fs.unlink(path.join(`${process.env.MESSAGE_PHOTOS_FOLDER}/${commence_message.image.split('/').pop()}`), (err) => {
                if (err) {
                    console.error(err)
                    return
                }
                console.log("removed: "+commence_message.image)
            })
        }
    
        if(commence_message.signature){
            fs.unlink(path.join(`${process.env.SIGNATURE_IMAGE_FOLDER}/${commence_message.signature.split('/').pop()}`), (err) => {
                if (err) {
                    console.error(err)
                    return
                }
                console.log("removed: "+commence_message.signature)
            })
        }
    })

    await Commence.deleteMany({position: req.body.id})

    await Commence_Position.findByIdAndDelete(req.body.id)
    .then(async (data) => {
        Commence_Position.find({})
        .then(async (position) => {
            let updated_data = await Commence.find({}).populate('position').populate('academic_year') 
            res.status(200).json({
                data: updated_data,
                message: 'Deleted', 
                position_list: position
            })
        })
        .catch((err) => res.status(409).json({message: err}))
    })
}

exports.getCommenceData = async (req, res) => {
    Commence.find({}).populate('academic_year').populate('position')
    .then((data) => {
        data.sort(function(a, b) {
            return b.position.priority_value - a.position.priority_value;
        });
        res.status(200).json(data)
    })
    .catch((err) => res.status(409).json({message: err}))
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
        let commence = await Commence.countDocuments({academic_year: value._id})

        const jsonData = {
            _id: value._id,
            academic_year: value.academic_year,
            counts: commence,
        }

        resolve(jsonData)
    });
}

exports.uploadMessage = async (req, res) => {
    let image = filename(req.body.image)
    ba64.writeImageSync(`${process.env.MESSAGE_PHOTOS_FOLDER}/${image}`, req.body.image, function(err){
        if (err) throw err;     
        console.log(`${image} saved successfully`);
    });

    req.body.image = `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.MESSAGE_PHOTOS_NAME}/${image}.${getExtensionName(req.body.image)}`
    if(req.body.signature){
        let signature = filename(req.body.signature)

        ba64.writeImageSync(`${process.env.SIGNATURE_IMAGE_FOLDER}/${signature}`, req.body.signature, function(err){
            if (err) throw err;     
            console.log(`${signature} saved successfully`);
        });
    
        req.body.signature = `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.SIGNATURE_IMAGE_NAME}/${signature}.${getExtensionName(req.body.signature)}`
    }

    const newCommence = new Commence(req.body)
    try {
        await newCommence.save().then(async (result) => {
            let updatePDF = await PDF_YEARBOOK.findOne({academic_year: result.academic_year})
            updatePDF.missing = updatePDF.missing.filter(e => e !== 'Commence Message');
            await PDF_YEARBOOK.findByIdAndUpdate(updatePDF._id, {missing: updatePDF.missing}, {new: true})
        });
        let newUpdate = await Commence.findById(newCommence).populate('position').populate('academic_year')
        res.status(201).json({
            entry: newUpdate,
            message: `${newCommence.name} successfully created`
        });
    } catch (error) {
        console.log(error)
        res.status(409).json({ message: error.message });
    }
}

exports.updateMessage = async (req, res) => {
    let data = await Commence.findById(req.body.id)
    if(req.body.image){
        if(data.image){
            fs.unlink(path.join(`${process.env.MESSAGE_PHOTOS_FOLDER}/${data.image.split('/').pop()}`), (err) => {
                if (err) {
                    console.error(err)
                    return
                }
                console.log("removed: "+data.image)
            })
        }
        let image = filename(req.body.image)
        ba64.writeImageSync(`${process.env.MESSAGE_PHOTOS_FOLDER}/${image}`, req.body.image, function(err){
            if (err) throw err;     
            console.log(`${image} saved successfully`);
        });
        req.body.image = `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.MESSAGE_PHOTOS_NAME}/${image}.${getExtensionName(req.body.image)}`
    }
    else{
        req.body.image = data.image
    }

    if(req.body.signature){
        if(data.signature){
            fs.unlink(path.join(`${process.env.SIGNATURE_IMAGE_FOLDER}/${data.signature.split('/').pop()}`), (err) => {
                if (err) {
                    console.error(err)
                    return
                }
                console.log("removed: "+data.signature)
            })
        }
        let signature = filename(req.body.image)
        ba64.writeImageSync(`${process.env.SIGNATURE_IMAGE_FOLDER}/${signature}`, req.body.signature, function(err){
            if (err) throw err;     
            console.log(`${signature} saved successfully`);
        });
        req.body.signature = `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.SIGNATURE_IMAGE_NAME}/${signature}.${getExtensionName(req.body.signature)}`
    }
    else{
        req.body.signature = data.signature
    }
    await Commence.findByIdAndUpdate(req.body.id, req.body, {new: true})
    .then(async (data) => {
        let updatedEntry = await Academic_Year.findOne({academic_year: req.body.academic_year})
        await Commence.find({}).populate('academic_year').populate('position')
        .then((data) => {
            data.sort(function(a, b) {
                return b.position.priority_value - a.position.priority_value;
            });
            res.status(200).json({
                entry: data,
                message: `${req.body.name} successfully updated`
            })
        })
        .catch((err) => res.status(409).json({message: err}))
    })
}

exports.deleteMessage = async (req, res) => {
    let deleteData = await Commence.findOne({_id: req.body.id})

    if(deleteData.image){
        fs.unlink(path.join(`${process.env.MESSAGE_PHOTOS_FOLDER}/${deleteData.image.split('/').pop()}`), (err) => {
            if (err) {
                console.error(err)
                return
            }
            console.log("removed: "+deleteData.image)
        })
    }

    if(deleteData.signature){
        fs.unlink(path.join(`${process.env.SIGNATURE_IMAGE_FOLDER}/${deleteData.signature.split('/').pop()}`), (err) => {
            if (err) {
                console.error(err)
                return
            }
            console.log("removed: "+deleteData.signature)
        })
    }

    await Commence.deleteOne({_id: req.body.id}).then(async() => {

        await Commence.find({}).populate('academic_year').populate('position')
        .then((data) => {
            data.sort(function(a, b) {
                return b.position.priority_value - a.position.priority_value;
            });
            res.status(200).json({
                entry: data,
                message: `${deleteData.name} deleted`
            })
        })
        .catch((err) => res.status(409).json({message: err}))
        
        let check_data = await Commence.find({academic_year: deleteData.academic_year})
        let updatePDF = await PDF_YEARBOOK.findOne({academic_year: deleteData.academic_year})
        if(check_data.length < 1){
        await PDF_YEARBOOK.findByIdAndUpdate(updatePDF._id, {
            $push: { "missing": "Commence Message" }
            }, {new: true})
        }
    })
}
