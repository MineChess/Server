const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const authorize = require('../middleware/auth')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const prisma = new PrismaClient()
const validator = require('validator')

router.post('/', async (req, res) => {

    // Sanitize inputs, GPT
    const sanitizedUsername = validator.trim(req.body.username);
    const sanitizedPassword = validator.trim(req.body.password);

    // Validate inputs, GPT
    if (!validator.isAlphanumeric(sanitizedUsername) || !validator.isLength(sanitizedUsername, { min: 3, max: 20 })) {
        return res.status(400).send({ msg: "Invalid username. It must be alphanumeric and between 3 to 20 characters long" })
    }

    if (!validator.isLength(sanitizedPassword, { min: 6 })) {
        return res.status(400).send({ msg: "Password must be at least 6 characters long" })
    }

    const hashedPassword = await bcrypt.hash(sanitizedPassword, 10)

    try {
        const newUser = await prisma.user.create({
            data: {
                username: sanitizedUsername,
                password: hashedPassword,
                rating: '1000'
            }
        })

        res.send({ msg: "User created." })
    }
    catch (error) {
        console.log(error)
        res.status(500).send({ msg: "ERROR" })
    }
})

router.post('/login', async (req, res) => {
    const user = await prisma.user.findUnique({
        where: {
            username: req.body.username
        }
    })

    if (user == null) {
        console.log("BAD USERNAME")
        return res.status(401).send({ msg: "User not found" })
    }
    const match = await bcrypt.compare(req.body.password, user.password)

    if (!match) {
        console.log("BAD PASSWORD")
        return res.status(401).send({ msg: "Invalid credentials" })
    }

    const token = await jwt.sign({
        sub: user.id,
        username: user.username,
        rating: user.rating
    }, process.env.JWT_SECRET, { expiresIn: '1d' })

    res.send({ msg: "Login OK", jwt: token })
})

router.put('/', authorize, async (req, res) => {
    // Sanitize and validate new rating, GPT
    const newRating = validator.trim(req.body.newRating);
    if (!validator.isNumeric(newRating)) {
        return res.status(400).send({ msg: "Invalid rating. It must be a numeric value" });
    }

    try {
        const newUser = await prisma.user.update({
            where: {
                id: req.userData.sub,
            },
            data: {
                rating: req.body.newRating
            }
        })

        res.send({ msg: "Rating updated" })
    }
    catch (error) {
        console.log(error)
        res.status(500).send({ msg: "User not found." })
    }
})

router.delete('/', authorize, async (req, res) => {

    try {
        const user = await prisma.user.delete({
            where: {
                id: req.userData.sub
            }
        })
        res.send("User deleted!")
    } catch (error) {
        res.status(500).send({ msg: "User not found." })
    }
})

router.get('/profile', authorize, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: req.userData.sub
            }
        })

        res.send({ msg: `Hej ! ${user.username}` })
    }
    catch (error) {
        res.status(500).send({ msg: "ERROR" })
    }
})

module.exports = router