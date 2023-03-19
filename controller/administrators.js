const Academic_Year         = require('../models/academic_year.model')
const Administrators        = require('../models/administrators.model')
const Administration        = require('../models/administration.model')
const PDF_YEARBOOK          = require('../models/pdf.model')
const path                  = require('path')
const ba64                  = require("ba64")
const uuid                  = require('uuid');
const fs                    = require("fs");
const async                 = require('async')

require('dotenv').config()

function filename(base64String){
    return (uuid.v4() + path.extname(getExtensionName(base64String)))
}

function getExtensionName(base64String){
    return base64String.substring("data:image/".length, base64String.indexOf(";base64"))
}

exports.addAdministration = async(req, res) => {
    const administration = new Administration(req.body)

    try {
        await administration.save().then(async (result) => {
            res.status(201).json({
                title: result,
                message: `Title "${administration.title}" added.`,
                variant: 'success'
            });
        });

    } catch (error) {
        res.status(409).json({ message: error.message });
    }

}

exports.editAdministration = async(req, res) => {
    await Administration.findByIdAndUpdate(req.body.id, {title: req.body.title}, {new: true})
    .then(async (data) => {
        await Administration.find({}).populate('administration')
            .then(title => res.json(title))
            .catch(err => res.status(400).json(`Error: ${err}`))
    })

}

exports.deleteAdministration = async(req, res) => {
    let acad = await Academic_Year.findById(req.body.academic_year)
    let deleteData = await Administration.findById(req.body.id)

    let relatedData = await Administrators.find({administration: req.body.id})

    relatedData.forEach((item) => {
        if(item.image){
            fs.unlink(path.join(`${process.env.ADMINISTRATOR_PHOTOS_FOLDER}/${item.image.split('/').pop()}`), (err) => {
                if (err) {
                    console.error(err)
                    return
                }
                console.log("removed: "+item.image)
            })
        }
    })

    await Administrators.deleteMany({administration: deleteData._id})

    Administration.findByIdAndDelete(req.body.id)
    .then(async () => {
        let updatedEntry = await Administration.find({})
        
        if(updatedEntry.length == 0) {
            res.status(404).json({
                title: [],
                admin: [],
                variant: 'warning',
                message: 'No Administration found. Make sure you add one by clicking the add button'
            })
            return
        }
        let administrator = await Administrators.find({academic_year: acad._id, administration: updatedEntry[0]._id})

        res.status(201).json({
            title: updatedEntry.length > 0 ? updatedEntry : [],
            admin: administrator.length > 0 ? administrator : [],
            message: `Title "${deleteData.title} deleted."`,
            variant: "success"
        })
    })
    .catch((e) => console.log(e))
}

exports.getAcademicYear = async (req, res) => {
    try {
        let data = []
        let academic_year = await Academic_Year.find({})
                                  .sort([['academic_year', 'descending']])
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

exports.getLatestContent = async (req, res) => {
    const channel = await Academic_Year.findOne({}, {}, { sort: { 'academic_year' : -1 } })
    if(!channel) return

    let administration = await Administration.find({})
    if(administration.length == 0){
        res.status(404).json({
            variant: 'warning',
            message: 'No Administration found. Make sure you add one by clicking the add button'
        })
        return
    }

    Administrators.find({administration: administration[0]._id}).populate('administration')
    .then((result) => {
        if(result.length > 0)
            res.status(201).json({
                title: administration,
                admin: result,
            })
        else
            if(administration.length > 0)
                res.status(404).json({title: administration})
            else
                res.status(404).json({
                    title: [],
                    admin: [],
                })
    })
    .catch((err) => console.log(err))
}

exports.getAdminContent = async (req, res) => {
    let administration = await Administration.findOne({title: req.body.administration})

    const channel = await Academic_Year.findById(req.body.academic_year)
    Administrators.find({administration: administration._id, academic_year: channel._id}).populate('administration')
    .then((result) => {
        if(result.length > 0)
            res.status(201).json({
                admin: result
            })
        else
            res.status(404).json({
                variant: '',
                message: ''
            })
    })
    .catch((err) => res.status(401).json({message: err}))
}

function flattenDocument(value) {
    return new Promise(async (resolve) => {
        let admin = await Administrators.countDocuments({academic_year: value._id})
        
        const jsonData = {
            _id: value._id,
            academic_year: value.academic_year,
            counts: admin,
        }

        resolve(jsonData)
    });
}

exports.getAdministrators = async (req, res) => {
    let academic_year = await Academic_Year.findOne({academic_year: req.body.academic_year})
    await Administrators.find({ academic_year: academic_year._id }).populate('administration')
        .then(admins => res.json(admins))
        .catch(err => res.status(400).json(`Error: ${err}`))
}

exports.uploadAdministrators = async (req, res) => {
    let administration = await Administration.findById(req.body.administration)
    if(!administration){
        res.status(404).json({
            variant: 'danger',
            message: 'Administration not found'
        })
        return
    }
    let image_path = ''

    if(req.body.image){
        let image = filename(req.body.image)

        ba64.writeImageSync(`${process.env.ADMINISTRATOR_PHOTOS_FOLDER}/${image}`, req.body.image, function(err){
            if (err) throw err;     
            console.log(`${image} saved successfully`);
        });

        image_path = `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.ADMINISTRATOR_PHOTOS_NAME}/${image}.${getExtensionName(req.body.image)}`
    }
    
    let academic_year = await Academic_Year.findById(req.body.academic_year)
    const newAdministrators = new Administrators({
        administration: administration._id,
        name: req.body.name,
        image: image_path,
        position: req.body.position,
        academic_year: academic_year._id
    })

    try {
        await newAdministrators.save().then(async (result) => {
            let updatePDF = await PDF_YEARBOOK.findOne({academic_year: result.academic_year})
            updatePDF.missing = updatePDF.missing.filter(e => e !== 'Administrators');
            await PDF_YEARBOOK.findByIdAndUpdate(updatePDF._id, {missing: updatePDF.missing}, {new: true})
        });
        let new_admin = await Administrators.findById(newAdministrators._id).populate('administration')
        res.status(201).json(new_admin);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
}

exports.updateAdministrators = async (req, res) => {
    let data = await Administrators.findById(req.body.id)
    if(req.body.image){
        if(data.image){
            fs.unlink(path.join(`${process.env.ADMINISTRATOR_PHOTOS_FOLDER}/${data.image.split('/').pop()}`), (err) => {
                if (err) {
                    console.error(err)
                    return
                }
                console.log("removed: "+data.image)
            })
        }

        let image = filename(req.body.image)
        ba64.writeImageSync(`${process.env.ADMINISTRATOR_PHOTOS_FOLDER}/${image}`, req.body.image, function(err){
            if (err) throw err;     
            console.log(`${image} saved successfully`);
        });

        req.body.image = `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.ADMINISTRATOR_PHOTOS_NAME}/${image}.${getExtensionName(req.body.image)}`
    }
    else{
        req.body.image = data.image
    }

    await Administrators.findByIdAndUpdate(req.body.id, {name: req.body.name, image: req.body.image, position: req.body.position}, {new: true})
    .then(async (data) => {
        let academic_year = await Academic_Year.findById(req.body.academic_year)
        await Administrators.find({ administration: req.body.administration, academic_year: academic_year._id }).populate('administration')
            .then(admins => res.json({
                entry: admins,
                variant: 'success',
                message: `${data.name} successfully updated`
            }))
            .catch(err => res.status(400).json(`Error: ${err}`))
    })
}

exports.deleteAdministrators = async (req, res) => {
    const {id, data} = req.body

    if(id){
        let deleteData = await Administrators.findById(req.body.id)

        if(deleteData.image){
            fs.unlink(path.join(`${process.env.ADMINISTRATOR_PHOTOS_FOLDER}/${deleteData.image.split('/').pop()}`), (err) => {
                if (err) {
                    console.error(err)
                    return
                }
                console.log("removed: "+deleteData.image)
            })
        }

        await Administrators.deleteOne({_id: req.body.id}).then(async() => {
            let academic_year = await Academic_Year.findById(req.body.academic_year)
            await Administrators.find({ administration: req.body.administration, academic_year: academic_year._id }).populate('administration')
                .then(admins => res.json({
                    entry: admins,
                    message: `${deleteData.name} deleted`
                }))
                .catch(err => res.status(400).json(`Error: ${err}`))

            let check_data = await Administrators.find({academic_year: deleteData.academic_year})
            let updatePDF = await PDF_YEARBOOK.findOne({academic_year: deleteData.academic_year})
            if(check_data.length < 1){
            await PDF_YEARBOOK.findByIdAndUpdate(updatePDF._id, {
                $push: { "missing": "Administrators" }
                }, {new: true})
            }
        })
    }
    else if(data){

        async.eachSeries(data, function updateObject (obj, done) {
            if(obj.image){
                fs.unlink(path.join(`${process.env.ADMINISTRATOR_PHOTOS_FOLDER}/${obj.image.split('/').pop()}`), (err) => {
                    if (err) {
                        console.error(err)
                        return
                    }
                    console.log("removed: "+obj.image)
                })
            }
            Administrators.findByIdAndDelete(obj._id, done)
        }, async function allDone (err) {
            let academic_year = await Academic_Year.findById(req.body.academic_year)
            await Administrators.find({ administration: req.body.administration, academic_year: academic_year._id }).populate('administration')
                .then(admins => res.json({
                    entry: admins,
                    message: `${data.length} selected administration successfully deleted`
                }))
                .catch(err => res.status(400).json(`Error: ${err}`))

            let check_data = await Administrators.find({academic_year: academic_year._id})
            let updatePDF = await PDF_YEARBOOK.findOne({academic_year: academic_year._id})
            if(check_data.length < 1){
            await PDF_YEARBOOK.findByIdAndUpdate(updatePDF._id, {
                $push: { "missing": "Administrators" }
                }, {new: true})
            }
        });
    }
}