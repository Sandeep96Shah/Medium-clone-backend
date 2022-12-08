const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URL, {
    dbName: "medium-clone-new",
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {console.log("Connected to mongodb")})
.catch((err) => {console.log("Error", err)})