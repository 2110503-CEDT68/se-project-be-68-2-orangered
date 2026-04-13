const { setServers } = require("node:dns/promises");
setServers(["1.1.1.1", "8.8.8.8"]);

const express = require('express');
const dotenv = require('dotenv');
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

//load env
dotenv.config({path:'./config/config.env'});

//connect to db
connectDB();

const app = express();

//body parser
app.use(express.json());
//cookie parser
app.use(cookieParser());

// 🌟 แก้ไข: อนุญาต CORS ให้อ่านจากพอร์ต 3000 ได้แน่นอน
app.use(
    cors({
        origin: ['http://localhost:3000', 'https://jobphobia.vercel.app'],
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

app.use(limiter);

// Prevent http param pollution
app.use(hpp());

// ==========================================
// 1. ROUTE FILES
// ==========================================
const shop = require('./routes/shops');
const reservation = require('./routes/reservations');
const auth = require('./routes/auth');
const shopUpload = require("./controllers/shopUpload");
const rating = require('./routes/ratings');
const message = require('./routes/messages');
const announcementRoutes = require('./routes/announcementRoutes'); // API ประกาศ

// ==========================================
// 2. MOUNT ROUTERS
// ==========================================
app.use("/api/v1/shops", shopUpload);
app.use('/api/v1/shops', shop);
app.use('/api/v1/auth', auth);
app.use('/api/v1/reservations', reservation);
app.use('/api/v1/ratings', rating);
app.use('/api/v1/messages', message);
app.use('/api/announcements', announcementRoutes); // เส้นทางของ API ประกาศ

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// set parser for pagination
app.set('query parser', 'extended');

const PORT = process.env.PORT || 5003;

const server = app.listen(PORT, 
    console.log('Server running in ', 
        process.env.NODE_ENV, 
        ' mode on port ', PORT)
);

//handle unhandled promise rejection
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    server.close(() => process.exit(1));
});