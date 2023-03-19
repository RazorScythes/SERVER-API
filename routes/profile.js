const express       = require('express')
const router        = express.Router()

const { changePassword, updateName } = require('../controller/profile')

router.post('/changePassword', changePassword)
router.post('/updateName', updateName)

module.exports = router