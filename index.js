// npm pacakages =================================
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { Server } from 'socket.io';
import { createServer } from 'http';

//initialize express ====================================
const PORT = process.env.PORT || 5000;
let app = express();
//=======================================================

//set approot ===========================================
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
global.appRoot = path.resolve(__dirname);


//json limit and parsers ==================================
app.use(express.json({ limit: "10mb", extended: true }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.options('*', cors());
app.use(express.static('public'));
//===========================================================
let isWhite = true;

app.get('*',async (req,res) =>{
    res.sendFile(path.join(__dirname,'/public/index.html'));
});

const httpServer = createServer(app);
const io = new Server(httpServer,{ cors: { origin: "*" } });

io.on("connection", (socket) => {

    socket.emit("color",isWhite ? 'white' : 'black')
    isWhite = !isWhite
    socket.on("send_move", (args) => {
        console.log(args);
        io.emit("recieve_move",args);
    })
    socket.on("players", (args) => {
      console.log(args);
      io.emit("players",args);
  })
  });


httpServer.listen(PORT,() => {
    console.log("Running at port::"+PORT)
  });
  
