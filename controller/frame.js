const Frame         = require('../models/frame.model')
const path          = require('path')
const ba64          = require("ba64")
const uuid          = require('uuid');

function filename(base64String){
    return (uuid.v4() + path.extname(getExtensionName(base64String)))
}

function getExtensionName(base64String){
    return base64String.substring("data:image/".length, base64String.indexOf(";base64"))
}

exports.getFrame = async (req, res) => {
    Frame.find()
        .then(frame => res.json(frame))
        .catch(err => res.status(400).json(`Error: ${err}`))
}

exports.addFrame = async (req, res) => {
    let rawDocuments = req.body;
    let frame_json = []
    try {
        for(var i in rawDocuments) {
            var jsonObj = new Object();

            let image = filename(rawDocuments[i])
            ba64.writeImageSync("public/frame/"+image, rawDocuments[i], function(err){
                if (err) throw err;     
                console.log(`${image} saved successfully`);
            });

            jsonObj.image = "http://"+process.env.IP_ADDRESS+":"+process.env.PORT+"/frame/"+image+"."+getExtensionName(rawDocuments[i]);
            frame_json.push(jsonObj);
        }

        await Frame.insertMany(frame_json)
        .then(() => {
            Frame.find()
            .then(frame => res.json({data: frame, message: `${frame_json.length} Frame successfully uploaded!`, variant:'success', heading: 'Upload Successful'}))
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