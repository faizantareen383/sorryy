const pages = [...document.querySelectorAll('.page')];
const dots = [...document.querySelectorAll('.dot')];
const pageNumber = document.querySelector('#page-number');
const progressFill = document.querySelector('#progress-fill');
const backButton = document.querySelector('#back-button');
const sparkleField = document.querySelector('.sparkle-field');
const backgroundMusic = document.querySelector('#background-music');
const musicToggle = document.querySelector('#music-toggle');
let currentPage = 0;
let matchedPairs = 0;
let revealedCards = [];
let gameLocked = true;
let hideCardsTimeout;
let forgiveButtonScale = 1;

function updateMusicButton(label, isPlaying) {
  musicToggle.textContent = label;
  musicToggle.setAttribute('aria-pressed', String(isPlaying));
  musicToggle.setAttribute('aria-label', isPlaying ? 'Turn background music off' : 'Turn background music on');
}

function startMusic() {
  const playback = backgroundMusic.play();
  if (playback) {
    playback.then(() => updateMusicButton('♫ Music on', true)).catch(() => {
      if (backgroundMusic.error) {
        updateMusicButton('♫ Add ww.mp3', false);
      } else {
        updateMusicButton('♫ Tap for music', false);
      }
    });
  }
}

function startMusicAfterGesture(event) {
  if (event.target instanceof Element && event.target.closest('#music-toggle')) {
    return;
  }
  document.removeEventListener('pointerdown', startMusicAfterGesture);
  document.removeEventListener('keydown', startMusicAfterGesture);
  startMusic();
}

backgroundMusic.addEventListener('error', () => updateMusicButton('♫ Add ww.mp3', false));
backgroundMusic.addEventListener('pause', () => {
  if (!backgroundMusic.error) {
    updateMusicButton('♫ Music', false);
  }
});
musicToggle.addEventListener('click', () => {
  if (backgroundMusic.paused) {
    startMusic();
  } else {
    backgroundMusic.pause();
  }
});
document.addEventListener('pointerdown', startMusicAfterGesture);
document.addEventListener('keydown', startMusicAfterGesture);
startMusic();

document.querySelectorAll('.optional-gif').forEach(image => {
  image.addEventListener('load', () => {
    image.closest('.art').classList.add('has-gif');
  });
  image.addEventListener('error', () => {
    image.hidden = true;
  });
  if (image.complete && image.naturalWidth === 0) {
    image.hidden = true;
  } else if (image.complete && image.naturalWidth > 0) {
    image.closest('.art').classList.add('has-gif');
  }
});

function showPage(index) {
  currentPage = Math.max(0, Math.min(index, pages.length - 1));
  pages.forEach((page, pageIndex) => {
    const active = pageIndex === currentPage;
    page.hidden = !active;
    page.classList.toggle('active', active);
  });
  dots.forEach((dot, dotIndex) => dot.classList.toggle('active', dotIndex === currentPage));
  pageNumber.textContent = String(currentPage + 1).padStart(2, '0');
  progressFill.style.width = `${((currentPage + 1) / pages.length) * 100}%`;
  backButton.disabled = currentPage === 0;
}

document.querySelectorAll('[data-next]').forEach(button => {
  button.addEventListener('click', () => showPage(currentPage + 1));
});
document.querySelectorAll('[data-go]').forEach(button => {
  button.addEventListener('click', () => showPage(Number(button.dataset.go)));
});
backButton.addEventListener('click', () => showPage(currentPage - 1));
document.querySelector('.brand').addEventListener('click', event => {
  event.preventDefault();
  showPage(0);
});

document.querySelector('#yes-button').addEventListener('click', () => {
  document.querySelector('#response').textContent = 'Yay! Sending you the biggest bestie hug ever! ♡';
  makeConfetti();
});
document.querySelector('#later-button').addEventListener('click', () => {
  document.querySelector('#response').textContent = 'Of course, take all the time you need. No pressure at all — I’ll be right here whenever you feel ready. ♡';
  forgiveButtonScale = Math.min(forgiveButtonScale + 0.18, 2.2);
  document.querySelector('#yes-button').style.setProperty('--forgive-scale', forgiveButtonScale.toFixed(2));
});

const memoryBoard = document.querySelector('#memory-board');
const gameStart = document.querySelector('#game-start');
const gameReset = document.querySelector('#game-reset');
const gameInstruction = document.querySelector('#game-instruction');
const matchScore = document.querySelector('#match-score');
const cardSymbols = [
  { emoji: '🐻', name: 'teddy bear' },
  { emoji: '🌷', name: 'tulip' },
  { emoji: '🍓', name: 'strawberry' }
];

function renderMemoryCards() {
  const shuffledCards = [...cardSymbols, ...cardSymbols]
    .map((card, index) => ({ ...card, id: index, sort: Math.random() }))
    .sort((first, second) => first.sort - second.sort);

  memoryBoard.replaceChildren(...shuffledCards.map(card => {
    const button = document.createElement('button');
    button.className = 'memory-card';
    button.type = 'button';
    button.disabled = gameLocked;
    button.dataset.symbol = card.name;
    button.setAttribute('aria-label', `Hidden card ${card.id + 1}`);
    button.innerHTML = `<span class="memory-card-inner"><span class="memory-card-face memory-card-back" aria-hidden="true">♡</span><span class="memory-card-face memory-card-front" aria-hidden="true">${card.emoji}</span></span>`;
    button.addEventListener('click', () => revealMemoryCard(button));
    return button;
  }));
}

function startMemoryGame() {
  window.clearTimeout(hideCardsTimeout);
  matchedPairs = 0;
  revealedCards = [];
  gameLocked = false;
  matchScore.textContent = '0';
  gameInstruction.textContent = 'Flip two cards and find their matching pair!';
  gameStart.hidden = true;
  gameReset.hidden = true;
  renderMemoryCards();
}

function revealMemoryCard(card) {
  if (gameLocked || card.classList.contains('flipped') || card.classList.contains('matched')) {
    return;
  }

  card.classList.add('flipped');
  card.setAttribute('aria-label', `${card.dataset.symbol}, revealed`);
  revealedCards.push(card);

  if (revealedCards.length < 2) {
    return;
  }

  const [firstCard, secondCard] = revealedCards;
  if (firstCard.dataset.symbol === secondCard.dataset.symbol) {
    firstCard.classList.add('matched');
    secondCard.classList.add('matched');
    firstCard.setAttribute('aria-label', `${firstCard.dataset.symbol}, matched`);
    secondCard.setAttribute('aria-label', `${secondCard.dataset.symbol}, matched`);
    matchedPairs += 1;
    matchScore.textContent = String(matchedPairs);
    revealedCards = [];

    if (matchedPairs === cardSymbols.length) {
      gameInstruction.textContent = 'You found every pair! Sending your bonus hug! 🫂';
      gameReset.hidden = false;
      makeConfetti();
    }
    return;
  }

  gameLocked = true;
  gameInstruction.textContent = 'Not a match — try another pair!';
  hideCardsTimeout = window.setTimeout(() => {
    revealedCards.forEach(revealedCard => {
      revealedCard.classList.remove('flipped');
      revealedCard.setAttribute('aria-label', 'Hidden card');
    });
    revealedCards = [];
    gameLocked = false;
    gameInstruction.textContent = 'Flip two cards and find their matching pair!';
  }, 750);
}

gameStart.addEventListener('click', startMemoryGame);
gameReset.addEventListener('click', () => {
  startMemoryGame();
});
renderMemoryCards();

function makeConfetti() {
  const colors = ['#ef91a7', '#f6c96d', '#c9a6db', '#a6cdb5', '#f2b6a0'];
  for (let index = 0; index < 65; index += 1) {
    const piece = document.createElement('span');
    piece.className = 'confetti';
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.backgroundColor = colors[index % colors.length];
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    piece.style.setProperty('--drift', `${Math.random() * 180 - 90}px`);
    piece.style.animationDelay = `${Math.random() * 0.7}s`;
    document.body.append(piece);
    window.setTimeout(() => piece.remove(), 3600);
  }
}

for (let index = 0; index < 18; index += 1) {
  const sparkle = document.createElement('span');
  sparkle.className = 'sparkle';
  sparkle.textContent = index % 3 === 0 ? '♡' : '✦';
  sparkle.style.left = `${Math.random() * 100}%`;
  sparkle.style.top = `${Math.random() * 100}%`;
  sparkle.style.fontSize = `${10 + Math.random() * 13}px`;
  sparkle.style.animationDelay = `${Math.random() * -8}s`;
  sparkleField.append(sparkle);
}
