const express = require('express')
require('dotenv').config()
const cors = require('cors')
const PORT = process.env.PORT || 3000
const app = express()
app.use(express.json())

app.use(cors({
    origin: process.env.DEV_ORIGIN
}))

app.get('/', (req, res) => {
    res.send("Nothing of note here.")
})

const usersRouter = require('./routes/users')
app.use('/users', usersRouter)

module.exports = app;

// Only start listening if this script is run directly, not during testing
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Server listening on port http://localhost:${PORT}`);
    });
}