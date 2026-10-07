// Authored research definitions. Prices are frozen separately in prices.js.
export const RESEARCH=[
 {
  "id": 1,
  "name": "START",
  "chapter": 0,
  "max": 1,
  "icon": "Power",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "mul",
    "currency": "money",
    "value": 2
   }
  ],
  "longTerm": false
 },
 {
  "id": 2,
  "name": "UNIT",
  "chapter": 0,
  "max": 1,
  "icon": "Unit",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "add",
    "currency": "money",
    "value": 2
   }
  ],
  "longTerm": false
 },
 {
  "id": 3,
  "name": "INCREMENT",
  "chapter": 0,
  "max": 20,
  "icon": "Plus",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "add",
    "currency": "money",
    "value": 1
   },
   {
    "type": "mul",
    "currency": "money",
    "value": 1.0372
   }
  ],
  "longTerm": false
 },
 {
  "id": 4,
  "name": "MULTIPLY",
  "chapter": 0,
  "max": 5,
  "icon": "X",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "mul",
    "currency": "money",
    "value": 1.2867
   }
  ],
  "longTerm": false
 },
 {
  "id": 5,
  "name": "BUFFER",
  "chapter": 0,
  "max": 1,
  "icon": "Buffer",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "base",
    "currency": "money",
    "value": 1.3899
   }
  ],
  "longTerm": false
 },
 {
  "id": 6,
  "name": "COUNTER",
  "chapter": 0,
  "max": 1,
  "icon": "Counter",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "levels",
    "currency": "money",
    "value": 0.04275,
    "source": "sector"
   }
  ],
  "longTerm": false
 },
 {
  "id": 7,
  "name": "ACCUMULATOR",
  "chapter": 0,
  "max": 1,
  "icon": "Sigma",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "count",
    "currency": "money",
    "value": 0.057
   }
  ],
  "longTerm": false
 },
 {
  "id": 8,
  "name": "BOOTSTRAP",
  "chapter": 0,
  "max": 1,
  "icon": "Terminal",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "mul",
    "currency": "money",
    "value": 1.6851
   }
  ],
  "longTerm": false
 },
 {
  "id": 9,
  "name": "ADDITION",
  "chapter": 1,
  "max": 10,
  "icon": "CirclePlus",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "add",
    "currency": "money",
    "value": 6
   }
  ],
  "longTerm": false
 },
 {
  "id": 10,
  "name": "PRODUCT",
  "chapter": 1,
  "max": 5,
  "icon": "Factory",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "mul",
    "currency": "money",
    "value": 1.2867
   }
  ],
  "longTerm": false
 },
 {
  "id": 11,
  "name": "SERIES",
  "chapter": 1,
  "max": 1,
  "icon": "ListOrdered",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "levels",
    "currency": "money",
    "value": 0.02137
   }
  ],
  "longTerm": false
 },
 {
  "id": 12,
  "name": "SUMMATION",
  "chapter": 1,
  "max": 1,
  "icon": "Summation",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "base",
    "currency": "money",
    "value": 1.3899
   }
  ],
  "longTerm": false
 },
 {
  "id": 13,
  "name": "FACTORIAL",
  "chapter": 1,
  "max": 1,
  "icon": "Asterisk",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "mul",
    "currency": "money",
    "value": 1.6851
   }
  ],
  "longTerm": false
 },
 {
  "id": 14,
  "name": "DISTRIBUTIVE",
  "chapter": 1,
  "max": 1,
  "icon": "Split",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "base",
    "currency": "money",
    "value": 1.5453
   }
  ],
  "longTerm": false
 },
 {
  "id": 15,
  "name": "RATIO",
  "chapter": 1,
  "max": 1,
  "icon": "Ratio",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "discount",
    "currency": "money",
    "value": 0.9
   }
  ],
  "longTerm": false
 },
 {
  "id": 16,
  "name": "COMMON FACTOR",
  "chapter": 1,
  "max": 1,
  "icon": "CommonFactor",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "balance",
    "currency": "money",
    "value": 0.057,
    "source": "money"
   }
  ],
  "longTerm": false
 },
 {
  "id": 17,
  "name": "GEOMETRIC",
  "chapter": 1,
  "max": 20,
  "icon": "ChartNoAxesCombined",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "mul",
    "currency": "money",
    "value": 1.0642
   }
  ],
  "longTerm": false
 },
 {
  "id": 18,
  "name": "REMAINDER",
  "chapter": 1,
  "max": 1,
  "icon": "Percent",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "cache",
    "currency": "money",
    "value": 3
   }
  ],
  "longTerm": false
 },
 {
  "id": 19,
  "name": "CONVERGENCE",
  "chapter": 1,
  "max": 1,
  "icon": "GitMerge",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "balance",
    "currency": "money",
    "value": 0.076,
    "source": "money"
   }
  ],
  "longTerm": false
 },
 {
  "id": 20,
  "name": "ARITHMETIC CORE",
  "chapter": 1,
  "max": 1,
  "icon": "Calculator",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "mul",
    "currency": "money",
    "value": 1.9319
   }
  ],
  "longTerm": false
 },
 {
  "id": 21,
  "name": "VARIABLE",
  "chapter": 2,
  "max": 10,
  "icon": "Variable",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "add",
    "currency": "money",
    "value": 30
   }
  ],
  "longTerm": false
 },
 {
  "id": 22,
  "name": "BASIS",
  "chapter": 2,
  "max": 1,
  "icon": "Basis",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "unlock",
    "currency": "coin",
    "value": 1
   }
  ],
  "longTerm": false
 },
 {
  "id": 23,
  "name": "SCALAR",
  "chapter": 2,
  "max": 10,
  "icon": "Scalar",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "add",
    "currency": "coin",
    "value": 0.3
   }
  ],
  "longTerm": false
 },
 {
  "id": 24,
  "name": "LINEAR",
  "chapter": 2,
  "max": 1,
  "icon": "ChartLine",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "base",
    "currency": "coin",
    "value": 1.4229
   }
  ],
  "longTerm": false
 },
 {
  "id": 25,
  "name": "LOGARITHM",
  "chapter": 2,
  "max": 1,
  "icon": "ChartSpline",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "balance",
    "currency": "money",
    "value": 0.095,
    "source": "money"
   }
  ],
  "longTerm": false
 },
 {
  "id": 26,
  "name": "POLYNOMIAL",
  "chapter": 2,
  "max": 5,
  "icon": "Superscript",
  "payment": [
   "coin"
  ],
  "effects": [
   {
    "type": "mul",
    "currency": "money",
    "value": 1.3899
   }
  ],
  "longTerm": false
 },
 {
  "id": 27,
  "name": "MATRIX",
  "chapter": 2,
  "max": 1,
  "icon": "Grid3X3",
  "payment": [
   "coin"
  ],
  "effects": [
   {
    "type": "count",
    "currency": "money",
    "value": 0.057
   }
  ],
  "longTerm": false
 },
 {
  "id": 28,
  "name": "VECTOR",
  "chapter": 2,
  "max": 1,
  "icon": "MoveUpRight",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "mul",
    "currency": "coin",
    "value": 1.5157
   }
  ],
  "longTerm": false
 },
 {
  "id": 29,
  "name": "TRANSFORM",
  "chapter": 2,
  "max": 1,
  "icon": "Transform",
  "payment": [
   "coin"
  ],
  "effects": [
   {
    "type": "balance",
    "currency": "coin",
    "value": 0.036,
    "source": "money"
   }
  ],
  "longTerm": false
 },
 {
  "id": 30,
  "name": "INNER PRODUCT",
  "chapter": 2,
  "max": 1,
  "icon": "InnerProduct",
  "payment": [
   "money",
   "coin"
  ],
  "effects": [
   {
    "type": "balance",
    "currency": "money",
    "value": 0.21375,
    "source": "coin"
   }
  ],
  "longTerm": false
 },
 {
  "id": 31,
  "name": "EIGENVALUE",
  "chapter": 2,
  "max": 1,
  "icon": "Boxes",
  "payment": [
   "money",
   "coin"
  ],
  "effects": [
   {
    "type": "mul",
    "currency": "money",
    "value": 1.6851
   },
   {
    "type": "mul",
    "currency": "coin",
    "value": 1.4229
   }
  ],
  "longTerm": false
 },
 {
  "id": 32,
  "name": "DERIVATIVE",
  "chapter": 2,
  "max": 1,
  "icon": "Tangent",
  "payment": [
   "coin"
  ],
  "effects": [
   {
    "type": "levels",
    "currency": "coin",
    "value": 0.0072
   }
  ],
  "longTerm": false
 },
 {
  "id": 33,
  "name": "INTEGRAL",
  "chapter": 2,
  "max": 1,
  "icon": "SquareSigma",
  "payment": [
   "money",
   "coin"
  ],
  "effects": [
   {
    "type": "cache",
    "currency": "money",
    "value": 4
   },
   {
    "type": "cache",
    "currency": "coin",
    "value": 4
   }
  ],
  "longTerm": false
 },
 {
  "id": 34,
  "name": "ALGEBRA CORE",
  "chapter": 2,
  "max": 1,
  "icon": "Axis3d",
  "payment": [
   "money",
   "coin"
  ],
  "effects": [
   {
    "type": "balance",
    "currency": "money",
    "value": 0.1425,
    "source": "coin"
   },
   {
    "type": "balance",
    "currency": "coin",
    "value": 0.024,
    "source": "money"
   }
  ],
  "longTerm": false
 },
 {
  "id": 35,
  "name": "BOOLEAN",
  "chapter": 3,
  "max": 1,
  "icon": "Binary",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "mul",
    "currency": "money",
    "value": 1.9319
   }
  ],
  "longTerm": false
 },
 {
  "id": 36,
  "name": "AND GATE",
  "chapter": 3,
  "max": 1,
  "icon": "CircuitBoard",
  "payment": [
   "money",
   "coin"
  ],
  "effects": [
   {
    "type": "count",
    "currency": "money",
    "value": 0.038
   },
   {
    "type": "count",
    "currency": "coin",
    "value": 0.048
   }
  ],
  "longTerm": false
 },
 {
  "id": 37,
  "name": "OR GATE",
  "chapter": 3,
  "max": 5,
  "icon": "GitBranch",
  "payment": [
   "coin"
  ],
  "effects": [
   {
    "type": "mul",
    "currency": "money",
    "value": 1.3565
   }
  ],
  "longTerm": false
 },
 {
  "id": 38,
  "name": "IMPLICATION",
  "chapter": 3,
  "max": 1,
  "icon": "Implication",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "count",
    "currency": "coin",
    "value": 0.015,
    "source": "money"
   }
  ],
  "longTerm": false
 },
 {
  "id": 39,
  "name": "NEGATION",
  "chapter": 3,
  "max": 1,
  "icon": "CircleSlash",
  "payment": [
   "coin"
  ],
  "effects": [
   {
    "type": "discount",
    "currency": "money",
    "value": 0.88
   }
  ],
  "longTerm": false
 },
 {
  "id": 40,
  "name": "XOR",
  "chapter": 3,
  "max": 1,
  "icon": "Shuffle",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "count",
    "currency": "money",
    "value": 0.1425,
    "source": "coin"
   }
  ],
  "longTerm": false
 },
 {
  "id": 41,
  "name": "TRUTH TABLE",
  "chapter": 3,
  "max": 20,
  "icon": "Table2",
  "payment": [
   "money",
   "coin"
  ],
  "effects": [
   {
    "type": "levels",
    "currency": "money",
    "value": 0.00085
   }
  ],
  "longTerm": true
 },
 {
  "id": 42,
  "name": "BITSHIFT",
  "chapter": 3,
  "max": 10,
  "icon": "ChevronsLeft",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "mul",
    "currency": "coin",
    "value": 1.0875
   }
  ],
  "longTerm": false
 },
 {
  "id": 43,
  "name": "MUX",
  "chapter": 3,
  "max": 1,
  "icon": "ToggleLeft",
  "payment": [
   "coin"
  ],
  "effects": [
   {
    "type": "cache",
    "currency": "money",
    "value": 4
   }
  ],
  "longTerm": false
 },
 {
  "id": 44,
  "name": "DEMUX",
  "chapter": 3,
  "max": 1,
  "icon": "Demux",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "cache",
    "currency": "coin",
    "value": 4
   }
  ],
  "longTerm": false
 },
 {
  "id": 45,
  "name": "DECODER",
  "chapter": 3,
  "max": 5,
  "icon": "Decoder",
  "payment": [
   "coin"
  ],
  "effects": [
   {
    "type": "base",
    "currency": "coin",
    "value": 1.1705
   }
  ],
  "longTerm": false
 },
 {
  "id": 46,
  "name": "SAT SOLVER",
  "chapter": 3,
  "max": 1,
  "icon": "ListChecks",
  "payment": [
   "money",
   "coin"
  ],
  "effects": [
   {
    "type": "balance",
    "currency": "money",
    "value": 0.19,
    "source": "coin"
   },
   {
    "type": "balance",
    "currency": "coin",
    "value": 0.024,
    "source": "money"
   }
  ],
  "longTerm": false
 },
 {
  "id": 47,
  "name": "LOGIC CORE",
  "chapter": 3,
  "max": 1,
  "icon": "Cpu",
  "payment": [
   "money",
   "coin"
  ],
  "effects": [
   {
    "type": "mul",
    "currency": "money",
    "value": 1.9319
   },
   {
    "type": "mul",
    "currency": "coin",
    "value": 1.5157
   }
  ],
  "longTerm": false
 },
 {
  "id": 48,
  "name": "REGISTER",
  "chapter": 4,
  "max": 20,
  "icon": "Microchip",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "add",
    "currency": "money",
    "value": 200
   },
   {
    "type": "mul",
    "currency": "money",
    "value": 1.0463
   }
  ],
  "longTerm": false
 },
 {
  "id": 49,
  "name": "L1 CACHE",
  "chapter": 4,
  "max": 1,
  "icon": "DatabaseZap",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "cache",
    "currency": "money",
    "value": 5
   }
  ],
  "longTerm": false
 },
 {
  "id": 50,
  "name": "MEMORY BUS",
  "chapter": 4,
  "max": 10,
  "icon": "Cable",
  "payment": [
   "coin"
  ],
  "effects": [
   {
    "type": "add",
    "currency": "coin",
    "value": 5
   }
  ],
  "longTerm": false
 },
 {
  "id": 51,
  "name": "L2 CACHE",
  "chapter": 4,
  "max": 1,
  "icon": "Database",
  "payment": [
   "coin"
  ],
  "effects": [
   {
    "type": "cache",
    "currency": "coin",
    "value": 5
   }
  ],
  "longTerm": false
 },
 {
  "id": 52,
  "name": "BUFFER POOL",
  "chapter": 4,
  "max": 10,
  "icon": "BufferPool",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "base",
    "currency": "coin",
    "value": 1.0704
   }
  ],
  "longTerm": false
 },
 {
  "id": 53,
  "name": "POINTER",
  "chapter": 4,
  "max": 1,
  "icon": "MousePointer2",
  "payment": [
   "coin"
  ],
  "effects": [
   {
    "type": "base",
    "currency": "money",
    "value": 1.9319
   }
  ],
  "longTerm": false
 },
 {
  "id": 54,
  "name": "STACK",
  "chapter": 4,
  "max": 1,
  "icon": "Layers",
  "payment": [
   "coin"
  ],
  "effects": [
   {
    "type": "levels",
    "currency": "money",
    "value": 0.01663
   }
  ],
  "longTerm": false
 },
 {
  "id": 55,
  "name": "HEAP",
  "chapter": 4,
  "max": 1,
  "icon": "Archive",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "count",
    "currency": "coin",
    "value": 0.018
   }
  ],
  "longTerm": false
 },
 {
  "id": 56,
  "name": "CACHE LINE",
  "chapter": 4,
  "max": 5,
  "icon": "CacheLine",
  "payment": [
   "money",
   "coin"
  ],
  "effects": [
   {
    "type": "cacheMul",
    "currency": "money",
    "value": 1.12
   },
   {
    "type": "cacheMul",
    "currency": "coin",
    "value": 1.12
   }
  ],
  "longTerm": false
 },
 {
  "id": 57,
  "name": "PREFETCH",
  "chapter": 4,
  "max": 1,
  "icon": "FastForward",
  "payment": [
   "money",
   "coin"
  ],
  "effects": [
   {
    "type": "speed",
    "currency": "money",
    "value": 0.9
   },
   {
    "type": "speed",
    "currency": "coin",
    "value": 0.9
   }
  ],
  "longTerm": false
 },
 {
  "id": 58,
  "name": "WRITEBACK",
  "chapter": 4,
  "max": 1,
  "icon": "Writeback",
  "payment": [
   "coin"
  ],
  "effects": [
   {
    "type": "cacheMul",
    "currency": "money",
    "value": 1.6
   }
  ],
  "longTerm": false
 },
 {
  "id": 59,
  "name": "PAGING",
  "chapter": 4,
  "max": 1,
  "icon": "Paging",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "cacheMul",
    "currency": "coin",
    "value": 1.6
   }
  ],
  "longTerm": false
 },
 {
  "id": 60,
  "name": "GARBAGE COLLECTOR",
  "chapter": 4,
  "max": 1,
  "icon": "Trash2",
  "payment": [
   "money",
   "coin"
  ],
  "effects": [
   {
    "type": "scaling",
    "currency": "money",
    "value": 0.98
   },
   {
    "type": "scaling",
    "currency": "coin",
    "value": 0.98
   }
  ],
  "longTerm": false
 },
 {
  "id": 61,
  "name": "MEMORY CORE",
  "chapter": 4,
  "max": 1,
  "icon": "MemoryStick",
  "payment": [
   "money",
   "coin"
  ],
  "effects": [
   {
    "type": "base",
    "currency": "money",
    "value": 1.9319
   },
   {
    "type": "base",
    "currency": "coin",
    "value": 1.5157
   }
  ],
  "longTerm": false
 },
 {
  "id": 62,
  "name": "BINARY SEARCH",
  "chapter": 5,
  "max": 1,
  "icon": "Search",
  "payment": [
   "coin"
  ],
  "effects": [
   {
    "type": "scaling",
    "currency": "money",
    "value": 0.98
   }
  ],
  "longTerm": false
 },
 {
  "id": 63,
  "name": "DIVIDE & CONQUER",
  "chapter": 5,
  "max": 1,
  "icon": "Scissors",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "mul",
    "currency": "coin",
    "value": 1.9332
   }
  ],
  "longTerm": false
 },
 {
  "id": 64,
  "name": "MEMOIZATION",
  "chapter": 5,
  "max": 1,
  "icon": "NotebookPen",
  "payment": [
   "coin"
  ],
  "effects": [
   {
    "type": "cacheMul",
    "currency": "money",
    "value": 1.5
   }
  ],
  "longTerm": false
 },
 {
  "id": 65,
  "name": "BINARY HEAP",
  "chapter": 5,
  "max": 5,
  "icon": "BinaryHeap",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "scaling",
    "currency": "coin",
    "value": 0.992
   }
  ],
  "longTerm": false
 },
 {
  "id": 66,
  "name": "QUICKSORT",
  "chapter": 5,
  "max": 10,
  "icon": "ListFilter",
  "payment": [
   "coin"
  ],
  "effects": [
   {
    "type": "mul",
    "currency": "money",
    "value": 1.2501
   }
  ],
  "longTerm": false
 },
 {
  "id": 67,
  "name": "DYNAMIC PROGRAM",
  "chapter": 5,
  "max": 10,
  "icon": "Workflow",
  "payment": [
   "money",
   "coin"
  ],
  "effects": [
   {
    "type": "levels",
    "currency": "coin",
    "value": 0.0012
   }
  ],
  "longTerm": true
 },
 {
  "id": 68,
  "name": "GREEDY",
  "chapter": 5,
  "max": 1,
  "icon": "Target",
  "payment": [
   "coin"
  ],
  "effects": [
   {
    "type": "count",
    "currency": "money",
    "value": 0.0475
   }
  ],
  "longTerm": false
 },
 {
  "id": 69,
  "name": "RECURSION",
  "chapter": 5,
  "max": 5,
  "icon": "Repeat2",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "recursive",
    "currency": "coin",
    "value": 1.1973
   }
  ],
  "longTerm": false
 },
 {
  "id": 70,
  "name": "AMORTIZATION",
  "chapter": 5,
  "max": 1,
  "icon": "Amortization",
  "payment": [
   "money",
   "coin"
  ],
  "effects": [
   {
    "type": "discount",
    "currency": "money",
    "value": 0.9
   },
   {
    "type": "discount",
    "currency": "coin",
    "value": 0.9
   }
  ],
  "longTerm": false
 },
 {
  "id": 71,
  "name": "HASH MAP",
  "chapter": 5,
  "max": 1,
  "icon": "Hash",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "discount",
    "currency": "coin",
    "value": 0.88
   }
  ],
  "longTerm": false
 },
 {
  "id": 72,
  "name": "STABLE SORT",
  "chapter": 5,
  "max": 1,
  "icon": "StableSort",
  "payment": [
   "coin"
  ],
  "effects": [
   {
    "type": "balance",
    "currency": "money",
    "value": 0.2375,
    "source": "coin"
   }
  ],
  "longTerm": false
 },
 {
  "id": 73,
  "name": "OPTIMIZATION",
  "chapter": 5,
  "max": 1,
  "icon": "Gauge",
  "payment": [
   "coin"
  ],
  "effects": [
   {
    "type": "scaling",
    "currency": "money",
    "value": 0.98
   }
  ],
  "longTerm": false
 },
 {
  "id": 74,
  "name": "TOPOLOGICAL SORT",
  "chapter": 5,
  "max": 1,
  "icon": "TopologicalSort",
  "payment": [
   "money",
   "coin"
  ],
  "effects": [
   {
    "type": "completed",
    "currency": "money",
    "value": 0.2375
   },
   {
    "type": "completed",
    "currency": "coin",
    "value": 0.3
   }
  ],
  "longTerm": false
 },
 {
  "id": 75,
  "name": "ALGORITHM CORE",
  "chapter": 5,
  "max": 1,
  "icon": "BrainCircuit",
  "payment": [
   "money",
   "coin"
  ],
  "effects": [
   {
    "type": "balance",
    "currency": "money",
    "value": 0.2375,
    "source": "coin"
   },
   {
    "type": "balance",
    "currency": "coin",
    "value": 0.033,
    "source": "money"
   }
  ],
  "longTerm": false
 },
 {
  "id": 76,
  "name": "CLOCK",
  "chapter": 6,
  "max": 20,
  "icon": "Timer",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "mul",
    "currency": "money",
    "value": 1.0774
   }
  ],
  "longTerm": false
 },
 {
  "id": 77,
  "name": "PIPELINE",
  "chapter": 6,
  "max": 1,
  "icon": "Waypoints",
  "payment": [
   "coin"
  ],
  "effects": [
   {
    "type": "base",
    "currency": "money",
    "value": 1.9319
   }
  ],
  "longTerm": false
 },
 {
  "id": 78,
  "name": "THREAD",
  "chapter": 6,
  "max": 1,
  "icon": "GitFork",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "levels",
    "currency": "coin",
    "value": 0.009
   }
  ],
  "longTerm": false
 },
 {
  "id": 79,
  "name": "SCHEDULER",
  "chapter": 6,
  "max": 1,
  "icon": "CalendarClock",
  "payment": [
   "money",
   "coin"
  ],
  "effects": [
   {
    "type": "cacheMul",
    "currency": "money",
    "value": 1.4
   },
   {
    "type": "cacheMul",
    "currency": "coin",
    "value": 1.4
   }
  ],
  "longTerm": false
 },
 {
  "id": 80,
  "name": "PARALLELISM",
  "chapter": 6,
  "max": 1,
  "icon": "Columns3",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "cacheMul",
    "currency": "coin",
    "value": 1.5
   }
  ],
  "longTerm": false
 },
 {
  "id": 81,
  "name": "SIMD",
  "chapter": 6,
  "max": 1,
  "icon": "Grid2X2",
  "payment": [
   "coin"
  ],
  "effects": [
   {
    "type": "base",
    "currency": "money",
    "value": 1.9319
   }
  ],
  "longTerm": false
 },
 {
  "id": 82,
  "name": "BRANCH PREDICTOR",
  "chapter": 6,
  "max": 1,
  "icon": "Signpost",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "scaling",
    "currency": "coin",
    "value": 0.97
   }
  ],
  "longTerm": false
 },
 {
  "id": 83,
  "name": "MULTICORE",
  "chapter": 6,
  "max": 1,
  "icon": "ServerCog",
  "payment": [
   "money",
   "coin"
  ],
  "effects": [
   {
    "type": "maxed",
    "currency": "money",
    "value": 0.07125
   },
   {
    "type": "maxed",
    "currency": "coin",
    "value": 0.09
   }
  ],
  "longTerm": false
 },
 {
  "id": 84,
  "name": "SUPERSCALAR",
  "chapter": 6,
  "max": 1,
  "icon": "Superscalar",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "add",
    "currency": "coin",
    "value": 250
   }
  ],
  "longTerm": false
 },
 {
  "id": 85,
  "name": "INSTRUCTION SET",
  "chapter": 6,
  "max": 5,
  "icon": "FileCode2",
  "payment": [
   "coin"
  ],
  "effects": [
   {
    "type": "mul",
    "currency": "money",
    "value": 1.3899
   }
  ],
  "longTerm": false
 },
 {
  "id": 86,
  "name": "SPECULATION",
  "chapter": 6,
  "max": 1,
  "icon": "ScanSearch",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "balance",
    "currency": "coin",
    "value": 0.039,
    "source": "money"
   }
  ],
  "longTerm": false
 },
 {
  "id": 87,
  "name": "CLOCK DOMAIN",
  "chapter": 6,
  "max": 1,
  "icon": "Activity",
  "payment": [
   "money",
   "coin"
  ],
  "effects": [
   {
    "type": "speed",
    "currency": "money",
    "value": 0.85
   },
   {
    "type": "speed",
    "currency": "coin",
    "value": 0.85
   }
  ],
  "longTerm": false
 },
 {
  "id": 88,
  "name": "LOAD BALANCER",
  "chapter": 6,
  "max": 1,
  "icon": "LoadBalancer",
  "payment": [
   "money",
   "coin"
  ],
  "effects": [
   {
    "type": "balance",
    "currency": "money",
    "value": 0.285,
    "source": "coin"
   },
   {
    "type": "balance",
    "currency": "coin",
    "value": 0.036,
    "source": "money"
   }
  ],
  "longTerm": false
 },
 {
  "id": 89,
  "name": "INTERCONNECT",
  "chapter": 6,
  "max": 1,
  "icon": "Network",
  "payment": [
   "coin"
  ],
  "effects": [
   {
    "type": "count",
    "currency": "money",
    "value": 0.0665,
    "source": "coin"
   }
  ],
  "longTerm": false
 },
 {
  "id": 90,
  "name": "ARCHITECTURE CORE",
  "chapter": 6,
  "max": 1,
  "icon": "Component",
  "payment": [
   "money",
   "coin"
  ],
  "effects": [
   {
    "type": "mul",
    "currency": "money",
    "value": 2.1479
   },
   {
    "type": "mul",
    "currency": "coin",
    "value": 1.9332
   }
  ],
  "longTerm": false
 },
 {
  "id": 91,
  "name": "FINITE STATE",
  "chapter": 7,
  "max": 1,
  "icon": "CircleDot",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "mul",
    "currency": "coin",
    "value": 1.9332
   }
  ],
  "longTerm": false
 },
 {
  "id": 92,
  "name": "TURING MACHINE",
  "chapter": 7,
  "max": 1,
  "icon": "Computer",
  "payment": [
   "coin"
  ],
  "effects": [
   {
    "type": "levels",
    "currency": "money",
    "value": 0.006
   }
  ],
  "longTerm": false
 },
 {
  "id": 93,
  "name": "LAMBDA CALCULUS",
  "chapter": 7,
  "max": 5,
  "icon": "SquareFunction",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "mul",
    "currency": "coin",
    "value": 1.3258
   }
  ],
  "longTerm": false
 },
 {
  "id": 94,
  "name": "FIXED POINT",
  "chapter": 7,
  "max": 5,
  "icon": "LocateFixed",
  "payment": [
   "coin"
  ],
  "effects": [
   {
    "type": "recursive",
    "currency": "money",
    "value": 1.1247
   }
  ],
  "longTerm": false
 },
 {
  "id": 95,
  "name": "INFORMATION",
  "chapter": 7,
  "max": 1,
  "icon": "Info",
  "payment": [
   "money",
   "coin"
  ],
  "effects": [
   {
    "type": "count",
    "currency": "money",
    "value": 0.016
   },
   {
    "type": "count",
    "currency": "coin",
    "value": 0.048
   }
  ],
  "longTerm": false
 },
 {
  "id": 96,
  "name": "INVARIANT",
  "chapter": 7,
  "max": 1,
  "icon": "Invariant",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "balance",
    "currency": "coin",
    "value": 0.042,
    "source": "money"
   }
  ],
  "longTerm": false
 },
 {
  "id": 97,
  "name": "ENTROPY",
  "chapter": 7,
  "max": 1,
  "icon": "Waves",
  "payment": [
   "coin"
  ],
  "effects": [
   {
    "type": "discount",
    "currency": "money",
    "value": 0.82
   }
  ],
  "longTerm": false
 },
 {
  "id": 98,
  "name": "COMPLEXITY",
  "chapter": 7,
  "max": 1,
  "icon": "Puzzle",
  "payment": [
   "money"
  ],
  "effects": [
   {
    "type": "scaling",
    "currency": "coin",
    "value": 0.97
   }
  ],
  "longTerm": false
 },
 {
  "id": 99,
  "name": "SUPERPOSITION",
  "chapter": 7,
  "max": 1,
  "icon": "Orbit",
  "payment": [
   "money",
   "coin"
  ],
  "effects": [
   {
    "type": "mul",
    "currency": "money",
    "value": 1.3797
   },
   {
    "type": "mul",
    "currency": "coin",
    "value": 1.9332
   }
  ],
  "longTerm": false
 },
 {
  "id": 100,
  "name": "DUALITY",
  "chapter": 7,
  "max": 1,
  "icon": "Duality",
  "payment": [
   "money",
   "coin"
  ],
  "effects": [
   {
    "type": "balance",
    "currency": "money",
    "value": 0.14,
    "source": "coin"
   },
   {
    "type": "balance",
    "currency": "coin",
    "value": 0.048,
    "source": "money"
   }
  ],
  "longTerm": false
 },
 {
  "id": 101,
  "name": "FOURIER",
  "chapter": 7,
  "max": 1,
  "icon": "AudioLines",
  "payment": [
   "money",
   "coin"
  ],
  "effects": [
   {
    "type": "cacheMul",
    "currency": "money",
    "value": 1.6
   },
   {
    "type": "cacheMul",
    "currency": "coin",
    "value": 1.6
   }
  ],
  "longTerm": false
 },
 {
  "id": 102,
  "name": "CONSERVATION",
  "chapter": 7,
  "max": 1,
  "icon": "Conservation",
  "payment": [
   "coin"
  ],
  "effects": [
   {
    "type": "balance",
    "currency": "money",
    "value": 0.14,
    "source": "coin"
   }
  ],
  "longTerm": false
 },
 {
  "id": 103,
  "name": "UNIVERSAL",
  "chapter": 7,
  "max": 1,
  "icon": "Globe2",
  "payment": [
   "money",
   "coin"
  ],
  "effects": [
   {
    "type": "base",
    "currency": "money",
    "value": 1.2457
   },
   {
    "type": "base",
    "currency": "coin",
    "value": 1.5157
   }
  ],
  "longTerm": false
 },
 {
  "id": 104,
  "name": "SINGULARITY",
  "chapter": 7,
  "max": 1,
  "icon": "Infinity",
  "payment": [
   "money",
   "coin"
  ],
  "effects": [
   {
    "type": "mul",
    "currency": "money",
    "value": 1.431
   },
   {
    "type": "mul",
    "currency": "coin",
    "value": 2.2974
   }
  ],
  "longTerm": false
 },
 {
  "id": 105,
  "name": "AXIOM",
  "chapter": 7,
  "max": 1,
  "icon": "Aperture",
  "payment": [
   "money",
   "coin"
  ],
  "effects": [
   {
    "type": "mul",
    "currency": "money",
    "value": 1.1487
   },
   {
    "type": "mul",
    "currency": "coin",
    "value": 1.5157
   }
  ],
  "longTerm": false
 }
];
