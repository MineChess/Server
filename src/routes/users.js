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
                username: sanitizedUsername.toLowerCase(),
                password: hashedPassword,
                rating: '1000'
            }
        })

        res.send({ msg: "User created." })
    }
    catch (error) {
        console.log(error)
        res.status(500).send({ msg: "Error: Try a different username" })
    }
})

router.get('/', authorize, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true
            }
        });
        res.send(users);
    } catch (error) {
        console.log(error);
        res.status(500).send({ msg: "Error fetching users" });
    }
});

router.post('/login', async (req, res) => {
    const user = await prisma.user.findUnique({
        where: {
            username: req.body.username.toLowerCase()
        }
    })

    if (user == null) {
        console.log("BAD USERNAME")
        return res.status(401).send({ msg: "Invalid credentials" })
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

    res.send({ msg: "Login OK", jwt: token, user: req.body.username.toLowerCase() })
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

router.delete('/:username', authorize, async (req, res) => {
    try {
        const username = req.params.username;

        // Check that user exists and user is a user in user
        const user = await prisma.user.findFirst({
            where: {
                username: username,
                id: req.userData.sub
            }
        });

        if (!user) {
            return res.status(404).send({ msg: "User not found or you are not authorized to delete it" });
        }

        // Delete user
        await prisma.user.delete({
            where: {
                username: username
            }
        });

        res.send({ msg: "User deleted" });
    } catch (error) {
        console.log(error);
        res.status(500).send({ msg: error });
    }
});

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