require("dotenv").config(); // must run first so process.env is populated 

const app = require("./app");
const connectDB = require("./src/config/db");
const PORT = process.env.PORT || 3000;


const start = async () => {
    try{
        await connectDB(); // don't start listening unless the db connects
        app.listen(PORT, ()=> {
            console.log(`Server running on port ${PORT}`)
        })
    } catch (err){
        console.error("Startup failed: ", err.message);
        process.exit(1);
    }
}

start();