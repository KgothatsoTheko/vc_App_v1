const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const {connectDB, bucket} = require('./dbconn/dbconn')
const routes = require('./routes/routes')
dotenv.config()
const app = express()

//middleware
app.use(express.json())
app.use(cors())
app.use('/api', routes)

//connection to DB
connectDB()
.then(()=> {
    const PORT = process.env.PORT || 3000
    app.listen(PORT, ()=> {
    console.log(`Server connected to ${PORT}`)
    })
})
.catch((error) => {
    console.log(`Falied to connect to database: ${error.message}`);
    
})
