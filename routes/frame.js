const express       = require('express')
const router        = express.Router()

const { getFrame, addFrame } = require('../controller/frame')

router.get('/', getFrame)
router.post('/addFrame', addFrame)

module.exports = router