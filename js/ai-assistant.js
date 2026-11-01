const aiLauncher = document.querySelector("#ai-launcher");
const aiPanel = document.querySelector("#ai-panel");
const aiCloseBtn = document.querySelector("#ai-close-btn");

const aiMenuBtn = document.querySelector("#ai-menu-btn");
const aiMenu = document.querySelector("#ai-menu");

const aiChat = document.querySelector("#ai-chat");
const aiWelcome = document.querySelector("#ai-welcome");
const aiMessages = document.querySelector("#ai-messages");

const aiForm = document.querySelector("#ai-form");
const aiInput = document.querySelector("#ai-input");
const aiSendBtn = document.querySelector("#ai-send-btn");

const aiConfirm = document.querySelector("#ai-confirm");
const aiCancelClear = document.querySelector("#ai-cancel-clear");
const aiConfirmClear = document.querySelector("#ai-confirm-clear");

const STORAGE_KEY = "portfolio_ai_conversation";

let conversation = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

function saveConversation() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversation));
}
let isLoading = false;

/* ---------------- OPEN / CLOSE ---------------- */

function openAI() {
  aiPanel.hidden = false;
  aiLauncher.hidden = true;
  aiLauncher.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="CurrentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x preview-icon"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
  aiInput.focus();
}

function closeAI() {
  aiPanel.hidden = true;
  aiLauncher.hidden = false;
  aiMenu.hidden = true;
  aiLauncher.innerHTML = `<svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="CurrentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="lucide lucide-bot-message-square preview-icon"
            >
              <path d="M12 6V2H8" />
              <path d="M15 11v2" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path
                d="M20 16a2 2 0 0 1-2 2H8.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 4 20.286V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z"
              />
              <path d="M9 11v2" />
            </svg>`;
  aiMenuBtn.setAttribute("aria-expanded", "false");
}

aiLauncher.addEventListener("click", function () {
  aiLauncher.hidden ? closeAI() : openAI();
});
aiCloseBtn.addEventListener("click", closeAI);

/* ---------------- MENU ---------------- */

aiMenuBtn.addEventListener("click", () => {
  aiMenu.hidden = !aiMenu.hidden;

  aiMenuBtn.setAttribute("aria-expanded", String(!aiMenu.hidden));
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".ai-menu-wrapper")) {
    aiMenu.hidden = true;
    aiMenuBtn.setAttribute("aria-expanded", "false");
  }
});

/* ---------------- ADD MESSAGE ---------------- */

function addMessage(text, sender) {
  const message = document.createElement("div");

  message.className = `ai-message ${sender}`;

  const paragraph = document.createElement("p");
  paragraph.textContent = text;

  message.append(paragraph);
  aiMessages.append(message);

  aiChat.scrollTop = aiChat.scrollHeight;
}

function loadConversation() {
  if (conversation.length === 0) return;

  aiWelcome.hidden = true;

  conversation.forEach((message) => {
    addMessage(message.text, message.role);
  });
}
/* ---------------- LOADING ---------------- */

function showLoading() {
  const loading = document.createElement("div");

  loading.className = "ai-message assistant";
  loading.id = "ai-loading";
  loading.textContent = "Thinking...";

  aiMessages.append(loading);
  aiChat.scrollTop = aiChat.scrollHeight;
}

function hideLoading() {
  document.querySelector("#ai-loading")?.remove();
}

/* ---------------- SEND MESSAGE ---------------- */

async function sendMessage(message) {
  const question = message.trim();

  if (!question || isLoading) return;

  aiWelcome.hidden = true;

  addMessage(question, "user");

  conversation.push({
    role: "user",
    text: question,
  });

  saveConversation();

  aiInput.value = "";
  isLoading = true;
  aiSendBtn.disabled = true;

  showLoading();

  const requestData = {
    message: question,
    history: conversation.slice(0, -1).slice(-10),
  };

  console.log(
    "Request size:",
    new Blob([JSON.stringify(requestData)]).size,
    "bytes",
  );

  try {
    const response = await fetch("http://127.0.0.1:5000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    const data = await response.json();

    if (!response.ok || data.status !== "success") {
      throw new Error(data.error || "Request failed");
    }

    if (!data.answer) {
      throw new Error("Empty response from assistant");
    }

    addMessage(data.answer, "assistant");

    conversation.push({
      role: "assistant",
      text: data.answer,
    });
  } catch (error) {
    console.error("AI Assistant Error:", error);

    addMessage("Sorry, something went wrong. Please try again.", "assistant");
  } finally {
    hideLoading();

    isLoading = false;
    aiSendBtn.disabled = false;
    aiInput.focus();
  }
}

/* ---------------- INPUT SUBMIT ---------------- */

aiForm.addEventListener("submit", (event) => {
  event.preventDefault();
  sendMessage(aiInput.value);
});

document.querySelectorAll(".ai-suggestion").forEach((button) => {
  button.addEventListener("click", () => {
    sendMessage(button.textContent);
  });
});

aiMenu.addEventListener("click", (event) => {
  const action = event.target.dataset.action;

  if (action === "new") {
    clearConversation();
  }

  if (action === "clear") {
    aiConfirm.hidden = false;
  }

  if (action === "about") {
    addMessage(
      "I'm a simple portfolio assistant. I can only answer questions about Mohammad's background, skills, projects and collaboration.",
      "assistant",
    );
  }

  aiMenu.hidden = true;
  aiMenuBtn.setAttribute("aria-expanded", "false");
});

function clearConversation() {
  conversation = [];
  aiMessages.replaceChildren();
  aiWelcome.hidden = false;
  aiConfirm.hidden = true;
  aiInput.value = "";
  localStorage.removeItem(STORAGE_KEY);
}

aiCancelClear.addEventListener("click", () => {
  aiConfirm.hidden = true;
});

aiConfirmClear.addEventListener("click", clearConversation);

loadConversation();
