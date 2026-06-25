let questions = [];

const API_URL =
"https://script.google.com/macros/s/AKfycbxm4iN2r95Z0mMURErmvas467YXsm8d5jSFZtn2NtAId3nGcFHs3-4CQcoKTEd1J-s/exec";

let badgeNumber = "";
let gameTimeLeft = 40;
let score = 0;
let questionCount = 0;
let currentStreak = 0;
let bestStreak = 0;
let currentQuestion = null;
let normalQuestions = [];
let jcQuestions = [];
let gameTimer = null;
let isPaused = false;
let hasAnswered = false;
let gameEnded = false;

async function showRules() {
  const input = document.getElementById("badgeInput").value.trim();

  if (!input) {
    alert("請輸入 Badge Number");
    return;
  }

  badgeNumber = input;

  showLoading("正在驗證 Badge...", "請稍候，系統正在確認挑戰次數");

  try {
    const response = await fetch(
      API_URL + "?action=checkBadge&badge=" + encodeURIComponent(badgeNumber)
    );

    const result = await response.json();

    hideLoading();

    if (!result.canPlay) {
      alert(
        "此 Badge Number 已完成兩次挑戰。\n\n" +
        "最高分：" + result.bestScore + " 分"
      );
      return;
    }

    document.getElementById("rulesPopup").classList.remove("hidden");

  } catch (error) {
    hideLoading();
    alert("無法連接伺服器，請稍後再試。");
    console.log(error);
  }
}

async function startGame() {
  showLoading("正在載入題庫...", "請稍候，系統正在準備比賽");

  await loadQuestions();

  if (questions.length === 0) {
    hideLoading();
    alert("題庫未能載入，請檢查 Google Sheet。");
    return;
  }

  await startCountdown();

  hideLoading();

  document.getElementById("landing").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");
  document.getElementById("rulesPopup").classList.add("hidden");

  prepareQuestionPools();
  loadNextQuestion();

  gameTimer = setInterval(() => {
    if (!isPaused && !gameEnded) {
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

async function loadQuestions() {
  try {
    const response = await fetch(API_URL + "?action=questions");
    const data = await response.json();

    if (!data.success || !data.questions || data.questions.length === 0) {
      questions = [];
      return;
    }

    questions = data.questions;
    console.log("成功載入題目：", questions.length);

  } catch (error) {
    questions = [];
    console.error(error);
  }
}

function prepareQuestionPools() {
  normalQuestions = questions
    .filter(q => String(q.category).toLowerCase() !== "jc")
    .sort(() => Math.random() - 0.5);

  jcQuestions = questions
    .filter(q => String(q.category).toLowerCase() === "jc")
    .sort(() => Math.random() - 0.5);
}

function loadNextQuestion() {
  hasAnswered = false;
  questionCount++;

  if (questionCount % 5 === 0 && jcQuestions.length > 0) {
    currentQuestion = jcQuestions.pop();
  } else {
    if (normalQuestions.length === 0) {
      normalQuestions = questions
        .filter(q => String(q.category).toLowerCase() !== "jc")
        .sort(() => Math.random() - 0.5);
    }

    currentQuestion = normalQuestions.pop();
  }

  if (!currentQuestion) {
    endGame();
    return;
  }

  document.getElementById("questionNo").textContent = questionCount;
  document.getElementById("questionText").textContent = currentQuestion.question;

  const questionImage = document.getElementById("questionImage");

  if (questionImage) {
    if (currentQuestion.image && currentQuestion.image.trim() !== "") {
      questionImage.src = currentQuestion.image;
      questionImage.classList.remove("hidden");
    } else {
      questionImage.src = "";
      questionImage.classList.add("hidden");
    }
  }

  const optionsDiv = document.getElementById("options");
  optionsDiv.innerHTML = "";

  currentQuestion.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.textContent = String.fromCharCode(65 + index) + ". " + option;
    button.onclick = () => handleAnswer(index);
    optionsDiv.appendChild(button);
  });
}

function handleAnswer(selectedIndex) {
  if (hasAnswered || gameEnded) return;

  hasAnswered = true;
  isPaused = true;

  document.querySelectorAll("#options button").forEach(btn => {
    btn.disabled = true;
  });

  const selectedLetter = String.fromCharCode(65 + selectedIndex);
  const correct = selectedLetter === String(currentQuestion.answer).toUpperCase();

  if (correct) {
    score++;
    currentStreak++;
    bestStreak = Math.max(bestStreak, currentStreak);
  } else {
    currentStreak = 0;
  }

  document.getElementById("score").textContent = score;

  if (correct) {
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

  const answerLetter = String(currentQuestion.answer).toUpperCase();
  const answerIndex = answerLetter.charCodeAt(0) - 65;

  document.getElementById("correctAnswerText").textContent =
    currentQuestion.options[answerIndex];

  document.getElementById("resultPopup").classList.remove("hidden");
}

function endGame() {
  if (gameEnded) return;

  gameEnded = true;
  clearInterval(gameTimer);

  submitResult();

  document.getElementById("game").classList.add("hidden");
  document.getElementById("end").classList.remove("hidden");

  document.getElementById("finalBadge").textContent = badgeNumber;
  document.getElementById("finalScore").textContent = score;
  document.getElementById("bestStreak").textContent = bestStreak;
}

async function submitResult() {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "submitResult",
        badge: badgeNumber,
        score: score
      })
    });

    const result = await response.json();
    console.log("成績提交結果：", result);

  } catch (error) {
    console.log("提交成績失敗：", error);
  }
}

function showLoading(title = "正在載入題庫...", text = "請稍候，系統正在準備比賽") {
  document.getElementById("loadingTitle").textContent = title;
  document.getElementById("loadingText").textContent = text;
  document.getElementById("loadingOverlay").classList.remove("hidden");
}

function hideLoading() {
  document.getElementById("loadingOverlay").classList.add("hidden");
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function startCountdown() {
  showLoading("3", "準備開始！");

  await delay(700);
  showLoading("2", "集中精神！");

  await delay(700);
  showLoading("1", "準備入波！");

  await delay(700);
  showLoading("GO!", "開始挑戰！");

  await delay(500);
}
