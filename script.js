let questions = [];
const API_URL =
"https://script.google.com/macros/s/AKfycbxm4iN2r95Z0mMURErmvas467YXsm8d5jSFZtn2NtAId3nGcFHs3-4CQcoKTEd1J-s/exec";
let badgeNumber = "";
let gameTimeLeft = 40;
let score = 0;
let questionCount = 0;
let currentStreak = 0;
let bestStreak = 0;
let currentQuestion;
let questionPool = [];
let gameTimer = null;
let isPaused = false;
let hasAnswered = false;

function showRules() {
  const input = document.getElementById("badgeInput").value.trim();

  if (!input) {
    alert("請先輸入 Badge Number");
    return;
  }

  badgeNumber = input;

  const playData = JSON.parse(localStorage.getItem("worldcupQuizResults") || "{}");
  const playerRecords = playData[badgeNumber] || [];

  if (playerRecords.length >= 2) {
    const bestScore = Math.max(...playerRecords.map(record => record.score));

    alert(
      "此 Badge Number 已完成 2 次挑戰。\n\n" +
      "你的最高分為：" + bestScore + " 分。\n\n" +
      "遊戲開放期內，每個 Badge Number 最多挑戰 2 次。"
    );

    return;
  }

  document.getElementById("rulesPopup").classList.remove("hidden");
}

async function startGame() {
await loadQuestions();
  document.getElementById("landing").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");
  document.getElementById("rulesPopup").classList.add("hidden");

  questionPool = [...questions].sort(() => Math.random() - 0.5);
  loadNextQuestion();

  gameTimer = setInterval(() => {
    if (!isPaused) {
      gameTimeLeft = Math.max(0, gameTimeLeft - 0.1);
      document.getElementById("gameTime").textContent = gameTimeLeft.toFixed(1);

      if (gameTimeLeft <= 10) {
        document.getElementById("gameTime").classList.add("danger");
      }

      if (gameTimeLeft <= 0) {
        endGame();
      }
    }
  }, 100);

  
}

function loadNextQuestion() {
  if (questionPool.length === 0) {
    questionPool = [...questions].sort(() => Math.random() - 0.5);
  }

  hasAnswered = false;
  questionCount++;
  currentQuestion = questionPool.pop();

  document.getElementById("questionNo").textContent = questionCount;
  document.getElementById("questionText").textContent = currentQuestion.question;

  const optionsDiv = document.getElementById("options");
  optionsDiv.innerHTML = "";

  currentQuestion.options.forEach((option, index) => {
    const btn = document.createElement("button");
    btn.textContent = String.fromCharCode(65 + index) + ". " + option;
    btn.onclick = () => handleAnswer(index, false);
    optionsDiv.appendChild(btn);
  });
}

function handleAnswer(selectedIndex, isTimeout) {
  if (hasAnswered) return;
  hasAnswered = true;
  isPaused = true;

  document.querySelectorAll("#options button").forEach(btn => {
    btn.disabled = true;
  });

const correct =
String.fromCharCode(65 + selectedIndex) === currentQuestion.answer;

  if (correct) {
    score++;
    currentStreak++;
    bestStreak = Math.max(bestStreak, currentStreak);
  } else {
    currentStreak = 0;
  }

  document.getElementById("score").textContent = score;

  if (isTimeout) {
    showResult("⏰ 時間到！", "timeout");
  } else if (correct) {
    showResult("✅ 答對！GOAL!", "correct");
  } else {
    showResult("❌ 答錯！MISS!", "wrong");
  }

  setTimeout(() => {
    document.getElementById("resultPopup").classList.add("hidden");

    if (gameTimeLeft <= 0) {
      endGame();
    } else {
      loadNextQuestion();
      isPaused = false;
    }
  }, 1000);
}

function showResult(title, type) {
  const popupTitle = document.getElementById("popupTitle");

  popupTitle.textContent = title;
  popupTitle.className = "result-title " + type;

  const answerIndex = currentQuestion.answer.charCodeAt(0) - 65;

  document.getElementById("correctAnswerText").textContent =
    currentQuestion.options[answerIndex];

  document.getElementById("resultPopup").classList.remove("hidden");
}

function endGame() {
  clearInterval(gameTimer);

  saveResult();

  document.getElementById("game").classList.add("hidden");
  document.getElementById("end").classList.remove("hidden");

  document.getElementById("finalBadge").textContent = badgeNumber;
  document.getElementById("finalScore").textContent = score;
  document.getElementById("bestStreak").textContent = bestStreak;
}
function saveResult() {
  const playData = JSON.parse(localStorage.getItem("worldcupQuizResults") || "{}");

  if (!playData[badgeNumber]) {
    playData[badgeNumber] = [];
  }

  if (playData[badgeNumber].length < 2) {
    playData[badgeNumber].push({
      score: score,
      bestStreak: bestStreak,
      playedAt: new Date().toISOString()
    });
  }

  localStorage.setItem("worldcupQuizResults", JSON.stringify(playData));
}
async function loadQuestions() {

  try {

    const response = await fetch(API_URL);

    const data = await response.json();

    questions = data;

    console.log("成功載入題目：", questions.length);

  }

  catch (error) {

    alert("無法載入題目");

    console.error(error);

  }

}
