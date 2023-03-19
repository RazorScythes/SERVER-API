const express       = require('express')
const router        = express.Router()

const { getAccountRole, getAccounts, uploadAccount, updateAccount, deleteAccount, confirmDeletion, sendGmail } = require('../controller/accounts')

router.get('/', getAccountRole)
router.post('/getAccounts', getAccounts)
router.post('/uploadAccount', uploadAccount)
router.patch('/updateAccount', updateAccount)
router.post('/deleteAccount', deleteAccount)

router.post('/confirmDeletion', confirmDeletion)
router.post('/sendGmail', sendGmail)

module.exports = router