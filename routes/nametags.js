const express       = require('express')
const router        = express.Router()
const multer        = require('multer')

const { getNametags, addNametags } = require('../controller/nametags')

const images = multer({});

router.get('/', getNametags)
router.post('/addNametags', images.array("images"), addNametags)

module.exports = router