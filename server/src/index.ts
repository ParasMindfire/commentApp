import cors from "cors"
import express from "express"
import syncTables from "./models";
import { connectDB } from "./config/db";
import router from "./routes";
import { errorHandler } from "./middlewares/errorHandler";


const app= express();

app.use(cors());

app.use(express.json());

app.use(errorHandler);

app.use('/',router);

app.listen('5000',()=>{
    console.log("app is listening to port 5000");
})


const startServer=async()=>{
    try {
        await connectDB();
        await syncTables();
    } catch (error) {
        console.log(error);
    }
}

startServer();

