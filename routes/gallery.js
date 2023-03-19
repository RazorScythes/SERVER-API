const express       = require('express')
const router        = express.Router()

const { getAllYear, getLatestGallery, getGallery, uploadOnDrop, removeImage } = require('../controller/gallery')

router.get('/getAllYear', getAllYear)
router.get('/getLatestGallery', getLatestGallery)
router.post('/getGallery', getGallery)
router.post('/uploadOnDrop', uploadOnDrop)
router.post('/removeImage', removeImage)

module.exports = router