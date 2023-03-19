const https             = require('https');
const hsts              = require('hsts')
const express           = require('express')
const cors              = require('cors')
const mongoose          = require('mongoose')
const morgan            = require('morgan')
const path              = require('path')
const exercise_route    = require('./routes/exercises')
const user_route        = require('./routes/users')
const puppeteer         = require('puppeteer')
const fs                = require('fs')

const alumni_r          = require('./routes/alumni')
const academic_year_r   = require('./routes/batch')

const frame_r           = require('./routes/frame')
const banner_r          = require('./routes/banner')

const cover_r           = require('./routes/page_cover')
const nametags_r        = require('./routes/nametags')
const template_r        = require('./routes/template')
const institute_r       = require('./routes/institute')
const commence_r        = require('./routes/commence')
const events_r          = require('./routes/events')
const pdfYearbook_r     = require('./routes/pdf-control')
const administrators_r  = require('./routes/administrators')
const ha_r              = require('./routes/honor-and-awards')
const auth_r            = require('./routes/auth')
const profile_r         = require('./routes/profile')
const accounts_r        = require('./routes/accounts')
const orders_r          = require('./routes/orders')
const home_r            = require('./routes/home')
const gallery_r         = require('./routes/gallery')
const inbox_r           = require('./routes/inbox')

require('dotenv').config()


const options = {
    // key: fs.readFileSync('/etc/letsencrypt/live/mccyearbook.ddns.net/privkey.pem'), // Replace with the path to your key
    // cert: fs.readFileSync('/etc/letsencrypt/live/mccyearbook.ddns.net/fullchain.pem') // Replace with the path to your certificate
}

const app = express()
const port = process.env.PORT || 5000

// mongoose.connect(`mongodb://127.0.0.1:27017/${process.env.DATABASE}`, {useNewUrlParser: true, useUnifiedTopology: true})
// .then(() => process.env.PROTOCOL === 'https' ? 
//     https.createServer(options, app).listen(port, (err)=> {
//         if(err) throw err
//         console.log(`Server is running on PORT: ${port}`)
//     }) : app.listen(port, (err)=> {
//         if(err) throw err
//         console.log(`Server is running on PORT: ${port}`)
//     }
// ))

// .catch((err) => console.log(err.message))
const db = mongoose.connection


// mongoose.set("useFindAndModify", false)
// db.on('error', (err) => {
//     console.log(err)
// })
mongoose.connect(`mongodb+srv://RazorScythe:QMciXCA2YyiaqmRX@cluster0.idzctai.mongodb.net/?retryWrites=true&w=majority`, {useNewUrlParser: true, useUnifiedTopology: true})
.then(() => {process.env.PROTOCOL === 'https' ? 
    https.createServer(options, app).listen(port, (err)=> {
        if(err) throw err
        console.log(`Server is running on PORT: ${port}`)
    }) : app.listen(port, (err)=> {
        if(err) throw err
        console.log(`Server is running on PORT: ${port}`)
})})

db.once('open', () => {
    console.log('Database Connection Established')
})


app.use(hsts({
    maxAge: 31536000,        // Must be at least 1 year to be approved
    includeSubDomains: true, // Must be enabled to be approved
    preload: true
}))

app.use(morgan('dev'))
app.use(express.urlencoded({
    limit: '50mb',
    parameterLimit: 100000,
    extended: true 
}))


app.get("/", (req, res) => {
    console.log("OK")
    res.send("ok")
})

app.use(express.json({limit: '150mb'}))

app.use(cors())

app.use(express.static(path.join(__dirname,'/public')));

app.use('/exercises', exercise_route)
app.use('/users', user_route)

app.use('/home', home_r)

app.use('/admin/alumni', alumni_r)
app.use('/admin/orders', orders_r)
app.use('/admin/academic_year', academic_year_r)
app.use('/admin/template', template_r)
app.use('/admin/cover', cover_r)
app.use('/admin/nametags', nametags_r)

app.use('/admin/frame', frame_r)
app.use('/admin/banner', banner_r)

app.use('/admin/institute', institute_r)
app.use('/admin/commence', commence_r)
app.use('/admin/events', events_r)
app.use('/admin/pdf', pdfYearbook_r)
app.use('/admin/administrators', administrators_r)
app.use('/admin/honor-and-awards', ha_r)
app.use('/admin/auth', auth_r)
app.use('/admin/profile', profile_r)
app.use('/admin/accounts', accounts_r)
app.use('/admin/gallery', gallery_r)
app.use('/admin/inbox', inbox_r)

app.get('/hello', (req, res) => {
  res.send('Hello World!')
})

const exp_hbs  = require('express-handlebars')


const User                  = require('./models/user.model')
const bcrypt                = require("bcryptjs")

async function defaultAdmin() {
    let default_admin = await User.find({username: 'admin'})
    if(default_admin.length > 0) return

    let password = "admin"

    try {
        console.log("OK")
        let hashedPassword = await bcrypt.hash(password, 12);

        const newAccount = new User({
            role : "Admin",
            name : 'Default Admin',
            username : 'admin',
            password: hashedPassword
        })
        await newAccount.save().then("Default Admin created");

    } catch (error) {
        console.log(error)
    }
}

defaultAdmin()
