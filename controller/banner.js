const Banner        = require('../models/banner.model')
const path          = require('path')
const ba64          = require("ba64")
const uuid          = require('uuid');

function filename(base64String){
    return (uuid.v4() + path.extname(getExtensionName(base64String)))
}

function getExtensionName(base64String){
    return base64String.substring("data:image/".length, base64String.indexOf(";base64"))
}

exports.getBanner = async (req, res) => {
    Banner.find()
        .then(banner => res.json(banner))
        .catch(err => res.status(400).json(`Error: ${err}`))
}

exports.addBanner = async (req, res) => {
    let rawDocuments = req.body;
    let banner_json = []
    try {
        for(var i in rawDocuments) {
            var jsonObj = new Object();

            let image = filename(rawDocuments[i])
            ba64.writeImageSync("public/banner/"+image, rawDocuments[i], function(err){
                if (err) throw err;     
                console.log(`${image} saved successfully`);
            });

            jsonObj.image = "http://"+process.env.IP_ADDRESS+":"+process.env.PORT+"/banner/"+image+"."+getExtensionName(rawDocuments[i]);
            banner_json.push(jsonObj);
        }

        await Banner.insertMany(banner_json)
        .then(() => {
            Banner.find()
            .then(banner => res.json({data: banner, message: `${banner_json.length} Banner successfully uploaded!`, variant:'success', heading: 'Upload Successful'}))
            .catch(err => res.status(400).json(`Error: ${err}`))
        })
        .catch(function(err) {
            console.log(err)
            res.status(400).json(`Error: ${err}`)
        });
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
}