const express       = require('express')
const router        = express.Router()

const { getAcademicYear, getEvents, uploadEvents, updateEvents, deleteEvents, getNews, uploadNews, updateNews, deleteNews } = require('../controller/events')

router.get('/', getAcademicYear)
router.get('/getEvents', getEvents)
router.post('/uploadEvents', uploadEvents)
router.post('/editEvents', updateEvents)
router.post('/deleteEvents', deleteEvents)

router.get('/getNews', getNews)
router.post('/uploadNews', uploadNews)
router.post('/editNews', updateNews)
router.post('/deleteNews', deleteNews)

module.exports = router