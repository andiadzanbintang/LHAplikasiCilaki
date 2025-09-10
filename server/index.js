require('dotenv').config() 
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser')
const helmet = require('helmet')

const app = express()
app.set('trust proxy', 1);

// Mongoose connection
mongoose.connect(process.env.MONGO_URL)
.then(() => console.log("Database Connected"))
.catch((e) => console.log('Database is not connected', e))

// middleware  
app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({extended:false}))
app.use(helmet())


// Cors Configuration
app.use(cors({
    credentials:true,
    origin: [process.env.FRONTEND_URL, 
      "https://www.lhbappenas.fun", 
      "https://lhbappenas.fun", 
      "http://www.lhbappenas.fun", 
      "http://lhbappenas.fun",
      "http://localhost:5173"
    ]
}))


// Routes
app.use("/api/v1/form", require('../server/routes/formRoutes'))
app.use("/api/v1/admin", require("../server/routes/adminRoutes"))
app.get("/", (req, res) => {
    res.send("Server is running!");
  });

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`))