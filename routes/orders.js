const express       = require('express')
const router        = express.Router()

const { getOrders, setStatusReleasing, setStatusOK } = require('../controller/orders')

router.get('/getOrders', getOrders)
router.post('/setStatusReleasing', setStatusReleasing)
router.post('/setStatusOK', setStatusOK)



module.exports = router