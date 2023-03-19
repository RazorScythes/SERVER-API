const Nametags         = require('../models/nametags.model')
const uuid          = require('uuid');
const fs            = require('fs')
const PSD           = require('psd');
const sharp         = require('sharp')

require('dotenv').config()

function filename(){
    return (uuid.v4())
}

// function filename(base64String){
//     return (uuid.v4() + path.extname(getExtensionName(base64String)))
// }

// function getExtensionName(base64String){
//     return base64String.substring("data:image/".length, base64String.indexOf(";base64"))
// }

exports.getNametags = async (req, res) => {
    Nametags.find()
        .then(nametags => res.json(nametags))
        .catch(err => res.status(400).json(`Error: ${err}`))
}

exports.addNametags = async (req, res) => {
    let rawDocuments = req.files;
    let nametags_json = []
    try {
        rawDocuments.map(async (files) => {
            var jsonObj = new Object();

            var extension = files.originalname.split('.')

            if(extension[extension.length - 1] == 'psd'){
                let image = filename()

                fs.writeFileSync("tmp/upload.psd", files.buffer);
    
                var psd = PSD.fromFile("tmp/upload.psd");

                psd.parse();

                psd.image.saveAsPng(`${process.env.NAMETAGS_IMAGE_FOLDER}/${image}.png`)

                // psd.image.saveAsPng(`${process.env.NAMETAGS_IMAGE_FOLDER}/${image}.png`).then(async () => {
                //     const cmyk = await sharp(`${process.env.NAMETAGS_IMAGE_FOLDER}/${image}.png`)
                //     .toColourspace('cmyk')
                //     .toFile(`${process.env.NAMETAGS_IMAGE_FOLDER}/cmyk/${image}.jpg`)
                // });
                
                jsonObj.image = `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.NAMETAGS_FOLDER_NAME}/${image}.png`;
            }
            else{
                let image = filename()
                
                fs.writeFileSync(`${process.env.NAMETAGS_IMAGE_FOLDER}/${image}.${files.mimetype.split("/").splice(-1)[0]}`, files.buffer);

                // sharp(files.buffer)
                //     .toColourspace('cmyk')
                //     .toFile(`${process.env.NAMETAGS_IMAGE_FOLDER}/cmyk/${image}.jpg`)

                jsonObj.image = `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.NAMETAGS_FOLDER_NAME}/${image}.${files.mimetype.split("/").splice(-1)[0]}`
            }
            nametags_json.push(jsonObj);
        })

        await Nametags.insertMany(nametags_json)
        .then(() => {
            Nametags.find()
            .then(nametags => {console.log(nametags); res.json({data: nametags, message: `${nametags_json.length} Nametags successfully uploaded!`, variant:'success', heading: 'Upload Successful'})})
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