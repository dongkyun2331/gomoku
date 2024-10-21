const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

const boardSize = 15; // 15x15 오목판
const cellSize = canvas.width / boardSize;
const board = Array.from({ length: boardSize }, () => Array(boardSize).fill(0)); // 0: 빈 칸, 1: 사용자, 2: 컴퓨터

let playerTurn = true;
const status = document.getElementById("status");

canvas.addEventListener("click", (e) => {
  if (!playerTurn) return;

  const x = Math.floor(e.offsetX / cellSize);
  const y = Math.floor(e.offsetY / cellSize);

  if (board[y][x] === 0) {
    board[y][x] = 1; // 사용자 돌 놓기
    drawBoard();
    if (checkWin(1)) {
      status.innerText = "축하합니다! 당신이 승리했습니다!";
      return;
    }
    playerTurn = false;
    status.innerText = "컴퓨터의 차례입니다!";
    setTimeout(computerMove, 500); // 컴퓨터가 조금 늦게 두도록 지연
  }
});

let moveCount = 0; // 몇 번째 수인지 기록

function computerMove() {
  let move;

  // 3수 이하에서는 중앙에 가까운 곳에 두도록 유도
  if (moveCount < 3) {
    move = findCentralMove();
  } else {
    move = findBestMove();
  }

  if (move) {
    const { x, y } = move;
    board[y][x] = 2; // 컴퓨터 돌 놓기
    drawBoard();
    moveCount++; // 수 증가
    if (checkWin(2)) {
      status.innerText = "컴퓨터가 승리했습니다.";
      return;
    }
    playerTurn = true;
    status.innerText = "당신의 차례입니다!";
  }
}

// 중앙 근처에 돌을 두는 함수
function findCentralMove() {
  const centerX = Math.floor(boardSize / 2);
  const centerY = Math.floor(boardSize / 2);

  let bestMove = null;
  let bestDistance = Infinity;

  for (let y = 0; y < boardSize; y++) {
    for (let x = 0; x < boardSize; x++) {
      if (board[y][x] === 0) {
        // 중앙과의 거리 계산
        const distance = Math.sqrt(
          Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
        );
        if (distance < bestDistance) {
          bestDistance = distance;
          bestMove = { x, y };
        }
      }
    }
  }

  return bestMove;
}

// 최선의 수를 찾는 함수
function findBestMove() {
  // 1. 승리 가능한 자리 찾기 (컴퓨터 돌로 4개가 연결된 자리에 놓기)
  let winMove = findWinningMove(2);
  if (winMove) return winMove;

  // 2. 플레이어가 승리하는 것을 막기 (사용자 돌로 4개가 연결된 자리에 막기)
  let blockMove = findWinningMove(1);
  if (blockMove) return blockMove;

  // 3. 컴퓨터 돌 3개가 연결된 자리 공격하기
  let attackMove = findThreatMove(2, 3);
  if (attackMove) return attackMove;

  // 4. 사용자 돌 3개가 연결된 자리 방어하기
  let defenseMove = findThreatMove(1, 3);
  if (defenseMove) return defenseMove;

  // 5. 랜덤으로 돌 놓기 (가장 덜 우선적인 전략)
  return findRandomMove();
}

// 승리할 수 있는 자리를 찾는 함수 (4개의 돌이 연결될 수 있는 곳을 찾음)
function findWinningMove(player) {
  for (let y = 0; y < boardSize; y++) {
    for (let x = 0; x < boardSize; x++) {
      if (board[y][x] === 0) {
        board[y][x] = player;
        if (checkWin(player)) {
          board[y][x] = 0; // 원래 상태로 돌려놓기
          return { x, y };
        }
        board[y][x] = 0;
      }
    }
  }
  return null;
}

// 위협적인 자리를 찾는 함수 (n개의 돌이 연결된 자리를 찾음)
function findThreatMove(player, count) {
  for (let y = 0; y < boardSize; y++) {
    for (let x = 0; x < boardSize; x++) {
      if (board[y][x] === 0) {
        board[y][x] = player;
        if (getStoneCount(player, x, y) >= count) {
          board[y][x] = 0; // 원래 상태로 돌려놓기
          return { x, y };
        }
        board[y][x] = 0;
      }
    }
  }
  return null;
}

// 돌이 몇 개가 연결되었는지 확인하는 함수
function getStoneCount(player, x, y) {
  let maxCount = 0;
  const directions = [
    { dx: 1, dy: 0 }, // 가로
    { dx: 0, dy: 1 }, // 세로
    { dx: 1, dy: 1 }, // 대각선 \
    { dx: 1, dy: -1 }, // 대각선 /
  ];

  for (const { dx, dy } of directions) {
    let count = 1;

    // 해당 방향으로 확인
    for (let step = 1; step < 5; step++) {
      const nx = x + dx * step;
      const ny = y + dy * step;

      if (
        nx < 0 ||
        ny < 0 ||
        nx >= boardSize ||
        ny >= boardSize ||
        board[ny][nx] !== player
      )
        break;
      count++;
    }

    // 반대 방향으로 확인
    for (let step = 1; step < 5; step++) {
      const nx = x - dx * step;
      const ny = y - dy * step;

      if (
        nx < 0 ||
        ny < 0 ||
        nx >= boardSize ||
        ny >= boardSize ||
        board[ny][nx] !== player
      )
        break;
      count++;
    }

    maxCount = Math.max(maxCount, count);
  }

  return maxCount;
}

// 랜덤한 빈 자리를 찾는 함수 (가장 우선순위가 낮은 전략)
function findRandomMove() {
  let x, y;
  do {
    x = Math.floor(Math.random() * boardSize);
    y = Math.floor(Math.random() * boardSize);
  } while (board[y][x] !== 0);

  return { x, y };
}

function computerMove() {
  let move = findBestMove();

  if (move) {
    const { x, y } = move;
    board[y][x] = 2; // 컴퓨터 돌 놓기
    drawBoard();
    if (checkWin(2)) {
      status.innerText = "컴퓨터가 승리했습니다.";
      return;
    }
    playerTurn = true;
    status.innerText = "당신의 차례입니다!";
  }
}

function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "black";

  // 오목판 그리기
  for (let i = 0; i < boardSize; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cellSize, 0);
    ctx.lineTo(i * cellSize, canvas.height);
    ctx.moveTo(0, i * cellSize);
    ctx.lineTo(canvas.width, i * cellSize);
    ctx.stroke();
  }

  // 돌 그리기
  for (let y = 0; y < boardSize; y++) {
    for (let x = 0; x < boardSize; x++) {
      if (board[y][x] === 1) {
        drawStone(x, y, "black");
      } else if (board[y][x] === 2) {
        drawStone(x, y, "white");
      }
    }
  }
}

function drawStone(x, y, color) {
  ctx.beginPath();
  ctx.arc(
    x * cellSize + cellSize / 2,
    y * cellSize + cellSize / 2,
    cellSize / 2.5,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = color;
  ctx.fill();
  ctx.stroke();
}

function checkWin(player) {
  const directions = [
    { dx: 1, dy: 0 }, // 가로
    { dx: 0, dy: 1 }, // 세로
    { dx: 1, dy: 1 }, // 대각선 \
    { dx: 1, dy: -1 }, // 대각선 /
  ];

  for (let y = 0; y < boardSize; y++) {
    for (let x = 0; x < boardSize; x++) {
      if (board[y][x] !== player) continue;

      for (const { dx, dy } of directions) {
        let count = 1;

        for (let step = 1; step < 5; step++) {
          const nx = x + dx * step;
          const ny = y + dy * step;

          if (
            nx < 0 ||
            ny < 0 ||
            nx >= boardSize ||
            ny >= boardSize ||
            board[ny][nx] !== player
          ) {
            break;
          }
          count++;
        }

        if (count === 5) return true;
      }
    }
  }
  return false;
}

// 처음에 보드 그리기
drawBoard();
