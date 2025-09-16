// 게임 설정
const CONFIG = {
    INITIAL_TIME: 20, // 초기 제한 시간 (초)
    CARD_PAIRS: 8,    // 카드 쌍의 수 (8쌍 = 16장의 카드)
    MEMORY_TIME: 3000, // 카드를 기억할 시간 (밀리초)
    WORDS: [
        '사과', '바나나', '딸기', '포도', '수박', '오렌지', '키위', '파인애플',
        '복숭아', '자두', '망고', '체리', '레몬', '자몽', '멜론', '블루베리'
    ]
};

// 게임 상태
const gameState = {
    cards: [],
    flippedCards: [],
    matchedPairs: 0,
    score: 0,
    timeLeft: CONFIG.INITIAL_TIME,
    timer: null,
    isGameStarted: false,
    canFlip: false
};

// DOM 요소
const gameBoard = document.getElementById('game-board');
const startButton = document.getElementById('start-btn');
const timeDisplay = document.getElementById('time');
const scoreDisplay = document.querySelector('#score span');
const messageDisplay = document.getElementById('message');

// 게임 초기화
function initGame() {
    // 기존 카드 제거
    gameBoard.innerHTML = '';
    
    // 게임 상태 초기화
    gameState.cards = [];
    gameState.flippedCards = [];
    gameState.matchedPairs = 0;
    gameState.score = 0;
    
    // 설정된 시간 가져오기
    const gameTimeInput = document.getElementById('game-time');
    gameState.timeLeft = parseInt(gameTimeInput.value) || CONFIG.INITIAL_TIME;
    
    gameState.isGameStarted = false;
    gameState.canFlip = false;
    
    // UI 업데이트
    updateScore(0);
    updateTimer();
    messageDisplay.textContent = '';
    startButton.textContent = '게임 시작';
    startButton.disabled = false;
    gameTimeInput.disabled = false;
    
    // 카드 생성
    createCards();
}

// 카드 생성
function createCards() {
    // 사용할 단어 선택 및 셔플
    const selectedWords = CONFIG.WORDS.slice(0, CONFIG.CARD_PAIRS);
    const wordPairs = [...selectedWords, ...selectedWords];
    shuffleArray(wordPairs);
    
    // 카드 생성 및 이벤트 리스너 추가
    wordPairs.forEach((word, index) => {
        const card = document.createElement('div');
        card.className = 'card hidden';
        card.dataset.index = index;
        card.dataset.word = word;
        
        const cardContent = document.createElement('div');
        cardContent.className = 'card-content';
        cardContent.textContent = word;
        
        card.appendChild(cardContent);
        gameBoard.appendChild(card);
        
        // 카드 상태 저장
        gameState.cards.push({
            element: card,
            word: word,
            isFlipped: false,
            isMatched: false
        });
        
        // 카드 클릭 이벤트 리스너
        card.addEventListener('click', handleCardClick);
    });
}

// 카드 클릭 핸들러
function handleCardClick(event) {
    if (!gameState.canFlip || gameState.flippedCards.length >= 2) return;
    
    const cardElement = event.currentTarget;
    const cardIndex = parseInt(cardElement.dataset.index);
    const card = gameState.cards[cardIndex];
    
    // 이미 뒤집혔거나 매칭된 카드는 무시
    if (card.isFlipped || card.isMatched) return;
    
    // 카드 뒤집기
    flipCard(card, true);
    gameState.flippedCards.push(card);
    
    // 두 장의 카드가 뒤집혔는지 확인
    if (gameState.flippedCards.length === 2) {
        checkForMatch();
    }
}

// 카드 뒤집기
function flipCard(card, show) {
    const cardElement = card.element;
    
    if (show) {
        cardElement.classList.remove('hidden');
        card.isFlipped = true;
    } else {
        cardElement.classList.add('hidden');
        card.isFlipped = false;
    }
}

// 카드 매칭 확인
function checkForMatch() {
    const [firstCard, secondCard] = gameState.flippedCards;
    
    // 카드가 일치하는 경우
    if (firstCard.word === secondCard.word) {
        firstCard.isMatched = true;
        secondCard.isMatched = true;
        firstCard.element.classList.add('matched');
        secondCard.element.classList.add('matched');
        
        gameState.matchedPairs++;
        updateScore(10); // 맞춘 쌍당 10점 추가
        
        // 모든 쌍을 맞춘 경우 게임 클리어
        if (gameState.matchedPairs === CONFIG.CARD_PAIRS) {
            endGame(true);
        }
        
        gameState.flippedCards = [];
    } else {
        // 카드가 일치하지 않는 경우 잠시 후 뒤집기
        gameState.canFlip = false;
        setTimeout(() => {
            flipCard(firstCard, false);
            flipCard(secondCard, false);
            gameState.flippedCards = [];
            gameState.canFlip = true;
        }, 1000);
    }
}

// 게임 시작
function startGame() {
    if (gameState.isGameStarted) return;
    
    // 설정된 시간 가져오기
    const gameTimeInput = document.getElementById('game-time');
    const selectedTime = parseInt(gameTimeInput.value) || CONFIG.INITIAL_TIME;
    
    // 유효성 검사 (5초에서 60초 사이)
    const validTime = Math.min(Math.max(5, selectedTime), 60);
    gameTimeInput.value = validTime;
    
    gameState.isGameStarted = true;
    startButton.disabled = true;
    gameTimeInput.disabled = true;
    
    // 모든 카드 보여주기
    gameState.cards.forEach(card => {
        flipCard(card, true);
    });
    
    // 제한 시간 설정
    gameState.timeLeft = validTime;
    updateTimer();
    
    // 타이머 시작 (1초마다 감소)
    gameState.timer = setInterval(() => {
        gameState.timeLeft--;
        updateTimer();
        
        // 시간 종료 시 게임 종료
        if (gameState.timeLeft <= 0) {
            clearInterval(gameState.timer);
            endGame(false);
        }
    }, 1000);
    
    // 설정된 시간 후에 카드 숨기기
    setTimeout(() => {
        if (gameState.isGameStarted) {
            hideAllCards();
        }
    }, CONFIG.MEMORY_TIME);
}

// 모든 카드 숨기기
function hideAllCards() {
    gameState.cards.forEach(card => {
        if (!card.isMatched) {
            flipCard(card, false);
        }
    });
    
    // 카드 클릭 가능하도록 설정
    gameState.canFlip = true;
}

// 게임 종료
function endGame(isWin) {
    clearInterval(gameState.timer);
    gameState.isGameStarted = false;
    gameState.canFlip = false;
    
    if (isWin) {
        messageDisplay.textContent = `축하합니다! ${gameState.score}점으로 모든 카드를 맞췄습니다!`;
        messageDisplay.style.color = '#2ecc71';
    } else {
        messageDisplay.textContent = `시간이 종료되었습니다! 최종 점수: ${gameState.score}점`;
        messageDisplay.style.color = '#e74c3c';
    }
    
    startButton.textContent = '다시 시작';
    startButton.disabled = false;
}

// 점수 업데이트
function updateScore(points) {
    gameState.score += points;
    scoreDisplay.textContent = gameState.score;
}

// 타이머 업데이트
function updateTimer() {
    timeDisplay.textContent = gameState.timeLeft;
    
    if (gameState.timeLeft <= 0) {
        endGame(false);
    }
}

// 배열 셔플 (Fisher-Yates 알고리즘)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 이벤트 리스너
startButton.addEventListener('click', () => {
    if (!gameState.isGameStarted) {
        initGame();
        startGame();
    }
});

// 게임 초기화
initGame();
