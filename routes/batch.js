const express       = require('express')
const router        = express.Router()

const { addAcademicYear, editAcademicYear, getCurrentYear, verifyYear, getBatchYear, deleteAcademicYear, getCategoryType, removeDesign } = require('../controller/batch')

router.get('/current_year', getCurrentYear)
router.get('/getBatchYear', getBatchYear)
router.post('/removeDesign', removeDesign)
router.post('/category', getCategoryType)
router.post('/check_year', verifyYear)
router.post('/addBatch', addAcademicYear)
router.patch('/editBatch/:id', editAcademicYear)
router.delete('/deleteBatch/:id', deleteAcademicYear)
module.exports = router
