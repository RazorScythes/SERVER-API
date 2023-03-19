const express       = require('express')
const router        = express.Router()

const { addAdministration, editAdministration, deleteAdministration, getAcademicYear, getAdministrators, uploadAdministrators, updateAdministrators, deleteAdministrators, getLatestContent, getAdminContent } = require('../controller/administrators')

router.get('/', getAcademicYear)
router.post('/editAdministration', editAdministration)
router.post('/addAdministration', addAdministration)
router.post('/deleteAdministration', deleteAdministration)
router.post('/getLatestContent', getLatestContent)
router.post('/getAdminContent', getAdminContent)

router.post('/getAdministrators', getAdministrators)
router.post('/uploadAdministrators', uploadAdministrators)
router.patch('/updateAdministrators', updateAdministrators)
router.post('/deleteAdministrators', deleteAdministrators)

module.exports = router