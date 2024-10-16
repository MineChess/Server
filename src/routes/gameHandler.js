const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const authorize = require('../middleware/auth')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const prisma = new PrismaClient()
const validator = require('validator')

router.get('/', authorize, async (req, res) => {

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
        // Validate that the game exists and the user is authorized
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

        // Update the game
        const updatedGame = await prisma.game.update({
            where: {
                id: req.body.id
            },
            data: {
                moves: req.body.moves
            }
        });

        console.log(`Game ${req.body.id} updated`);
        res.send({ msg: "Game updated", game: updatedGame });
    } catch (error) {
        console.log(error);
        res.status(500).send({ msg: "ERROR" });
    }
});

router.delete('/:id', authorize, async (req, res) => {
    try {
        const gameId = req.params.id;

        // Check that game exists and player is a player in game
        const game = await prisma.game.findFirst({
            where: {
                id: gameId,
                OR: [
                    { player1Id: req.userData.sub },
                    { player2Id: req.userData.sub }
                ]
            }
        });

        if (!game) {
            return res.status(404).send({ msg: "Game not found or you are not authorized to delete it" });
        }

        // Delete game
        await prisma.game.delete({
            where: {
                id: gameId
            }
        });

        res.send({ msg: "Game deleted" });
    } catch (error) {
        console.log(error);
        res.status(500).send({ msg: "ERROR" });
    }
});

router.post('/', authorize, async (req, res) => {
    const { player1Id, player2Id, moves } = req.body;

    // Check if both player1Id and player2Id are provided
    if (!player1Id || !player2Id) {
        return res.status(400).send({ msg: "Both player1Id and player2Id are required" });
    }

    try {
        const game = await prisma.game.create({
            data: {
                player1Id: req.userData.sub,
                player2Id: player2Id,
                moves: moves || '', // Initialize moves with empty string if not provided
            }
        });
        res.send({ msg: 'Game created successfully!', game });
    } catch (error) {
        console.log(error);
        res.status(500).send({ msg: "Error creating game" });
    }
});

module.exports = router