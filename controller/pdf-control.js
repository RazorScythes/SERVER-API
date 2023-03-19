const Academic_Year     = require('../models/academic_year.model')
const Section           = require('../models/section.model')
const PDF_YEARBOOK      = require('../models/pdf.model')
const Alumni            = require('../models/alumni.model')
const Commence          = require('../models/graduation_message.model')
const Gallery           = require('../models/gallery.model')
const Administrators    = require('../models/administrators.model')
const Institute         = require('../models/institute.model')
const HA                = require('../models/honor_and_awards.model')
const Honor_Title       = require('../models/honor_title.model')
const hbs               = require('handlebars')
const sharp             = require('sharp')

const puppeteer         = require('puppeteer');
const path              = require('path')
const fsx               = require('fs-extra');
const async             = require('async')

require('dotenv').config()

const ordered_institute = [
    'IBCE',
    'IHTM',
    'IASTE',
    'ICS',
    'IBE'
]

// var browser;
// async function startPupperteer(){
//     browser = await puppeteer.launch().then(() => console.log("browser launch"));
    
// }

// startPupperteer();

function paginate (arr, size) {
    if(!arr) return
    return arr.reduce((acc, val, i) => {
      let idx = Math.floor(i / size)
      let page = acc[idx] || (acc[idx] = [])
      page.push(val)
  
      return acc
    }, [])
}

function rearrange (arr, filter) {

    let data = []
    filter.forEach((x) => {
        let result = arr.filter(obj => {
            return obj.institute === x.institute_acronym
        })

        if(result.length > 0) data.push(result)
    })
    return data
}

/* ================================================================================================================================ */
/*                                                    HONOR AND AWARDS                                                              */
/* ================================================================================================================================ */

const ha_list = [
    {title: "Dean's List with Distinction", desc: "is based on 15 units and a 4.000 grade-point-average."},
    {title: "Dean's List", desc: "is based on 15 units and a grade-point average of 3.500-3.999."},
    {title: "Honorable Mention", desc: "is based on 12 units of 3.500 and above grade-point-average"},
    {title: "Highest Academic Distinction", desc: "is based on 30 units and a 4.000 grade-point-average."},
    {title: "Academic Distinction", desc: "is based on 30 units and a grade-point-average of 3.500-3.999."},
    {title: "Summa Cum Laude", desc: "is awarded to candidates whose grade-point-average is 3.900 or higher."},
    {title: "Magna Cum Laude", desc: "is awarded to candidates whose grade-point-average is 3.700-3.899."},
    {title: "Cum Laude",desc: "is awarded to candidates whose grade-point-average is 3.5000-3.699."}
]

function sortBy(field) {
    return function(a, b) {
        if(a[field].includes('Cum'))    
            return a[field]
        else
            return (a[field] < b[field]) - (a[field] > b[field])
    };
}


function reArrangeHA (arr, filter_obj) {
    let filtered_data = []
    let title = []
    
    arr.forEach((x) => { title.push(x.title); })

    title = title.filter(function(elem, pos) {
        return title.indexOf(elem) == pos;
    })

    title.sort(function(a, b) {
        return b.priority_value - a.priority_value;
    });

    title.forEach((x) => {
        let result = arr.filter(obj => {
            return obj.title === x
        })

        var output = filter_obj.filter(function(value){ return value.title == x })

        if(result.length > 0) 
            filtered_data.push({
                title: x.title,
                desc: x.desc,
                // desc: output.length > 0 ? output[0].desc : '',
                data: {...result}
            })
    })

    //filtered_data.sort(sortBy('title')).reverse();

    return filtered_data
}

/* ================================================================================================================================ */
/*                                                             END                                                                  */
/* ================================================================================================================================ */



/* ================================================================================================================================ */
/*                                                          CANDIDATES                                                              */
/* ================================================================================================================================ */

function reArrangeAndMerge (arr, filter) {
    let filtered_data = []
    let rawdata = []
    let program = []
    
    arr.forEach((x) => { program.push(x.program); })
    program = program.filter(function(elem, pos) {
        return program.indexOf(elem) == pos;
    })

    program.forEach((x) => {
        let result = arr.filter(obj => {
            return obj.program === x
        })

        if(result.length > 0) rawdata.push(result)
    })

    filter.forEach((x) => {
        let result = rawdata.filter(obj => { return obj[0].institute === x })
        if(result.length > 0) filtered_data.push(result)
    })

    return filtered_data
}

function compressCandidates(value, academic_year) {
    return new Promise(async (resolve) => {
        let data = []

        value.forEach((x) => { 
            data.push(getCandidatesByProgram(x))
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

function getCandidatesByProgram(section) {
    return new Promise(async (resolve) => {
        let data = []
        section.forEach((x) => { 
            data.push(getCandidatesData(x._id))
        })

        Promise.all(data)
        .then((results) => {
            let compress_data = []
            //compressing data into single array
            results.forEach((x) => {
                x.forEach((y) => {
                    compress_data.push(y)
                })
            })
    
            resolve({
                program: section[0].program,
                candidates: compress_data
            })
        })
        .catch((e) => {
            console.log("error", e)
        });
    });
}

function getCandidatesData(id){
    return new Promise(async (resolve) => {
        let obj_data = []
        let alumni = await Alumni.find({section_id: id}).sort([['full_name.last_name', 'ascending']])

        alumni.forEach((x) => {
            obj_data.push({name: `${x.full_name.last_name}, ${x.full_name.first_name}`})
        })

        resolve(obj_data)
    });
}

function paginateAll(arr) {
    let max = 192 //224
    let count = 0
    var remaining_space = 0
    let paginated_data = []
    let data = []

    let overlap = false;
    let next_page = false;

    let name_space = 8
    let additional_space = 5
    let row_count = 4
    arr.forEach((x) => {
        x.forEach((y) => {
            if(y.candidates.length == 0) return

            count = y.candidates.length

            if(count <= max){
                if(next_page){
                    next_page = false;
                    paginated_data.push([y])
                    
                    remaining_space = 0
                    remaining_space +=  count + name_space
                    return
                }
                // data.push(y)
                // if(paginated_data.length > 0)
                //     paginated_data[paginated_data.length - 1].push(...data)
                // else
                //     paginated_data.push(data)
                // return

                let temp = y.candidates.slice(0, remaining_space == 0 ? count : (max - remaining_space));
                
                if(temp.length % additional_space > 0) {
                    temp = y.candidates.slice(0, (remaining_space == 0 ? count : (max - remaining_space)) + (additional_space - (temp.length % additional_space)));
                    
                    if((4 - (temp.length % 4) > 0) && ((y.candidates.slice(temp.length , y.candidates.length)).length > 0)) {
                        temp.push(...y.candidates.slice(temp.length, temp.length + (4 - (temp.length % 4) ) ))
                    }
                }
                
                let dump = y.candidates.slice(temp.length , y.candidates.length);
                //console.log("temp:", temp.length,"dump:", dump.length, "count:", count, "r_s_abs:", Math.abs(max - remaining_space), "remaining space: ", remaining_space, "remainder temp:", 4 - temp.length % 4)
                if(dump.length === 0) {
                   
                    
                    if(remaining_space >= max) {
                        remaining_space = 0
                        // console.log("temp: ",y.candidates.length, "compute: ", remaining_space - (max), "orig: ", remaining_space)
                        // remaining_space = remaining_space - (count)

                       
                    }
                }

                if(count  > additional_space) remaining_space +=  count + name_space
                else remaining_space += additional_space + 12
                
                if(remaining_space >= max - name_space) {
                    next_page = true;
                }
                
                if(remaining_space < 0) overlap = true;
                
                // console.log(temp.length, dump.length, remaining_space)
                // console.log(remaining_space)
                data.push({
                    program: y.program,
                    candidates: {...temp}
                })

                if(paginated_data.length > 0){
                    paginated_data[paginated_data.length - 1].push(...data)
                }
                else
                    paginated_data.push([y])

                while(dump.length > 0){
                    let arr = dump.slice(0 , max + 10);
                    let dump_len = dump.slice(max + 10 , dump.length).length

                    if(arr.length % additional_space > 0) {
                        arr = dump.slice(0, max + 10 + (additional_space - (arr.length % additional_space)));
                    }

                    paginated_data.push([{
                        candidates: {...arr}
                    }])

                    remaining_space = 0

                    if(dump_len == 0) remaining_space = dump.length + name_space

                    next_page = false
                    //     if(overlap) {
                    //         remaining_space = max - remaining_space
                    //         overlap = false
                    //     }
                    // }

                    dump = dump.slice(max + 10 , dump.length);
                }
                // console.log(paginated_data)

                data = [];
                count = 0
                // remaining_space = 0
                
            }
            else{
                next_page = false;
                remaining_space = max - count
                
                let temp = y.candidates.slice(0, remaining_space);

                if(remaining_space < 0) overlap = true;

                if(temp.length % additional_space > 0) {
                    temp = y.candidates.slice(0, remaining_space + (additional_space - (temp.length % additional_space)));
                }

                let dump = y.candidates.slice(temp.length , y.candidates.length);
                
                data.push({
                    program: y.program,
                    candidates: {...temp}
                })
                //console.log("DUMP:", dump.length)
                paginated_data.push(data)

                while(dump.length > 0){
                    let arr = dump.slice(0 , max + 10);
                    let dump_len = dump.slice(max + 10 , dump.length).length
                    if(arr.length % additional_space > 0) {
                        arr = dump.slice(0, max + 10 + (additional_space - (arr.length % additional_space)));
                    }

                    paginated_data.push([{
                        candidates: {...arr}
                    }])

                    
                    if(dump_len == 0) {
                        remaining_space = max - (dump.length + name_space)
                        if(overlap) {
                            remaining_space = max - remaining_space
                            overlap = false
                        }
                    }

                    dump = dump.slice(max + 10 , dump.length);
                }
                //console.log("space", remaining_space)
                // console.log(paginated_data)
                data = [];
                count = 0
                // remaining_space = 0
            }
        })
    })

    // if(paginated_data.length > 0)
    //     paginated_data[paginated_data.length - 1].push(...data)
    // else
    //     paginated_data.push(data)

    //console.log(paginated_data)
    return paginated_data
}

/* ================================================================================================================================ */


function compressSections(value, academic_year) {
    return new Promise(async (resolve) => {
        let institute = await Institute.findOne({institute_acronym: value[0].institute, institute: value[0].institute_name})
        let data = []
        console.log(institute.institute_acronym, institute.background)
        value.forEach((x) => {
            data.push(getAlumniCollection(x, academic_year))
        })

        Promise.all(data)
        .then((results) => {
            let institute_logo = institute.logo
            // if(value[0].institute == "ICS") institute_logo = `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.ICS_LOGO}`
            // else if(value[0].institute == "IBCE") institute_logo = `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.IBCE_LOGO}`
            // else if(value[0].institute == "IBE") institute_logo = `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.IBE_LOGO}`
            // else if(value[0].institute == "IHTM") institute_logo = `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.IHTM_LOGO}`
            // else if(value[0].institute == "IASTE") institute_logo = `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.IASTE_LOGO}`

            const jsonData = {
                batch: academic_year.academic_year,
                image: institute_logo,
                institute: value[0].institute_name,
                logo: `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.MCC_LOGO}`,
                background: academic_year.template_id.template4 !== null ? academic_year.template_id.template4.image : '',
                institute_background: institute.background,
                overwrite: institute.overwrite,
                graduates: results
            }
            resolve(jsonData)
        })
        .catch((e) => {
            console.log("error", e)
        });
    });
}

function getAlumniCollection(section, academic_year) {
    return new Promise(async (resolve) => {
        let alumni = await Alumni.find({section_id: section._id}).sort([['full_name.last_name', 'ascending']])
        let data = []
        alumni.forEach((x) => { 
            let main
            if(!x.main) main = `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.MCC_LOGO}`
            else main = x.main

            let obj = {
                name: `${x.full_name.last_name.replace(' ', '')}, ${x.full_name.first_name}  ${x.full_name.middle_name ? x.full_name.middle_name.charAt(0)+"." : ''}` ,
                quotes: x.quotes && x.quotes.length > 43 ? x.quotes.slice(0, 42) : x.quotes,
                main: main,
                sub: x.img1,
                nametag: academic_year.nametags_id !== null ? academic_year.nametags_id.image : ''
            }
            data.push(obj)
        })

        resolve({
            program: section.program,
            candidates:[...data]
        })
    });
}

/* ================================================================================================================================ */
/*                                                       ADMINISTRATION                                                             */
/* ================================================================================================================================ */

function filterAdministration (arr, filter) {
    let data = []
    let administration = []
    
    arr.forEach((x) => { administration.push(x.administration); })
    administration = administration.filter(function(elem, pos) {
        return administration.indexOf(elem) == pos;
    })

    administration.forEach((x) => {
        let result = arr.filter(obj => {
            return obj.administration === x
        })

        if(result.length > 0) data.push({
            title: x,
            administration: result
        })
    })

    return data
}

/* ================================================================================================================================ */
/*                                                             END                                                                  */
/* ================================================================================================================================ */

var sizeOf = require('image-size');

function filterGallery(propName) {
    return function(a,b) {
        if (a[propName] < b[propName])
            return -1;
        if (a[propName] > b[propName])
            return 1;
        return 0;
    };
}

function sortGallery(arr) {
    let max_count = 0
    let gallery_data = [], temp_ = []
    let size = 8040
    arr.forEach((x) => {
        var str = x.image.split("/");
        var img_path = `public/${str[str.length - 2]}/${str[str.length - 1]}`

        const dimensions = sizeOf(img_path)
        if(dimensions.width > dimensions.height){
            max_count += 150 + 10; 
            max_count += 150 + 10;
            temp_.push({
                class:'horizontal',
                image: x.image
            })
        }
        else if(dimensions.height > dimensions.width){
            max_count += 150 + 10; 
            max_count += 300 + 20;
            temp_.push({
                class:'vertical',
                image: x.image
            })
        }
        else {
            max_count += 150 + 10; 
            max_count += 300 + 20
            temp_.push({
                class:'horizontal', //big
                image: x.image
            })
        }

        if(max_count >= size){
            gallery_data.push(temp_.sort(filterGallery("class")).reverse())
            temp_ = []
            max_count = 0
        }
    })
    if(temp_.length > 0) gallery_data.push(temp_)

    return gallery_data
}


exports.generateBatchYearbook = async (req, res) => {
    let academic_year = await Academic_Year.findOne({academic_year: "2021 - 2022"})
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

    var institute_list = await Institute.find({})
    var ordered_inst = []
    
    institute_list.sort(function(a, b) {
        return b.priority_value - a.priority_value;
    });

    institute_list.forEach((item) => {
        ordered_inst.push(item.institute_acronym)
    })
    
    /*
        Honor and Awards
    */
    let honor_title = await Honor_Title.find({})
    let honor_and_awards = await HA.find({academic_year: academic_year._id}).populate('title')
    let honor_and_awards_list = reArrangeHA(honor_and_awards, honor_title)

    /*
        Retrieving commence data
    */

    let commence = await Commence.find({academic_year: academic_year._id}).populate('academic_year').populate('position')
    let commence_data = []

    commence.forEach((x) => {
        commence_data.push({
            background: academic_year.template_id.template2.image,
            academic_year: academic_year.academic_year,
            logo: `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.MCC_LOGO}`,
            name: x.name,
            image: x.image,
            signature: x.signature,
            position: x.position.position,
            quotes: x.quotes,
            content: x.message
        })
    })

    /*
        Retrieving administrators data
    */
    let administrators = await Administrators.find({academic_year: academic_year._id}).populate('administration')
    let admins = []


    let sorted_administration = []
    administrators.forEach((x) => {
        let image = x.image ? x.image : `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.MCC_LOGO}`
        admins.push({
            administration: x.administration.title,
            image: image,
            name: x.name,
            position: x.position.join("/ ")
        })
    })
    
    sorted_administration = filterAdministration(admins)

    sorted_administration.forEach((x) => {
        let pages = paginate(x.administration, 15)
        x.administration = [...pages]  
    });

    /*
        MISION, VISION, GOALS, CORE VALUES
    */
    let mvgc = {
        mision: academic_year.mision,
        vision: academic_year.vision,
        goals: academic_year.goals,
        core_values: academic_year.core_values
    }

    let cover_bg    = academic_year.cover_id.image //cover background
    let first_bg    = academic_year.template_id.template1.image // first page background
    let second_bg   = academic_year.template_id.template2.image // commence page background
    let third_bg    = academic_year.template_id.template3.image // events page background
    let forth_bg    = academic_year.template_id.template4.image // institute and back page background
    
    let logo        = `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.MCC_LOGO}` // mcc logo
    let history     = {
        image: academic_year.history_image,
        content: academic_year.history_content
    }
    let sections    = await Section.find({academic_year: academic_year._id}).sort([['program_acronym', 'descending']]) 

    let data        = [] //data holder for alumni objects
    let candidates  = []

    reArrangeAndMerge(sections, ordered_inst).forEach(async (x) => {
        candidates.push(compressCandidates(x, academic_year));
    })

    let gallery = await Gallery.find({academic_year: academic_year._id})
    let sorted_gallery = sortGallery(gallery)
    
    var nametag_attributes = {
        checked: academic_year.nametag_props.checked,
        color: academic_year.nametag_props.color,
        name: (academic_year.nametag_props.name - 37),
        quotes: (academic_year.nametag_props.quotes - 35),
    } 

    Promise.all(candidates)
    .then((results) => {
        let paginated_candidates = paginateAll(results)
        /*
            rearranging programs according to their institutes
        */

        rearrange(sections, institute_list).forEach(async (x) => {
            data.push(compressSections(x, academic_year));
        })

        Promise.all(data)
        .then((results) => {

            results.forEach((x) => {
                x.graduates.forEach((y) => {
                    let pages = paginate(y.candidates, 9)
                    y.candidates = [...pages]
                })    
            });

            res.render('../yearbook/batch-template',{
                main_text_color: academic_year.main_text_color ? academic_year.main_text_color : '#000000',
                main_header_color: academic_year.main_header_color ? academic_year.main_header_color : '#000000',
                backpage: {
                    prayer: academic_year.prayer,
                    oath: academic_year.oath,
                    graduation_song: academic_year.graduation_song ,
                    closing_song: academic_year.closing_song ,
                },
                nametag_props: nametag_attributes,
                // gallery: sorted_gallery,
                logo: logo,
                objects: results,
                cover_bg: cover_bg,
                first_page_bg: first_bg,
                second_page_bg: second_bg,
                third_page_bg: third_bg,
                forth_page_bg: forth_bg,
                history: history,
                commence: commence_data,
                mvgc: mvgc,
                administrator: sorted_administration,
                candidates: paginated_candidates,
                ha: honor_and_awards_list,
                // commence: batch,
                // history: history,
                // administrators: admins,
                // helpers: helpers,
                layout: "no-layout"
            })
        
            // const compile = async function(template, cover, first_bg, second_bg, third_bg, forth_bg, logo, data, commence, mvgc, admins, paginated_candidates, honor_and_awards_list, history, sorted_gallery){
            //     const filepath = path.join(process.cwd(), 'yearbook', `${template}.handlebars`);
            //     const html = await fsx.readFile(filepath,'utf-8');
            //     var template = hbs.compile(html);
            //     var wrapper  = {
            //         // candidates: candidate,
            //         logo: logo,
            //         cover_bg: cover,
            //         first_page_bg: first_bg,
            //         second_page_bg: second_bg,
            //         third_page_bg: third_bg,
            //         forth_page_bg: forth_bg,
            //         objects: data,
            //         commence: commence,
            //         mvgc: mvgc,
            //         administrator: admins,
            //         candidates: paginated_candidates,
            //         ha: honor_and_awards_list,
            //         history: history,
            //         gallery: sorted_gallery,
            //         // commence: batch,
            //         // history: history,
            //         // administrators: admins,
            //         // helper: helpers
            //     };
            //     console.log("converting pdf file, please wait...")
            //     return template(wrapper);
            // };

            // (async function() {
            //     try{
            //         const browser = await puppeteer.launch();
            //         const page = await browser.newPage();
            //         await page.setDefaultNavigationTimeout(0);
            //         const gitMetrics = await page.metrics();
            //         console.log(gitMetrics.Timestamp) 
            //         console.log(gitMetrics.TaskDuration)
                    

            //         const content = await compile(
            //             'batch-template', 
            //             cover_bg, first_bg, 
            //             second_bg, third_bg, 
            //             forth_bg, logo, results, 
            //             commence_data, 
            //             mvgc, 
            //             admins, 
            //             paginated_candidates, 
            //             honor_and_awards_list,
            //             history,
            //             sorted_gallery
            //         );
            //         await page.setContent(content);
            //         await page.emulateMediaType('screen');
            //         await page.pdf({
            //             path: 'public/mypdf.pdf',
            //             format: 'A4',
            //             printBackground: true

            //         });
            //         console.log('done');
            //         await browser.close();
            //     }
            //     catch(e){
            //         console.log("error " +e);
            //     }
            // })()
        })
        .catch((e) => {
            console.log(e)
            res.status(409).json({ message: e.message });
        });
       
    })
    .catch((e) => {
        console.log(e)
        res.status(409).json({ message: e.message });
    });
}


function getHonor_Speech (honor_list, academic_year) {
    var arr = []

    honor_list.forEach(item => {
        if(item.title.enabled && item.message)
            arr.push({
                background: academic_year.template_id.template2.image,
                logo: `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.MCC_LOGO}`,
                academic_year: academic_year.academic_year,
                title: item.title.title,
                image: item.image ? item.image : `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.MCC_LOGO}`,
                name: item.name,
                quotes: item.quotes,
                message: item.message,
                nametag_props: academic_year.nametag_props,
                nametag: academic_year.nametags_id.image
            })
    })

    return arr
}

/*
     ==========================================================VIEW YEARBOOK===============================================================
*/
exports.viewYearbook = async (req, res) => {
    let academic_year = await Academic_Year.findOne({academic_year: req.params.academic_year})
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
    
    var institute_list = await Institute.find({})
    var ordered_inst = []
    
    institute_list.sort(function(a, b) {
        return b.priority_value - a.priority_value;
    });

    institute_list.forEach((item) => {
        ordered_inst.push(item.institute_acronym)
    })
    
    /*
        Honor and Awards
    */
    let honor_title = await Honor_Title.find({})
    let honor_and_awards = await HA.find({academic_year: academic_year._id}).populate('title')
    let honor_and_awards_list = reArrangeHA(honor_and_awards, honor_title)
    let honor_speech = getHonor_Speech(honor_and_awards, academic_year)

    /*
        Retrieving commence data
    */

    let commence = await Commence.find({academic_year: academic_year._id}).populate('academic_year').populate('position')
    let commence_data = []

    commence.forEach((x) => {
        commence_data.push({
            background: academic_year.template_id.template2.image,
            academic_year: academic_year.academic_year,
            logo: `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.MCC_LOGO}`,
            name: x.name,
            image: x.image,
            signature: x.signature,
            position: x.position.position,
            quotes: x.quotes,
            content: x.message
        })
    })

    /*
        Retrieving administrators data
    */
    let administrators = await Administrators.find({academic_year: academic_year._id}).populate('administration')
    let admins = []


    let sorted_administration = []
    administrators.forEach((x) => {
        let image = x.image ? x.image : `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.MCC_LOGO}`
        admins.push({
            administration: x.administration.title,
            image: image,
            name: x.name,
            position: x.position.join("/ ")
        })
    })
    
    sorted_administration = filterAdministration(admins)

    sorted_administration.forEach((x) => {
        let pages = paginate(x.administration, 15)
        x.administration = [...pages]  
    });

    /*
        MISION, VISION, GOALS, CORE VALUES
    */
    let mvgc = {
        mision: academic_year.mision,
        vision: academic_year.vision,
        goals: academic_year.goals,
        core_values: academic_year.core_values
    }

    let cover_bg    = academic_year.cover_id.image //cover background
    let first_bg    = academic_year.template_id.template1.image // first page background
    let second_bg   = academic_year.template_id.template2.image // commence page background
    let third_bg    = academic_year.template_id.template3.image // events page background
    let forth_bg    = academic_year.template_id.template4.image // institute and back page background
    
    let logo        = `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.MCC_LOGO}` // mcc logo
    let history     = {
        image: academic_year.history_image,
        content: academic_year.history_content
    }
    let sections    = await Section.find({academic_year: academic_year._id}).sort([['program_acronym', 'descending']]) 

    let data        = [] //data holder for alumni objects
    let candidates  = []

    reArrangeAndMerge(sections, ordered_inst).forEach(async (x) => {
        candidates.push(compressCandidates(x, academic_year));
    })

    let gallery = await Gallery.find({academic_year: academic_year._id})
    let sorted_gallery = sortGallery(gallery)
    
    var nametag_attributes = {
        checked: academic_year.nametag_props.checked,
        color: academic_year.nametag_props.color,
        name: (academic_year.nametag_props.name - 37),
        quotes: (academic_year.nametag_props.quotes - 35),
    } 

    Promise.all(candidates)
    .then((results) => {
        let paginated_candidates = paginateAll(results)
        /*
            rearranging programs according to their institutes
        */

        rearrange(sections, institute_list).forEach(async (x) => {
            data.push(compressSections(x, academic_year));
        })

        Promise.all(data)
        .then((results) => {

            results.forEach((x) => {
                x.graduates.forEach((y) => {
                    let pages = paginate(y.candidates, academic_year.display_count === 4 ? 16 : 9)
                    y.candidates = [...pages]
                })    
            });
            res.render('../yearbook/batch-template',{
                main_text_color: academic_year.main_text_color ? academic_year.main_text_color : '#000000',
                main_header_color: academic_year.main_header_color ? academic_year.main_header_color : '#000000',
                display_count: academic_year.display_count ? academic_year.display_count === 4 ? true : false : false,
                backpage: {
                    prayer: academic_year.prayer,
                    oath: academic_year.oath,
                    pledge: academic_year.pledge,
                    acknowledgement: academic_year.acknowledgement,
                    graduation_song: academic_year.graduation_song ,
                    closing_song: academic_year.closing_song ,
                },
                epilogue: academic_year.epilogue,
                nametag_props: nametag_attributes,
                logo: logo,
                objects: results,
                cover_bg: cover_bg,
                first_page_bg: first_bg,
                second_page_bg: second_bg,
                third_page_bg: third_bg,
                forth_page_bg: forth_bg,
                history: history,
                commence: commence_data,
                mvgc: mvgc,
                administrator: sorted_administration,
                candidates: paginated_candidates,
                ha: honor_and_awards_list,
                honor_speech: honor_speech,
                epilogue_image_notes: `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/epilogue_notes.png`,
                layout: "no-layout"
            })
        })
        .catch((e) => {
            console.log(e)
            res.status(409).json({ message: e.message });
        });
       
    })
    .catch((e) => {
        console.log(e)
        res.status(409).json({ message: e.message });
    });
}
/*
     ==========================================================END===============================================================
*/



exports.getAcademicYear = async (req, res) => {
    try {
        let data = []
        let academic_year = await Academic_Year.find({}).populate('cover_id')

        academic_year.forEach(async (x) => {
            data.push(flattenYear(x));
        })

        Promise.all(data)
        .then((results) => {
            res.status(201).json(results);
        })
        .catch((e) => {
            res.status(409).json({ message: e.message });
        });
    } catch (error) {   
        console.log(error)
    }
}

function flattenYear(value) {
    return new Promise(async (resolve) => {
        let pdf_yearbook = await PDF_YEARBOOK.countDocuments({academic_year: value._id, generated: true})
        let items = await PDF_YEARBOOK.countDocuments({academic_year: value._id})
        const jsonData = {
            _id: value._id,
            academic_year: value.academic_year,
            items: items,
            counts: pdf_yearbook,
            cover: value.cover_id !== null ? value.cover_id.image : ''
        }

        resolve(jsonData)
    });
}

exports.getPDFYearbook = async (req, res) => {
    try {
        let data = []
        let academic_year = await Academic_Year.find({academic_year: req.body.academic_year})
        let pdf_yearbook = await PDF_YEARBOOK.find({academic_year: academic_year[0]._id}).populate('academic_year').populate('section_id')

        pdf_yearbook.forEach(async (x) => {
            data.push(flattenDocument(x));
        })

        Promise.all(data)
        .then((results) => {
            res.status(201).json(results);
        })
        .catch((e) => {
            res.status(409).json({ message: e.message });
        });
    } catch (error) {   
        console.log(error)
    }
}

function flattenDocument(value) {
    return new Promise(async (resolve) => {
        let program = 'Batch Year'
        if(value.section_id)
            program = value.section_id.program
        const jsonData = {
            _id: value._id,
            academic_year: value.academic_year.academic_year,
            section: value.section_id ? true : false,
            program: program,
            target: value.target ? value.target : 'All',
            status: value.status,
            missing: value.missing,
            file: {
                file_name: value.file_name ? value.file_name : '',
                uri: value.uri ? value.uri : ''
            },
            uri: value.uri ? value.uri : ''
        }

        resolve(jsonData)
    });
}

exports.generateBYearbook = async(req, res) => {
    console.log("creating batch yearbook for a.y ", req.body)

    let pdf = await PDF_YEARBOOK.findById(req.body.id).populate('academic_year')
    let academic_year = await Academic_Year.findOne({academic_year: pdf.academic_year.academic_year})
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

    let text_color = academic_year.main_text_color
    let header_color = academic_year.main_header_color
    let backpage = {
        prayer: academic_year.prayer,
        oath: academic_year.oath,
        pledge: academic_year.pledge,
        acknowledgement: academic_year.acknowledgement,
        graduation_song: academic_year.graduation_song ,
        closing_song: academic_year.closing_song ,
    }
    let epilogue = academic_year.epilogue

    /*
        Retrieving commence data
    */

    let commence = await Commence.find({academic_year: academic_year._id}).populate('academic_year').populate('position')
    let commence_data = []

    commence.forEach((x) => {
        commence_data.push({
            background: academic_year.template_id.template2 !== null ? academic_year.template_id.template2.image : '',
            academic_year: academic_year.academic_year,
            logo: `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.MCC_LOGO}`,
            name: x.name,
            image: x.image,
            signature: x.signature,
            position: x.position.position,
            quotes: x.quotes,
            content: x.message
        })
    })

    var institute_list = await Institute.find({})
    var ordered_inst = []
    
    institute_list.sort(function(a, b) {
        return b.priority_value - a.priority_value;
    });

    institute_list.forEach((item) => {
        ordered_inst.push(item.institute_acronym)
    })

    /*
        Honor and Awards
    */
    let honor_title = await Honor_Title.find({})
    let honor_and_awards = await HA.find({academic_year: academic_year._id}).populate('title')
    let honor_and_awards_list = reArrangeHA(honor_and_awards, honor_title)
    let honor_speech = getHonor_Speech(honor_and_awards, academic_year)

    /*
        Retrieving administrators data
    */
    let administrators = await Administrators.find({academic_year: academic_year._id}).populate('administration')
    let admins = []

    let sorted_administration = []
    administrators.forEach((x) => {
        let image = x.image ? x.image : `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.MCC_LOGO}`
        admins.push({
            administration: x.administration.title,
            image: image,
            name: x.name,
            position: x.position.join("/ ")
        })
    })

    sorted_administration = filterAdministration(admins)

    sorted_administration.forEach((x) => {
        let pages = paginate(x.administration, 15)
        x.administration = [...pages]  
    });

    /*
        MISION, VISION, GOALS, CORE VALUES
    */
    let mvgc = {
        mision: academic_year.mision,
        vision: academic_year.vision,
        goals: academic_year.goals,
        core_values: academic_year.core_values
    }

    let cover_bg    = academic_year.cover_id !== null ? academic_year.cover_id.image : '' //cover background
    let first_bg    = academic_year.template_id.template1 !== null ? academic_year.template_id.template1.image : '' // first page background
    let second_bg   = academic_year.template_id.template2 !== null ? academic_year.template_id.template2.image : '' // commence page background
    let third_bg    = academic_year.template_id.template3 !== null ? academic_year.template_id.template3.image : '' // events page background
    let forth_bg    = academic_year.template_id.template4 !== null ? academic_year.template_id.template4.image : '' // institute and back page background
    let epilogue_image_notes = `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/epilogue_notes.png`

    let logo        = `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.MCC_LOGO}` // mcc logo

    let history     = {
        image: academic_year.history_image,
        content: academic_year.history_content
    }
    
    let sections    = await Section.find({academic_year: academic_year._id}).sort([['program_acronym', 'descending']]) 
    let data        = [] //data holder for alumni objects
    let candidates  = []

    reArrangeAndMerge(sections, ordered_inst).forEach(async (x) => {
        candidates.push(compressCandidates(x, academic_year));
    })

    let gallery = await Gallery.find({academic_year: academic_year._id})
    let sorted_gallery = sortGallery(gallery)

    var nametag_attributes = {
        checked: academic_year.nametag_props.checked,
        color: academic_year.nametag_props.color,
        name: (academic_year.nametag_props.name - 37),
        quotes: (academic_year.nametag_props.quotes - 35),
    } 

    var display_count_result = academic_year.display_count ? academic_year.display_count === 4 ? true : false : false
    
    Promise.all(candidates)
    .then((results) => {
    
        let paginated_candidates = paginateAll(results)

        /*
            rearranging programs according to their institutes
        */
        rearrange(sections, institute_list).forEach(async (x) => {
            data.push(compressSections(x, academic_year));
        })

        Promise.all(data)
        .then((results) => {

            results.forEach((x) => {
                x.graduates.forEach((y) => {
                    let pages = paginate(y.candidates, academic_year.display_count === 4 ? 16 : 9)
                    y.candidates = [...pages]
                })    
            });
        
            const compile = async function(
                template,
                main_text_color,
                main_header_color,
                backpage,
                nametag_props,
                logo,
                objects,
                cover_bg,
                first_page_bg,
                second_page_bg,
                third_page_bg,
                forth_page_bg,
                history,
                commence,
                mvgc,
                administrator,
                candidates,
                ha,
                gallery,
                display_count,
                epilogue,
                honor_speech,
                epilogue_image_notes
            ){
                const filepath = path.join(process.cwd(), 'yearbook', `${template}.handlebars`);
                const html = await fsx.readFile(filepath,'utf-8');
                var template = hbs.compile(html);
                var wrapper  = {
                    main_text_color: main_text_color ? main_text_color : '#000000',
                    main_header_color: main_header_color ? main_header_color : '#000000',
                    backpage: backpage,
                    nametag_props: nametag_props,
                    logo: logo,
                    objects: objects,
                    cover_bg: cover_bg,
                    first_page_bg: first_page_bg,
                    second_page_bg: second_page_bg,
                    third_page_bg: third_page_bg,
                    forth_page_bg: forth_page_bg,
                    history: history,
                    commence: commence,
                    mvgc: mvgc,
                    administrator: administrator,
                    candidates: candidates,
                    ha: ha,
                    gallery: gallery,
                    display_count: display_count,
                    epilogue: epilogue,
                    honor_speech: honor_speech,
                    epilogue_image_notes: epilogue_image_notes
                };
                console.log("converting pdf file, please wait...")
                return template(wrapper);
            };

            (async function() {
                try{
                    const browser = await puppeteer.launch({
                        headless: true,
                        args: ['--no-sandbox', '--font-render-hinting=none', '--disable-setuid-sandbox'],
                    });
                    const page = await browser.newPage();

                    await page.setDefaultNavigationTimeout(1000000);

                    const content = await compile('batch-template', 
                        text_color,
                        header_color,
                        backpage,
                        nametag_attributes,
                        logo,
                        results,
                        cover_bg,
                        first_bg,
                        second_bg,
                        third_bg,
                        forth_bg,
                        history,
                        commence_data,
                        mvgc,
                        sorted_administration,
                        paginated_candidates,
                        honor_and_awards_list,
                        sorted_gallery,
                        display_count_result,
                        epilogue,
                        honor_speech,
                        epilogue_image_notes
                    );

                    await page.setContent(content);
                    await page.emulateMediaType('screen');
                    await page.pdf({
                        path: `${pdf.path}.pdf`,
                        format: 'A4',
                        printBackground: true,
                        timeout: 0
                    });
                    console.log('done');

                    await PDF_YEARBOOK.findByIdAndUpdate(pdf._id, {
                        status: "created",
                        generated: true,
                        uri: `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${pdf.path.substr(pdf.path.indexOf("/") + 1)}.pdf`
                    }, {new: true})

                    let data = []
                    let academic_year = await Academic_Year.findById(pdf.academic_year._id)

                    let pdf_yearbook = await PDF_YEARBOOK.find({academic_year: academic_year._id}).populate('academic_year').populate('section_id')
                    pdf_yearbook.forEach(async (x) => {
                        data.push(flattenDocument(x));
                    })

                    Promise.all(data)
                    .then((results) => {
                        res.json({
                            entry: results,
                            message: `${pdf.target} ${pdf.section_id ? `(${pdf.section_id.section})` : ''} Yearbook Done`
                        })
                    })
                    .catch((e) => {
                        res.status(409).json({ message: e.message });
                    });
                    await page.close();
                }
                catch(e){
                    console.log(e);
                }
            })()
        })
        .catch((e) => {
            console.log(e)
            res.status(409).json({ message: e.message });
        });
       
    })
    .catch((e) => {
        console.log(e)
        res.status(409).json({ message: e.message });
    });
}

exports.generateSYearbook = async(req, res) => {
    console.log("creating section yearbook for a.y ", req.body)

    let pdf = await PDF_YEARBOOK.findById(req.body.id).populate('academic_year').populate('section_id')
    let academic_year = await Academic_Year.findOne({academic_year: pdf.academic_year.academic_year})
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

    let text_color = academic_year.main_text_color
    let header_color = academic_year.main_header_color
    
    var institute_list = await Institute.find({})
    var ordered_inst = []
    
    institute_list.sort(function(a, b) {
        return b.priority_value - a.priority_value;
    });

    institute_list.forEach((item) => {
        ordered_inst.push(item.institute_acronym)
    })

    /*
        MISION, VISION, GOALS, CORE VALUES
    */
    let mvgc = {
        mision: academic_year.mision,
        vision: academic_year.vision,
        goals: academic_year.goals,
        core_values: academic_year.core_values
    }

    let cover_bg    = academic_year.cover_id !== null ? academic_year.cover_id.image : '' //cover background
    let first_bg    = academic_year.template_id.template1 !== null ? academic_year.template_id.template1.image : '' // first page background
    let second_bg   = academic_year.template_id.template2 !== null ? academic_year.template_id.template2.image : '' // commence page background
    let third_bg    = academic_year.template_id.template3 !== null ? academic_year.template_id.template3.image : '' // events page background
    let forth_bg    = academic_year.template_id.template4 !== null ? academic_year.template_id.template4.image : '' // institute and back page background
    let logo        = `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${process.env.MCC_LOGO}` // mcc logo

    let sections    = await Section.find({_id: pdf.section_id._id}).sort([['program_acronym', 'descending']]) 
    let data        = [] //data holder for alumni objects
    let candidates  = []

    reArrangeAndMerge(sections, ordered_inst).forEach(async (x) => {
        candidates.push(compressCandidates(x, academic_year));
    })

    var nametag_attributes = {
        checked: academic_year.nametag_props.checked,
        color: academic_year.nametag_props.color,
        name: (academic_year.nametag_props.name - 37),
        quotes: (academic_year.nametag_props.quotes - 35),
    } 

    var display_count_result = academic_year.display_count ? academic_year.display_count === 4 ? true : false : false

    Promise.all(candidates)
    .then((results) => {
    
        let paginated_candidates = paginateAll(results)

        /*
            rearranging programs according to their institutes
        */
        rearrange(sections, institute_list).forEach(async (x) => {
            data.push(compressSections(x, academic_year));
        })

        Promise.all(data)
        .then((results) => {

            results.forEach((x) => {
                x.graduates.forEach((y) => {
                    let pages = paginate(y.candidates, academic_year.display_count === 4 ? 16 : 9)
                    y.candidates = [...pages]
                })    
            });
        
            const compile = async function(
                template, 
                main_text_color,
                main_header_color,
                nametag_props,
                logo, 
                objects,
                cover_bg, 
                first_page_bg, 
                second_page_bg, 
                third_page_bg, 
                forth_page_bg,   
                mvgc,  
                candidates, 
                display_count
            ){
                const filepath = path.join(process.cwd(), 'yearbook', `${template}.handlebars`);
                const html = await fsx.readFile(filepath,'utf-8');
                var template = hbs.compile(html);
                var wrapper  = {
                    main_text_color: main_text_color ? main_text_color : '#000000',
                    main_header_color: main_header_color ? main_header_color : '#000000',
                    nametag_props: nametag_props,
                    logo: logo,
                    cover_bg: cover_bg,
                    first_page_bg: first_page_bg,
                    second_page_bg: second_page_bg,
                    third_page_bg: third_page_bg,
                    forth_page_bg: forth_page_bg,
                    objects: objects,
                    mvgc: mvgc,
                    candidates: candidates,
                    display_count: display_count
                };
                console.log("converting pdf file, please wait...")
                
                return template(wrapper);
            };

            (async function() {
                try{
                    const browser = await puppeteer.launch({
                        headless: true,
                        args: ['--no-sandbox', '--font-render-hinting=none', '--disable-setuid-sandbox'],
                    });
                    const page = await browser.newPage();

                    await page.setDefaultNavigationTimeout(100000);

                    const content = await compile('batch-template', 
                        text_color,
                        header_color,
                        nametag_attributes,
                        logo,
                        results,
                        cover_bg,
                        first_bg,
                        second_bg,
                        third_bg,
                        forth_bg,
                        mvgc,
                        paginated_candidates,
                        display_count_result
                    );
                    await page.setContent(content);
                    await page.emulateMediaType('screen');
                    await page.pdf({
                        path: `${pdf.path}.pdf`,
                        format: 'A4',
                        printBackground: true,
                        timeout: 0
                    });
                    console.log('done');

                    await PDF_YEARBOOK.findByIdAndUpdate(pdf._id, {
                        status: "created",
                        generated: true,
                        uri: `${process.env.PROTOCOL}://${process.env.IP_ADDRESS}:${process.env.PORT}/${pdf.path.substr(pdf.path.indexOf("/") + 1)}.pdf`
                    }, {new: true})

                    let data = []
                    let academic_year = await Academic_Year.findById(pdf.academic_year._id)

                    let pdf_yearbook = await PDF_YEARBOOK.find({academic_year: academic_year._id}).populate('academic_year').populate('section_id')
                    pdf_yearbook.forEach(async (x) => {
                        data.push(flattenDocument(x));
                    })

                    Promise.all(data)
                    .then((results) => {
                        res.json({
                            entry: results,
                            message: `${pdf.target} ${pdf.section_id ? `(${pdf.section_id.program})` : ''} Yearbook Done`
                        })
                    })
                    .catch((e) => {
                        console.log(e)
                        res.status(409).json({ message: e.message });
                    });
                    await browser.close();
                }
                catch(e){
                    console.log(e);
                }
            })()
        })
        .catch((e) => {
            console.log(e)
            res.status(409).json({ message: e.message });
        });
       
    })
    .catch((e) => {
        console.log(e)
        res.status(409).json({ message: e.message });
    });
}

exports.enableLink = async (req, res) => {
    let pdf = await PDF_YEARBOOK.findById(req.body.id)

    await PDF_YEARBOOK.findByIdAndUpdate(req.body.id, {
        status: "active",
    }, {new: true})

    let data = []

    let pdf_yearbook = await PDF_YEARBOOK.find({academic_year: pdf.academic_year}).populate('academic_year').populate('section_id')

    pdf_yearbook.forEach(async (x) => {
        data.push(flattenDocument(x));
    })

    Promise.all(data)
    .then((results) => {
        res.status(201).json(results)
    })
    .catch((e) => {
        res.status(409).json({ message: e.message });
    });
}

exports.disableLink = async (req, res) => {
    let pdf = await PDF_YEARBOOK.findById(req.body.id)

    await PDF_YEARBOOK.findByIdAndUpdate(req.body.id, {
        status: "inactive",
    }, {new: true})

    let data = []

    let pdf_yearbook = await PDF_YEARBOOK.find({academic_year: pdf.academic_year}).populate('academic_year').populate('section_id')

    pdf_yearbook.forEach(async (x) => {
        data.push(flattenDocument(x));
    })

    Promise.all(data)
    .then((results) => {
        res.status(201).json(results)
    })
    .catch((e) => {
        res.status(409).json({ message: e.message });
    });
}

exports.setActive = async (req, res) => {
    let academic_year = await Academic_Year.findOne({academic_year: req.body.academic_year})
    var pdf = await PDF_YEARBOOK.find({academic_year: academic_year._id, $or:[ {status: 'inactive'}, {status: 'created'}] })

    pdf.map((x) => { x.status = 'active'})

    async.eachSeries(pdf, function updateObject (obj, done) {
        PDF_YEARBOOK.findByIdAndUpdate(obj._id, obj, done)
    }, async function allDone (err) {
        let data = []

        let pdf_yearbook = await PDF_YEARBOOK.find({academic_year: academic_year._id}).populate('academic_year').populate('section_id')
    
        pdf_yearbook.forEach(async (x) => {
            data.push(flattenDocument(x));
        })
    
        Promise.all(data)
        .then((results) => { res.status(201).json(results) })
        .catch((e) => { res.status(409).json({ message: e.message }); });
    });
}

exports.setInactive = async (req, res) => {
    let academic_year = await Academic_Year.findOne({academic_year: req.body.academic_year})
    var pdf = await PDF_YEARBOOK.find({academic_year: academic_year._id, status: 'active'})

    pdf.map((x) => { x.status = 'inactive'})

    async.eachSeries(pdf, function updateObject (obj, done) {
        PDF_YEARBOOK.findByIdAndUpdate(obj._id, obj, done)
    }, async function allDone (err) {
        let data = []

        let pdf_yearbook = await PDF_YEARBOOK.find({academic_year: academic_year._id}).populate('academic_year').populate('section_id')
    
        pdf_yearbook.forEach(async (x) => {
            data.push(flattenDocument(x));
        })
    
        Promise.all(data)
        .then((results) => { res.status(201).json(results) })
        .catch((e) => { res.status(409).json({ message: e.message }); });
    });
}