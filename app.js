const vibeResponses = {
  space: {
    title: "Bet. Space means space.",
    text: "I will not spam your phone, chase a reply, or act weird because you need time. I care, so I can wait."
  },
  talk: {
    title: "We can talk, calm only.",
    text: "No yelling, no interrupting, no turning it around on you. I will listen first, then answer like someone who actually wants to fix this."
  },
  proof: {
    title: "Receipts over speeches.",
    text: "You do not need a paragraph king. You need changed behavior. I am locked in on proving the apology after the cute website is closed."
  },
  angry: {
    title: "Your anger is valid, fr.",
    text: "I am not going to call you dramatic for reacting to something that hurt. Stay mad if you need to. I will focus on why it happened."
  }
};

const vibeButtons = document.querySelectorAll("[data-choice]");
const responseTitle = document.querySelector("#responseTitle");
const responseText = document.querySelector("#responseText");

vibeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const response = vibeResponses[button.dataset.choice];

    vibeButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    if (responseTitle && responseText && response) {
      responseTitle.textContent = response.title;
      responseText.textContent = response.text;
    }
  });
});

const copyButtons = document.querySelectorAll("[data-copy-target]");

copyButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const target = document.querySelector(button.dataset.copyTarget);
    const status = button.dataset.copyStatus ? document.querySelector(button.dataset.copyStatus) : null;

    if (!target) return;

    const text = target.textContent.trim().replace(/\s+/g, " ");

    try {
      await navigator.clipboard.writeText(text);
      if (status) status.textContent = "Copied. Send it when the timing feels respectful.";
    } catch {
      if (status) status.textContent = "Copy was blocked. Select the note and copy it manually.";
    }
  });
});

const questionForm = document.querySelector("#questionForm");
const questionList = document.querySelector("#questionList");
const exportButton = document.querySelector("#exportQuestions");
const clearButton = document.querySelector("#clearQuestions");
const formToast = document.querySelector("#formToast");
const qaStorageKey = "baddie_apology_questions_v1";

function loadQuestions() {
  try {
    return JSON.parse(localStorage.getItem(qaStorageKey) || "[]");
  } catch {
    return [];
  }
}

function saveQuestions(questions) {
  localStorage.setItem(qaStorageKey, JSON.stringify(questions));
}

function formatDate(value) {
  return new Intl.DateTimeFormat(globalThis.navigator?.language || "en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function renderQuestions() {
  if (!questionList) return;

  const questions = loadQuestions();

  if (!questions.length) {
    questionList.innerHTML = '<div class="empty-state">No anonymous drops yet. When she writes something, it will show up here privately in this browser.</div>';
    return;
  }

  questionList.innerHTML = questions.map((item) => `
    <article class="qa-card" data-id="${item.id}">
      <div class="qa-meta">
        <span>Anonymous</span>
        <span>${item.mood}</span>
        <span>${formatDate(item.createdAt)}</span>
      </div>
      <p class="qa-question">${escapeHtml(item.question)}</p>
      <div class="answer-box field">
        <label for="answer-${item.id}">Your answer</label>
        <textarea id="answer-${item.id}" data-answer="${item.id}" placeholder="Answer with accountability, not attitude.">${escapeHtml(item.answer || "")}</textarea>
      </div>
      <div class="qa-actions">
        <button class="button button-primary" type="button" data-save-answer="${item.id}">Save answer</button>
        <button class="button button-secondary" type="button" data-copy-answer="${item.id}">Copy Q and A</button>
        <button class="button button-ghost" type="button" data-delete-question="${item.id}">Delete</button>
      </div>
      <div class="toast" id="toast-${item.id}"></div>
    </article>
  `).join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

questionForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(questionForm);
  const question = String(formData.get("question") || "").trim();
  const mood = String(formData.get("mood") || "Real talk");

  if (!question) {
    if (formToast) formToast.textContent = "Drop the question first.";
    return;
  }

  const questions = loadQuestions();
  questions.unshift({
    id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : String(Date.now()),
    mood,
    question,
    answer: "",
    createdAt: new Date().toISOString()
  });

  saveQuestions(questions);
  questionForm.reset();
  if (formToast) formToast.textContent = "Anon ask dropped. The owner inbox is separate from this page.";
  renderQuestions();
});

questionList?.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const questions = loadQuestions();
  const saveId = button.dataset.saveAnswer;
  const copyId = button.dataset.copyAnswer;
  const deleteId = button.dataset.deleteQuestion;

  if (saveId) {
    const answerField = questionList.querySelector(`[data-answer="${saveId}"]`);
    const question = questions.find((item) => item.id === saveId);
    if (question && answerField) {
      question.answer = answerField.value.trim();
      saveQuestions(questions);
      const toast = document.querySelector(`#toast-${saveId}`);
      if (toast) toast.textContent = "Answer saved.";
    }
  }

  if (copyId) {
    const question = questions.find((item) => item.id === copyId);
    if (question) {
      const text = `Anonymous question: ${question.question}\n\nAnswer: ${question.answer || "Not answered yet."}`;
      const toast = document.querySelector(`#toast-${copyId}`);
      try {
        await navigator.clipboard.writeText(text);
        if (toast) toast.textContent = "Q and A copied.";
      } catch {
        if (toast) toast.textContent = "Copy was blocked. Select and copy manually.";
      }
    }
  }

  if (deleteId) {
    saveQuestions(questions.filter((item) => item.id !== deleteId));
    renderQuestions();
  }
});

exportButton?.addEventListener("click", async () => {
  const questions = loadQuestions();
  const text = questions.length
    ? questions.map((item, index) => `${index + 1}. [${item.mood}] ${item.question}\nAnswer: ${item.answer || "Not answered yet."}`).join("\n\n")
    : "No anonymous questions yet.";

  try {
    await navigator.clipboard.writeText(text);
    if (formToast) formToast.textContent = "All questions copied.";
  } catch {
    if (formToast) formToast.textContent = "Copy was blocked. Keep the questions saved here.";
  }
});

clearButton?.addEventListener("click", () => {
  const questions = loadQuestions();
  if (!questions.length) return;

  if (confirm("Clear all anonymous questions from this browser?")) {
    saveQuestions([]);
    renderQuestions();
    if (formToast) formToast.textContent = "Question box cleared.";
  }
});

renderQuestions();

const slangSearch = document.querySelector("#slangSearch");
const dictionaryCards = document.querySelectorAll(".dict-card");

slangSearch?.addEventListener("input", () => {
  const query = slangSearch.value.trim().toLowerCase();

  dictionaryCards.forEach((card) => {
    const text = card.textContent.toLowerCase();
    card.classList.toggle("hidden", query.length > 0 && !text.includes(query));
  });
});

const questCards = document.querySelectorAll("[data-quest]");
const questCount = document.querySelector("#questCount");
const questProgress = document.querySelector("#questProgress");
const unlockPanel = document.querySelector("#unlockPanel");
const unlockTitle = document.querySelector("#unlockTitle");
const unlockText = document.querySelector("#unlockText");
const completedQuests = new Set();

function updateQuest() {
  if (!questCount || !questProgress) return;

  const total = questCards.length || 3;
  const count = completedQuests.size;
  questCount.textContent = `${count}/${total}`;
  questProgress.style.width = `${(count / total) * 100}%`;

  if (count === total && unlockPanel && unlockTitle && unlockText) {
    unlockPanel.classList.add("unlocked");
    unlockTitle.textContent = "Final note unlocked.";
    unlockText.textContent = "I know a fun website does not erase hurt. I made it so you could explore at your pace, but the real point is simple: I care, I hear you, and I need to show change with receipts.";
  }
}

questCards.forEach((card) => {
  card.addEventListener("click", () => {
    completedQuests.add(card.dataset.quest);
    card.classList.add("done");
    updateQuest();
  });
});

const spinButton = document.querySelector("#spinLine");
const randomLine = document.querySelector("#randomLine");
const spinStatus = document.querySelector("#spinStatus");
const apologyLines = [
  "I fumbled, no cap. Your feelings are valid, and I am bringing receipts through my actions.",
  "Real talk: I do not want to win the argument. I want to understand what hurt you.",
  "Bet, if you need space, I will respect it. No spam, no pressure, no weird energy.",
  "Highkey, I was wrong. Lowkey is not even the word. I need to move different.",
  "This is my do-better era, and you deserve proof instead of another mid apology.",
  "Your side eye is valid. I gave you a reason to question me, and I need to earn trust back.",
  "No rizz, no love bombing, no excuses. Just accountability and changed behavior.",
  "You ate me up with the truth, and honestly I needed to hear it."
];

spinButton?.addEventListener("click", () => {
  if (!randomLine) return;

  const next = apologyLines[Math.floor(Math.random() * apologyLines.length)];
  randomLine.textContent = next;
  if (spinStatus) spinStatus.textContent = "New line loaded.";
});

const vibeGameResponses = {
  mad: {
    title: "Still mad is valid.",
    text: "No rush. The correct move is space, patience, and not acting shocked that actions have consequences."
  },
  soft: {
    title: "Softening, but do not get brave.",
    text: "This is progress, not permission to act like everything is fixed. Keep listening and move gently."
  },
  snacks: {
    title: "Snack diplomacy required.",
    text: "Bring food, bring accountability, and do not forget the main ingredient: changed behavior."
  },
  talk: {
    title: "Ready to talk, calm only.",
    text: "No interrupting. No debate mode. Let her finish, repeat what you understood, then answer with care."
  }
};

const vibeGameButtons = document.querySelectorAll("[data-vibe]");
const vibeTitle = document.querySelector("#vibeTitle");
const vibeText = document.querySelector("#vibeText");

vibeGameButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const response = vibeGameResponses[button.dataset.vibe];
    vibeGameButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    if (response && vibeTitle && vibeText) {
      vibeTitle.textContent = response.title;
      vibeText.textContent = response.text;
    }
  });
});

const wheelMissions = [
  ["Snack run", "Buy her favorite snack and do not call it a peace treaty unless she laughs first."],
  ["Space mode", "Give her time without sending ten follow-up texts. Silent respect is still respect."],
  ["Voice note", "Send one calm voice note: apology first, explanation later."],
  ["Plan a date", "Plan something low-pressure that fits her mood, not your panic."],
  ["Write better", "Rewrite the apology with the actual thing you did wrong. No vague sorry."],
  ["Listen only", "Ask what hurt and listen for five full minutes before responding."]
];
const wheelButton = document.querySelector("#spinWheel");
const wheelFace = document.querySelector("#wheelFace");
const wheelTitle = document.querySelector("#wheelTitle");
const wheelText = document.querySelector("#wheelText");
let wheelTurns = 0;

wheelButton?.addEventListener("click", () => {
  const mission = wheelMissions[Math.floor(Math.random() * wheelMissions.length)];
  wheelTurns += 1;
  if (wheelFace) {
    wheelFace.style.transform = `rotate(${wheelTurns * 540}deg)`;
    wheelFace.textContent = mission[0];
  }
  if (wheelTitle && wheelText) {
    wheelTitle.textContent = mission[0];
    wheelText.textContent = mission[1];
  }
});

const truthPrompts = [
  "What is one thing I did that made you feel unheard?",
  "What is one habit I need to change if I want us to feel safe again?",
  "What would make this apology feel real instead of performative?",
  "What do you need from me before you can even think about softening?"
];
const darePrompts = [
  "Dare: send one cute memory, then one real thing you will improve.",
  "Dare: write a three-line apology with zero excuses.",
  "Dare: plan a no-pressure date and let her choose yes, no, or later.",
  "Dare: stay quiet and let her speak first next time."
];
const truthButton = document.querySelector("#truthButton");
const dareButton = document.querySelector("#dareButton");
const truthDareTitle = document.querySelector("#truthDareTitle");
const truthDareText = document.querySelector("#truthDareText");

function setTruthDare(type) {
  const list = type === "truth" ? truthPrompts : darePrompts;
  const prompt = list[Math.floor(Math.random() * list.length)];
  if (truthDareTitle && truthDareText) {
    truthDareTitle.textContent = type === "truth" ? "Truth prompt." : "Dare prompt.";
    truthDareText.textContent = prompt;
  }
}

truthButton?.addEventListener("click", () => setTruthDare("truth"));
dareButton?.addEventListener("click", () => setTruthDare("dare"));

const memoryLabels = {
  laugh: "Laugh attack",
  date: "Cute date",
  song: "Our song"
};
const memoryCards = document.querySelectorAll("[data-memory]");
const memoryStatus = document.querySelector("#memoryStatus");
const flippedMemory = [];
let memoryMatches = 0;

function updateMemoryStatus() {
  if (!memoryStatus) return;

  memoryStatus.innerHTML = `
    <p class="eyebrow">Match status</p>
    <h2>${memoryMatches}/3 pairs found.</h2>
    <p>${memoryMatches === 3 ? "All matched. Tiny compliment unlocked: you are still my favorite notification." : "Match all pairs to unlock a tiny compliment."}</p>
  `;
}

memoryCards.forEach((card) => {
  card.addEventListener("click", () => {
    if (card.classList.contains("matched") || card.classList.contains("flipped") || flippedMemory.length === 2) return;

    card.classList.add("flipped");
    card.textContent = memoryLabels[card.dataset.memory] || "Memory";
    flippedMemory.push(card);

    if (flippedMemory.length === 2) {
      const [first, second] = flippedMemory;
      if (first.dataset.memory === second.dataset.memory) {
        first.classList.add("matched");
        second.classList.add("matched");
        memoryMatches += 1;
        flippedMemory.length = 0;
        updateMemoryStatus();
      } else {
        window.setTimeout(() => {
          first.classList.remove("flipped");
          second.classList.remove("flipped");
          first.textContent = "?";
          second.textContent = "?";
          flippedMemory.length = 0;
        }, 700);
      }
    }
  });
});

const flagScenarios = [
  {
    text: "Interrupting while she explains why she is hurt.",
    answer: "red",
    result: "Red flag. Let her finish. The defense can wait."
  },
  {
    text: "Saying, 'I understand why that hurt, and I will change it.'",
    answer: "green",
    result: "Green flag. That is accountability with a pulse."
  },
  {
    text: "Sending ten texts because she did not reply in five minutes.",
    answer: "red",
    result: "Red flag. Space means space, not a notification ambush."
  },
  {
    text: "Planning something thoughtful without demanding instant forgiveness.",
    answer: "green",
    result: "Green flag. Effort without pressure is the move."
  }
];
const flagScenario = document.querySelector("#flagScenario");
const flagTitle = document.querySelector("#flagTitle");
const flagText = document.querySelector("#flagText");
const flagButtons = document.querySelectorAll("[data-flag-pick]");
let flagIndex = 0;

flagButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const scenario = flagScenarios[flagIndex];
    const correct = button.dataset.flagPick === scenario.answer;
    if (flagTitle && flagText) {
      flagTitle.textContent = correct ? "Correct read." : "Not the vibe.";
      flagText.textContent = scenario.result;
    }
    flagIndex = (flagIndex + 1) % flagScenarios.length;
    if (flagScenario) {
      window.setTimeout(() => {
        flagScenario.textContent = flagScenarios[flagIndex].text;
      }, 450);
    }
  });
});

const playlistResponses = {
  angry: {
    title: "Still angry playlist.",
    text: "The soundtrack is main character walk, no replies, and standards fully awake. Respect the distance."
  },
  miss: {
    title: "Miss you but mad playlist.",
    text: "Soft songs, sharp side eye. This means there is care, but the repair still needs receipts."
  },
  soft: {
    title: "Soft girl mode playlist.",
    text: "Tea, healing, maybe one reply. Do not ruin it by getting cocky."
  }
};
const playlistButtons = document.querySelectorAll("[data-playlist]");
const playlistResult = document.querySelector("#playlistResult");

playlistButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const response = playlistResponses[button.dataset.playlist];
    playlistButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    if (playlistResult && response) {
      playlistResult.innerHTML = `
        <p class="eyebrow">Playlist result</p>
        <h2>${response.title}</h2>
        <p>${response.text}</p>
      `;
    }
  });
});

const secretWords = document.querySelectorAll("[data-secret]");
const secretPanel = document.querySelector("#secretPanel");
const secretTitle = document.querySelector("#secretTitle");
const secretText = document.querySelector("#secretText");
const foundSecrets = new Set();

secretWords.forEach((word) => {
  word.addEventListener("click", () => {
    foundSecrets.add(word.dataset.secret);
    word.classList.add("found");
    const count = foundSecrets.size;

    if (secretTitle && secretText) {
      secretTitle.textContent = `${count}/3 words found.`;
      secretText.textContent = count === 3
        ? "Final compliment unlocked: angry or not, you are still gorgeous, iconic, and worth every bit of effort."
        : "Keep tapping the hidden words to unlock the final compliment.";
    }

    if (count === 3 && secretPanel) {
      secretPanel.classList.add("unlocked");
    }
  });
});
