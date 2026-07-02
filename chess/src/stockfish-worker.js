const STOCKFISH_CDN_URLS = [
  'https://cdn.jsdelivr.net/npm/stockfish@16.0.0/src/stockfish.js',
  'https://unpkg.com/stockfish@16.0.0/src/stockfish.js',
  'https://cdn.jsdelivr.net/npm/stockfish@11.0.0/src/stockfish.js',
];

let engine = null;
let ready = false;
let failed = false;
let queue = [];

function post(type, payload = {}) {
  self.postMessage({ type, ...payload });
}

function flushQueue() {
  const pending = [...queue];
  queue = [];
  pending.forEach((command) => sendToEngine(command));
}

function sendToEngine(command) {
  if (!engine || failed) {
    return;
  }

  if (typeof engine.postMessage === 'function') {
    engine.postMessage(command);
    return;
  }

  if (typeof engine === 'function') {
    engine(command);
  }
}

function attachEngineMessageHandler() {
  const onLine = (line) => {
    const text = String(line?.data ?? line);

    if (text === 'uciok' || text === 'readyok') {
      ready = true;
      post('ready');
      flushQueue();
    }

    if (text.startsWith('bestmove')) {
      const [, move] = text.split(' ');
      post('bestmove', { move });
    }

    post('line', { line: text });
  };

  if (typeof engine.addEventListener === 'function') {
    engine.addEventListener('message', onLine);
  } else {
    engine.onmessage = onLine;
  }
}

function loadStockfish() {
  for (const url of STOCKFISH_CDN_URLS) {
    try {
      importScripts(url);

      if (typeof self.Stockfish === 'function') {
        engine = self.Stockfish();
      } else if (typeof self.STOCKFISH === 'function') {
        engine = self.STOCKFISH();
      } else if (typeof self.Module === 'object' && typeof self.Module.postMessage === 'function') {
        engine = self.Module;
      }

      if (engine) {
        attachEngineMessageHandler();
        sendToEngine('uci');
        sendToEngine('isready');
        return;
      }
    } catch (error) {
      // Try the next CDN URL.
    }
  }

  failed = true;
  post('error', {
    message: 'No se pudo cargar Stockfish desde CDN. Se usará un puzzle táctico local.',
  });
}

self.onmessage = (event) => {
  const command = event.data?.command;

  if (!command) {
    return;
  }

  if (!ready) {
    queue.push(command);
    return;
  }

  sendToEngine(command);
};

loadStockfish();
