const container = document.getElementById("container");
const joinMenu = document.getElementById("join-menu");
const joinForm = document.getElementById("join-form");
const joinBtn = document.getElementById("join-btn");
const createBtn = document.getElementById("create-btn");
const canvas = document.getElementById("canvas");

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

class Entity{
  constructor(id, colour, drawFunc) {
    this.id = id
    this.colour = colour;
    this.drawFunc = drawFunc;
  }
}

const drawLine = (ctx, lineEntity)=> {
  let {points, colour} = lineEntity
  ctx.strokeStyle = colour.rgb;
  ctx.beginPath();
  for (let idx = 0; idx < points.length; idx++) {
    const {x, y} = points[idx];
    if (idx == 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }
  ctx.stroke();
}

class LineEntity extends Entity{
  points = [];
  constructor(id, colour, ...points) {
    super(id, colour, drawLine)
    for (const point of points) {
      this.addPoint(point);
    }
  }

  addPoint(point) {
    if (this.points.length == 0 || !point.equalTo(this.points[this.points.length-1])) {
      this.points.push(point)
    }
  }
}

const drawBox = (ctx, boxEntity)=> {
  let {a, b, colour, fill} = boxEntity;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(a.x, b.y)
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = colour.rbg;
    ctx.fill();
  } else {
    ctx.strokeStyle = colour.rgb;
    ctx.stroke();
  }
}

class BoxEntity extends Entity{
  constructor(id, colour, a, b, fill) {
    super(id, colour, drawBox)
    this.a = a;
    this.b = b;
    this.fill = fill;
  }

  setPoint(point) {
    if (!this.b.equalTo(point)) {
      this.b = point;
    }
  }
}

const drawCircle = (ctx, circleEntity)=> {
  let {center, radius, colour, fill} = circleEntity;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
  if (fill) {
    ctx.fillStyle = colour.rgb;
    ctx.fill();
  } else {
    ctx.strokeStyle = colour.rgb;
    ctx.stroke();
  }
}

class CircleEntity extends Entity{
  constructor(id, colour, center, point, fill) {
    super(id, colour, drawCircle)
    this.center = center;
    this.point = point;
    this.fill = fill;
  }

  setPoint(point) {
    if (!this.point.equalTo(point)) {
      this.point = point;
      this.radius = this.center.distTo(point);
    }
  }
}

const entities = [];
let lineCooldown = 0;
let localEntity;

const tools = {
  "line": {
    name: "line",
    start: (point, colour)=>{
      console.log(`Start line tool @ ${point.x} ${point.y}`)
      localEntity = new LineEntity(-1, colour, point);
    },
    tick: (point)=>{
        console.log(`Tick line tool @ ${point.x} ${point.y}`)
        localEntity.addPoint(point);
    },
    end: (point)=>{
      console.log(`End line @ ${point.x} ${point.y}`)
      localEntity.addPoint(point);
      entities.push(localEntity);
    }
  },
  "box": {
    name: "box",
    start: (point, colour)=>{
      console.log(`Start box tool @ ${point.x} ${point.y}`)
      localEntity = new BoxEntity(-1, colour, point, new Point(point.x, point.y));
    },
    tick: (point)=>{
        console.log(`Tick box tool @ ${point.x} ${point.y}`)
        localEntity.setPoint(point);
    },
    end: (point)=>{
      console.log(`End box @ ${point.x} ${point.y}`)
      localEntity.b = point;
      entities.push(localEntity);
    }
  },
  "circle": {
    name: "circle",
    start: (point, colour)=>{
      console.log(`Start circle tool @ ${point.x} ${point.y}`);
      localEntity = new CircleEntity(-1, colour, point, point);
    },
    tick: (point)=>{
        console.log(`Tick circle tool @ ${point.x} ${point.y}`);
        localEntity.setPoint(point);
    },
    end: (point)=>{
      console.log(`End circle @ ${point.x} ${point.y}`);
      localEntity.setPoint(point);
      entities.push(localEntity);
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

const startUsingTool = (point, colour)=> {
  if (!isUsingTool) {
    console.log(`Start using tool: ${currentTool.name} with ${colour.id}`);
    isUsingTool = true;
    currentTool.start(point, colour);
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

const radios = document.querySelectorAll("input");
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

canvas.addEventListener("mousedown", e => {startUsingTool(new Point(e.offsetX, e.offsetY), currentColour)});
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