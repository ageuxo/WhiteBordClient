const container = document.getElementById("container");
const joinMenu = document.getElementById("join-menu");
const joinForm = document.getElementById("join-form");
const joinBtn = document.getElementById("join-btn");
const createBtn = document.getElementById("create-btn");

const entities = [];
const tools = [
  "line",
  "box",
  "circle"
];
let currentTool = tools[0];

const updateSelectedTool = ()=> {
  const selectedTool = document.querySelector('input[name="yourRadioName"]:checked');
  if (selectedTool) {
      currentTool = selectedTool.value;
  }
}

const useTool = (tool)=> {
  

}

const createLine = ()=> {
  
}

const draw = ()=> {
  const canvas = document.getElementById("canvas");
  if (canvas.getContext) {
    const drawCtx = canvas.getContext("2d");
    // Clear canvas
    drawCtx.clearRect(0,0,canvas.width, canvas.height)
    
    // Draw entities
    for (const entity of entities) {
      entity.drawFunc(drawCtx, entity);
    }
  }
}

const drawLine = (ctx, lineEntity)=> {
  let {points, red, green, blue} = lineEntity
  ctx.strokeStyle = `rgb(${red} ${green} ${blue})`
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

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

const toolSelector = (e) => {
  if (e.target.checked) {
    selectedTool = e.target.value;
    console.log("Selected tool: " + selectedTool)
  }
}

entities.push({
  id:0,
  drawFunc: drawLine,
  points: [
    {x: 7, y: 8},
    {x: 17, y: 18},
    {x: 12, y: 34},
    {x: 64, y: 85},
  ],
  red: 200,
  green: 10,
  blue: 20
})

const radios = document.querySelectorAll("input");
radios.forEach(radio => {
  radio.addEventListener("change", toolSelector)
});

setInterval(draw, 500);

/* test 
window.addEventListener("load", async ()=> {
  console.log("Draw 1")
  draw()
  await wait(2000)
  console.log("Draw 2")
  draw()
  await wait(2000)
  console.log("Draw 3")
  draw()
  await wait(2000)
}); */
