const express       = require('express')
const router        = express.Router()

const { getPDFYearbook, getAcademicYear, generateBatchYearbook, generateBYearbook, generateSYearbook, disableLink, enableLink, viewYearbook, setActive, setInactive  } = require('../controller/pdf-control')

router.get('/', getAcademicYear)
router.post('/files', getPDFYearbook)
router.post('/generateBatchYearbook', generateBYearbook)
router.post('/enableLink', enableLink)
router.post('/disableLink', disableLink)
router.post('/setActive', setActive)
router.post('/setInactive', setInactive)
router.post('/generateSectionYearbook', generateSYearbook)
router.get('/make-batch-template', generateBatchYearbook)

router.get('/view/:academic_year', viewYearbook)

module.exports = router