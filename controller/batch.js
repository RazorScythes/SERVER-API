const Academic_Year = require('../models/academic_year.model')
const PDF_YEARBOOK  = require('../models/pdf.model')
const Section       = require('../models/section.model')
const Alumni        = require('../models/alumni.model')
const User          = require('../models/user.model')
const Commence      = require('../models/graduation_message.model')
const Gallery       = require('../models/gallery.model')
const Event         = require('../models/events.model')
const News          = require('../models/news.model')
const HA            = require('../models/honor_and_awards.model')
const Administrator = require('../models/administrators.model')


const Cover         = require('../models/page_cover.model')
const Nametags         = require('../models/nametags.model')
const Template      = require('../models/template.model')

const path          = require('path')
const fs            = require("fs");
const ba64          = require("ba64")
const uuid          = require('uuid');

require('dotenv').config()

function filename(base64String){
    return (uuid.v4() + path.extname(getExtensionName(base64String)))
}

function getExtensionName(base64String){
    return base64String.substring("data:image/".length, base64String.indexOf(";base64"))
}

exports.getCurrentYear = async (req, res) => {
    let thisYear = `${new Date().getFullYear()} - ${new Date().getFullYear() + 1}`
    Academic_Year.findOne({academic_year: thisYear})
        .then(year => res.json(year))
        .catch(err => res.status(400).json(`Error: ${err}`))
}

exports.verifyYear = async (req, res) => {
    Academic_Year.findOne({academic_year: req.body.academic_year})
        .then(year => res.json(year))
        .catch(err => res.status(400).json(`Error: ${err}`))
}

exports.getBatchYear = async (req, res) => {
    Academic_Year.find()
        .sort([['academic_year', 'descending']])
        .populate('cover_id')
        .populate('nametags_id')
        .populate({ 
            path: 'template_id',
            populate: [
                {
                    path: 'template1',
                    model: 'Template'
                },
                {
                    path: 'template2',
                    model: 'Template'
                },
                {
                    path: 'template3',
                    model: 'Template'
                },
                {
                    path: 'template4',
                    model: 'Template'
                }
            ]
        })
        .exec((err, data) => {
            if(err) return res.status(400).json(`Error: ${err}`)
            res.json(data)
        })
}

exports.addAcademicYear = async (req, res) => {
    
    let image = filename(req.body.history_image)
    ba64.writeImageSync(`${process.env.HISTORY_IMAGE_FOLDER}/${image}`, req.body.history_image, function(err){
        if (err) throw err;     
        console.log(`${image} saved successfully`);
    });

    req.body.history_image = `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.HISTORY_FOLDER_NAME}/${image}.${getExtensionName(req.body.history_image)}`


    const newBatch = new Academic_Year({...req.body})
    
    try {
        await newBatch.save().then(async (result) => {
            const newPDF = new PDF_YEARBOOK({
                file_name: `Yearbook ${req.body.academic_year} MCC`,
                target: "Main",
                path: `${process.env.PDF_FILE}/Yearbook ${req.body.academic_year} MCC`,
                status: "not created",
                generated: false,
                missing: ['Section', 'Alumni Data', 'Commence Message', 'Events', 'Administrators', 'Honors and Awards', 'Exercise Gallery'],
                section_id: null,
                academic_year: result._id
            })
            await newPDF.save()
        })

        res.status(201).json({data: newBatch, message: `Academic Year ${req.body.academic_year} successfully created!`, variant:'success', heading: 'Created Successfully'});
    } catch (error) {
        console.log(error)
        res.status(409).json({ message: error.message });
    }
}

exports.editAcademicYear = async (req, res) => {
    const {id: _id} = req.params

    const data = req.body
    let getData = await Academic_Year.findById(_id)
    if(req.body.history_image){
        if(getData.history_image){
            fs.unlink(path.join(`${process.env.HISTORY_IMAGE_FOLDER}/${getData.history_image.split('/').pop()}`), (err) => {
                if (err) {
                    console.error(err)
                    return
                }
                console.log("overwrite: "+getData.history_image)
            })
        }

        let image = filename(req.body.history_image)
        ba64.writeImageSync(`${process.env.HISTORY_IMAGE_FOLDER}/${image}`, req.body.history_image, function(err){
            if (err) throw err;     
            console.log(`${image} saved successfully`);
        });

        req.body.history_image = `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.HISTORY_FOLDER_NAME}/${image}.${getExtensionName(req.body.history_image)}`
    }
    else{
        req.body.history_image = getData.history_image
    }

    await Academic_Year.findByIdAndUpdate(_id, data, {new: true})
    Academic_Year.find()
        .sort([['academic_year', 'descending']])
        .populate('cover_id')
        .populate('nametags_id')
        .populate({ 
            path: 'template_id',
            populate: [
                {
                    path: 'template1',
                    model: 'Template'
                },
                {
                    path: 'template2',
                    model: 'Template'
                },
                {
                    path: 'template3',
                    model: 'Template'
                },
                {
                    path: 'template4',
                    model: 'Template'
                }
            ]
        })
        .exec((err, data) => {
            if(err) return res.status(400).json(`Error: ${err}`)
            res.json({new: data, message: `Academic Year ${req.body.academic_year} edited!`, variant:'success', heading: 'Edited Successfully'})
        })
}

exports.deleteAcademicYear = async (req, res) => {
    const {id: _id} = req.params
    try {
        let alumniData  = await Alumni.find({batch_id: _id})
        let pdf         = await PDF_YEARBOOK.find({ academic_year: _id })
        let commence    = await Commence.find({ academic_year: _id })
        let event       = await Event.find({ academic_year: _id })
        let news        = await News.find({ academic_year: _id })
        let gallery     = await Gallery.find({ academic_year: _id })

        let deleteData = await Academic_Year.findById(_id)
  
        if(deleteData.history_image){
            fs.unlink(path.join(`${process.env.HISTORY_IMAGE_FOLDER}/${deleteData.history_image.split('/').pop()}`), (err) => {
                if (err) {
                    console.error(err)
                    return
                }
                console.log("removed: "+deleteData.history_image)
            })
        }

        gallery.forEach((x) => {
            if(x.image){
                fs.unlink(path.join(`${process.env.GALLERY_IMAGE_FOLDER}/${x.image.split('/').pop()}`), (err) => {
                    if (err) {
                        console.error(err)
                        return
                    }
                    console.log("removed: "+x.image)
                })
            }
        })  

        event.forEach((x) => {
            if(x.image){
                fs.unlink(path.join(`${process.env.EVENTS_PHOTOS_FOLDER}/${x.image.split('/').pop()}`), (err) => {
                    if (err) {
                        console.error(err)
                        return
                    }
                    console.log("removed: "+x.image)
                })
            }
        })  

        news.forEach((x) => {
            if(x.image){
                fs.unlink(path.join(`${process.env.NEWS_PHOTOS_FOLDER}/${x.image.split('/').pop()}`), (err) => {
                    if (err) {
                        console.error(err)
                        return
                    }
                    console.log("removed: "+x.image)
                })
            }
        })
        
        commence.forEach((x) => {
            if(x.image){
                fs.unlink(path.join(`${process.env.MESSAGE_PHOTOS_FOLDER}/${x.image.split('/').pop()}`), (err) => {
                    if (err) {
                        console.error(err)
                        return
                    }
                    console.log("removed: "+x.image)
                })
            }

            if(x.signature){
                fs.unlink(path.join(`${process.env.SIGNATURE_IMAGE_FOLDER}/${x.signature.split('/').pop()}`), (err) => {
                    if (err) {
                        console.error(err)
                        return
                    }
                    console.log("removed: "+x.signature)
                })
            }
        })

        pdf.forEach((x) => {
            if(x.uri){
                fs.unlink(path.join(`${x.path}.pdf`), (err) => {
                    if (err) {
                        console.error(err)
                        return
                    }
                    console.log("removed: "+x.path.split('/').pop())
                })
            }
        })

        alumniData.forEach(async x => {
            await User.deleteOne({alumni_id: x._id});
            if(x.main != '' && (x.main != undefined || x.main != null)){
                fs.unlink(path.join(process.env.MAIN_IMAGE_FOLDER+x.main.split('/').pop()), (err) => {
                    if (err) {
                        console.error(err)
                        return
                    }
                    console.log("removed: "+x.main)
                })
            }
            if(x.img1 != '' && (x.img1 != undefined || x.img1 != null)){
                fs.unlink(path.join(process.env.SUB_IMAGE_FOLDER+x.img1.split('/').pop()), (err) => {
                    if (err) {
                        console.error(err)
                        return
                    }
                    console.log("removed: "+x.img1)
                })
            }
            if(x.img2 != '' && (x.img2 != undefined || x.img2 != null)){
                fs.unlink(path.join(process.env.SUB_IMAGE_FOLDER+x.img2.split('/').pop()), (err) => {
                    if (err) {
                        console.error(err)
                        return
                    }
                    console.log("removed: "+x.img2)
                })
            }
            if(x.img3 != '' &&(x.img3 != undefined || x.img3 != null)){
                fs.unlink(path.join(process.env.SUB_IMAGE_FOLDER+x.img3.split('/').pop()), (err) => {
                    if (err) {
                        console.error(err)
                        return
                    }
                    console.log("removed: "+x.img3)
                })
            }
        })

        await Alumni.deleteMany({ batch_id: _id })
        await PDF_YEARBOOK.deleteMany({ academic_year: _id })
        await Event.deleteMany({ academic_year: _id })
        await News.deleteMany({ academic_year: _id })
        await Gallery.deleteMany({ academic_year: _id })
        await Commence.deleteMany({ academic_year: _id })
        await Section.deleteMany({ academic_year: _id })
        await Academic_Year.findByIdAndRemove(_id);
        await HA.deleteMany({ academic_year: _id })
        await Administrator.deleteMany({ academic_year: _id })
        Academic_Year.find()
        .sort([['academic_year', 'descending']])
        .populate('cover_id')
        .populate('nametags_id')
        .populate({ 
            path: 'template_id',
            populate: [
                {
                    path: 'template1',
                    model: 'Template'
                },
                {
                    path: 'template2',
                    model: 'Template'
                },
                {
                    path: 'template3',
                    model: 'Template'
                },
                {
                    path: 'template4',
                    model: 'Template'
                }
            ]
        })
        .exec((err, data) => {
            if(err) return res.status(400).json(`Error: ${err}`)
            res.status(201).json({new: data, message: `Academic Year deleted!`, variant:'success', heading: 'Deleted Successfully'})
        })
    } catch (error) {
        console.log(error)
        res.status(409).json({ message: error.message });
    }
}

exports.getCategoryType = async (req, res) => {
    const { type } = req.body
    if(type == "Cover"){
        Cover.find({})
        .then((results) => res.status(201).json(results))
        .catch((err) => res.status(409).json({ message: err.message }))
    }
    else if(type == "Template"){
        Template.find({})
        .then((results) => res.status(201).json(results))
        .catch((err) => res.status(409).json({ message: err.message }))
    }
    else if(type == "Nametag"){
        Nametags.find({})
        .then((results) => res.status(201).json(results))
        .catch((err) => res.status(409).json({ message: err.message }))
    }
}

exports.removeDesign = async (req, res) => {
    const { type, id } = req.body
    if(type == "Cover"){
        let deleteData = await Cover.findById(id)
        // let name = deleteData.image.split('/').pop().split('.')
        // name.pop() // removes the last element of the array

        fs.unlink(path.join(`${process.env.COVERPAGE_IMAGE_FOLDER}/${deleteData.image.split('/').pop()}`), (err) => {
            if (err) {
                console.error(err)
                return
            }
            console.log("removed: "+deleteData.image)
        })

        // fs.unlink(path.join(`${process.env.COVERPAGE_IMAGE_FOLDER}/cmyk/${name}.jpg`), (err) => {
        //     if (err) {
        //         console.error(err)
        //         return
        //     }
        //     console.log("removed: "+deleteData.image)
        // })

        Cover.findByIdAndDelete(id).then(async () => {
            let cover = await Cover.find({})
            let template = await Template.find({})
            let nametag = await Nametags.find({})

            res.status(201).json({
                category: cover,
                cover: cover,
                template: template,
                nametag: nametag,
            })
        })
        .catch((err) => res.status(409).json({ message: err.message }))
    }
    else if(type == "Template"){
        let deleteData = await Template.findById(id)
        // let name = deleteData.image.split('/').pop().split('.')
        // name.pop() // removes the last element of the array

        fs.unlink(path.join(`${process.env.TEMPLATE_IMAGE_FOLDER}/${deleteData.image.split('/').pop()}`), (err) => {
            if (err) {
                console.error(err)
                return
            }
            console.log("removed: "+deleteData.image)
        })

        // fs.unlink(path.join(`${process.env.TEMPLATE_IMAGE_FOLDER}/cmyk/${name}.jpg`), (err) => {
        //     if (err) {
        //         console.error(err)
        //         return
        //     }
        //     console.log("removed: "+deleteData.image)
        // })

        Template.findByIdAndDelete(id).then(async () => {
            let cover = await Cover.find({})
            let template = await Template.find({})
            let nametag = await Nametags.find({})

            res.status(201).json({
                category: template,
                cover: cover,
                template: template,
                nametag: nametag,
            })
        })
        .catch((err) => res.status(409).json({ message: err.message }))
    }
    else if(type == "Nametag"){
        let deleteData = await Nametags.findById(id)
        // let name = deleteData.image.split('/').pop().split('.')
        // name.pop() // removes the last element of the array

        fs.unlink(path.join(`${process.env.NAMETAGS_IMAGE_FOLDER}/${deleteData.image.split('/').pop()}`), (err) => {
            if (err) {
                console.error(err)
                return
            }
            console.log("removed: "+deleteData.image)
        })

        // fs.unlink(path.join(`${process.env.NAMETAGS_IMAGE_FOLDER}/cmyk/${name}.jpg`), (err) => {
        //     if (err) {
        //         console.error(err)
        //         return
        //     }
        //     console.log("removed: "+deleteData.image)
        // })

        Nametags.findByIdAndDelete(id).then(async () => {
            let cover = await Cover.find({})
            let template = await Template.find({})
            let nametag = await Nametags.find({})

            res.status(201).json({
                category: nametag,
                cover: cover,
                template: template,
                nametag: nametag,
            })
        })
        .catch((err) => res.status(409).json({ message: err.message }))
    }
}