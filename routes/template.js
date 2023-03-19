const express       = require('express')
const router        = express.Router()
const multer        = require('multer')

const { addTemplate, getTemplate } = require('../controller/template')

const images = multer({});

router.get('/', getTemplate)
router.post('/addTemplate', images.array("images"), addTemplate)

module.exports = router