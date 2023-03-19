const express       = require('express')
const router        = express.Router()

const { getAllMessage, updateAllMessage, replyMessage, removeMessage } = require('../controller/inbox')

router.get('/getAllMessage', getAllMessage)
router.post('/updateAllMessage', updateAllMessage)
router.post('/replyMessage', replyMessage)
router.post('/removeMessage', removeMessage)

module.exports = router