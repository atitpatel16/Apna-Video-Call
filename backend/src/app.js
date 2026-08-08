import express from "express";
import {createServer} from "http";

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';


import { Server } from "socket.io";

import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManager.js";

import cors from "cors";
import userRoutes from "./routes/users.routes.js";


import dns from "dns";

dns.setServers(["1.1.1.1", "8.8.8.8"]);


const app = express();
const server = createServer(app);
const io = connectToSocket(server);



const __dirname = dirname(fileURLToPath(import.meta.url));

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '../index.html'));
});



app.set("port", (process.env.PORT || 8000));
app.use(cors());

app.use(express.json({limit:"40kb"}));

app.use(express.urlencoded({extended:true, limit:"40kb"}))

app.use("/api/v1/users", userRoutes);




const start = async () =>{
     app.set("mongo_user")
    const connectionDb = await mongoose.connect("mongodb+srv://atitpatel6884_db_user:apnacollege123@cluster0.tddlmuc.mongodb.net/?appName=Cluster0") 
     console.log(`MongoDB Connected DB HOst ${connectionDb.connection.host}`)  
    
    server.listen(app.get("port"),() =>{
        console.log("Listening on port 8000" );
    });
}

start();