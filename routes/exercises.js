const express       = require('express')
const mongoose      = require('mongoose')
const router        = express.Router()
const Exercise      = require('../models/exercise.model')
const bcrypt        = require('bcryptjs')
const jwt           = require('jsonwebtoken')

const User          = require('../models/user.model')

const auth          = require('../middleware/auth')

router.get('/', (req, res, next) => {
    Exercise.find()
        .then(exercises => res.json(exercises))
        .catch(err => res.status(400).json(`Error: ${err}`))
})

router.post('/signup', async (req, res, next) => {
    const { email, password, firstName, lastName } = req.body;
    try {
        const oldUser = await User.findOne({ email });

        if (oldUser) return res.status(400).json({ message: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 12);

        const result = await User.create({ email, password: hashedPassword, name: `${firstName} ${lastName}` });

        const token = jwt.sign( { email: result.email, id: result._id }, 'test', { expiresIn: "1h" } );

        console.log(result)
        console.log(token)

        res.status(201).json({ result, token });
    } catch (error) {
        res.status(500).json({ message: "Something went wrong" });

        console.log(error);
    }
})


router.post('/signin', async (req, res, next) => {
    const { email, password } = req.body

        const existingUser = await User.findOne({ email })

        if(!existingUser) return res.status(404).json({ message: 'User does not exist.' })
    
        const isPasswordCorrect = await bcrypt.compare(password, existingUser.password)

        if(!isPasswordCorrect) return res.status(404).json({ message: "Invalid credentials" })
        
        const token = jwt.sign({ email: existingUser.email, id: existingUser._id }, 'test', { expiresIn: '1h' } )
        
        res.status(200).json({ result: existingUser, token })
})

router.post('/add', auth, async (req, res, next) => {
    // const creator = req.body.creator
    // const title = req.body.title
    // const message = req.body.message
    // const tags = req.body.tags
    // const selectedFile = req.body.tags
    const post = req.body

    const newExercise = new Exercise({...post, creator: req.userId, createdAt: new Date().toISOString() })

    try {
        await newExercise.save();

        res.status(201).json(newExercise);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }

    // newExercise.save()
    // .then(() => res.json('Exercise Added!'))
    // .catch(err => res.status(400).json(`Error: ${err}`))
})

router.get('/:id', (req, res, next) => {
    Exercise.findById(req.params.id)
        .then(exercises => res.json(exercises))
        .catch(err => res.status(400).json(`Error: ${err}`))
})

router.delete('/:id', auth, async (req, res, next) => {
    if(!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).send("No post with that id")
    
    const { id } = req.params
    await Exercise.findByIdAndRemove(id);

    res.json({message: 'Post deleted successfully'})

    // Exercise.findByIdAndDelete(req.params.id)
    //     .then(exercises => res.json('Exercise Deleted!'))
    //     .catch(err => res.status(400).json(`Error: ${err}`))
})

router.patch('/update/:id', auth, async (req, res, next) => {
    if(!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).send("No post with that id")
    const {id: _id} = req.params
    const post = req.body
    
    const updatedPost = await Exercise.findByIdAndUpdate(_id, {...post, _id}, {new: true})
    res.json(updatedPost)
    // Exercise.findById(req.params.id)
    //     .then(exercises => {
    //         exercises.username = req.body.username,
    //         exercises.description = req.body.description,
    //         exercises.duration = Number(req.body.duration),
    //         exercises.date = Date.parse(req.body.date)

    //         exercises.save()
    //         .then(() => res.json('Exercise Updated!'))
    //         .catch(err => res.status(400).json(`Error: ${err}`))
    //     })
    //     .catch(err => res.status(400).json(`Error: ${err}`))
})

module.exports = router