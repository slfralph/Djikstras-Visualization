var  MIN_NUM_CONNECTIONS = 3;
var NUM_NODES = 10;
var WIDTH;
var HEIGHT;
var NODE_SIZE = 10;
var BUFFER = 15;
var FRAMERATE = .5;

var NODE_OUTLINE_WEIGHT = 1.2;
var SHORTEST_PATH_LINE_WEIGHT = 1;

var USE_RANDOM_WEIGHTS = true;

var nodes;
var unvisited_set;
var current_node;
var shortest_path;
var next_node;
var min_distance;

var drawingSearchingEdges = false;
var node_to_draw = 0;

// BACKGROUND
// 221, 217, 217

// CURRENT NODE
// 255, 167, 5

// CURRENT OUTLINE
// 249, 145, 17

// START NODE
// 102, 252, 2

// START OUTLINE
// 28, 188, 0

// TARGET NODE
// 255, 58, 58

// TARGET OUTLINE
// 249, 37, 37

// VISITED
// 66, 134, 244

// VISITED OUTLINE
// 30, 116, 255

class Node {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.distance = Number.MAX_SAFE_INTEGER;
    this.neighbors = new Set();
    this.visited = false;
    this.current = false;
    this.target = false;

  }

  drawEdges() {
    // TODO: ADD COLOR GRADIENT FOR THE EDGES DEPENDING ON WEIGHT
    for (let n of this.neighbors) {
      stroke(0, 0, 0, 10);
      if (n != null) {
        line(this.x, this.y, n.node.x, n.node.y);
      }
    }
  }

  drawSearchingEdge() {
    var iteration = 1;
    stroke(249, 145, 17);
    for (let n of this.neighbors) {
      if (n != null && !n.node.visited) {
        line(this.x, this.y, n.node.x, n.node.y);
      }
      iteration = iteration + 1;
    }
  }


  drawNode() {
    if (this.start) {
      // stroke(28, 188, 0);
      // strokeWeight(NODE_OUTLINE_WEIGHT);
      fill(102, 252, 2);
    } else if (this.target) {
      // stroke(249, 37, 37);
      // strokeWeight(NODE_OUTLINE_WEIGHT);
      fill(255, 58, 58);
    } else if (this.current) {
      // stroke(249, 145, 17);
      // strokeWeight(NODE_OUTLINE_WEIGHT);
      fill(249, 145, 17);
    } else if (this.visited) {
      // stroke(30, 116, 255);
      // strokeWeight(NODE_OUTLINE_WEIGHT);
      fill(66, 134, 244);
    } else {
      fill(0, 0, 0, 100);
    }
    ellipse(this.x, this.y, NODE_SIZE);
  }
}

function setup() {
  WIDTH = windowWidth;
  HEIGHT = windowHeight;
  createCanvas(WIDTH, HEIGHT);


  // INITIALIZE COLLECTIONS
  nodes = new Array();
  unvisited_set = new Set();
  shortest_path = new Array();

  // CREATE NODES
  var y_noise = 10;
  for (i = 0; i < NUM_NODES; i++) {
    nodes.push(new Node(random(BUFFER, WIDTH - BUFFER), map(noise(y_noise), 0, 1, 0, HEIGHT)));
    y_noise = y_noise + .5;

    // CONNECT CURRENT NODE WITH PREVIOUS TO ENSURE A CONNECTED GRAPH
    if (i > 0) {
      weight = USE_RANDOM_WEIGHTS ? random() : 1;
      nodes[i].neighbors.add({
        node: nodes[i - 1],
        weight: weight
      });
      nodes[i - 1].neighbors.add({
        node: nodes[i],
        weight: weight
      });
    }
  }

  // SORT BY X VAL
  nodes.sort(function(a, b) {
    return a.x - b.x;
  });

  // SET BEGIN AND END NODES
  current_node = nodes[0];
  nodes[0].start = true;
  nodes[0].current = true;
  nodes[0].distance = 0;
  nodes[nodes.length - 1].target = true;

  // ADD NEIGHBORS
  var nbor;
  var weight;
  for (i = 0; i < nodes.length; i++) {
    while (nodes[i].neighbors.size < MIN_NUM_CONNECTIONS) {
      // FIND A RANDOM UNIQUE NEIGHBOR
      do {
        nbor = random(nodes);
      } while (equals(nbor, nodes[i]) || contains(nodes[i].neighbors, nbor));
      // GENERATE RANDOM WIEGHT FOR EDGE
      weight = USE_RANDOM_WEIGHTS ? random() : 1;
      // ADD EACHOTHER AS NEIGHBORS
      nodes[i].neighbors.add({
        node: nbor,
        weight: weight
      });
      nbor.neighbors.add({
        node: nodes[i],
        weidth: weight
      });
    }
  }
  // ADD ALL NODES TO THE UNVISITED SET
  for (let n of nodes) {
    unvisited_set.add(n);
  }
}

function draw() {
  background(221, 217, 217);

  if (drawingSearchingEdges) {
    frameRate(30);
    stroke(249, 145, 17);
    if (node_to_draw < current_node.neighbors.size){
      var n = current_node.neighbors.iterable[node_to_draw];
      line(current_node.x, current_node.y, n.node.x, n.node.y);
      node_to_draw = node_to_draw + 1;
    }
    if (node_to_draw == current_node.neighbors.size) {
      drawingSearchingEdges = false;
      node_to_draw = 0;
    }
    // current_node.drawSearchingEdge();
  } else {
    frameRate(FRAMERATE);

    // UPDATE DJIKSTRAS ------------------------------------------------------------------------------
    if (current_node.target) {
      noLoop();
      drawMinPath();
      console.log("SHORTEST PATH FOUND!");
      console.log("SHORTEST PATH", shortest_path);
    } else {
      // CALCULATE NET NEIGHBOR DISTANCES
      calcNeighborDistance();

      // SET CURRENT NODE AS VISITED AND REMOVE FROM UNIVISITED SET
      current_node.visited = true;
      unvisited_set.delete(current_node);

      // FIND THE NEXT NODE
      min_distance = Number.MAX_SAFE_INTEGER;
      findNextNode();

      // SET NEXT NODE
      if (min_distance == Number.MAX_SAFE_INTEGER) {
        console.log("UNCONNECTED GRAPH, CANNOT FINISH SEARCH!");
        noLoop();
      }
    }
    // -----------------------------------------------------------------------------------------------

    // DRAW ALL NODES AND THEIR EDGES
    noStroke();
    strokeWeight(1);
    for (i = 0; i < nodes.length; i++) {
      nodes[i].drawEdges();
    }
    for (i = 0; i < nodes.length; i++) {
      nodes[i].drawNode();
    }

    current_node.current = false;
    current_node = next_node;
    current_node.current = true;


  }
}


// HELPER FUNCTIONS --------------------------------------------------------------------------------

function distance(a, b) {
  return sq(a.x - b.x) + sq(a.y - b.y);
}

function equals(n1, n2) {
  return n1.x == n2.x && n1.y == n2.y;
}

function contains(neighbor, node) {
  var ret = false;
  for (let n of neighbor) {
    if (n.node.x == node.x && n.node.y == node.y) {
      ret = true;
    }
  }
  return ret;
}

function drawMinPath() {
  stroke(0);
  strokeWeight(SHORTEST_PATH_LINE_WEIGHT);

  while (!equals(current_node, nodes[0])) {
    shortest_path.push(current_node);
    var min_distance = Number.MAX_SAFE_INTEGER;
    var next;
    for (let n of current_node.neighbors) {
      if (n.node.distance < min_distance) {
        min_distance = n.node.distance;
        next = n.node;
      }
    }
    line(current_node.x, current_node.y, next.x, next.y);
    current_node = next;
  }
}

function calcNeighborDistance() {
  var calculated_dis;
  for (let ob of current_node.neighbors) {
    // UPDATE NEIGHBOR DISTANCE IF IT IS SMALLER THAN ITS CURRENT DISTANCE
    calculated_dis = current_node.distance + distance(current_node, ob.node) * ob.weight;
    ob.node.distance = calculated_dis < ob.node.distance ? calculated_dis : ob.node.distance;

    drawingSearchingEdges = true;
    // current_node.drawSearchingEdge();
  }
}

function findNextNode() {
  for (let n of unvisited_set) {
    if (n.distance < min_distance) {
      min_distance = n.distance;
      next_node = n;
    }
  }
}
