const Alumni        = require('../models/alumni.model')
const Academic_Year = require('../models/academic_year.model')
const PDF_YEARBOOK  = require('../models/pdf.model')
const User          = require('../models/user.model')
const Section       = require('../models/section.model')
const Institute     = require('../models/institute.model')
const XLSX          = require('xlsx');
const path          = require('path');
const csv           = require("csvtojson");
const bcrypt        = require("bcryptjs")
const fs            = require("fs");
const uuid          = require('uuid');
const nodemailer    = require('nodemailer');
const sharp         = require('sharp')
const ba64          = require("ba64")
require('dotenv').config()

function filename(base64String){
    return (uuid.v4() + path.extname(getExtensionName(base64String)))
}

function getExtensionName(base64String){
    return base64String.substring("data:image/".length, base64String.indexOf(";base64"))
}

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.NODEMAILER_USER,
    pass: process.env.NODEMAILER_PASS
  }
});

exports.getInstitute = async (req, res) => {
    Institute.find({})
        .then(inst => {
            if(inst.length > 0) {
                inst.sort(function(a, b) {
                    return b.priority_value - a.priority_value;
                });
                res.status(201).json(inst);
            }
            else res.status(404).json({message: "not found"})
        })
        .catch(err => res.status(409).json(`Error: ${err}`))
}

exports.uploadInstitute = async (req, res) => {
    let logo = filename(req.body.logo)
    ba64.writeImageSync(`${process.env.INSTITUTE_LOGO_FOLDER}/${logo}`, req.body.logo, function(err){
        if (err) throw err;     
        console.log(`${logo} saved successfully`);
    });

    req.body.logo = `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.INSTITUTE_LOGO_NAME}/${logo}.${getExtensionName(req.body.logo)}`

    if(req.body.background){
        let background = filename(req.body.background)
        ba64.writeImageSync(`${process.env.INSTITUTE_BACKGROUND_FOLDER}/${background}`, req.body.background, function(err){
            if (err) throw err;     
            console.log(`${background} saved successfully`);
        });
        req.body.background = `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.INSTITUTE_BACKGROUND_NAME}/${background}.${getExtensionName(req.body.background)}`
    }

    const newInstitute = new Institute(req.body)

    try {
        await newInstitute.save();

        res.status(201).json({
            newEntry: newInstitute,
            message: `new Institute "${newInstitute.institute}" successfully created`,
            variant: 'success'
        });
    } catch (error) {
        console.log(error)
        res.status(409).json({ message: error.message });
    }
}

exports.editInstitute = async (req, res) => {
    let institute = await Institute.findById(req.body.id)
    if(!req.body.logo) req.body.logo = institute.logo
    else{
        if(institute.logo){
            fs.unlink(path.join(`${process.env.INSTITUTE_LOGO_FOLDER}/${institute.logo.split('/').pop()}`), (err) => {
                if (err) {
                    console.error(err)
                    return
                }
                console.log("removed: "+institute.logo)
            })
        }

        let logo = filename(req.body.logo)
        ba64.writeImageSync(`${process.env.INSTITUTE_LOGO_FOLDER}/${logo}`, req.body.logo, function(err){
            if (err) throw err;     
            console.log(`${logo} saved successfully`);
        });

        req.body.logo = `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.INSTITUTE_LOGO_NAME}/${logo}.${getExtensionName(req.body.logo)}`
    }
    if(!req.body.background) req.body.background = institute.background
    else {
        if(institute.background){
            fs.unlink(path.join(`${process.env.INSTITUTE_BACKGROUND_FOLDER}/${institute.background.split('/').pop()}`), (err) => {
                if (err) {
                    console.error(err)
                    return
                }
                console.log("removed: "+institute.background)
            })
        }

        let background = filename(req.body.background)
        
        ba64.writeImageSync(`${process.env.INSTITUTE_BACKGROUND_FOLDER}/${background}`, req.body.background, function(err){
            if (err) throw err;     
            console.log(`${background} saved successfully`);
        });
        req.body.background = `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.INSTITUTE_BACKGROUND_NAME}/${background}.${getExtensionName(req.body.background)}`
    }

    await Institute.findByIdAndUpdate(institute._id, req.body, {new: true})
    .then(() => {
        Institute.find({})
        .then((inst) => {
            inst.sort(function(a, b) {
                return b.priority_value - a.priority_value;
            });
            
            res.status(201).json({
                entry: inst,
                message: `Institute "${req.body.institute}" successfully edited`,
                variant: 'success'
            })
        })
        .catch(err => res.status(409).json(`Error: ${err}`))
    })
    .catch(err => res.status(409).json({message: e}))
}

exports.deleteInstitute = async (req, res) => {
    let institute = await Institute.findById(req.body.id)

    if(institute.logo){
        fs.unlink(path.join(`${process.env.INSTITUTE_LOGO_FOLDER}/${institute.logo.split('/').pop()}`), (err) => {
            if (err) {
                console.error(err)
                return
            }
            console.log("removed: "+institute.logo)
        })
    }

    if(institute.background){
        fs.unlink(path.join(`${process.env.INSTITUTE_BACKGROUND_FOLDER}/${institute.background.split('/').pop()}`), (err) => {
            if (err) {
                console.error(err)
                return
            }
            console.log("removed: "+institute.background)
        })
    }

    Institute.findByIdAndDelete(req.body.id)
    .then(() => {
        Institute.find({})
        .then((inst) => {
            
            inst.sort(function(a, b) {
                return b.priority_value - a.priority_value;
            });
            
            res.status(201).json({
                entry: inst,
                message: `Institute "${institute.institute}" deleted`,
                variant: 'danger'
            })
        })
        .catch(err => res.status(409).json(`Error: ${err}`))
    })
}

exports.getInstituteCounts = async(req, res) => {
    let institute = await Institute.findOne({institute_acronym: req.body.institute})
    let x = await Institute.find({})

    if(!institute) {
        res.status(404).json({message: "not found"})
        return
    }

    try {
        Promise.all([
            Academic_Year.find().sort([['academic_year', 'descending']]),
          ])
          .then(year => {
            const data = []
            const [academic_year] = year
            academic_year.forEach(async (x) => {
                data.push(filterDocument(x, institute.institute_acronym));
            })

            Promise.all(data)

            .then((results) => {
                res.status(201).json({
                    display_name: institute.institute,
                    data: results
                });
            })
            .catch((e) => {
                res.status(409).json({ message: e.message });
            });
          })
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
}

function filterDocument(value, inst) {
    return new Promise(async (resolve) => {
        let section = await Section.countDocuments({academic_year: value._id, institute: inst})
        let student_count = 0
        let k = await Alumni.find({})
            .populate({path: 'section_id'})
            .exec()
   
        k.forEach((item) => {
            if(item.section_id != undefined)
                    if(item.section_id.institute.includes(inst) && item.batch_id.equals(value._id))
                        student_count++
        })

        const jsonData = {
            _id: value._id,
            academic_year: value.academic_year,
            sections: section,
            alumni: student_count,
        }
        resolve(jsonData)
    });
}

exports.getSectionCounts = async(req, res) => {
    const {academic_year: academic_year} = req.body
    let institute = await Institute.findOne({institute_acronym: req.body.institute})

    try {
        let acad = await Academic_Year.findOne({academic_year: academic_year})
        Promise.all([
                Section.find({academic_year: acad._id, institute: institute.institute_acronym}).sort([['program', 'descending']]),
          ])
          .then(section => {
                const data = []
                const [sections] = section
                sections.forEach(async (x) => {
                    data.push(filterSDocument(x));
                })

                Promise.all(data)
                .then((results) => {
                    res.status(201).json({
                        display_name: institute.institute,
                        program: institute.program,
                        section: results
                    });
                })
                .catch((e) => {
                    res.status(409).json({ message: e.message });
                });
          })
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
}

function filterSDocument(value) {
    return new Promise(async (resolve) => {
        let student_count = await Alumni.countDocuments({section_id: value._id, batch_id: value.academic_year})
        const jsonData = {
            _id: value._id,
            section: value.section ? value.section : `ALL-${value.program_acronym}`,
            academic_year: value.academic_year,
            alumni: student_count,
            program: value.program_acronym
        }
        resolve(jsonData)
    });
}

exports.getAlumniList = async(req, res) => {
    let splitSections = req.body.section.split(" ");

    if(splitSections[1].toLowerCase().includes("all-")) splitSections[1] = ""

    const {academic_year , institute} = req.body

    try {
        let a = await Academic_Year.findOne({academic_year: academic_year})
        let s = await Section.findOne({academic_year: a._id, section: splitSections[1], program_acronym: splitSections[0], institute: institute})
        let inst = await Institute.findOne({institute_acronym: institute})

        Promise.all([
            Alumni.find({section_id: s._id}).sort([['full_name.first_name', 'ascending']])
        ])
        .then(alumni => {
            const data = []
            const [list] = alumni
            list.forEach(async (x) => {
                data.push(flattenDocument(x));
            })

            Promise.all(data)
            .then((results) => {
                res.status(201).json({
                    display_name: inst.institute,
                    alumni: results
                });
            })
            .catch((e) => {
                console.log(e)
                res.status(409).json({ message: e.message });
            });
        })
    } catch (error) {
        console.log(error)
        res.status(409).json({ message: error.message });
    }
}

function search(nameKey, prop, prop2 = '', arr){
    if(!nameKey) return []
    return arr.filter(keyword => keyword[prop].toLowerCase().includes(nameKey.toLowerCase()) || keyword[prop2].toLowerCase().includes(nameKey))
}

exports.getSearchQuery = async(req, res) => {
    var alumni = await Alumni.find({}).sort([['full_name.first_name', 'ascending']])
                                .populate('section_id')
                                .populate('batch_id')
    const data = []

    alumni.forEach(async (x) => { data.push(flattenDocument(x)); })
    Promise.all(data)
    .then((results) => {
        results = search(req.body.search, 'full_name', 'student_number', results)
        res.status(201).json(results);
    })
    .catch((e) => {
        console.log(e)
        res.status(409).json({ message: e.message });
    });
}

exports.getSearchAlumni = async (req, res) => {
    var search_key = req.body.student_number.split("_");
    let alumni;
    if(search_key.length > 1)
        alumni = await Alumni.find({"full_name.first_name": search_key[0], "full_name.last_name": search_key[1]}).populate('section_id').populate('batch_id')
    else
        alumni = await Alumni.find({student_number: req.body.student_number}).populate('section_id').populate('batch_id')

    const data = []

    alumni.forEach(async (x) => { data.push(flattenDocument(x)); })
    Promise.all(data)
    .then((results) => {
        if(results.length > 0) res.status(201).json(results);
        else res.status(404).json()
    })
    .catch((e) => {
        console.log(e)
        res.status(409).json({ message: e.message });
    });
}

function flattenDocument(value) {
    return new Promise(async (resolve) => {
        let image_count = 0
        let main = 0
        let sub = 0
        if(value.main != '' && (value.main != undefined || value.main != null))
            main = 1
        if(value.img1 != '' && (value.img1 != undefined || value.img1 != null))
            sub = 1
        if(value.img2 != '' && (value.img2 != undefined || value.img2 != null))
            image_count++
        if(value.img3 != '' &&(value.img3 != undefined || value.img3 != null))
            image_count++

        const jsonData = {
            _id: value._id,
            full_name: `${value.full_name.first_name} ${value.full_name.last_name}`,
            student_number: value.student_number ? value.student_number : "n/a",
            images: image_count,
            main: main,
            sub: sub,
            info: value
        }
        resolve(jsonData)
    });
}


exports.checkSectionExists = async(req, res) => {
    if(req.body.program.length == 0) {
        res.status(400).json(`Error: Null value`)
        return
    }

    let program = req.body.program.split(" - ")
    let academic_year = await Academic_Year.findOne({academic_year: req.body.academic_year})
    Section.findOne({academic_year: academic_year._id, program_acronym: program[1], section: req.body.section, institute: req.body.institute})
        .then(result => res.json(result))
        .catch(err => res.status(400).json(`Error: ${err}`))
}

exports.createSection = async(req, res) => {
    let program = req.body.program.split(" - ")
    let institute = await Institute.findOne({institute_acronym: req.body.institute})
    let academic_year = await Academic_Year.findOne({academic_year: req.body.academic_year})
    
    const newSection = new Section({
            section: req.body.section,
            institute: institute.institute_acronym,
            institute_name: institute.institute,
            program: program[0],
            program_acronym: program[1],
            academic_year: academic_year._id
        }
    )
    try {
        await newSection.save().then(async (result) => {
            let updatePDF = await PDF_YEARBOOK.findOne({academic_year: academic_year._id})
            updatePDF.missing = updatePDF.missing.filter(e => e !== 'Section');
            await PDF_YEARBOOK.findByIdAndUpdate(updatePDF._id, {missing: updatePDF.missing}, {new: true})

            const newPDF = new PDF_YEARBOOK({
                file_name: `Yearbook ${req.body.academic_year} ${result.program_acronym} ${result.section}`,
                target: `${result.section}`,
                path: `${process.env.PDF_FILE}/Yearbook ${req.body.academic_year} ${result.program_acronym} ${result.section}`,
                status: "not created",
                missing: ['Alumni Data'],
                section_id: result._id,
                academic_year: academic_year._id
            })
            await newPDF.save()
        })
        let newEntry = await filterSDocument(newSection)

        res.status(201).json(newEntry);
    } catch (error) {
        console.log(error)
        res.status(409).json({ message: error.message });
    }
}

exports.uploadFile = async(req, res) => {
    let data = []
    /*
        file validitation
        accept: csv / xlsx
    */
    if(getExtension(req.file.originalname) == 'csv')
        data.push(readCSV(req.file.path))
    else if(getExtension(req.file.originalname) == 'xlsx')
        data.push(readXLSX(req.file.path))
    else{
        return res.status(401).json({
            message: `Error: File is not a csv/xlxs format!`, 
            variant: 'danger', 
            heading: 'File Type Error'
        });
    }

    Promise.all(data)
    .then(async (results) => {  
        const obj = Object.keys(results[0][0]).map(v => v.toLowerCase());
        /*
            check if object has a valid properties 
        */
        if(!obj.includes('student_number') && !obj.includes('first_name') && !obj.includes('last_name'))
            return res.status(401).json({
                message: `Error: File was not a valid format given. Please use the proper format`, 
                variant: 'danger', 
                heading: 'File Error'
            });
        let currentAcademic = await Academic_Year.findOne({academic_year: req.body.academic_year})
        let program = req.body.program.split(" - ")
        let institute = await Institute.findOne({institute_acronym: req.body.institute})
        const newSection = new Section({
                section: req.body.section,
                institute: institute.institute_acronym,
                institute_name: institute.institute,
                program: program[0],
                program_acronym: program[1],
                academic_year: currentAcademic,
            }
        )
        try {
            /*
                Creating Section 
                Bulk insert Student List
            */
            await newSection.save().then(async (result) => {
                const newPDF = new PDF_YEARBOOK({
                    file_name: `Yearbook ${req.body.academic_year} ${result.program_acronym} ${result.section}`,
                    target: `${result.section}`,
                    path: `${process.env.PDF_FILE}/Yearbook ${req.body.academic_year} ${result.program_acronym} ${result.section}`,
                    status: "not created",
                    missing: ['Alumni Data'],
                    section_id: result._id,
                    academic_year: currentAcademic._id
                })
                await newPDF.save()
            })

            let schema = []
            results[0].forEach((x) => {
                if(x.Student_Number == '' && x.First_Name == '' && x.Last_Name == '')   
                    return

                let jsonData = {
                    student_number: x.Student_Number,
                    full_name: {
                        first_name: x.First_Name ? x.First_Name : '',
                        middle_name: x.Middle_Name ? x.Middle_Name : '',
                        last_name: x.Last_Name ? x.Last_Name : ''
                    },
                    quotes: x.Quotes,
                    address: x.Address,
                    contact: x.Contact,
                    email: x.Email,
                    section_id: newSection._id,
                    batch_id: currentAcademic._id,
                    main: '',
                    img1: '',
                    img2: '',
                    img3: ''
                }
                schema.push(jsonData)
            })

            var unique_id = removeDuplicates(schema, "student_number");
            var alumni_list = await Alumni.find({})
            var new_arr = []
            var existing_alumni_count = 0


            
            unique_id.forEach((item, i) => {
                var output = alumni_list.filter(function(value){ 
                    if(value.student_number)
                        return item.student_number === value.student_number
                    else 
                        return `${item.full_name.first_name} ${item.full_name.last_name}` === `${value.full_name.first_name} ${value.full_name.last_name}`
                })
                if(output.length == 0) new_arr.push(item)
                else existing_alumni_count ++
            })


            if (new_arr.length == 0){
                await Section.findByIdAndDelete(newSection._id)
                res.status(404).json({
                    message: `All data inserted on file are already existed! `, 
                    variant: 'warning', 
                    heading: 'Failed to Upload'
                });
                return
            }
            
            await Alumni.insertMany(new_arr)
            .then(async (result) => {
                let updatePDF = await PDF_YEARBOOK.findOne({section_id: newSection._id})
                updatePDF.missing = updatePDF.missing.filter(e => e !== 'Alumni Data');
                await PDF_YEARBOOK.findByIdAndUpdate(updatePDF._id, {missing: updatePDF.missing}, {new: true})

                let updatedBatchPDF = await PDF_YEARBOOK.findOne({academic_year: currentAcademic._id})
                updatedBatchPDF.missing = updatedBatchPDF.missing.filter(e => e !== 'Section');
                updatedBatchPDF.missing = updatedBatchPDF.missing.filter(e => e !== 'Alumni Data');
                await PDF_YEARBOOK.findByIdAndUpdate(updatedBatchPDF._id, {missing: updatedBatchPDF.missing}, {new: true})

                let userData = []
                result.forEach(async (x) => {
                    userData.push(createStudentAccount(x, userData))
                })
                /*
                    Bulk insert Student Account
                */
                Promise.all(userData)
                .then(async (results) => {
                    /*
                        responds to the client
                    */
                    var unique_username = removeDuplicates(results, "username");
                    sendEmail(unique_username)

                    await User.insertMany(unique_username)
                    .then(async (result) => {    
                        let outputCount = await filterSDocument(newSection)
                        res.status(201).json({
                            entry: outputCount, 
                            message: `Section ${newSection.section} created with bulk insert of total ${outputCount.alumni} Alumni`, 
                            variant: 'success', 
                            heading: 'Created Successfully',
                            duplicate: existing_alumni_count
                        });
                    })
                    .catch(function(err) {
                        console.log(err)
                        res.status(400).json(`Error: ${err}`)
                    });
                })
                .catch((e) => {
                    console.log(e)
                    res.status(409).json({ 
                        heading: 'Failed to Upload',
                        message: e.message,
                        variant: 'danger' 
                    });
                });
            })
            .catch(function(err) {
                console.log(err)
                res.status(400).json(`Error: ${err}`)
            });
        } catch (error) {
            console.log(error)
            res.status(409).json({ 
                heading: 'Failed to Upload',
                message: error.message,
                variant: 'danger' 
            });
        }
    })
    .catch((e) => {
        console.log(e)
        res.status(409).json({ 
            heading: 'Failed to Upload',
            message: e.message,
            variant: 'danger' 
        });
    });
}

function getExtension(filename) {
    return filename.split('.').pop();
}

function readXLSX(file) {
    return new Promise(async (resolve) => {
        var workbook = await XLSX.readFile(path.join(file));
        var sheet_name_list = workbook.SheetNames;
        sheet_name_list.forEach(function(y) {
            var worksheet = workbook.Sheets[y];
            var headers = {};
            var data = [];
            for(z in worksheet) {
                if(z[0] === '!') continue;
                //parse out the column, row, and value
                var col = z.substring(0,1);
                var row = parseInt(z.substring(1));
                var value = worksheet[z].v;
                
                let convertion = ExcelDateToJSDate(value, 5)

                if(isDate(convertion))
                    value = convertion

                //store header names
                if(row == 1) {
                    headers[col] = modifyHeader(value);
                    continue;
                }

                if(!data[row]) data[row]={};

                if(headers[col] === "First_Name" || headers[col] === "Middle_Name" || headers[col] === "Last_Name")
                    data[row][headers[col]] = capitalizeLetter(value.toLowerCase());
                else
                    data[row][headers[col]] = value;
            }
            //drop those first two rows which are empty
            data.shift();
            data.shift();
   
            resolve(data)
        });
    });
}

function capitalizeFirstLetter(string) {
    return string[0].toUpperCase() + string.slice(1);
}

function capitalizeLetter(string) {
    var arr = string.split(" ")
    var name = ""
    if(arr.length > 1) {
        arr.forEach((item) => {
            if(!item) return
            name += `${capitalizeFirstLetter(item)} `
        })
    }
    else name = capitalizeFirstLetter(string)

    if(name.charAt(name.length-1) == " ") name = name.slice(0, -1)

    return name
}

function modifyHeader(header){
    var arr = header.toLowerCase().split(/[ _]/)
    var newHeader = "";

    arr.forEach((item) => {
        if(!item) {
            return
        }
        newHeader += `${capitalizeFirstLetter(item)}_`
    })
    
    if(newHeader.charAt(newHeader.length-1) == "_") newHeader = newHeader.slice(0, -1)
    return newHeader;
}

function readCSV(file) {
    return new Promise(async (resolve) => {
        csv()
        .fromFile(path.join(file))
        .then((jsonObj)=>{
            resolve(jsonObj)
        })    
    });
}

function createStudentAccount(value){
    return new Promise(async (resolve) => {
        //console.log(value.student_number, value.student_number.split("-").pop())
        //console.log(`${value.full_name.first_name && value.full_name.first_name.charAt(0)+`.`}${value.full_name.last_name && value.full_name.last_name}${value.student_number ? value.student_number.split("-").pop() : "0000"}`.toLowerCase().replace(/\s+/g, ''))
        let user = `${value.full_name.first_name && value.full_name.first_name.charAt(0)+`.`}${value.full_name.last_name && value.full_name.last_name}${value.student_number ? value.student_number.split("-").pop() : "0000"}`.toLowerCase().replace(/\s+/g, '')

        let hashedPassword = await bcrypt.hash(user, 12);
        let jsonData = {
            alumni_id: value._id,
            name: `${value.full_name.first_name} ${value.full_name.last_name}`,
            username: user,
            email: value.email,
            password: hashedPassword,
            role: 'Student'
        }
        resolve(jsonData)  
    });
}

function removeDuplicates(array, prop) {
    let uniq = {};
    var blank_props = []
    var new_arr = []
    array.forEach((obj) => {
        if(obj[prop] == undefined || obj[prop] == "") blank_props.push(obj)
    })

    var filter = array.filter(obj => (obj[prop] && !uniq[obj[prop]]) && (uniq[obj[prop]] = true))

    if(blank_props.length > 0) new_arr = filter.concat(blank_props)
    else new_arr = filter

    return new_arr

    // var newArray = [];
    // var lookupObject  = {};

    // for(var i in originalArray) {
    //     if(originalArray[i][prop] != undefined && !originalArray[i][prop])
    //         lookupObject[originalArray[i][prop]] = originalArray[i];
    // }

    // for(i in lookupObject) {
    //     newArray.push(lookupObject[i]);
    // }
    // return newArray;
}

function removeDuplicateFilename(originalArray, prop, array2, prop2, size, multiple = false, array3 = [], prop3 = []) {
    var newArray = [];
    var filtered_array = []
    var lookupObject  = {};
    for(var i in originalArray) {
       lookupObject[originalArray[i][prop]] = originalArray[i];
    }

    for(i in lookupObject) {
        newArray.push(lookupObject[i]);
    }
    // console.log(newArray.length)
    // newArray.forEach(i => {
    //     console.log(i.originalname)
    // })
    // return
     
    if(multiple)
        array2.forEach((x) => {
            let rawData = []
            array3.forEach((z) => {
                let y = newArray.filter(function(elem){ return elem[prop].includes(x[prop2]) && elem[prop].includes(z[prop3])})
                rawData.push(...y.slice(0, 1))
            })
            filtered_array.push(rawData.slice(0, size))
        })       
    else
        array2.forEach(item => {
            newArray.some(x => {
                let match_str = x[prop].replace(",", " ")
                if(item[prop2] !== '' && x[prop].includes(item[prop2])){
                        filtered_array.push(x)
                        return true
                    }
                else if(match_str.toLowerCase().includes(item.full_name.last_name.toLowerCase()) && match_str.toLowerCase().includes(item.full_name.first_name.toLowerCase())){
                        filtered_array.push(x)
                        return true
                    }
            })
        })
        // array2.forEach((x, i) => {
        //     let y = newArray.filter(function(elem){ 
                
        //         let match_str = elem[prop].replace(".", " ").replace(",", " ")
        //         //console.log(match_str.toLowerCase().includes(x.full_name.last_name.toLowerCase()) && match_str.toLowerCase().includes(x.full_name.first_name.toLowerCase()))
        //         if(elem[prop].includes(x[prop2]))
        //             return elem[prop].includes(x[prop2])
        //         else
        //             return match_str.toLowerCase().includes(x.full_name.last_name.toLowerCase()) && match_str.toLowerCase().includes(x.full_name.first_name.toLowerCase())
        //     })
        //     console.log(y)
        //     filtered_array.push(...y.slice(0, size))
        // })
        
    return filtered_array;
}

// function removeDuplicateFilename2(originalArray, prop, array2, prop2, array3, prop3, size, multiple = false) {
//     var newArray = [];
//     var filtered_array = []
//     var lookupObject  = {};

//     for(var i in originalArray) {
//        lookupObject[originalArray[i][prop]] = originalArray[i];
//     }

//     for(i in lookupObject) {
//         newArray.push(lookupObject[i]);
//     }
    
//     if(filter)
//         array2.forEach((x) => {
//             let rawData = []
//             array3.forEach((z) => {
//                 let y = newArray.filter(function(elem){ return elem[prop].includes(x[prop2]) && elem[prop].includes(z[prop3])})
//                 rawData.push(...y.slice(0, 1))
//             })
//             filtered_array.push(rawData.slice(0, size))
//         })
//     else
//         filtered_array.push(newArray)

//     return filtered_array;
// }

function countDuplicates(originalArray, prop) {
    var newArray = [];
    var lookupObject  = {};

    for(var i in originalArray) {
       lookupObject[originalArray[i][prop]] = originalArray[i];
    }

    for(i in lookupObject) {
        newArray.push(lookupObject[i]);
    }
    return originalArray.length - newArray.length;
}

exports.deleteSection = async (req, res) => {
    const {id: _id} = req.body
    const {academic_year: academic_year} = req.body
    const {institute: institute} = req.body

    try {
        let alumniData = await Alumni.find({section_id: req.body.id})
        let pdf = await PDF_YEARBOOK.findOne({section_id: _id})

        if(pdf.uri){
            fs.unlink(path.join(`${pdf.path}.pdf`), (err) => {
                if (err) {
                    console.error(err)
                    return
                }
                console.log("removed: "+pdf.path.split('/').pop())
            })
        }

        alumniData.forEach(async x => {
            await User.deleteOne({alumni_id: x._id});
            if(x.main != '' && (x.main != undefined || x.main != null)){
                fs.unlink(path.join(process.env.MAIN_IMAGE_FOLDER+x.main.split('/').pop()), (err) => {
                    if (err) {
                        console.error(err)
                        return
                    }
                    console.log("removed: "+x.main)
                })
            }
            if(x.img1 != '' && (x.img1 != undefined || x.img1 != null)){
                fs.unlink(path.join(process.env.SUB_IMAGE_FOLDER+x.img1.split('/').pop()), (err) => {
                    if (err) {
                        console.error(err)
                        return
                    }
                    console.log("removed: "+x.img1)
                })
            }
            if(x.img2 != '' && (x.img2 != undefined || x.img2 != null)){
                fs.unlink(path.join(process.env.SUB_IMAGE_FOLDER+x.img2.split('/').pop()), (err) => {
                    if (err) {
                        console.error(err)
                        return
                    }
                    console.log("removed: "+x.img2)
                })
            }
            if(x.img3 != '' &&(x.img3 != undefined || x.img3 != null)){
                fs.unlink(path.join(process.env.SUB_IMAGE_FOLDER+x.img3.split('/').pop()), (err) => {
                    if (err) {
                        console.error(err)
                        return
                    }
                    console.log("removed: "+x.img3)
                })
            }
        })

        await Alumni.deleteMany({ section_id: req.body.id })
        await PDF_YEARBOOK.deleteOne({ section_id: _id })
        await Section.findByIdAndRemove(_id);

        let acad = await Academic_Year.findOne({academic_year: academic_year})
        
        Promise.all([
                Section.find({academic_year: acad._id, institute: institute}).sort([['section', 'descending']])
          ])
          .then(async(section) => {
                const data = []
                const [sections] = section

                sections.forEach(async (x) => {
                    data.push(filterSDocument(x));
                })

                let updatePDF = await PDF_YEARBOOK.findOne({academic_year: acad._id})
                if(section[0].length < 1){
                    await PDF_YEARBOOK.findByIdAndUpdate(updatePDF._id, {
                        $push: { missing : { $each: [ 'Section', 'Alumni Data' ] } }
                        }, {new: true})
                }

                Promise.all(data)
                .then((results) => {
                    res.status(201).json(results);
                })
                .catch((e) => {
                    res.status(409).json({ message: e.message });
                });
          })
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
}

/*
    params excel serial date
    use for birthday
*/
function ExcelDateToJSDate(serial, len) {  
    if(serial.toString().length <= len) return 'Invalid Date';

    var date_info = new Date(Math.round((serial - 25569)*86400*1000));

    return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate()+1).toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
 }

/*
    check if string value is a date
*/
function isDate(sDate) {  
    if(sDate.toString() == parseInt(sDate).toString()) return false; 
    var tryDate = new Date(sDate);
    return (tryDate && tryDate.toString() != "NaN" && tryDate != "Invalid Date");  
}

exports.checkStudentExists = async (req, res) => {
    Alumni.findOne({student_number: req.body.student_number})
        .then(student => res.json(student))
        .catch(err => res.status(400).json(`Error: ${err}`))
}

exports.uploadAlumni = async (req, res) => {
    let obj = {...req.body}
    let encoded, filename_, type_, pathImage, urlPath

    delete obj['params']
    try {
        let splitSections = req.body.params[1].split(" ");

        if(splitSections[1].toLowerCase().includes("all-")) splitSections[1] = ""
        
        let currentYear = await Academic_Year.findOne({academic_year: req.body.params[0]})
        let currentSection = await Section.findOne({academic_year: currentYear._id, institute: req.body.params[2], program_acronym: splitSections[0], section: splitSections[1]})
        obj['section_id'] = currentSection._id
        obj['batch_id'] = currentYear._id
        if(req.files.main != null){
            encoded = new Buffer.from(req.files.main[0].buffer).toString('base64');
    
            filename_ = filename(encoded)
    
            type_ = req.files.main[0].mimetype.split("/").splice(-1)[0]
    
            pathImage = `${process.env.MAIN_IMAGE_FOLDER}${filename_}.${type_}`
    
            urlPath = `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.MAIN_FOLDER_NAME}/${filename_}.${type_}`
    
            fs.writeFileSync(pathImage , req.files.main[0].buffer);
    
            obj["main"] = urlPath
        }
    
        if(req.files.subs != null){
            req.files.subs.forEach( async (x, i) => {
                let encoded, type_, pathImage
    
                encoded = new Buffer.from(x.buffer).toString('base64');
    
                filename_ = filename(encoded)
    
                type_ = x.mimetype.split("/").splice(-1)[0]
    
                pathImage = `${process.env.SUB_IMAGE_FOLDER}${filename_}.${type_}`
    
                urlPath = `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.SUB_FOLDER_NAME}/${filename_}.${type_}`
    
                fs.writeFileSync(pathImage , x.buffer);
    
                obj[`img${i+1}`] = urlPath
            })
        }
        const newAlumni = new Alumni({
            ...obj,
            full_name:{
                first_name: obj.first_name,
                middle_name: obj.middle_name,
                last_name: obj.last_name
            }
        })
        await newAlumni.save().then(async (result) => {
            let updatePDF = await PDF_YEARBOOK.findOne({section_id: currentSection._id})
            updatePDF.missing = updatePDF.missing.filter(e => e !== 'Alumni Data');
            await PDF_YEARBOOK.findByIdAndUpdate(updatePDF._id, {missing: updatePDF.missing}, {new: true})

            let updatedBatchPDF = await PDF_YEARBOOK.findOne({academic_year: currentYear._id})
            updatedBatchPDF.missing = updatedBatchPDF.missing.filter(e => e !== 'Alumni Data');
            await PDF_YEARBOOK.findByIdAndUpdate(updatedBatchPDF._id, {missing: updatedBatchPDF.missing}, {new: true})

            let newEntry = await flattenDocument(newAlumni)

            let user_account = await createStudentAccount(result)
            
            const newUser = new User(user_account)
            await newUser.save().then(() => {
                sendEmail([newUser])
                res.status(201).json({
                    entry: newEntry, 
                    message: `Alumni ${obj.first_name} ${obj.last_name} added!`, 
                    variant: 'success', 
                    heading: 'Added Successfully'});
            })
        }).catch(err => res.status(400).json(`Error: ${err}`))

    } catch (error) {
        console.log(error)
        res.status(409).json({ message: error.message });
    }
}

function sendEmail(arr){
    arr.forEach((list) => {
        if(list.email){
            var mailOptions = {
                from: process.env.NODEMAILER_USER,
                to: list.email,
                subject: 'MCC Alumni Yearbook Account',
                text: `
                    Hi ${list.name} this will be your account to access our Mabalacat City College alumni websites!

                    username: ${list.username}
                    password: ${list.username}

                    you can access the website by clicking the link below
                    ${process.env.PROTOCOL}://${process.env.DOMAIN_NAME}/login
                `
            };

            transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });
        }
    })
}

// async function test(){
//     let currentYear = await Academic_Year.findOne({academic_year: "2021 - 2022"})
//     let currentSection = await Section.findOne({academic_year: currentYear._id, institute: "ICS", program: "BSIT", section: "4A"})
//     let updatePDF = await PDF_YEARBOOK.findOne({section_id: currentSection._id})
//     updatePDF.missing = updatePDF.missing.filter(e => e !== 'Alumni');
//     console.log(updatePDF.missing)
//     await PDF_YEARBOOK.findByIdAndUpdate(updatePDF._id, {missing: updatePDF.missing}, {new: true})
// }
// test()

function filename(base64String){
    return (uuid.v4() + path.extname(base64String))
}

exports.updateAlumni = async (req, res) => {
    let student_number, first_name, middle_name, last_name, quotes, address, program, email, contact, main
    let img = ['','','']
    let thisAlumni = await Alumni.findOne({_id: req.body.params[3]})

    if(req.body.student_number != '') student_number = req.body.student_number 
    else student_number = thisAlumni.student_number

    if(req.body.first_name != '') first_name = req.body.first_name 
    else first_name = thisAlumni.full_name.first_name ? thisAlumni.full_name.first_name : ''

    if(req.body.middle_name != '') middle_name = req.body.middle_name 
    else middle_name = thisAlumni.full_name.middle_name ? thisAlumni.full_name.middle_name : ''

    if(req.body.last_name != '') last_name = req.body.last_name 
    else last_name = thisAlumni.full_name.last_name ? thisAlumni.full_name.last_name : ''

    if(req.body.quotes != '') quotes = req.body.quotes 
    else quotes = thisAlumni.quotes

    if(req.body.address != '') address = req.body.address 
    else address = thisAlumni.address

    if(req.body.program != '') program = req.body.program 
    else program = thisAlumni.program

    if(req.body.email != '') email = req.body.email 
    else email = thisAlumni.email

    if(req.body.contact != '') contact = req.body.contact 
    else contact = thisAlumni.contact

    if(req.body.contact != 'null' && req.body.contact != 'undefined') contact = req.body.contact 
    else contact = thisAlumni.contact

    let encoded, filename_, type_, pathImage, urlPath
    try {
        if(req.files.main != null){
            if(thisAlumni.main && thisAlumni.main != null){
                fs.unlink(path.join(`${process.env.MAIN_IMAGE_FOLDER}/${thisAlumni.main.split('/').pop()}`), (err) => {
                    if (err) {
                        console.error(err)
                        return
                    }
                    console.log("removed: "+thisAlumni.main)
                })
            }

            encoded = new Buffer.from(req.files.main[0].buffer).toString('base64');
    
            filename_ = filename(encoded)
    
            type_ = req.files.main[0].mimetype.split("/").splice(-1)[0]
    
            pathImage = `public/${process.env.MAIN_FOLDER_NAME}/${filename_}.${type_}`
    
            urlPath = `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.MAIN_FOLDER_NAME}/${filename_}.${type_}`
    
            fs.writeFileSync(pathImage , req.files.main[0].buffer);
    
            main = urlPath
        }else{
            if(thisAlumni.main != null)
                main = thisAlumni.main
            else
                main = ''
        }

        if(req.files.subs != null){
            if(thisAlumni.img1 && thisAlumni.img1 != null){
                fs.unlink(path.join(`${process.env.SUB_IMAGE_FOLDER}/${thisAlumni.img1.split('/').pop()}`), (err) => {
                    if (err) {
                        console.error(err)
                        return
                    }
                    console.log("removed: "+thisAlumni.img1)
                })
            }
            if(thisAlumni.img2 && thisAlumni.img2 != null){
                fs.unlink(path.join(`${process.env.SUB_IMAGE_FOLDER}/${thisAlumni.img2.split('/').pop()}`), (err) => {
                    if (err) {
                        console.error(err)
                        return
                    }
                    console.log("removed: "+thisAlumni.img2)
                })
            }
            if(thisAlumni.img3 && thisAlumni.img3 != null){
                fs.unlink(path.join(`${process.env.SUB_IMAGE_FOLDER}/${thisAlumni.img3.split('/').pop()}`), (err) => {
                    if (err) {
                        console.error(err)
                        return
                    }
                    console.log("removed: "+thisAlumni.img3)
                })
            }

            req.files.subs.forEach( async (x, i) => {
                let encoded, type_, pathImage
    
                encoded = new Buffer.from(x.buffer).toString('base64');
    
                filename_ = filename(encoded)
    
                type_ = x.mimetype.split("/").splice(-1)[0]
    
                pathImage = `public/${process.env.SUB_FOLDER_NAME}/${filename_}.${type_}`
    
                urlPath = `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.SUB_FOLDER_NAME}/${filename_}.${type_}`
    
                fs.writeFileSync(pathImage , x.buffer);
    
                img[i] = urlPath
            })
        }else{
            if(thisAlumni.img1) img[0] = thisAlumni.img1
            else img[0] = ''

            if(thisAlumni.img2) img[1] = thisAlumni.img2
            else img[1] = ''

            if(thisAlumni.img3) img[2] = thisAlumni.img3
            else img[2] = ''
        }

        let objBody = {
            student_number: student_number,
            full_name:{
                first_name: first_name,
                middle_name: middle_name,
                last_name: last_name
            },
            quotes: quotes,
            address: address,
            program: program,
            email: email,
            contact: contact,
            main: main,
            img1: img[0],
            img2: img[1],
            img3: img[2]
        }

        await Alumni.findByIdAndUpdate(thisAlumni._id, objBody, {new: true})
        .then(async (result) =>{
            let splitSections = req.body.params[1].split(" ");

            if(splitSections[1].toLowerCase().includes("all")) splitSections[1] = ""
            
            let updated_alumni = result 
            let updated_data = await getSectionAlumni(req.body.params[0], req.body.params[2], splitSections[0], splitSections[1])
            let updated_list = []

            updated_data.forEach(async (x) => {
                updated_list.push(flattenDocument(x));
            })

            Promise.all(updated_list)
            .then((results) => {
                res.status(200).json({
                    updated: results,
                    message: updated_alumni.student_number ? `Student Number ${updated_alumni.student_number} Updated!` : `Alumni ${updated_alumni.full_name.first_name} ${updated_alumni.full_name.last_name} Updated!`, 
                    variant: 'success', 
                    heading: 'Updated Successfully'
                });
            })
            .catch((e) => {
                console.log(err)
                res.status(409).json({ message: e.message });
            });
        })
    } catch (error) {
        console.log(error)
        res.status(409).json({ message: error.message });
    }
}

async function getSectionAlumni(a, i, p , s){
    let findYear = await Academic_Year.findOne({academic_year: a})
    let findSection = await Section.findOne({academic_year: findYear._id, program_acronym: p, section: s, institute: i})
    let alumni_list = await Alumni.find({batch_id: findYear._id, section_id: findSection._id})
                        .sort([['full_name.first_name', 'ascending']])
                        .populate('section_id')
                        .populate('batch_id')
    return alumni_list
}

exports.deleteAlumni = async (req, res) =>{
    const {id, data} = req.body
    const {academic_year: academic_year} = req.body
    const {institute: institute} = req.body
    const {section: section} = req.body
    if(id){
        try {
            let delete_alumni = await Alumni.findById(id)
            await Alumni.findById(id).then(async (alumni) => {
                if((alumni.main != undefined || alumni.main != null) && alumni.main != ''){
                    fs.unlink(path.join(process.env.MAIN_IMAGE_FOLDER+alumni.main.split('/').pop()), (err) => {
                        if (err) {
                            console.error(err)
                            return
                        }
                        console.log("removed: "+alumni.main)
                    })
                }
                if((alumni.img1 != undefined || alumni.img1 != null) && alumni.img1 != ''){
                    fs.unlink(path.join(process.env.SUB_IMAGE_FOLDER+alumni.img1.split('/').pop()), (err) => {
                        if (err) {
                            console.error(err)
                            return
                        }
                        console.log("removed: "+alumni.img1)
                    })
                }
                if((alumni.img2 != undefined || alumni.img2 != null) && alumni.img2 != ''){
                    fs.unlink(path.join(process.env.SUB_IMAGE_FOLDER+alumni.img2.split('/').pop()), (err) => {
                        if (err) {
                            console.error(err)
                            return
                        }
                        console.log("removed: "+alumni.img2)
                    })
                }
                if((alumni.img3 != undefined || alumni.img3 != null) && alumni.img3 != ''){
                    fs.unlink(path.join(process.env.SUB_IMAGE_FOLDER+alumni.img3.split('/').pop()), (err) => {
                        if (err) {
                            console.error(err)
                            return
                        }
                        console.log("removed: "+alumni.img3)
                    })
                }
        
                await User.deleteOne({alumni_id: alumni._id});
                await Alumni.deleteOne({_id: id})
                
                let splitSections = req.body.section.split(" ");

                if(splitSections[1].toLowerCase().includes("all")) splitSections[1] = ""

                let a = await Academic_Year.findOne({academic_year: academic_year})
                let s = await Section.findOne({academic_year: a._id, program_acronym: splitSections[0], section: splitSections[1], institute: institute})
                Promise.all([
                    Alumni.find({section_id: s._id}).sort([['full_name.first_name', 'ascending']])
                ])
                .then(async(alumni) => {
                    let updatePDF = await PDF_YEARBOOK.findOne({section_id: s._id})
                    if(alumni[0].length < 1){
                        await PDF_YEARBOOK.findByIdAndUpdate(updatePDF._id, {
                            $push: { "missing": "Alumni Data" }
                        }, {new: true})

                        let updatedBatchPDF = await PDF_YEARBOOK.findOne({academic_year: a._id})
                        await PDF_YEARBOOK.findByIdAndUpdate(updatedBatchPDF._id,{ $push: { "missing": "Alumni Data" } }, {new: true})
                    }

                    const data = []
                    const [list] = alumni
                    list.forEach(async (x) => {
                        data.push(flattenDocument(x));
                    })
        
                    Promise.all(data)
                    .then((results) => {
                        res.status(201).json({
                            entry: results, 
                            message: `Student Number ${delete_alumni.student_number} Removed`, 
                            variant: 'danger', 
                        });
                    })
                    .catch((e) => {
                        res.status(409).json({ message: e.message });
                    });
                })
            })
        } catch (error) {
            console.log(error)
            res.status(409).json({ message: error.message });
        }
    }
    else if(data){
        let len = data.length
        async.eachSeries(data, function updateObject (obj, done) {
            if((obj.info.main != undefined || obj.info.main != null) && obj.info.main != ''){
                fs.unlink(path.join(process.env.MAIN_IMAGE_FOLDER+obj.info.main.split('/').pop()), (err) => {
                    if (err) {
                        console.error(err)
                        return
                    }
                    console.log("removed: "+obj.info.main)
                })
            }
            if((obj.info.img1 != undefined || obj.info.img1 != null) && obj.info.img1 != ''){
                fs.unlink(path.join(process.env.SUB_IMAGE_FOLDER+obj.info.img1.split('/').pop()), (err) => {
                    if (err) {
                        console.error(err)
                        return
                    }
                    console.log("removed: "+obj.info.img1)
                })
            }
            if((obj.info.img2 != undefined || obj.info.img2 != null) && obj.info.img2 != ''){
                fs.unlink(path.join(process.env.SUB_IMAGE_FOLDER+obj.info.img2.split('/').pop()), (err) => {
                    if (err) {
                        console.error(err)
                        return
                    }
                    console.log("removed: "+obj.info.img2)
                })
            }
            if((obj.info.img3 != undefined || obj.info.img3 != null) && obj.info.img3 != ''){
                fs.unlink(path.join(process.env.SUB_IMAGE_FOLDER+obj.info.img3.split('/').pop()), (err) => {
                    if (err) {
                        console.error(err)
                        return
                    }
                    console.log("removed: "+obj.info.img3)
                })
            }

            Alumni.findByIdAndDelete(obj._id, done).then(() => User.deleteOne({alumni_id: obj._id}))
        }, async function allDone (err) {
            let splitSections = req.body.section.split(" ");

            if(splitSections[1].toLowerCase().includes("all")) splitSections[1] = ""

            let a = await Academic_Year.findOne({academic_year: academic_year})
            let s = await Section.findOne({academic_year: a._id, program_acronym: splitSections[0], section: splitSections[1], institute: institute})
            Alumni.find({section_id: s._id}).sort([['full_name.first_name', 'ascending']])
            .then(async(alumni) => {
                let updatePDF = await PDF_YEARBOOK.findOne({section_id: s._id})
                if(alumni.length < 1){
                    await PDF_YEARBOOK.findByIdAndUpdate(updatePDF._id, {
                        $push: { "missing": "Alumni Data" }
                    }, {new: true})

                    let updatedBatchPDF = await PDF_YEARBOOK.findOne({academic_year: a._id})
                    await PDF_YEARBOOK.findByIdAndUpdate(updatedBatchPDF._id,{ $push: { "missing": "Alumni Data" } }, {new: true})
                }

                const data = []
                alumni.forEach(async (x) => {
                    data.push(flattenDocument(x));
                })
    
                Promise.all(data)
                .then((results) => {
                    res.status(201).json({
                        entry: results, 
                        message: `${len} Selected data removed`, 
                        variant: 'danger', 
                    });
                })
                .catch((e) => {
                    console.log(e)
                    res.status(409).json({ message: e.message });
                });
            })
        });
    }
}

var async = require('async')
exports.bulkImage = async (req, res) => {
    let splitSections = req.body.params[1].split(" ");

    if(splitSections[1].toLowerCase().includes("all")) splitSections[1] = ""

    let encoded, filename_, type_, pathImage, urlPath
    let alumni_list = await getSectionAlumni(req.body.params[0], req.body.params[2], splitSections[0], splitSections[1])
    let updated_list = []
    let filtered_files = []

    if(req.body.type_ === 'GRADUATION'){
        /*
            filter entry
        */
        req.files.forEach((item) => {
            //console.log(item.originalname.replace(/[_,.]| /, " "), ":", value.full_name.first_name, ":", value.full_name.last_name)
            var output = alumni_list.filter(function(value){ 
                let stud_number = item.originalname.split(/[_,.]| /) 
                let match_str = item.originalname.replace(",", " ")

                if(stud_number[0] === value.student_number)
                    return stud_number[0] === value.student_number
                else
                    return match_str.toLowerCase().includes(value.full_name.last_name.toLowerCase()) && match_str.toLowerCase().includes(value.full_name.first_name.toLowerCase())
            })

            if(output.length > 0){
                updated_list.push(...output)
                filtered_files.push(item)
            }
        })
        /*
            removing duplicate entry
        */
        duplicate = countDuplicates(filtered_files, "originalname");
        updated_list = removeDuplicates(updated_list, "student_number");
        filtered_files = removeDuplicateFilename(filtered_files, "originalname", updated_list, "student_number", 1, false);

        if(updated_list < 1)
            return  res.status(401).json({
                message: `Error: No match user corresponds to your image uploaded, Please ensure that the filename includes their student number.`, 
                variant: 'danger', 
                heading: 'No Owner Found'
            });

        console.log(filtered_files.length, updated_list.length)
        filtered_files.forEach((item) => {

            let match_str = item.originalname.replace(",", " ")
            let unavailable_student_number = false
            let found = []

            updated_list.some(l => {
                if(l.student_number !== '' &&  item.originalname.includes(l.student_number)){
                    found.push(l)
                    return true
                }
                else if(match_str.toLowerCase().includes(l.full_name.last_name.toLowerCase()) && match_str.toLowerCase().includes(l.full_name.first_name.toLowerCase())) {
                    unavailable_student_number = true
                    found.push(l)
                    return true
                }
            })

            // var output = updated_list.filter(function(value){ 
            //     console.log(match_str.toLowerCase().includes(value.full_name.last_name.toLowerCase()) && match_str.toLowerCase().includes(value.full_name.first_name.toLowerCase()))
            //     if(item.originalname.includes(value.student_number))
            //         return item.originalname.includes(value.student_number)
            //     else {
            //         unavailable_student_number = true
            //         return match_str.toLowerCase().includes(value.full_name.last_name.toLowerCase()) && match_str.toLowerCase().includes(value.full_name.first_name.toLowerCase())
            //     }
            // })

            let index = updated_list.findIndex(x => 
                unavailable_student_number ? (x.full_name.first_name === found[0].full_name.first_name && x.full_name.last_name === found[0].full_name.last_name)
                : x.student_number === found[0].student_number);

            encoded = new Buffer.from(item.buffer).toString('base64');
        
            filename_ = filename(encoded)

            type_ = item.mimetype.split("/").splice(-1)[0]

            pathImage_copy = `${process.env.MAIN_IMAGE_FOLDER}${filename_}_copy.${type_}`

            pathImage = `${process.env.MAIN_IMAGE_FOLDER}${filename_}.${type_}`

            urlPath = `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.MAIN_FOLDER_NAME}/${filename_}.${type_}`

            //fs.writeFileSync(pathImage_copy , item.buffer)

            sharp(item.buffer).resize({width: 400, height: 600}).toFile(pathImage)
            .then(() => {
                console.log("File Overwriten")
            })
            .catch((err) => {console.log("There was a problem resizing images", err)})
            
            if(updated_list[index].main != '' && (updated_list[index].main != undefined || updated_list[index].main != null)){
                fs.unlink(path.join(process.env.MAIN_IMAGE_FOLDER+updated_list[index].main.split('/').pop()), (err) => {
                    if (err) {
                        //console.error(err)
                        return
                    }
                    console.log("removed: "+updated_list[index].main)
                })
            }

            updated_list[index]['main'] = urlPath
        })

        //console.log(updated_list)
        async.eachSeries(updated_list, function updateObject (obj, done) {
            Alumni.findByIdAndUpdate(obj._id, obj, done)
        }, async function allDone (err) {
            let splitSections = req.body.params[1].split(" ");

            if(splitSections[1].toLowerCase().includes("all")) splitSections[1] = ""

            let updated_data = await getSectionAlumni(req.body.params[0], req.body.params[2], splitSections[0], splitSections[1])
            let updated_list_ = []

            updated_data.forEach(async (x) => {
                updated_list_.push(flattenDocument(x));
            })

            Promise.all(updated_list_)
            .then((results) => {
                res.status(201).json({
                    updated_data: updated_data,
                    updated_list: results,
                    message: `${filtered_files.length} Graduation Images successfully uploaded to their corresponding Alumni`, 
                    duplication: `Found ${duplicate} duplicate image/s`, 
                    variant: 'success', 
                    heading: 'Uploaded Successfully'
                });
            })
            .catch((e) => {
                res.status(409).json({ message: e.message });
            });
        });
    }
    else if(req.body.type_ === 'EXTRA'){
        /*
            filter entry
        */
        req.files.forEach((item) => {
            var output = alumni_list.filter(function(value){ 
                let stud_number = item.originalname.split(/[,.]| /) 
                return (stud_number[0] === value.student_number && (item.originalname.includes("image_1") || item.originalname.includes("image_2") || item.originalname.includes("image_3") || item.originalname.includes("image1") || item.originalname.includes("image2") || item.originalname.includes("image3")))
                // return (item.originalname.includes(value.student_number) && (item.originalname.includes("image_1") || item.originalname.includes("image_2") || item.originalname.includes("image_3")))
            })
            if(output.length > 0){
                updated_list.push(...output); 
                filtered_files.push(item);
            }
        })

        /*
            removing duplicate entry
        */
        const key_ = [
            {param: "image_1"}, {param: "image_2"}, {param: "image_3"}, {param: "image1"}, {param: "image2"}, {param: "image3"}
        ]

        duplicate = countDuplicates(filtered_files, "originalname");
        updated_list = removeDuplicates(updated_list, "student_number");
        filtered_files = removeDuplicateFilename(filtered_files, "originalname", updated_list, "student_number", 3, true, key_, "param")

        let count_files = 0

        updated_list.forEach((item, i) => {
            if(item.img1 != '' && (item.img1 != undefined || item.img1 != null)){
                fs.unlink(path.join(process.env.SUB_IMAGE_FOLDER+item.img1.split('/').pop()), (err) => {
                    if (err) {
                        return
                    }
                    console.log("removed: "+item.img1)
                })
            }
            if(item.img2 != '' && (item.img2 != undefined || item.img2 != null)){
                fs.unlink(path.join(process.env.SUB_IMAGE_FOLDER+item.img2.split('/').pop()), (err) => {
                    if (err) {
                        return
                    }
                    console.log("removed: "+item.img2)
                })
            }
            if(item.img3 != '' && (item.img3 != undefined || item.img3 != null)){
                fs.unlink(path.join(process.env.SUB_IMAGE_FOLDER+item.img3.split('/').pop()), (err) => {
                    if (err) {
                        return
                    }
                    console.log("removed: "+item.img3)
                })
            }
        })

        filtered_files.forEach((item, i) => {
            item.forEach(async (file) => {
                count_files++;

                let index, objType_
                var output = alumni_list.filter(function(value){ 
                    let stud_number = file.originalname.split(/[,.]| /) 
                    return (stud_number[0] === value.student_number && (file.originalname.includes("image_1") || file.originalname.includes("image_2") || file.originalname.includes("image_3") || file.originalname.includes("image1") || file.originalname.includes("image2") || file.originalname.includes("image3")))
                    // return (file.originalname.includes(value.student_number) && (file.originalname.includes("image_1") || file.originalname.includes("image_2") || file.originalname.includes("image_3")))
                })
                /*
                    set object properties
                */
                if(file.originalname.includes("image_1"))       objType_ = 'img1'
                else if(file.originalname.includes("image_2"))  objType_ = 'img2'
                else if(file.originalname.includes("image_3"))  objType_ = 'img3'
                else if(file.originalname.includes("image1"))   objType_ = 'img1'
                else if(file.originalname.includes("image2"))   objType_ = 'img2'
                else if(file.originalname.includes("image3"))   objType_ = 'img3'
                
                if(file.originalname.includes("image_1")){
                    index = updated_list.findIndex(x => x.student_number === output[0].student_number && file.originalname.includes("image_1"));
                }
                else if(file.originalname.includes("image_2")){
                    index = updated_list.findIndex(x => x.student_number === output[0].student_number && file.originalname.includes("image_2"));
                }
                else if(file.originalname.includes("image_3")){
                    index = updated_list.findIndex(x => x.student_number === output[0].student_number && file.originalname.includes("image_3"));
                }
                else if(file.originalname.includes("image1")){
                    index = updated_list.findIndex(x => x.student_number === output[0].student_number && file.originalname.includes("image1"));
                }
                else if(file.originalname.includes("image2")){
                    index = updated_list.findIndex(x => x.student_number === output[0].student_number && file.originalname.includes("image2"));
                }
                else if(file.originalname.includes("image3")){
                    index = updated_list.findIndex(x => x.student_number === output[0].student_number && file.originalname.includes("image3"));
                }

                encoded = new Buffer.from(file.buffer).toString('base64');
            
                filename_ = filename(encoded)

                type_ = file.mimetype.split("/").splice(-1)[0]

                pathImage = `${process.env.SUB_IMAGE_FOLDER}${filename_}.${type_}`

                urlPath = `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.SUB_FOLDER_NAME}/${filename_}.${type_}`

                console.log(pathImage)
                fs.writeFileSync(pathImage , file.buffer);

                updated_list[index][objType_] = urlPath
            })
        })

        async.eachSeries(updated_list, function updateObject (obj, done) {
            Alumni.findByIdAndUpdate(obj._id, obj, done)
        }, async function allDone (err) {
            let splitSections = req.body.params[1].split(" ");

            if(splitSections[1].toLowerCase().includes("all")) splitSections[1] = ""
            
            let updated_data = await getSectionAlumni(req.body.params[0], req.body.params[2], splitSections[0], splitSections[1])
            let updated_list_ = []

            updated_data.forEach(async (x) => {
                updated_list_.push(flattenDocument(x));
            })

            Promise.all(updated_list_)
            .then((results) => {
                res.status(201).json({
                    updated_data: updated_data,
                    updated_list: results,
                    message: `${count_files} Extra Images successfully uploaded to their corresponding Alumni`, 
                    duplication: `Found ${duplicate} duplicate image/s`, 
                    variant: 'success', 
                    heading: 'Uploaded Successfully'
                });
            })
            .catch((e) => {
                res.status(409).json({ message: e.message });
            });
        });
    }
}

exports.uploadFileOnSection = async(req, res) => {
    let data = []
    /*
        file validitation
        accept: csv / xlsx
    */
    if(getExtension(req.file.originalname) == 'csv')
        data.push(readCSV(req.file.path))
    else if(getExtension(req.file.originalname) == 'xlsx')
        data.push(readXLSX(req.file.path))
    else{
        return res.status(401).json({
            message: `Error: File is not a csv/xlxs format!`, 
            variant: 'danger', 
            heading: 'File Type Error'
        });
    }

    Promise.all(data)
    .then(async (results) => {  
        const obj = Object.keys(results[0][0]).map(v => v.toLowerCase());
        /*
            check if object has a valid properties 
        */
        if(!obj.includes('student_number') && !obj.includes('first_name') && !obj.includes('last_name') && !obj.includes('program'))
            return res.status(401).json({
                message: `Error: File was not a valid format given. Please use the proper format`, 
                variant: 'danger', 
                heading: 'File Error'
            });
        
        let splitSections = req.body.section.split(" ");

        if(splitSections[1].toLowerCase().includes("all-")) splitSections[1] = ""

        let currentAcademic = await Academic_Year.findOne({academic_year: req.body.academic_year})
        let currentSection = await Section.findOne({academic_year: currentAcademic._id, program_acronym: splitSections[0], section: splitSections[1], institute: req.body.institute})
        try {
            let schema = []
            results[0].forEach((x) => {
                if(x.Student_Number == '' && x.First_Name == '' && x.Last_Name == '')   
                    return

                let jsonData = {
                    student_number: x.Student_Number ? x.Student_Number : '',
                    full_name: {
                        first_name: x.First_Name ? x.First_Name : '',
                        middle_name: x.Middle_Name ? x.Middle_Name : '',
                        last_name: x.Last_Name ? x.Last_Name : ''
                    },
                    quotes: x.Quotes,
                    address: x.Address,
                    contact: x.Contact,
                    email: x.Email,
                    program: x.Program,
                    section_id: currentSection._id,
                    batch_id: currentAcademic._id,
                    main: '',
                    img1: '',
                    img2: '',
                    img3: ''
                }
                schema.push(jsonData)
            })

            var unique_id = removeDuplicates(schema, "student_number");
            var alumni_list = await Alumni.find({})
            var new_arr = []
            var existing_alumni_count = 0


            
            unique_id.forEach((item, i) => {
                var output = alumni_list.filter(function(value){ 
                    if(value.student_number)
                        return item.student_number === value.student_number
                    else 
                        return `${item.full_name.first_name} ${item.full_name.last_name}` === `${value.full_name.first_name} ${value.full_name.last_name}`
                })
                if(output.length == 0) new_arr.push(item)
                else existing_alumni_count ++
            })


            if (new_arr.length == 0){
                res.status(201).json({
                    message: `All data inserted on file are already existed! `, 
                    variant: 'warning', 
                    heading: 'Failed to Upload'
                });
                return
            }

            await Alumni.insertMany(new_arr) //new_arr
            .then(async (result) => {
                let updatePDF = await PDF_YEARBOOK.findOne({section_id: currentSection._id})
                updatePDF.missing = updatePDF.missing.filter(e => e !== 'Alumni Data');
                await PDF_YEARBOOK.findByIdAndUpdate(updatePDF._id, {missing: updatePDF.missing}, {new: true})

                let updatedBatchPDF = await PDF_YEARBOOK.findOne({academic_year: currentAcademic._id})
                updatedBatchPDF.missing = updatedBatchPDF.missing.filter(e => e !== 'Alumni Data');
                await PDF_YEARBOOK.findByIdAndUpdate(updatedBatchPDF._id, {missing: updatedBatchPDF.missing}, {new: true})

                let userData = []
                result.forEach(async (x) => {
                    userData.push(createStudentAccount(x, userData))
                })
                /*
                    Bulk insert Student Account
                */
                Promise.all(userData)
                .then(async (results) => {
                    /*
                        responds to the client
                    */
                    var unique_username = removeDuplicates(results, "username");
                    sendEmail(unique_username)
                    await User.insertMany(unique_username)
                    .then(async () => {    
                        let splitSections = req.body.section.split(" ");

                        if(splitSections[1].toLowerCase().includes("all")) splitSections[1] = ""

                        let updated_data = await getSectionAlumni(req.body.academic_year, req.body.institute, splitSections[0], splitSections[1])
                        let updated_list_ = []
            
                        updated_data.forEach(async (x) => {
                            updated_list_.push(flattenDocument(x));
                        })
            
                        Promise.all(updated_list_)
                        .then((results) => {
                            res.status(201).json({
                                updated_data: updated_data,
                                updated_list: results,
                                message: `${unique_username.length} Alumni successfully added on this section`, 
                                variant: 'success', 
                                heading: 'Created Successfully'
                            });
                        })
                        .catch((e) => {
                            console.log(err)
                            res.status(409).json({ 
                                message: e.message,
                                variant: 'danger' 
                            });
                        });
                    })
                    .catch(function(err) {
                        console.log(err)
                        res.status(400).json(`Error: ${err}`)
                    });
                })
                .catch((e) => {
                    console.log(e)
                    res.status(409).json({ 
                        heading: 'Failed to Upload',
                        message: e.message,
                        variant: 'danger' 
                    });
                });
            })
            .catch(function(err) {
                console.log(err)
                res.status(400).json(`Error: ${err}`)
            });
        } catch (error) {
            console.log(error)
            res.status(409).json({ 
                heading: 'Failed to Upload',
                message: error.message,
                variant: 'danger' 
            });
        }
    })
    .catch((e) => {
        console.log(e)
        res.status(409).json({ 
            heading: 'Failed to Upload',
            message: e.message,
            variant: 'danger' 
        });
    });
}