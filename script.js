const questions = [
  { question: "2022年世界杯冠軍係邊隊？", options: ["阿根廷", "法國", "巴西", "德國"], answer: 0 },
  { question: "2018年世界杯冠軍係邊隊？", options: ["法國", "克羅地亞", "英格蘭", "比利時"], answer: 0 },
  { question: "世界杯通常幾多年舉辦一次？", options: ["2年", "3年", "4年", "5年"], answer: 2 },
  { question: "美斯代表邊個國家隊？", options: ["巴西", "阿根廷", "葡萄牙", "西班牙"], answer: 1 },
  { question: "C朗代表邊個國家隊？", options: ["葡萄牙", "阿根廷", "法國", "意大利"], answer: 0 },
  { question: "巴西曾經贏過幾多次世界杯？", options: ["3次", "4次", "5次", "6次"], answer: 2 },
  { question: "第一屆世界杯喺邊一年舉行？", options: ["1926", "1930", "1934", "1938"], answer: 1 },
  { question: "第一屆世界杯主辦國係邊個？", options: ["巴西", "烏拉圭", "阿根廷", "意大利"], answer: 1 },
  { question: "2022年世界杯喺邊個國家舉行？", options: ["卡塔爾", "俄羅斯", "巴西", "南非"], answer: 0 },
  { question: "2010年世界杯冠軍係邊隊？", options: ["荷蘭", "德國", "西班牙", "阿根廷"], answer: 2 }
];

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
  document.getElementById("rulesPopup").classList.remove("hidden");
}

function startGame() {
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

  const correct = selectedIndex === currentQuestion.answer;

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

  document.getElementById("correctAnswerText").textContent =
    currentQuestion.options[currentQuestion.answer];

  document.getElementById("resultPopup").classList.remove("hidden");
}

function endGame() {
  clearInterval(gameTimer);

  document.getElementById("resultPopup").classList.add("hidden");
  document.getElementById("game").classList.add("hidden");
  document.getElementById("end").classList.remove("hidden");

  document.getElementById("finalBadge").textContent = badgeNumber;
  document.getElementById("finalScore").textContent = score;
  document.getElementById("bestStreak").textContent = bestStreak;
}
