const express       = require('express')
const router        = express.Router()

const { getBatchGallery, getHomeContent, getAllEvent, getAcademicYear, getAlumniProfile, getDownloads, getEvent, getNews, getOrderData, preOrder, cancelOrder, searchQuery, getQuery, changeAlumniPassword, getCommence, getGraduates, changeEmail, newMessage } = require('../controller/home')

router.get('/batch_year', getAcademicYear)
router.post('/graduates', getGraduates)
router.post('/getAllEvent', getAllEvent)
router.post('/searchQuery', searchQuery)
router.post('/getQuery', getQuery)
router.post('/', getHomeContent)
router.post('/commence', getCommence)
router.post('/alumni', getAlumniProfile)
router.post('/downloads', getDownloads)
router.post('/event', getEvent)
router.post('/news', getNews)
router.post('/order', getOrderData)
router.post('/pre_order', preOrder)
router.post('/cancel_order', cancelOrder)
router.post('/changeAlumniPassword', changeAlumniPassword)
router.post('/changeEmail', changeEmail)
router.post('/getBatchGallery', getBatchGallery)
router.post('/newMessage', newMessage)

module.exports = router