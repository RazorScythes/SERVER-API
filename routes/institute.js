const express       = require('express')
const router        = express.Router()
const multer        = require('multer')
const path          = require('path')

const upload        = multer.diskStorage({ 
        destination: (req, file, cb) => {
            cb(null, 'tmp/csv')
        },
        filename: (req, file, cb) => {
            cb(null, file.originalname)
        }
    })

const file = multer({storage: upload})

// const alumniUpload        = multer.diskStorage({ 
//     destination: (req, file, cb) => {
//         cb(null, 'tmp/images')
//     },
//     filename: (req, file, cb) => {
//         cb(null, file.originalname)
//     }
// })

// const images = multer({storage: alumniUpload})

const { uploadInstitute, getSearchAlumni, editInstitute, deleteInstitute, getInstitute, getInstituteCounts, getSectionCounts, getAlumniList, getSearchQuery, checkSectionExists, createSection, uploadFile, deleteSection, checkStudentExists, uploadAlumni, getAlumniData, updateAlumni, deleteAlumni, bulkImage, uploadFileOnSection } = require('../controller/institute')

const images = multer({});
router.post('/uploadInstitute', uploadInstitute)
router.post('/editInstitute', editInstitute)
router.post('/deleteInstitute', deleteInstitute)
router.get('/getInstitute', getInstitute)
router.post('/editAlumni', getSearchAlumni)

router.post('/getInstituteCounts', getInstituteCounts)
router.post('/getSectionCounts', getSectionCounts)
router.post('/getAlumniList', getAlumniList)
router.post('/getSearchQuery', getSearchQuery)
router.post('/checkSectionExists', checkSectionExists)
router.post('/createSection', createSection)
router.post('/uploadFile', file.single("file"), uploadFile)
router.post('/deleteSection', deleteSection)
router.post('/checkStudentExists', checkStudentExists)
router.post('/uploadAlumni', images.fields([{ name: 'main', maxCount: 1 }, { name: 'subs', maxCount: 3 }]), uploadAlumni)
router.patch('/updateAlumni', images.fields([{ name: 'main', maxCount: 1 }, { name: 'subs', maxCount: 3 }]), updateAlumni)
router.post('/deleteAlumni', deleteAlumni)

router.post('/bulkImage', images.array("images"), bulkImage)
router.post('/uploadFileOnSection', file.single("file"), uploadFileOnSection)

module.exports = router