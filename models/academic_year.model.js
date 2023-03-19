const mongoose      = require('mongoose')
const Schema        = mongoose.Schema

const batchSchema = new Schema({
    academic_year: { type: String },
    multipage: {type: Boolean},
    mision: { type: String },
    vision: { type: String },
    goals: { type: String },
    core_values: { type: String },
    history_image: { type: String },
    history_content: { type: String },
    epilogue: { type: String },
    acknowledgement: { type: String },
    main_text_color: { type: String },
    main_header_color: { type: String },
    nametag_text_color: { type: String },
    prayer: { type: String },
    oath: { type: String },
    pledge: { type: String },
    display_count: { type: Number },
    graduation_song:  { 
        song_title: { type: String },
        singer: { type: String },
        lyrics: { type: String }
    },
    closing_song: { 
        song_title: { type: String },
        singer: { type: String },
        lyrics: { type: String }
    },
    template_id: {
        template1: {
            type: Schema.Types.ObjectId,
            ref: 'Template'
        },
        template2: {
            type: Schema.Types.ObjectId,
            ref: 'Template'
        },
        template3: {
            type: Schema.Types.ObjectId,
            ref: 'Template'
        },
        template4: {
            type: Schema.Types.ObjectId,
            ref: 'Template'
        }
    },
    cover_id: {
        type: Schema.Types.ObjectId,
        ref: 'Cover'
    },
    nametags_id: {
        type: Schema.Types.ObjectId,
        ref: 'Nametags'
    },
    nametag_props: {}
},{
    timestamps: true,
    collection: "academic_year"
})

const Batch = mongoose.model('Academic_Year', batchSchema)

module.exports = Batch

// const batchSchema = new Schema({
//     academic_year: { type: String },
//     multipage: {type: Boolean},
//     mision: { type: String },
//     vision: { type: String },
//     template_id: {
//         template1: {
//             type: Schema.Types.ObjectId,
//             ref: 'Template'
//         },
//         template2: {
//             type: Schema.Types.ObjectId,
//             ref: 'Template'
//         },
//         template3: {
//             type: Schema.Types.ObjectId,
//             ref: 'Template'
//         },
//         template4: {
//             type: Schema.Types.ObjectId,
//             ref: 'Template'
//         },
//         template5: {
//             type: Schema.Types.ObjectId,
//             ref: 'Template'
//         }
//     },
//     cover_id: {
//         type: Schema.Types.ObjectId,
//         ref: 'Cover'
//     },
//     nametags_id: {
//         type: Schema.Types.ObjectId,
//         ref: 'NameTags'
//     },
//     frame_id: {
//         type: Schema.Types.ObjectId,
//         ref: 'Frame'
//     },
//     banner_id: {
//         type: Schema.Types.ObjectId,
//         ref: 'Banner'
//     }
// },{
//     timestamps: true,
//     collection: "academic_year"
// })
