const express       = require('express')
const router        = express.Router()

const { addHonorTitle, editHonorTitle, deleteHonorTitle, getHAYear, getHA, uploadHA, updateHA, deleteHA } = require('../controller/honor-and-awards')

router.get('/', getHAYear)
router.post('/getHA', getHA)
router.post('/addHonorTitle', addHonorTitle)
router.post('/editHonorTitle', editHonorTitle)
router.post('/deleteHonorTitle', deleteHonorTitle)
router.post('/uploadHA', uploadHA)
router.patch('/updateHA', updateHA)
router.post('/deleteHA', deleteHA)

module.exports = router