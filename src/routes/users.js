const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const authorize = require('../middleware/auth')

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const prisma = new PrismaClient()

router.post('/', async (req, res) => {

    const hashedPassword = await bcrypt.hash(req.body.password, 10)

    try {
        const newUser = await prisma.user.create({
            data: {
                name: req.body.username,
                password: hashedPassword,
                rating: 1000
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

    try {
        const user = await prisma.user.findUnique({
            where: {
                username: req.body.username
            }
        })

        const passwordMatch = await bcrypt.compare(req.body.password, user.password)

        if (!user || !passwordMatch) {
            console.log("Invalid credentials.")
            res.status(401).send({ msg: "Invalid credentials." })
        }

        const token = await jwt.sign({
            sub: user.id,
            name: user.username,
            rating: user.rating,
        }, process.env.JWT_SECRET, { expiresIn: '1h' })

        res.send({ msg: "Logged in!", jwt: token })
    }
    catch (error) {
        res.status(500).send({ msg: "No such user." })
    }
})

router.get('users/profile', authorize, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: req.userData.sub
            }
        })

        res.send({msg: `Hej ! ${user.username}`})
    }
    catch (error) {
        res.status(500).send({ msg: "ERROR" })
    }
})

module.exports = router