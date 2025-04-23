const container = document.getElementById("container");
const joinMenu = document.getElementById("join-menu");
const joinForm = document.getElementById("join-form");
const joinBtn = document.getElementById("join-btn");
const createBtn = document.getElementById("create-btn");
const canvas = document.getElementById("canvas");
const strokeWidthSlider = document.getElementById("stroke-width");
const fillToggle = document.getElementById("fill-toggle");

let webSocket = new WebSocket("wss://ageuxo.org/ws");
console.log("Websocket created on " + webSocket.url);

const sendNewEntity = (entity)=> {
  const payload = {
    type: "add",
    entity: entity
  }
  const json = JSON.stringify(payload);
  webSocket.send(json);
}

webSocket.addEventListener('open', onOpenSocket);
webSocket.addEventListener('message', receivePayload);
webSocket.addEventListener('error', onSocketError);
webSocket.addEventListener('close', onCloseSocket);

function receivePayload(p) {
  console.log('received %s', p.data);
  handlePayload(JSON.parse(p.data));
}

function onSocketError(e) {
  console.log(`Error was thrown: CODE: ${e.code}, REASON: ${e.reason}, CLEAN: ${e.wasCleam}`);
  console.error(e);
}

function onOpenSocket() {
  console.log(`Connected to WebSocket @ ${webSocket.url}`);
  requestSync();
  console.log("Requesting sync from server...");
}

function onCloseSocket() {
  console.log('socket closed');
}

function handlePayload(payload) {
  console.log(`Handling payload from server with type: ${payload.type}.`);
  switch (payload.type) {
    case "add":
      addCleanEntity(payload.entity);
      break;
    case "added":
      const entity = localEntity;
      localEntity = null;
      entity.id = payload.newId;
      entities.push(entity);
      entities.sort((a, b)=> a.id - b.id);
      break;
    case "sync":
      entities = [];
      for (const entity of payload.entities) {
        addCleanEntity(entity);
      }
      break;
    default:
      console.log(`Error handling payload from server: type is not recognized! type: ${payload.type}`);
      break;
  }
}

function addCleanEntity(entity) {
  let newEntity;
  switch (entity.type) {
    case "line":
      console.log(`Adding line entity with id ${entity.id}`);
      newEntity = new LineEntity(entity.id, entity.colour, entity.lineWidth, entity.fill, ...entity.points);
      break;

    case "box":
      console.log(`Adding box entity with id ${entity.id}`);
      newEntity = new BoxEntity(entity.id, entity.colour, entity.a, entity.b, entity.lineWidth, entity.fill);
      break;

    case "circle":
      console.log(`Adding circle entity with id ${entity.id}`);
      newEntity = new CircleEntity(entity.id, entity.colour, entity.center, entity.point, entity.lineWidth, entity.fill);
      break;

    default:
      console.log(`Error adding entity: type is not recognized! type: ${entity.type}`);
      break;
  }
  entities.push(newEntity);
  drawEntities();
}

function requestSync() {
  const payload = {
    type: "sync"
  }
  const json = JSON.stringify(payload);
  webSocket.send(json);
}

class Point{
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  distTo(p) {
    let part = ((p.x - this.x)**2) + ((p.y - this.y)**2);
    let dist = Math.sqrt(part);
    return dist;
  }

  equalTo(p) {
    return this.x == p.x && this.y == p.y;
  }
}

function pointsEqual(p1, p2) {
  return p1.x == p2.x && p1.y == p2.y;
}

class Entity{
  constructor(type, id, colour, drawFunc, lineWidth, fill = false) {
    this.type = type;
    this.id = id
    this.colour = colour;
    this.drawFunc = drawFunc;
    this.lineWidth = lineWidth;
    this.fill = fill;
  }
}

const drawPath = (ctx, colour, lineWidth, fill)=> {
  if (fill) {
    ctx.fillStyle = colour.rgb;
    ctx.fill();
  } else {
    ctx.strokeStyle = colour.rgb;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

const drawLine = (ctx, lineEntity)=> {
  let {points, colour, fill, lineWidth} = lineEntity;
  ctx.beginPath();
  for (let idx = 0; idx < points.length; idx++) {
    const {x, y} = points[idx];
    if (idx == 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }
  drawPath(ctx, colour, lineWidth, fill);
}

class LineEntity extends Entity{
  points = [];
  constructor(id, colour, lineWidth, fill, ...points) {
    super("line", id, colour, drawLine, lineWidth, fill);
    for (const point of points) {
      this.addPoint(point);
    }
  }

  addPoint(point) {
    if (this.points.length == 0 || !pointsEqual(point, this.points[this.points.length-1])) {
      this.points.push(point)
    }
  }
}

const drawBox = (ctx, boxEntity)=> {
  let {a, b, colour, lineWidth, fill} = boxEntity;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(a.x, b.y)
  ctx.closePath();
  drawPath(ctx, colour, lineWidth, fill);
}

class BoxEntity extends Entity{
  constructor(id, colour, a, b, lineWidth, fill) {
    super("box", id, colour, drawBox, lineWidth, fill);
    this.a = a;
    this.b = b;
  }

  setPoint(point) {
    if (!this.b.equalTo(point)) {
      this.b = point;
    }
  }
}

const drawCircle = (ctx, circleEntity)=> {
  let {center, radius, colour, lineWidth, fill} = circleEntity;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
  drawPath(ctx, colour, lineWidth, fill);
}

class CircleEntity extends Entity{
  constructor(id, colour, center, point, lineWidth, fill) {
    super("circle", id, colour, drawCircle, lineWidth, fill);
    this.center = center;
    this.point = point;
    this.radius = this.center.distTo(point);
  }

  setPoint(point) {
    if (!this.point.equalTo(point)) {
      this.point = point;
      this.radius = this.center.distTo(point);
    }
  }
}

let entities = [];
let lineCooldown = 0;
let localEntity;

const tools = {
  "line": {
    name: "line",
    start: (point, colour, lineWidth, fill)=>{
      console.log(`Start line tool @ ${point.x} ${point.y}`)
      localEntity = new LineEntity(-1, colour, lineWidth, fill, point);
    },
    tick: (point)=>{
        console.log(`Tick line tool @ ${point.x} ${point.y}`)
        localEntity.addPoint(point);
    },
    end: (point)=>{
      console.log(`End line @ ${point.x} ${point.y}`)
      localEntity.addPoint(point);
      sendNewEntity(localEntity);
    }
  },
  "box": {
    name: "box",
    start: (point, colour, lineWidth, fill)=>{
      console.log(`Start box tool @ ${point.x} ${point.y}`)
      localEntity = new BoxEntity(-1, colour, point, new Point(point.x, point.y), lineWidth, fill);
    },
    tick: (point)=>{
        console.log(`Tick box tool @ ${point.x} ${point.y}`)
        localEntity.setPoint(point);
    },
    end: (point)=>{
      console.log(`End box @ ${point.x} ${point.y}`)
      localEntity.b = point;
      sendNewEntity(localEntity);
    }
  },
  "circle": {
    name: "circle",
    start: (point, colour, lineWidth, fill)=>{
      console.log(`Start circle tool @ ${point.x} ${point.y}`);
      localEntity = new CircleEntity(-1, colour, point, point, lineWidth, fill);
    },
    tick: (point)=>{
        console.log(`Tick circle tool @ ${point.x} ${point.y}`);
        localEntity.setPoint(point);
    },
    end: (point)=>{
      console.log(`End circle @ ${point.x} ${point.y}`);
      localEntity.setPoint(point);
      sendNewEntity(localEntity);
    }
  },
};
let currentTool = tools["line"];
let isUsingTool = false;

const colourDivs = document.getElementsByClassName("colour");
const colours = [
  {
    id: "red",
    rgb: "#FF0000"
  },
  {
    id: "green",
    rgb: "#00FF00"
  },
  {
    id: "blue",
    rgb: "#0000FF"
  },
  {
    id: "white",
    rgb: "#FFFFFF"
  },
  {
    id: "black",
    rgb: "#000000"
  }
]

let currentColour = colours[0];
let currentLineWidth = 1;
let currentFill = false;

const startUsingTool = (point, colour, lineWidth, fill)=> {
  if (!isUsingTool) {
    console.log(`Start using tool: ${currentTool.name} with ${colour.id}`);
    isUsingTool = true;
    currentTool.start(point, colour, lineWidth, fill);
  }
}

const usingTool = (point)=> {
  if (isUsingTool) {
    console.log(`Using tool: ${currentTool.name}`);
    currentTool.tick(point);
  }
}

const finishUsingTool = (point)=> {
  if (isUsingTool) {
    console.log(`Finish using tool: ${currentTool.name}`);
    currentTool.end(point);
    // TODO: upload local entity
    isUsingTool = false;
  }
}

const drawEntities = ()=> {
  if (canvas.getContext) {
    const drawCtx = canvas.getContext("2d");
    // Clear canvas
    drawCtx.clearRect(0,0,canvas.width, canvas.height)
    
    // Draw entities
    for (const entity of entities) {
      entity.drawFunc(drawCtx, entity);
    }

    if (localEntity != null) {
      localEntity.drawFunc(drawCtx, localEntity);
    }
  }
}

const toolSelector = (e) => {
  if (e.target.checked) {
    currentTool = tools[e.target.value];
    console.log("Selected tool: " + currentTool.name);
  }
}

const colourSelector = (e) => {
  for (const div of colourDivs) {
    div.classList.remove("colour-select")
  }
  e.target.classList.add("colour-select");
  currentColour = colours.find(c=>c.id == e.target.id);
  console.log(`Colour set to ${currentColour.id}`);
}

/* Debug entities
entities.push(
  {
    id: 0,
    drawFunc: drawLine,
    points: [
      { x: 7, y: 8 },
      { x: 17, y: 18 },
      { x: 12, y: 34 },
      { x: 64, y: 85 },
    ],
    colour: colours[0]
  },
  {
    id: 1,
    drawFunc: drawLine,
    points: [
      { x: 12, y: 18 },
      { x: 27, y: 28 },
      { x: 22, y: 54 },
      { x: 84, y: 45 },
    ],
    colour: colours[2]
  }
) */


const radios = document.querySelectorAll("input[type=radio]");
radios.forEach(radio => {
  radio.addEventListener("change", toolSelector)
});

for (let idx = 0; idx < colourDivs.length; idx++) {
  const div = colourDivs[idx];
  let colour = colours[idx];
  div.id = colour.id;
  div.style.backgroundColor = colour.rgb;
  div.addEventListener("click", colourSelector);
}

canvas.addEventListener("mousedown", e => {
  startUsingTool(new Point(e.offsetX, e.offsetY), currentColour, strokeWidthSlider.value, fillToggle.checked);
});
let cooldown = 0;
canvas.addEventListener("mousemove", e => {
  cooldown--;
  usingTool(new Point(e.offsetX, e.offsetY))
  if (cooldown <= 0) {
    drawEntities();
    cooldown = 10;
  }
});
canvas.addEventListener("mouseup", e => {finishUsingTool(new Point(e.offsetX, e.offsetY))});
canvas.addEventListener("mouseleave", e => {finishUsingTool(new Point(e.offsetX, e.offsetY))});

setInterval(()=>{
  drawEntities();
  cooldown = 10;
}, 500);