const express = require('express')
require('dotenv').config()
const PORT = process.env.PORT || 3000
const app = express()
app.use(express.json())

app.get('/', (req, res) => {
    res.send("Nothing of note here.")
})

const usersRouter = require('./routes/users')
app.use('/users', usersRouter)

app.listen(PORT, () => {
    console.log(`Server listening on port http://localhost:${PORT}`)
})
