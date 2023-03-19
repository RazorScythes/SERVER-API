const express       = require('express')
const router        = express.Router()

const { getTotalGraduate, getNotification, updateNotification, getStudentQuery, getOverviewData, postAlumni, csvAlumni } = require('../controller/alumni')

router.get('/', getOverviewData)
router.get('/notification', getNotification)
router.post('/updateNotification', updateNotification)
router.post('/search', getStudentQuery)
router.post('/add_alumni', postAlumni)
router.post('/csv_alumni', csvAlumni)

const Alumni        = require('../models/alumni.model')
const Academic_Year = require('../models/academic_year.model')

const Section       = require('../models/section.model')

router.post('/testpost', async (req, res) => {
    console.log(req.body)
    const data = req.body;
    const newAlumni = new Section(data)

    try {
        await newAlumni.save();

        res.status(201).json(newAlumni);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
})

module.exports = router