let questions = [];

const API_URL =
"https://script.google.com/macros/s/AKfycbxm4iN2r95Z0mMURErmvas467YXsm8d5jSFZtn2NtAId3nGcFHs3-4CQcoKTEd1J-s/exec";

let badgeNumber = "";
let gameTimeLeft = 90;
let score = 0;
let questionCount = 0;
let currentStreak = 0;
let bestStreak = 0;
let currentQuestion = null;
let normalQuestions = [];
let jcQuestions = [];
let easyNormalQuestions = [];
let mediumNormalQuestions = [];
let easyJcQuestions = [];
let mediumJcQuestions = [];
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
      if (result.isAllowed === false) {
        alert("此 Badge Number 不在參加名單內。");
      } else {
        alert(
          "此 Badge Number 已完成兩次挑戰。\n\n" +
          "最高分：" + result.bestScore + " 分"
        );
      }

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
  const normal = questions.filter(q =>
    String(q.category).toLowerCase() !== "jc"
  );

  const jc = questions.filter(q =>
    String(q.category).toLowerCase() === "jc"
  );

  easyNormalQuestions = shuffleArray(
    normal.filter(q => String(q.difficulty).toLowerCase() === "easy")
  );

  mediumNormalQuestions = shuffleArray(
    normal.filter(q => String(q.difficulty).toLowerCase() !== "easy")
  );

  easyJcQuestions = shuffleArray(
    jc.filter(q => String(q.difficulty).toLowerCase() === "easy")
  );

  mediumJcQuestions = shuffleArray(
    jc.filter(q => String(q.difficulty).toLowerCase() !== "easy")
  );
}

function loadNextQuestion() {
  hasAnswered = false;
  questionCount++;

  if (questionCount % 5 === 0) {
    currentQuestion = getJcQuestion();
  } else {
    currentQuestion = getNormalQuestion();
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
    if (!option || String(option).trim() === "") return;

    const button = document.createElement("button");
    button.textContent = String.fromCharCode(65 + index) + ". " + option;
    button.onclick = () => handleAnswer(index);
    optionsDiv.appendChild(button);
  });
}
function getNormalQuestion() {
  // 頭4題一定 Easy
  if (questionCount <= 4) {
    if (easyNormalQuestions.length > 0) {
      return easyNormalQuestions.pop();
    }
  }

  // 第6題之後 Easy / Normal 混合
  // 偶數題偏 Easy，奇數題偏 Normal，避免太集中
  if (questionCount % 2 === 0) {
    if (easyNormalQuestions.length > 0) return easyNormalQuestions.pop();
    if (mediumNormalQuestions.length > 0) return mediumNormalQuestions.pop();
  } else {
    if (mediumNormalQuestions.length > 0) return mediumNormalQuestions.pop();
    if (easyNormalQuestions.length > 0) return easyNormalQuestions.pop();
  }

  return null;
}

function getJcQuestion() {
  // JC 題也混合 Easy / Normal
  if (questionCount <= 10) {
    if (easyJcQuestions.length > 0) return easyJcQuestions.pop();
    if (mediumJcQuestions.length > 0) return mediumJcQuestions.pop();
  } else {
    if (mediumJcQuestions.length > 0) return mediumJcQuestions.pop();
    if (easyJcQuestions.length > 0) return easyJcQuestions.pop();
  }

  return null;
}

function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
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
