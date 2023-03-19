const express       = require('express')
const router        = express.Router()
const multer        = require('multer')

const { getCover, addCover } = require('../controller/page_cover')

const images = multer({});

router.get('/', getCover)
router.post('/addCover', images.array("images"), addCover)

module.exports = router