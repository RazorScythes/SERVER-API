const express       = require('express')
const router        = express.Router()

const { getBanner, addBanner } = require('../controller/banner')

router.get('/', getBanner)
router.post('/addBanner', addBanner)

module.exports = router