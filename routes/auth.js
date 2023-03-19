const express       = require('express')
const router        = express.Router()

const { SignIn, ResetPassword, checkResetConfirmation, newPassword } = require('../controller/auth')

router.post('/signin', SignIn)
router.post('/ResetPassword', ResetPassword)
router.post('/checkResetConfirmation', checkResetConfirmation)
router.post('/newPassword', newPassword)

module.exports = router