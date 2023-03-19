const Cover         = require('../models/page_cover.model')
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

exports.getCover = async (req, res) => {
    Cover.find()
        .then(cover => res.json(cover))
        .catch(err => res.status(400).json(`Error: ${err}`))
}

exports.addCover = async (req, res) => {
    let rawDocuments = req.files;
    let cover_json = []
    try {
        rawDocuments.map(async (files) => {
            var jsonObj = new Object();

            var extension = files.originalname.split('.')

            if(extension[extension.length - 1] == 'psd'){
                let image = filename()

                fs.writeFileSync("tmp/upload.psd", files.buffer);
    
                var psd = PSD.fromFile("tmp/upload.psd");

                psd.parse();

                psd.image.saveAsPng(`${process.env.COVERPAGE_IMAGE_FOLDER}/${image}.png`)

                // psd.image.saveAsPng(`${process.env.COVERPAGE_IMAGE_FOLDER}/${image}.png`).then(async () => {
                //     const cmyk = await sharp(`${process.env.COVERPAGE_IMAGE_FOLDER}/${image}.png`)
                //     .toColourspace('cmyk')
                //     .toFile(`${process.env.COVERPAGE_IMAGE_FOLDER}/cmyk/${image}.jpg`)
                // });
                
                jsonObj.image = `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.COVERPAGE_FOLDER_NAME}/${image}.png`;
            }
            else{
                let image = filename()
                
                fs.writeFileSync(`${process.env.COVERPAGE_IMAGE_FOLDER}/${image}.${files.mimetype.split("/").splice(-1)[0]}`, files.buffer);

                // sharp(files.buffer)
                //     .toColourspace('cmyk')
                //     .toFile(`${process.env.COVERPAGE_IMAGE_FOLDER}/cmyk/${image}.jpg`)

                jsonObj.image = `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.COVERPAGE_FOLDER_NAME}/${image}.${files.mimetype.split("/").splice(-1)[0]}`
            }
            cover_json.push(jsonObj);
        })

        await Cover.insertMany(cover_json)
        .then(() => {
            Cover.find()
            .then(cover => res.json({
                data: cover, 
                message: `${cover_json.length} Cover Page successfully uploaded!`, 
                variant:'success', 
                heading: 'Upload Successful'
            }))
            .catch(err => res.status(400).json(`Error: ${err}`))
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
