import { Chess } from 'https://cdn.jsdelivr.net/npm/chess.js@1.0.0/+esm';
import { parseFen } from 'https://cdn.jsdelivr.net/npm/chessops@0.16.0/fen/+esm';

const PIECES = {
  wp: '♙',
  wn: '♘',
  wb: '♗',
  wr: '♖',
  wq: '♕',
  wk: '♔',
  bp: '♟',
  bn: '♞',
  bb: '♝',
  br: '♜',
  bq: '♛',
  bk: '♚',
};

const FALLBACK_PUZZLES = [
  {
    fen: '6k1/5ppp/8/8/8/8/5PPP/6KQ w - - 0 1',
    winningColor: 'w',
    maxPlayerMoves: 1,
    solutionMoves: ['h1a8'],
  },
  {
    fen: 'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 1',
    winningColor: 'w',
    maxPlayerMoves: 1,
    solutionMoves: ['f7f8'],
  },
  {
    fen: 'rnb1kbnr/pppp1ppp/8/4p3/4P3/5q2/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    winningColor: 'b',
    maxPlayerMoves: 1,
    solutionMoves: ['f3f2'],
  },
];

const boardElement = document.querySelector('#board');
const statusText = document.querySelector('#status-text');
const targetColorElement = document.querySelector('#target-color');
const movesLeftElement = document.querySelector('#moves-left');
const lastMoveElement = document.querySelector('#last-move');
const solutionPanel = document.querySelector('#solution-panel');
const solutionList = document.querySelector('#solution-list');
const newPuzzleButton = document.querySelector('#new-puzzle-button');
const showSolutionButton = document.querySelector('#show-solution-button');

let game = new Chess();
let puzzle = null;
let selectedSquare = null;
let legalTargets = [];
let playerMoves = 0;
let isBoardLocked = true;
let stockfishClient = null;

class StockfishClient {
  constructor() {
    this.worker = new Worker('./stockfish-worker.js');
    this.pendingBestMoveResolver = null;
    this.isReady = false;
    this.hasFailed = false;

    this.worker.onmessage = (event) => {
      const { type, move, message } = event.data;

      if (type === 'ready') {
        this.isReady = true;
      }

      if (type === 'error') {
        this.hasFailed = true;
        setStatus(message, true);
        this.resolveBestMove(null);
      }

      if (type === 'bestmove') {
        this.resolveBestMove(move);
      }
    };
  }

  resolveBestMove(move) {
    if (!this.pendingBestMoveResolver) {
      return;
    }

    this.pendingBestMoveResolver(move);
    this.pendingBestMoveResolver = null;
  }

  command(command) {
    this.worker.postMessage({ command });
  }

  async bestMove(fen, depth = 8) {
    if (this.hasFailed) {
      return null;
    }

    this.command('ucinewgame');
    this.command(`position fen ${fen}`);
    this.command(`go depth ${depth}`);

    return new Promise((resolve) => {
      this.pendingBestMoveResolver = resolve;
      window.setTimeout(() => this.resolveBestMove(null), 5500);
    });
  }
}

function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.classList.toggle('error', isError);
}

function colorName(color) {
  return color === 'w' ? 'Blancas' : 'Negras';
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function validateFenWithChessops(fen) {
  try {
    return parseFen(fen).isOk;
  } catch (error) {
    return false;
  }
}

function renderBoard() {
  boardElement.innerHTML = '';
  const board = game.board();

  for (let rankIndex = 0; rankIndex < 8; rankIndex += 1) {
    for (let fileIndex = 0; fileIndex < 8; fileIndex += 1) {
      const rank = 8 - rankIndex;
      const file = String.fromCharCode(97 + fileIndex);
      const squareName = `${file}${rank}`;
      const piece = board[rankIndex][fileIndex];
      const square = document.createElement('button');
      const isLight = (rankIndex + fileIndex) % 2 === 0;

      square.type = 'button';
      square.className = `square ${isLight ? 'light' : 'dark'}`;
      square.dataset.square = squareName;
      square.setAttribute('aria-label', squareName);

      if (selectedSquare === squareName) {
        square.classList.add('selected');
      }

      if (legalTargets.includes(squareName)) {
        square.classList.add('legal');
      }

      if (piece) {
        const pieceElement = document.createElement('span');
        pieceElement.className = 'piece';
        pieceElement.textContent = PIECES[`${piece.color}${piece.type}`];
        square.appendChild(pieceElement);
      }

      square.addEventListener('click', () => handleSquareClick(squareName));
      boardElement.appendChild(square);
    }
  }
}

function refreshInfo() {
  targetColorElement.textContent = puzzle ? colorName(puzzle.winningColor) : '—';
  movesLeftElement.textContent = String(Math.max(0, (puzzle?.maxPlayerMoves ?? 10) - playerMoves));
  lastMoveElement.textContent = game.history({ verbose: true }).at(-1)?.san ?? '—';
}

function clearSelection() {
  selectedSquare = null;
  legalTargets = [];
}

function selectSquare(square) {
  const piece = game.get(square);

  if (!piece || !puzzle || piece.color !== puzzle.winningColor || game.turn() !== puzzle.winningColor) {
    clearSelection();
    return;
  }

  selectedSquare = square;
  legalTargets = game.moves({ square, verbose: true }).map((move) => move.to);
}

async function handleSquareClick(square) {
  if (isBoardLocked || !puzzle) {
    return;
  }

  if (!selectedSquare) {
    selectSquare(square);
    renderBoard();
    return;
  }

  if (selectedSquare === square) {
    clearSelection();
    renderBoard();
    return;
  }

  const move = game.move({ from: selectedSquare, to: square, promotion: 'q' });

  if (!move) {
    selectSquare(square);
    renderBoard();
    return;
  }

  clearSelection();
  playerMoves += 1;
  renderBoard();
  refreshInfo();

  if (game.isCheckmate()) {
    isBoardLocked = true;
    setStatus('¡Mate encontrado! Puzzle resuelto.');
    showSolution(false);
    return;
  }

  if (playerMoves >= puzzle.maxPlayerMoves) {
    isBoardLocked = true;
    setStatus('Se agotaron los movimientos. Aquí tienes la solución.');
    showSolution(true);
    return;
  }

  await playOpponentReply();
}

async function playOpponentReply() {
  isBoardLocked = true;
  setStatus('La IA responde…');

  const nextSolutionMove = puzzle.solutionMoves.find((uciMove) => {
    const legalMoves = game.moves({ verbose: true });
    return legalMoves.some((move) => toUci(move) === uciMove);
  });

  const engineMove = nextSolutionMove ?? await stockfishClient.bestMove(game.fen(), 8);

  if (engineMove && engineMove !== '(none)') {
    applyUciMove(engineMove);
  }

  renderBoard();
  refreshInfo();

  if (game.isCheckmate()) {
    isBoardLocked = true;
    setStatus('La línea terminó en mate. Pulsa Nuevo puzzle para intentarlo otra vez.');
    showSolution(true);
    return;
  }

  isBoardLocked = false;
  setStatus(`Juegan ${colorName(puzzle.winningColor)}. Encuentra el mate.`);
}

function toUci(move) {
  return `${move.from}${move.to}${move.promotion ?? ''}`;
}

function applyUciMove(uciMove) {
  const from = uciMove.slice(0, 2);
  const to = uciMove.slice(2, 4);
  const promotion = uciMove.slice(4, 5) || 'q';
  return game.move({ from, to, promotion });
}

async function generatePuzzleWithStockfish() {
  const generatedGame = new Chess();
  const fenHistory = [generatedGame.fen()];
  const moveHistory = [];
  const openingSeeds = [
    ['e2e4', 'e7e5', 'g1f3', 'b8c6'],
    ['d2d4', 'd7d5', 'c2c4', 'e7e6'],
    ['e2e4', 'c7c5', 'g1f3', 'd7d6'],
    ['g1f3', 'd7d5', 'g2g3', 'g8f6'],
  ];
  const seed = openingSeeds[Math.floor(Math.random() * openingSeeds.length)];

  for (const uciMove of seed) {
    applyMoveToGame(generatedGame, uciMove);
    fenHistory.push(generatedGame.fen());
    moveHistory.push(uciMove);
  }

  for (let ply = 0; ply < 80 && !generatedGame.isGameOver(); ply += 1) {
    const bestMove = await stockfishClient.bestMove(generatedGame.fen(), 7);

    if (!bestMove || bestMove === '(none)') {
      break;
    }

    const move = applyMoveToGame(generatedGame, bestMove);

    if (!move) {
      break;
    }

    moveHistory.push(bestMove);
    fenHistory.push(generatedGame.fen());
    setStatus(`Stockfish está generando la posición… ${ply + 1}/80`);
    await sleep(20);
  }

  if (!generatedGame.isCheckmate() || moveHistory.length < 10) {
    return null;
  }

  const winner = generatedGame.turn() === 'w' ? 'b' : 'w';
  const rewindPly = Math.max(0, moveHistory.length - 20);
  const initialFen = fenHistory[rewindPly];
  const solutionMoves = moveHistory.slice(rewindPly);

  return {
    fen: initialFen,
    winningColor: winner,
    maxPlayerMoves: 10,
    solutionMoves,
  };
}

function applyMoveToGame(targetGame, uciMove) {
  const from = uciMove.slice(0, 2);
  const to = uciMove.slice(2, 4);
  const promotion = uciMove.slice(4, 5) || 'q';
  return targetGame.move({ from, to, promotion });
}

function getFallbackPuzzle() {
  return FALLBACK_PUZZLES[Math.floor(Math.random() * FALLBACK_PUZZLES.length)];
}

async function loadNewPuzzle() {
  isBoardLocked = true;
  clearSelection();
  solutionPanel.classList.add('hidden');
  solutionList.innerHTML = '';
  playerMoves = 0;
  setStatus('Stockfish está creando una partida contra sí mismo…');

  let generatedPuzzle = null;

  try {
    generatedPuzzle = await generatePuzzleWithStockfish();
  } catch (error) {
    generatedPuzzle = null;
  }

  puzzle = generatedPuzzle ?? getFallbackPuzzle();

  if (!validateFenWithChessops(puzzle.fen)) {
    puzzle = getFallbackPuzzle();
  }

  game = new Chess(puzzle.fen);
  playerMoves = 0;
  isBoardLocked = game.turn() !== puzzle.winningColor;

  renderBoard();
  refreshInfo();

  if (isBoardLocked) {
    await playOpponentReply();
  } else {
    setStatus(`Juegan ${colorName(puzzle.winningColor)}. Encuentra el mate en ${puzzle.maxPlayerMoves} movimiento(s).`);
  }
}

function showSolution(replayPosition = false) {
  solutionPanel.classList.remove('hidden');
  solutionList.innerHTML = '';

  const solutionGame = new Chess(puzzle.fen);

  puzzle.solutionMoves.forEach((uciMove) => {
    const move = applyMoveToGame(solutionGame, uciMove);
    const item = document.createElement('li');
    item.textContent = move ? move.san : uciMove;
    solutionList.appendChild(item);
  });

  if (replayPosition) {
    game = new Chess(puzzle.fen);
    clearSelection();
    renderBoard();
    refreshInfo();
  }
}

newPuzzleButton.addEventListener('click', () => loadNewPuzzle());
showSolutionButton.addEventListener('click', () => {
  if (!puzzle) {
    return;
  }

  isBoardLocked = true;
  setStatus('Solución mostrada. Pulsa Nuevo puzzle para intentarlo otra vez.');
  showSolution(true);
});

stockfishClient = new StockfishClient();
renderBoard();
loadNewPuzzle();
