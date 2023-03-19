const express       = require('express')
const router        = express.Router()

const { getPosition, addPosition, editPosition, deletePosition, getAcademicYear, uploadMessage, getCommenceData, updateMessage, deleteMessage } = require('../controller/commence')

router.get('/', getAcademicYear)
router.get('/getCommenceData', getCommenceData)
router.post('/uploadMessage', uploadMessage)
router.post('/editMessage', updateMessage)
router.post('/deleteMessage', deleteMessage)

router.get('/getPosition', getPosition)
router.post('/addPosition', addPosition)
router.post('/editPosition', editPosition)
router.post('/deletePosition', deletePosition)
module.exports = router