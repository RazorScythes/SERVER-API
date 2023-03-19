const Academic_Year = require('../models/academic_year.model')
const PDF_YEARBOOK  = require('../models/pdf.model')
const Section       = require('../models/section.model')
const Institute      = require('../models/institute.model')
const Alumni        = require('../models/alumni.model')
const User          = require('../models/user.model')
const Commence      = require('../models/graduation_message.model')
const Event         = require('../models/events.model')
const News          = require('../models/news.model')
const HA            = require('../models/honor_and_awards.model')
const Administrator = require('../models/administrators.model')
const Order         = require('../models/orders.model')
const Gallery       = require('../models/gallery.model')
const Message       = require('../models/message.model')
const bcrypt        = require('bcryptjs')
const sizeOf        = require('image-size');

require('dotenv').config()

const ordered_institute = [
    'IBCE',
    'IHTM',
    'IASTE',
    'ICS',
    'IBE'
]

function gcd (a, b) {
    return (b == 0) ? a : gcd (b, a%b);
}

/*
    @params image = String
    the value must be existing in the database
*/  
function getAspectRatio(image){
    let path = image.split("/")
    var dimensions = sizeOf(`./public/${path[path.length - 2]}/${path[path.length - 1]}`);
    let r = gcd(dimensions.width, dimensions.height)
    return {
        width: dimensions.width/r,
        height: dimensions.height/r
    }
}

function removeDuplicates(originalArray, prop, value, id = false) {
    var newArray = [];

    originalArray.forEach((x) => {
        if(!id)
            if(x[prop] && x[prop] == value) delete x
            else newArray.push(x)
        else
            if(x[prop].equals(value)) delete x
            else newArray.push(x)
    })

    return newArray;
}

function removeDuplicates_Single (array, key) {
    return array.reduce((arr, item) => {
      const removed = arr.filter(i => i[key] !== item[key]);
      return [...removed, item];
    }, []);
  };

  
function paginate (arr, size) {
    if(!arr) return
    return arr.reduce((acc, val, i) => {
      let idx = Math.floor(i / size)
      let page = acc[idx] || (acc[idx] = [])
      page.push(val)
  
      return acc
    }, [])
}

function getHighestPosition(arr) {
//     const filter = [
//         "College President",
//         "Mayor", 
//         "Vice President for Academic Affairs", 
//         "Vice President for Administration",
//         "Vice President for External Affairs",
//         "Ched Regional", 
//         "Dean", 
//     ]
    var filter = []

    arr.forEach((x) => { filter.push(x.position); })
    // filter = filter.filter(function(elem, pos) {
    //     console.log(elem == pos)
    //     return filter.indexOf(elem) == pos;
    // })

    filter.sort(function(a, b) {
        return b.priority_value - a.priority_value;
    });

    let position
    filter.some(function(el) {
        let find_ = arr.find(o => o.position.position === el.position);
        if(find_){
            position = find_
            return true
        }
    });
    // console.log(position)
    return position
}

function getHighestAdministration(arr) {
    var administration = []

    arr.forEach((x) => { administration.push(x.administration.title); })
    administration = administration.filter(function(elem, pos) {
        return administration.indexOf(elem) == pos;
    })

    let data

    administration.some(function(el) {
        let result = arr.filter(obj => {
            return obj.administration.title === el
        })

        if(result.length > 0){
            data = result
            return true
        }
    });

    return data ? data : []
}

function rearrange (arr, filter) {
    let data = []
    filter.forEach((x) => {
        let result = arr.filter(obj => {
            return obj.institute === x
        })

        if(result.length > 0) data.push(result)
    })
    return data
}

function compressSections(value, academic_year) {
    return new Promise(async (resolve) => {
        let data = []

        value.forEach((x) => {
            data.push(getAlumniCollection(x, academic_year))
        })

        Promise.all(data)
        .then((results) => {
            resolve(results)
        })
        .catch((e) => {
            console.log("error", e)
        });
    });
}

function getAlumniCollection(section, academic_year) {
    return new Promise(async (resolve) => {
        let alumni = await Alumni.find({section_id: section._id}).populate('section_id').sort([['full_name.last_name', 'ascending']])
        let data = []
        alumni.forEach((x) => { 
            if(section.program_acronym !== x.section_id.program_acronym) return
            let main
            if(!x.main) main = `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.MCC_LOGO}`
            else main = x.main

            let obj = {
                student_number: x.student_number,
                name: `${x.full_name.last_name}, ${x.full_name.first_name}` ,
                quotes: x.quotes,
                main: main,
                sub: x.img1,
                nametag: academic_year.nametags_id.image,
                searchKey : {
                    student_number: x.student_number,
                    first_name: x.full_name.first_name,
                    last_name: x.full_name.last_name
                }
            }
            data.push(obj)
        })

        resolve({
            program: `${section.program} ${section.section && section.section}`,
            program_acronym: section.program_acronym,
            alumni: [...data]
        })
    });
}

function getProgramSection(batch, section, acronym){
    return new Promise(async (resolve) => {
        let section_ = await Section.find({academic_year: batch._id, institute: section.institute, program_acronym: acronym}).sort([['section', 'ascending']])
        let data = []

        section_.forEach(x => {
            data.push(getAlumniCollection(x, batch))
        })

        Promise.all(data)
        .then((results) => {
            resolve(results)
        })
        .catch((e) => {
            console.log(e)
        });
    });
}

function gatherBatchYear(batch, section, institute){
    return new Promise(async (resolve) => {
        // let sections    = await Section.find({academic_year: batch._id})
        // var institute_list = await Institute.find({})
        // var ordered_inst = []
    
        // institute_list.forEach((item) => {
        //     ordered_inst.push(item.institute_acronym)
        // })

        var nametag_attributes = {
            checked: batch.nametag_props.checked,
            color: batch.nametag_props.color,
            name: (batch.nametag_props.name - 40),
            quotes: (batch.nametag_props.quotes - 30),
        } 
        var data = []

        data.push(getProgramSection(batch, section, section.program_acronym));

        // rearrange(sections, ordered_inst).forEach(async (x) => {
        //     console.log(x)
        //     return
        //     data.push(compressSections(x, batch));
        // })

        Promise.all(data)
        .then((results) => {
            let exposed_results = []
            results.forEach((x) => {
                exposed_results.push(...x)
            })

            resolve({   
                institute: institute,
                academic_year: batch.academic_year,
                program: section.program_acronym,
                nametag_props: nametag_attributes,
                candidates: exposed_results
            })
        })
        .catch((e) => {
            console.log(e)
        });
    });
}

function gatherInstitute(institute, batch) {
    return new Promise(async (resolve) => {
        let yearSection = await Section.find({institute: institute.institute_acronym, academic_year: batch._id, institute: institute.institute_acronym})
        // console.log(yearSection)
        var data = []

        removeDuplicates_Single(yearSection, 'program_acronym').forEach((x) => {
            data.push(gatherBatchYear(batch, x, institute.institute_acronym))
        })

        Promise.all(data)
        .then((results) => {
            resolve({   
                institute: institute.institute_acronym,
                institute_name: institute.institute,
                program: removeDuplicates_Single(yearSection, 'program_acronym'),
                data: results
            })
        })
        .catch((e) => {
            console.log(e)
        });
    });
}

exports.getBatchGallery = async (req, res) => {
    if(!req.body.alumni_id){
        res.status(404).json({
            message: '404: No Data Available',
            additional: 'Looks like there was no data yet has been inserted',
        })
        return
    }

    let current_alumni = await Alumni.findById(req.body.alumni_id).populate("section_id")

    if(!current_alumni){
        res.status(404).json({
            message: "410: Account Deleted",
            additional: "looks like your account is no longer existed in our database"
        })
        return
    }

    let image_arr = []

    let getYear = await Academic_Year.findById(current_alumni.batch_id)

    let gallery_data = await Gallery.find({academic_year: getYear._id})

    let related_alumni = await Alumni.find({batch_id: getYear._id})

    related_alumni.forEach((obj) => {
        if(obj.img2) {
            let ratio = getAspectRatio(obj.img2)
            image_arr.push({
                src: obj.img2,
                width: ratio.width,
                height: ratio.height
            })
        }
        if(obj.img3){
            let ratio = getAspectRatio(obj.img3)
            image_arr.push({
                src: obj.img3,
                width: ratio.width,
                height: ratio.height
            })
        }
    })

    gallery_data.forEach((obj) => {
        let ratio = getAspectRatio(obj.image)
        image_arr.push({
            src: obj.image,
            width: ratio.width,
            height: ratio.height
        })
    })

    if(image_arr.length > 0) 
        res.status(200).json(image_arr)
    else 
        res.status(404).json({
            message: 'Error 404: No Data Available',
            additional: 'Looks like there was no data yet has been inserted',
        })
}

exports.getGraduates = async (req, res) => {
    if(!req.body.alumni_id){
        res.status(404).json({
            message: '404: No Data Available',
            additional: 'Looks like there was no data yet has been inserted',
        })
        return
    }

    let current_alumni = await Alumni.findById(req.body.alumni_id).populate("section_id")

    if(!current_alumni){
        res.status(404).json({
            message: "410: Account Deleted",
            additional: "looks like your account is no longer existed in our database"
        })
        return
    }
    let getYear = await Academic_Year.findById(current_alumni.batch_id).populate('nametags_id')
    .populate({ 
        path: 'template_id',
        populate: [
            {
                path: 'template4',
                model: 'Template'
            }
        ]
    })

    if(!getYear){
        res.status(404).json({
            message: '404: No Data Available',
            additional: 'Looks like there was no data yet has been inserted',
        })
        return
    }

    let institute = await Institute.find({})

    institute.sort(function(a, b) {
        return b.priority_value - a.priority_value;
    });

    var data = []

    institute.forEach((x) => {
        data.push(gatherInstitute(x, getYear))
    })

    Promise.all(data)
    .then((results) => {
        var filtered_obj = []

        results.forEach((el) => { 
            let data_program = []
            /*
                Loop program and check data if it has a data of alumni
                if data_program has value inside that program has no data of alumni
            */
            el.program.forEach((p, i) => {
                el.data[i].candidates.some(e => {
                    if(e.program_acronym === p.program_acronym && e.alumni.length === 0){
                        data_program.push(p)
                        // found = true
                        return true
                    }
                })
            })

            /*
                finds the index of the object then remove it
            */
            var num_index
            if(data_program.length > 0) {
                data_program.forEach((d) => {
                    for (var i = el.program.length; i--;) {                 
                        if(el.program[i].program_acronym === d.program_acronym) {
                            num_index = i
                            break
                        }
                    }
                    el.program.splice(num_index, 1)
                })
            }
      
            if(el.data.length > 0) {

                for (var i = el.data.length; i--;) {
                    var b = el.data[i].candidates.filter(function (e) {
                        return e.alumni.length !== 0;
                    });

                    if(b.length > 0) {
                        el.data[i].candidates = b
                    }
                    else {
                        el.data.splice(i, 1)
                    }

                }

                if(el.program.length > 0 && el.data.length > 0) filtered_obj.push(el) 
            }
        })

        var validate = false
        filtered_obj.some((el) => {
            if(el.data.length > 0){
                validate = true
                return true
            }
        })

        if(validate) res.status(200).json({
            background: getYear.template_id.template4.image,
            academic_year: getYear.academic_year,
            data: filtered_obj
        })
        else res.status(404).json({
            message: 'Error 404: No Data Available',
            additional: 'Looks like there was no data yet has been inserted',
        })
    })
    .catch((e) => {
        console.log(e)
        res.status(409).json({ message: e.message });
    });

}

function search(nameKey, prop, prop2 = '', arr, academic_year = ''){
    if(!nameKey) return []
    if(academic_year)
        return arr.filter(keyword => keyword['academic_year'] === academic_year && (keyword[prop].toLowerCase().includes(nameKey.toLowerCase()) || (keyword[prop2] && keyword[prop2].toLowerCase().includes(nameKey))))
    return arr.filter(keyword => keyword[prop].toLowerCase().includes(nameKey.toLowerCase()) || keyword[prop2].toLowerCase().includes(nameKey))
}


exports.searchQuery = async (req, res) => {
    Alumni.find({}).populate('section_id')
    .then(async(results) => {
        let sorted = []
        results.forEach((x) => {
            sorted.push({
                id: x._id,
                student_number: x.student_number,
                program: x.section_id.program_acronym,
                image: x.main ? x.main : `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.MCC_LOGO}`,
                name: `${x.full_name.first_name} ${x.full_name.last_name}`
            })
        })
        sorted = search(req.body.keyword, 'name', 'student_number', sorted)
        if(sorted !== undefined) res.status(201).json(sorted)
        else res.status(404).json({message: "not found"})
    })
    .catch((e) => {
        console.log(e)
        res.status(409).json({ message: e.message });
    });

}

exports.getQuery = async (req, res) => {
    let user = await Alumni.findById(req.body.alumni_id)
    if(!user) 
        return res.status(404).json({ 
            message: 'Sorry, we cannot find the batch year you belong',
        });    

    let validYear = await Academic_Year.findById(user.batch_id)
    Alumni.find({}).populate('section_id')
    .populate('nametags_id')
    .populate('section_id')
    .populate({ 
        path: 'batch_id',
        populate: [
            {
                path: 'nametags_id',
                model: 'Nametags'
            }
        ]
    })
    .then(async(results) => {
        let sorted = []
        results.forEach((x) => {
            sorted.push({
                id: x._id,
                student_number: x.student_number,
                program: x.section_id ? x.section_id.program_acronym : '',
                image: x.main ? x.main : `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.MCC_LOGO}`,
                name: `${x.full_name.last_name} ${x.full_name.first_name}`,
                quotes: x.quotes ? x.quotes : '',
                nametag: x.batch_id ? x.batch_id.nametags_id.image : '',
                academic_year: x.batch_id ? x.batch_id.academic_year : '',
                nametag_props: {
                    checked: x.batch_id ? x.batch_id.nametag_props.checked : '',
                    color: x.batch_id ? x.batch_id.nametag_props.color : '',
                    name: (x.batch_id ? x.batch_id.nametag_props.name - 40 : ''),
                    quotes: (x.batch_id ? x.batch_id.nametag_props.quotes - 30 : ''),
                }, 
                searchKey : {
                    student_number: x.student_number,
                    first_name: x.full_name.first_name,
                    last_name: x.full_name.last_name
                }
            })
        })
        sorted = search(req.body.keyword, 'name', 'student_number', sorted, validYear.academic_year)
        if(sorted !== undefined) res.status(201).json(sorted)
        else res.status(404).json({message: "not found"})
    })
    .catch((e) => {
        console.log(e)
        res.status(409).json({ message: e.message });
    });
}

exports.getAllEvent = async (req, res) => {
    Event.find({}).sort([['academic_year', 'descending']]).populate('academic_year')
    .then((result) => {
        let sorted = []
        if(req.body.keyword){
            sorted = search(req.body.keyword.toLowerCase(), 'header', 'content', result)
            console.log(sorted)
            if(sorted.length > 0) res.status(200).json(sorted)
            else res.status(404).json({
                message: "No content found matching with your keyword search"
            })
        }
        else {
            if(result.length > 0) res.status(200).json(result)
            else res.status(404).json({message: 'No event available'})
        }
    })
    .catch((e) => res.status(401).json({message: e}))
}



exports.getHomeContent = async (req, res) => {
    let latest
    if(req.body.academic_year){
        latest = await Academic_Year.findOne({academic_year: req.body.academic_year})
        .populate('nametags_id')
        .populate('cover_id')
        .populate({ 
            path: 'template_id',
            populate: [
                {
                    path: 'template1',
                    model: 'Template'
                },
                {
                    path: 'template2',
                    model: 'Template'
                },
                {
                    path: 'template3',
                    model: 'Template'
                },
                {
                    path: 'template4',
                    model: 'Template'
                }
            ]
        })
    }
    else{
        latest = await Academic_Year.findOne({}, {}, { sort: { 'academic_year' : -1 } })
        .populate('nametags_id')
        .populate('cover_id')
        .populate({ 
            path: 'template_id',
            populate: [
                {
                    path: 'template1',
                    model: 'Template'
                },
                {
                    path: 'template2',
                    model: 'Template'
                },
                {
                    path: 'template3',
                    model: 'Template'
                },
                {
                    path: 'template4',
                    model: 'Template'
                }
            ]
        })
    }
 
    let commence = await Commence.find({academic_year: latest._id}, {}, { sort: { 'position' : -1 } }).populate("position")
    let administrators = await Administrator.find({academic_year: latest._id}).populate("administration")
    let events = await Event.find({academic_year: latest._id}).limit(4).populate("academic_year")
    let news = await News.find({academic_year: latest._id}).limit(3).populate("academic_year")
    let gallery = await Gallery.find({academic_year: latest._id})
    let sections    = await Section.find({academic_year: latest._id}) 
    let data            = [] //data holder for alumni objects
    let admin_data      = [] //data holder for administrators objects
    let gallery_data    = [] //data holder for images objects
    let sorted_administration = getHighestAdministration(administrators)
    var institute_list = await Institute.find({})
    var ordered_inst = []
    var news_obj = {
        count : 0,
        main : [],
        sub : []
    };
    
    if(news.length > 1){
        news_obj.count = news.length
        news_obj.main.push(news[0])

        news.splice(0,1)
        news_obj.sub.push(...news)
    }
    else if(news.length === 1) {
        news_obj.count = news.length
        news_obj.main.push(...news)
    }

    institute_list.forEach((item) => {
        ordered_inst.push(item.institute_acronym)
    })

    sorted_administration.forEach((x) => {
        admin_data.push({
            image: x.image ? x.image : `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.MCC_LOGO}`,
            name: x.name,
            position: x.position
        })
    })

    gallery.forEach((x) => {
        gallery_data.push({
            src: x.image,
            original: x.image,
            thumbnail: x.image
        })
    })

    var nametag_attributes = {
        checked: latest.nametag_props.checked,
        color: latest.nametag_props.color,
        name: (latest.nametag_props.name - 40),
        quotes: (latest.nametag_props.quotes - 30),
    } 

    /*
        rearranging programs according to their institutes
    */
    rearrange(sections, ordered_inst).forEach(async (x) => {
        data.push(compressSections(x, latest));
    })

    Promise.all(data)
    .then((results) => {
        
        let exposed_results = []
        results.forEach((x) => {
            exposed_results.push(...x)
        })

        res.status(201).json({
            academic_year: latest.academic_year,
            nametag_props: nametag_attributes,
            commence: getHighestPosition(commence),
            administrators: {
                administration: sorted_administration[0] ? sorted_administration[0].administration : '',
                list: paginate(admin_data, 4)
            },
            gallery: gallery_data,
            alumni: exposed_results,
            events: events,
            news : news_obj
        })
    })
    .catch((e) => {
        console.log(e)
        res.status(409).json({ message: e.message });
    });
}

exports.getAcademicYear = async (req, res) => {
   Academic_Year.find({})
   .then((result) => res.status(201).json(result))
   .catch((e) => {
        console.log(e)
        res.status(409).json({ message: e.message });
    });
}

exports.getCommence = async (req, res) => {
    let query = req.body.id.split("_")
    let getYear = await Academic_Year.findOne({academic_year: query[1]})
    if(!getYear)
        return res.status(404).json({
            message: "404: Not Found",
            additional: "Make sure you type the correct keyword"
        })

    Commence.findOne({name: query[0].replace(/-/g, ' '), academic_year: getYear._id}).populate('position')
    .then((result) => {
        if(result) res.status(200).json(result)
        else res.status(404).json({
            message: "404: Not Found",
            additional: "Make sure you type the correct keyword"
        })
    })
    .catch((e) => {
        console.log(e)
        res.status(409).json({ message: e.message });
    });
}

exports.getAlumniProfile = async (req, res) => {
    var search_key = req.body.student_number.split("_");
    let alumni;

    if(req.body.student_number.length === 24) 
        alumni = await Alumni.findById(req.body.student_number).populate('section_id').populate('batch_id')
    else if(search_key.length > 1)
        alumni = await Alumni.findOne({"full_name.first_name": search_key[0], "full_name.last_name": search_key[1]}).populate('section_id').populate('batch_id')
    else
        alumni = await Alumni.findOne({student_number: req.body.student_number}).populate('section_id').populate('batch_id')

    if(!alumni) 
        return res.status(404).json({ 
            message: 'Alumni Not Found',
            additional: 'Make sure you type the correct student number',
        });

    let user = await Alumni.findById(req.body.alumni_id)
    let validYear = await Academic_Year.findById(user.batch_id)

    if(validYear.academic_year !== alumni.batch_id.academic_year)
        return res.status(404).json({ 
            message: '403: Forbidden Data',
            additional: 'Sorry but you cannot view other batch year :(',
        });

    if(!alumni.main) alumni.main = `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.MCC_LOGO}`

    let getYear = await Academic_Year.findById(alumni.batch_id)
    .populate({ 
        path: 'template_id',
        populate: [
            {
                path: 'template4',
                model: 'Template'
            }
        ]
    })

    let section = await Section.findById(alumni.section_id._id)       
       
    Alumni.find({section_id: section._id})
    .then((result) => {
        let updated_obj = []

        result.forEach((x) => {
            if(!x.main)
                x.main = `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.MCC_LOGO}`
            updated_obj.push(x)
        })

        let updated_list = paginate(removeDuplicates(result, "student_number", alumni.student_number), 5);

        res.status(201).json({
            background: getYear.template_id.template4.image,
            profile: alumni,
            related: updated_list
        })
    })
    .catch((e) => {
        console.log(e)
        res.status(409).json({ message: e.message });
    });
}

exports.getDownloads = async (req, res) => {
    let alumni = await Alumni.findById(req.body.id)

    let section_pdf = await PDF_YEARBOOK.findOne({section_id: alumni.section_id, status: 'active'})
    let batch_pdf = await PDF_YEARBOOK.findOne({academic_year: alumni.batch_id, status: 'active'})

    let download = []

    if(batch_pdf) download.push(batch_pdf)
    if(section_pdf) download.push(section_pdf)

    res.status(201).json(download)
}

exports.getEvent = async (req, res) => {
    let limit = 3
    let query = req.body.id.split("_")
    let getYear = await Academic_Year.findOne({academic_year: query[1]})
    if(!getYear)
        return res.status(404).json({
            message: "404: Not Found",
            additional: "Make sure you type the correct keyword"
        })

    let event = await Event.findOne({header: query[0].replace(/-/g, ' '), academic_year: getYear._id})

    if(!event)
        return res.status(404).json({
            message: "404: Not Found",
            additional: "Make sure you type the correct keyword"
        })
    Event.find({academic_year: event.academic_year}).populate('academic_year')
    .then((result) => {
        let event_index
        let new_ = removeDuplicates(result, "_id", event._id, true)
        let entry = []

        result.some((el, i) => {
            if(event._id.equals(el._id)){
                event_index = i
                return true
            }
        })

        if(new_.length > limit){
            let sub = 0
            for(var i = 0; i < limit; i++){
                if(result[event_index + (i+1)]){
                    entry.push(result[event_index + (i+1)])
                }
                else {
                    entry.push(result[event_index - (sub+1)])
                    sub++;
                }

            }
        }
        else {
            entry = new_
        }

        if(result) 
            res.status(201).json({
                event: event,
                related: entry
            })
        else res.status(404).json({
            message: "404: Not Found",
            additional: "Make sure you type the correct keyword"
        })
    })
    .catch((e) => {
        console.log(e)
        res.status(409).json({ message: e.message });
    });
}

exports.getNews = async (req, res) => {
    let query = req.body.id.split("_")

    let getYear = await Academic_Year.findOne({academic_year: query[1]})
    if(!getYear)
        return res.status(404).json({
            message: "404: Not Found",
            additional: "Make sure you type the correct keyword"
        })

    let news = await News.findOne({header: query[0].replace(/-/g, ' '), academic_year: getYear._id})

    if(!news)
        return res.status(404).json({
            message: "404: Not Found",
            additional: "Make sure you type the correct keyword"
        })
    else
        res.status(201).json({
            news: news
        })
}

exports.getOrderData = async (req, res) => {
    if(!req.body.data.alumni_id) 
        return res.status(404).json({
            message: "404: Not Found",
            additional: "We cannot find your account information"
        })
    Alumni.findById(req.body.data.alumni_id)
    .then(async (result) => {
        if(!result.batch_id)
            return res.status(404).json({
                message: "404: Not Found",
                additional: "We cannot find your batch information"
            })
        let academic_year = await Academic_Year.findById(result.batch_id).populate('cover_id')
        let orders = await Order.find({user_id: req.body.data._id}).populate('alumni_id')

        if(!orders) 
            return res.status(404).json({
                message: "404: Not Found",
                additional: "We cannot find your account information"
            })

        res.status(201).json({
            yearbook: academic_year,
            order_status: orders
        })
    })
    .catch((e) => {
        console.log(e)
        res.status(409).json({ message: e.message });
    });
}

exports.preOrder = async (req, res) => {
    const { data, yearbook } = req.body
    let order_data = {
        user_id: data._id,
        alumni_id: data.alumni_id,
        yearbook: yearbook,
        status: 'pending',
    }
    const newOrder = new Order(order_data)
    try {
        await newOrder.save()
        .then((entry) => {
            Alumni.findById(data.alumni_id)
            .then(async (result) => {
                let academic_year = await Academic_Year.findById(result.batch_id).populate('cover_id')
                let populated_entry = await Order.findById(entry._id).populate('alumni_id')

                res.status(201).json({
                    yearbook: academic_year,
                    order_status: [populated_entry]
                })
            })
            .catch((e) => {
                console.log(e)
                res.status(409).json({ message: e.message });
            });
        })
    } catch (error) {
        console.log(error)
    }
}

exports.cancelOrder = async (req, res) => {
    console.log(req.body)
    const { id, data, yearbook } = req.body
    await Order.findByIdAndDelete(id)
    .then(async () => {
        Alumni.findById(data.alumni_id)
        .then(async (result) => {
            let academic_year = await Academic_Year.findById(result.batch_id).populate('cover_id')
            let orders = await Order.find({user_id: data._id}).populate('alumni_id')
 
            res.status(201).json({
                yearbook: academic_year,
                order_status: orders
            })
        })
        .catch((e) => {
            console.log(e)
            res.status(409).json({ message: e.message });
        });
    })
}

exports.changeAlumniPassword = async (req, res) => {
    if(!req.body.info)
        return res.status(400).json({ 
            variant: "danger",
            message: "Error: You are trying to change password with a non existing user!" 
        })  

    let user = await User.findById(req.body.info._id)

    if(!user)
        return res.status(400).json({ 
            variant: "danger",
            message: "This account was already deleted, you cannot make further actions" 
        })

    try {
        const isPasswordMatch = await bcrypt.compare(req.body.form.old_password, user.password)
    
        if(!isPasswordMatch) return res.status(400).json({ 
            variant: "danger",
            message: "Old password does not match" 
        })

        const isNewConfirmMatch = req.body.form.confirm_password === req.body.form.new_password

        if(!isNewConfirmMatch) return res.status(400).json({ 
            variant: "danger",
            message: "New and confirm password does not match" 
        })

        let hashedPassword = await bcrypt.hash(req.body.form.new_password, 12);
        await User.findByIdAndUpdate(req.body.info._id, {password: hashedPassword}, {new: true})

        return res.status(200).json({ 
            variant: "success",
            message: "Password successfully updated!" 
        })
    } catch (error) {
        console.log(error)
    }

}

exports.changeEmail = async (req, res) => {
    if(!req.body.info)
        return res.status(400).json({ 
            variant: "danger",
            message: "Error: Invalid user information!" 
        })  

    let user = await User.findById(req.body.info._id)
    let alumni = await Alumni.findById(req.body.info.alumni_id)

    if(!user)
        return res.status(400).json({ 
            variant: "danger",
            message: "This account was already deleted, you cannot make further actions" 
        })
    
    if(!alumni)
        return res.status(400).json({ 
            variant: "danger",
            message: "Alumni information not found, Please login again." 
        })

    try {
        await Alumni.findByIdAndUpdate(alumni._id, {email: req.body.email}, {new: true})
        await User.findByIdAndUpdate(user._id, {email: req.body.email}, {new: true})
        return res.status(200).json({ 
            variant: "success",
            message: "Email Address successfully updated!" 
        })
    } catch (error) {
        console.log(error)
    }
}

exports.newMessage = async (req, res) => {
    const { name, student_number, issue, email, message } = req.body

    const new_message = new Message({
        name: name ? name : '',
        student_number: student_number ? student_number : '',
        issue: issue ? issue : '',
        email: email,
        message: message,
        color: '#00FF00',
        notification_status: 'new',
        status: '1_new'
    })

    await new_message.save().then(async (result) => {
        console.log(result)
        res.status(200).json("OK")
    })
    .catch((err) => res.status(400).json(`Error: ${err}`))
}