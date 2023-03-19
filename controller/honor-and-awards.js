const Academic_Year         = require('../models/academic_year.model')
const HA                    = require('../models/honor_and_awards.model')
const Honor_Title           = require('../models/honor_title.model')
const PDF_YEARBOOK          = require('../models/pdf.model')
const path                  = require('path')
const ba64                  = require("ba64")
const uuid                  = require('uuid');
const fs                    = require('fs')

require('dotenv').config()

function filename(base64String){
    return (uuid.v4() + path.extname(getExtensionName(base64String)))
}

function getExtensionName(base64String){
    return base64String.substring("data:image/".length, base64String.indexOf(";base64"))
}

exports.addHonorTitle = async (req, res) => {
    const honor_title = new Honor_Title(req.body)
    try {
        await honor_title.save()
        res.status(201).json({
            newTitle: honor_title,
            message: `Honor title "${honor_title.title}" added!`
        });
    } catch (error) {
        console.log(error)
        res.status(409).json({ message: error.message });
    }
}

function getAlumniHonor(arr){
    var new_arr = []

    arr.forEach((item) => {
        new_arr.push({
            _id: item._id,
            academic_year: item.academic_year,
            name: item.name,
            title: item.title.title,
            title_id: item.title._id,
            quotes: item.quotes,
            message: item.message,
            image: item.image,
            props: item.title
        })
    })

    new_arr.sort(function(a, b) {
        return b.props.priority_value - a.props.priority_value;
    });

    return new_arr
}

exports.editHonorTitle = async (req, res) => {
    await Honor_Title.findByIdAndUpdate(req.body.form.id, req.body.form, {new: true})
    .then(async (data) => {
        let academic_year = await Academic_Year.findOne({academic_year: req.body.academic_year})
        let ha = await HA.find({academic_year: academic_year._id}).populate('title')
        let altered = getAlumniHonor(ha)

        await Honor_Title.find({})
            .then(title => res.json({
                updatedTitle: title,
                ha: altered.length > 0 ? altered : [],
                message: `${data.title} successfully updated`
            }))
            .catch(err => console.log(err))
    })
}

exports.deleteHonorTitle = async (req, res) => {
    let deleteData = await Honor_Title.findById(req.body.id)

    let relatedData = await HA.find({title: deleteData._id}).populate('title')

    relatedData.forEach((item) => {
        if(item.image){
            fs.unlink(path.join(`${process.env.HONOR_IMAGE_FOLDER}/${item.image.split('/').pop()}`), (err) => {
                if (err) {
                    console.error(err)
                    return
                }
                console.log("removed: "+item.image)
            })
        }
    })

    await HA.deleteMany({title: deleteData._id})
    Honor_Title.findByIdAndDelete(req.body.id)
    .then(async () => {
        let honor_title = await Honor_Title.find({})
        if(honor_title.length === 0){
            res.status(404).json({
                message: `Title "${deleteData.title}" deleted. 
                          [No Title Found make sure you add one first] `,
                variant: 'warning'
            })
            return
        }
        let academic_year = await Academic_Year.findOne({academic_year: req.body.academic_year})
        let ha = await HA.find({academic_year: academic_year._id}).populate('title')
        let altered = getAlumniHonor(ha)

        res.status(201).json({
            title: honor_title,
            ha: altered.length > 0 ? altered : [],
            message: `Title "${deleteData.title}" deleted.`,
        })
    })
    .catch((e) => console.log(e))
}

exports.getHAYear = async (req, res) => {
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
        let ha = await HA.countDocuments({academic_year: value._id})
        
        const jsonData = {
            _id: value._id,
            academic_year: value.academic_year,
            counts: ha,
        }

        resolve(jsonData)
    });
}

exports.getHA = async (req, res) => {
    try {
        let honor_title = await Honor_Title.find({})
        if(honor_title.length === 0){
            res.status(404).json({
                message: "No Title Found, make sure you add one first",
                variant: 'warning'
            })
            return
        }
        let academic_year = await Academic_Year.findOne({academic_year: req.body.academic_year})
        let ha = await HA.find({academic_year: academic_year._id}).populate('title')
        let altered = getAlumniHonor(ha)

        res.status(201).json({
            title: honor_title,
            ha: altered.length > 0 ? altered : []
        });
    } catch (error) {   
        console.log(error)
    }
}

exports.uploadHA = async (req, res) => {
    req.body.title = req.body.title.id

    let academic_year = await Academic_Year.findOne({academic_year: req.body.academic_year})
    req.body.academic_year = academic_year._id

    if(req.body.image){
        let image = filename(req.body.image)

        ba64.writeImageSync(`${process.env.HONOR_IMAGE_FOLDER}/${image}`, req.body.image, function(err){
            if (err) throw err;     
            console.log(`${image} saved successfully`);
        });
    
        req.body.image = `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.HONOR_IMAGE_NAME}/${image}.${getExtensionName(req.body.image)}`
    }

    const newHA = new HA(req.body)

    try {
        await newHA.save().then(async (result) => {
            let updatePDF = await PDF_YEARBOOK.findOne({academic_year: result.academic_year})
            updatePDF.missing = updatePDF.missing.filter(e => e !== 'Honors and Awards');
            await PDF_YEARBOOK.findByIdAndUpdate(updatePDF._id, {missing: updatePDF.missing}, {new: true})
        });

        let new_ = await HA.findById(newHA._id).populate('title')

        res.status(201).json({
                _id: new_._id,
                academic_year: new_.academic_year,
                name: new_.name,
                title: new_.title.title,
                title_id: new_.title._id,
                quotes: new_.quotes,
                message: new_.message,
                image: new_.image,
                props: new_.title
            });

    } catch (error) {
        console.log(error)
        res.status(409).json({ message: error.message });
    }
}

exports.updateHA = async (req, res) => {
    req.body.title = req.body.title.id
    if(req.body.image){
        let data = await HA.findById(req.body.id)
        if(data.image){
            fs.unlink(path.join(process.env.HONOR_IMAGE_FOLDER+data.image.split('/').pop()), (err) => {
                if (err) {
                    console.error(err)
                    return
                }
                console.log("removed: "+data.image)
            })
        }
        
        let image = filename(req.body.image)

        ba64.writeImageSync(`${process.env.HONOR_IMAGE_FOLDER}/${image}`, req.body.image, function(err){
            if (err) throw err;     
            console.log(`${image} saved successfully`);
        });
    
        req.body.image = `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.HONOR_IMAGE_NAME}/${image}.${getExtensionName(req.body.image)}`
    }else{
        delete req.body.image
    }

    let academic_year = await Academic_Year.findOne({academic_year: req.body.academic_year})
    req.body.academic_year = academic_year._id 
    await HA.findByIdAndUpdate(req.body.id, req.body, {new: true})
    .then(async (data) => {
        let ha = await HA.find({ academic_year: academic_year._id }).populate('title')
        let altered = getAlumniHonor(ha)

        res.status(201).json({
            ha: altered.length > 0 ? altered : [],
            message: `Honor Alumni ${data.name} successfully updated`
        });

    })
}

exports.deleteHA = async (req, res) => {
    let deleteData = await HA.findOne({_id: req.body.id})

    await HA.deleteOne({_id: req.body.id}).then(async() => {
        if((deleteData.image != undefined || deleteData.image != null) && deleteData.image != ''){
            fs.unlink(path.join(process.env.HONOR_IMAGE_FOLDER+deleteData.image.split('/').pop()), (err) => {
                if (err) {
                    console.error(err)
                    return
                }
                console.log("removed: "+deleteData.image)
            })
        }

        let academic_year = await Academic_Year.findOne({academic_year: req.body.academic_year})
        let ha = await HA.find({academic_year: academic_year._id}).populate('title')
        let altered = getAlumniHonor(ha)

        res.status(200).json({
            entry: altered.length > 0 ? altered : [],
            message: `${deleteData.name} deleted`
        })

        let check_data = await HA.find({academic_year: deleteData.academic_year})
        let updatePDF = await PDF_YEARBOOK.findOne({academic_year: deleteData.academic_year})
        if(check_data.length < 1){
        await PDF_YEARBOOK.findByIdAndUpdate(updatePDF._id, {
            $push: { "missing": "Honors and Awards" }
            }, {new: true})
        }
    })
}
