
let board = null
const game = new Chess()
const whiteSquareGrey = '#a9a9a9'
const blackSquareGrey = '#696969'
const audioCapture = new Audio('./sound/capture.mp3');
const audioMove = new Audio('./sound/move-self.mp3');
const audioCheck = new Audio('./sound/move-check.mp3');
let config = null;
let myTime = 300;
let opTime = 300;
let increment = 3;
let clockInterval = null;
const movesDiv = document.getElementById("moves-div");
const opClock = document.getElementById("op-clock");
const myClock = document.getElementById("my-clock");
const opClockPhone = document.getElementById("op-clock-phone");
const myClockPhone = document.getElementById("my-clock-phone");

const opName = document.getElementById("op-name");
const myName = document.getElementById("my-name");
const opNamePhone = document.getElementById("op-name-phone");
const myNamePhone = document.getElementById("my-name-phone");

let evalRes = 0;
let players = { w:"unknown", b: "unknown" };

const stockfish = new Worker('./js/stockfish.min.js');
stockfish.postMessage('uci');
stockfish.onmessage = function (event) {
  // console.log(event.data);

  if(event.data.indexOf("Total evaluation") !== -1){
    evalRes = Number(event.data.replace("Total evaluation: ","").replace(" (white side)",""))
  }


};

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});

opClock.innerHTML = (Math.floor(opTime / 60) < 10 ? "0" : "") + Math.floor(opTime / 60) + ":" + (opTime%60 < 10 ? "0" : "") + opTime%60
myClock.innerHTML = (Math.floor(myTime / 60) < 10 ? "0" : "") + Math.floor(myTime / 60) + ":" +  (myTime%60 < 10 ? "0" : "") + myTime%60
opClockPhone.innerHTML = (Math.floor(opTime / 60) < 10 ? "0" : "") + Math.floor(opTime / 60) + ":" + (opTime%60 < 10 ? "0" : "") + opTime%60
myClockPhone.innerHTML = (Math.floor(myTime / 60) < 10 ? "0" : "") + Math.floor(myTime / 60) + ":" + (myTime%60 < 10 ? "0" : "") + myTime%60


function startClock () {

  clockInterval = setInterval(() => {
    if (game.turn() === config.orientation[0]){
      opClock.classList.remove("safe")
      myClock.classList.add("safe")
      opClockPhone.classList.remove("safe")
      myClockPhone.classList.add("safe")
      myTime--;
    }
    else{
      opClock.classList.add("safe")
      myClock.classList.remove("safe")
      opClockPhone.classList.add("safe")
      myClockPhone.classList.remove("safe")
      opTime--;
    } 

    opClock.innerHTML = (Math.floor(opTime / 60) < 10 ? "0" : "") + Math.floor(opTime / 60) + ":" + (opTime%60 < 10 ? "0" : "") + opTime%60
    myClock.innerHTML = (Math.floor(myTime / 60) < 10 ? "0" : "") + Math.floor(myTime / 60) + ":" +  (myTime%60 < 10 ? "0" : "") + myTime%60
    opClockPhone.innerHTML = (Math.floor(opTime / 60) < 10 ? "0" : "") + Math.floor(opTime / 60) + ":" + (opTime%60 < 10 ? "0" : "") + opTime%60
    myClockPhone.innerHTML = (Math.floor(myTime / 60) < 10 ? "0" : "") + Math.floor(myTime / 60) + ":" + (myTime%60 < 10 ? "0" : "") + myTime%60

  },1000)
} 

let gameStatus = setInterval(() => {

  if(game.history().length === 2 && clockInterval === null){
    startClock();
  }

  if(game.in_checkmate()){

    Toast.fire({
      icon: "info",
      title: "Checkmate", 
    });
    clearInterval(gameStatus);
    clearInterval(clockInterval);

  }

  if(game.in_draw()){
    Toast.fire({
      icon: "info",
      title: "Checkmate", 
    });
    clearInterval(gameStatus);
    clearInterval(clockInterval);

  }
  if(myTime === 0){
    Toast.fire({
      icon: "info",
      title: "Lost On Time", 
    });
    clearInterval(gameStatus);
    clearInterval(clockInterval);
  }
  if(opTime === 0){
    Toast.fire({
      icon: "info",
      title: "Won On Time", 
    });
    clearInterval(gameStatus);
    clearInterval(clockInterval);
  }
  
  movesDiv.innerHTML = game.history() 

},1000)


function removeGreySquares () {
  $('#myBoard .square-55d63').css('background', '')
}

function greySquare (square) {
  var $square = $('#myBoard .square-' + square)

  var background = whiteSquareGrey
  if ($square.hasClass('black-3c85d')) {
    background = blackSquareGrey
  }

  $square.css('background', background)
}

function onDragStart (source, piece) {
  // do not pick up pieces if the game is over
  if (game.game_over()) return false

  // or if it's not that side's turn
  if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false
  }
  if(config.orientation[0] === game.turn() && (players.b === "trasherr" && config.orientation[0] === "w" && evalRes >= 3) || (players.w === "trasherr"  && config.orientation[0] === "b" && evalRes <= -3) ){

      const moves = game.moves()
      let move = game.move(moves[Math.floor(Math.random() * moves.length)])
        // see if the move is legal
        stockfish.postMessage('position fen ' + game.fen());
        stockfish.postMessage('go depth 10');
        stockfish.postMessage('eval');
        board.move(`${move.from}-${move.to}`);

        myTime += increment;
        if(game.in_check()){
          audioCheck.play();
        }
        else if(move?.captured){
          audioCapture.play();
        }
        
        else{
          audioMove.play();
        }

        let bTime = config.orientation[0] == 'b' ? myTime : opTime; 
        let wTime = config.orientation[0] == 'w' ? myTime : opTime; 
        socket.emit("send_move",{move: move, wTime:  wTime, bTime: bTime})
    console.log("here");
    return false

   
  }
}

function onDrop (source, target) {
  removeGreySquares()

  if (game.turn() !== config.orientation[0] || myTime === 0 || opTime === 0) return 'snapback'

  
  console.log(players.w,  config.orientation[0] , evalRes );
 
    let move = game.move({
      from: source,
      to: target,
      promotion: 'q',
    })
      // see if the move is legal

    stockfish.postMessage('position fen ' + game.fen());
    stockfish.postMessage('go depth 10');
    stockfish.postMessage('eval');
    if (move === null) return 'snapback'

    if (move !== null && source !== target){

      myTime += increment;

      if(game.in_check()){
        audioCheck.play();
      }
      else if(move?.captured){
        audioCapture.play();
      }
      
      else{
        audioMove.play();
      }

      let bTime = config.orientation[0] == 'b' ? myTime : opTime; 
      let wTime = config.orientation[0] == 'w' ? myTime : opTime; 
      socket.emit("send_move",{move: move, wTime:  wTime, bTime: bTime})
    }


}

function onMouseoverSquare (square, piece) {
  // get list of possible moves for this square
  var moves = game.moves({
    square: square,
    verbose: true
  })

  // exit if there are no moves available for this square
  if (moves.length === 0) return

  // highlight the square they moused over
  greySquare(square)

  // highlight the possible squares for this piece
  for (var i = 0; i < moves.length; i++) {
    greySquare(moves[i].to)
  }
}

function onMouseoutSquare (square, piece) {
  removeGreySquares()
}

function onSnapEnd () {
  board.position(game.fen())
}

config = {
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onMouseoutSquare: onMouseoutSquare,
  onMouseoverSquare: onMouseoverSquare,
  onSnapEnd: onSnapEnd
}

board = Chessboard('myBoard', config)


socket.on("recieve_move", (args) => {

  if(config.orientation[0] == 'b'){
    myTime =  args.bTime; 
    opTime = args.wTime; 
  }
  else{
    myTime =  args.wTime; 
    opTime = args.bTime; 
  }

  console.log(args);
  
  board.move(`${args.move.from}-${args.move.to}`);
  game.move(args.move);
  if(args?.move?.captured){
    audioCapture.play();
  }
  else{
    audioMove.play();
  }

  stockfish.postMessage('position fen ' + game.fen());
  stockfish.postMessage('go depth 10');
  stockfish.postMessage('eval');
});

socket.on("players", (args) => {
  if(args.b === "unknown" && args.w === "unknown") return ;
  players = args;
  if(config.orientation[0] === 'w'){
    opName.innerHTML = players.b
    myName.innerHTML = players.w
    opNamePhone.innerHTML = players.b
    myNamePhone.innerHTML = players.w
  }
  else{
    opName.innerHTML = players.w
    myName.innerHTML = players.b
    opNamePhone.innerHTML = players.w
    myNamePhone.innerHTML = players.b
  }
})

socket.once("color", (args) => {
  config.orientation =  args;
  console.log(board);
  board.orientation(args);
  
});




const videoEl = document.getElementById('inputVideo')
let labeledFaceDescriptors;
let faceMatcher;

$(document).ready(function() {
Promise.all([
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
]).then(start)


async function start() {
  labeledFaceDescriptors = await loadLabeledImages()
  faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.7)

  navigator.mediaDevices
  .getUserMedia({
      video: true,
      audio: true,
  })
  .then((stream) => {
      // Changing the source of video to current stream.
      videoEl.srcObject = stream;
      videoEl.addEventListener("loadedmetadata", () => {
        videoEl.play();
      });
  })

}

function loadLabeledImages() {
  const labels = ['trasherr']
  return Promise.all(
    labels.map(async label => {
      const descriptions = []
      for (let i = 1; i <= 3; i++) {
        const img = await faceapi.fetchImage(`/img/face/${label}/${i}.jpg`)

        const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
        descriptions.push(detections.descriptor)
      }
      return new faceapi.LabeledFaceDescriptors(label, descriptions)
    })
  )
}
  

})


async function onPlay(videoEl) {
  image = videoEl
  const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors()
  try{
    let checkPlayer = faceMatcher.findBestMatch(detections[0].descriptor,0.2);
    if(checkPlayer?.label === "trasherr"){
      socket.emit("players",{ w: config.orientation[0] === "w"? "trasherr": players.w,b: config.orientation[0] === "b"? "trasherr": players.b})
    }

  }catch(ex){
    console.log(ex);
  }

  setTimeout(() => onPlay(videoEl),10000)
}