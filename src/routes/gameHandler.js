const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const authorize = require('../middleware/auth')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const prisma = new PrismaClient()
const validator = require('validator')

router.post('/', authorize, async (req, res) => {
    console.log('Player 1 ID:', req.body.player1Id)
    console.log('Player 2 ID:', req.body.player2Id)
    console.log('aaaaaa', req.body.moves)
    try {
        const game = await prisma.game.create({
            data: {
                player1Id: req.body.player1Id,
                player2Id: req.body.player2Id,
                moves: req.body.moves
            }
        })
        res.send({ msg: 'Game created', })
    } catch (error) {
        console.log(error)
        res.status(500).send({ msg: "ERROR" })
    }
})

router.get('/', async (req, res) => {

    try {
        const games = await prisma.game.findMany({
            where: {
                OR: [
                    { player1Id: req.userData.sub },
                    { player2Id: req.userData.sub }
                ]
            }
        })
        res.send({ msg: "Games fetched successfully!", games: games })
    } catch (error) {
        console.log(error)
        res.status(500).send({ msg: "Error fetching games" })
    }
})

router.put('/', authorize, async (req, res) => {
    try {
        const game = await prisma.game.update({
            where: {
                id: req.body.id
            },

            data: {
                moves: req.body.moves
            }
        })
        res.send({ msg: "Game updated", game: game })
    } catch (error) {
        console.log(error)
        res.status(500).send({ msg: "ERROR" })
    }
})

router.delete('/', authorize, async (req, res) => {
    try {
        //Check that game exists and player is a player in game
        const game = await prisma.game.findFirst({
            where: {
                id: req.body.id,
                OR: [
                    { player1Id: req.userData.sub },
                    { player2Id: req.userData.sub }
                ]
            }
        });

        if (!game) {
            return res.status(404).send({ msg: "Game not found or you are not authorized to update it" });
        }

        //Update game
        const updatedGame = await prisma.game.update({
            where: {
                id: req.body.id
            },
            data: {
                moves: req.body.moves
            }
        });

        res.send({ msg: "Game updated", game: updatedGame });
    } catch (error) {
        console.log(error);
        res.status(500).send({ msg: "ERROR" });
    }
})

module.exports = router