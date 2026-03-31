const { setServers } = require("node:dns/promises");
setServers(["1.1.1.1", "8.8.8.8"]);

const express = require('express');
const dotenv = require('dotenv');
// cookie to store token
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

// prevent injection
const expressMongoSanitize = require('@exortek/express-mongo-sanitize');
const helmet = require('helmet');
const {xss} = require('express-xss-sanitizer');

// Rate limit
const rateLimit = require('express-rate-limit');

// query
const hpp = require('hpp');
const path = require("path");

// Cors
const cors = require('cors');

//route file
const shop = require('./routes/shops');
const reservation = require('./routes/reservations');
const auth = require('./routes/auth');
const shopUpload = require("./controllers/shopUpload");
const rating = require('./routes/ratings')

//load env
dotenv.config({path:'./config/config.env'});

//connect to db
connectDB();

const app = express();
//body parser
app.use(express.json());
//cookie parser
app.use(cookieParser());

// Enable cors with credentials so frontend can send cookies
app.use(
    cors({
        origin: `${process.env.NODE_ENV==="development" ? 'http://localhost:3000' : 'https://jobphobia.vercel.app'}`,
        credentials: true,
    })
);

// Sanitize data
//app.use(expressMongoSanitize());
//app.use(xss());

// Set security helmet
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: 10*60*1000, // 10 min
    max: 100
});

app.use(limiter)

// Prevent http param pollution
app.use(hpp());


//mount router
app.use("/api/v1/shops", shopUpload);
app.use('/api/v1/shops', shop);
app.use('/api/v1/auth', auth);
app.use('/api/v1/reservations', reservation);
app.use('/api/v1/ratings', rating)

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// set parser for pagination
app.set('query parser', 'extended');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, 
    console.log('Server running in ', 
        process.env.NODE_ENV, 
        ' mode on port ', PORT)
    );

//handle unhandled promise rejectiom
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    //close server && exit port
    server.close(() => process.exit(1));
})