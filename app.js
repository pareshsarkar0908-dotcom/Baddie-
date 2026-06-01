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
  if (formToast) formToast.textContent = "Anonymous question saved in this browser.";
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
