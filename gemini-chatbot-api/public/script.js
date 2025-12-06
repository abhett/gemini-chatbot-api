// ========= CHATBOT =========
const messagesEl = document.getElementById("messages");
const formEl = document.getElementById("chat-form");
const inputEl = document.getElementById("message-input");
const statusEl = document.getElementById("status");
const sendBtn = document.getElementById("send-btn");
const clearBtn = document.getElementById("clear-btn");

// history percakapan untuk /api/chat
const conversation = [];

function scrollToBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function addMessage(text, sender = "bot") {
  const wrapper = document.createElement("div");
  wrapper.classList.add("message", sender);

  const avatar = document.createElement("div");
  avatar.classList.add("avatar");

  const bubble = document.createElement("div");
  bubble.classList.add("bubble");

  if (sender === "user") {
    avatar.classList.add("user-avatar");
    avatar.textContent = "You";
  } else if (sender === "bot") {
    avatar.classList.add("bot-avatar");
    avatar.textContent = "G";
  } else {
    avatar.classList.add("bot-avatar");
    avatar.textContent = "!";
  }

  bubble.textContent = text;

  if (sender === "user") {
    wrapper.appendChild(bubble);
    wrapper.appendChild(avatar);
  } else {
    wrapper.appendChild(avatar);
    wrapper.appendChild(bubble);
  }

  messagesEl.appendChild(wrapper);
  scrollToBottom();
}

function setStatus(msg) {
  statusEl.textContent = msg;
}

function setLoading(isLoading) {
  sendBtn.disabled = isLoading;
  inputEl.disabled = isLoading;
}

formEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = inputEl.value.trim();
  if (!text) return;

  addMessage(text, "user");
  conversation.push({ role: "user", text });

  inputEl.value = "";
  inputEl.style.height = "auto";
  inputEl.focus();

  setStatus("Gemini sedang berpikir...");
  setLoading(true);

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Terjadi kesalahan pada server");

    const replyText = data.result || "(Tidak ada respons)";
    addMessage(replyText, "bot");
    conversation.push({ role: "model", text: replyText });
  } catch (err) {
    console.error(err);
    addMessage(`Ups, error: ${err.message}`, "system");
  } finally {
    setStatus("");
    setLoading(false);
  }
});

inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    formEl.requestSubmit();
  }
});

inputEl.addEventListener("input", () => {
  inputEl.style.height = "auto";
  inputEl.style.height = inputEl.scrollHeight + "px";
});

clearBtn.addEventListener("click", () => {
  messagesEl.innerHTML = "";
  conversation.length = 0;
  addMessage("Obrolan baru dimulai. Apa yang ingin kamu tanyakan? 😊", "bot");
});

// ========= MULTIMODAL TOOLS =========

// helper umum
async function handleJsonTool({ url, body, resultEl }) {
  resultEl.textContent = "Memproses...";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Terjadi kesalahan.");
    resultEl.textContent = data.result || "(Tidak ada hasil)";
  } catch (err) {
    console.error(err);
    resultEl.textContent = "Error: " + err.message;
  }
}

async function handleFormDataTool({ url, formData, resultEl }) {
  resultEl.textContent = "Memproses...";
  try {
    const res = await fetch(url, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Terjadi kesalahan.");
    resultEl.textContent = data.result || "(Tidak ada hasil)";
  } catch (err) {
    console.error(err);
    resultEl.textContent = "Error: " + err.message;
  }
}

// ---- TEXT TOOL ----
const textForm = document.getElementById("text-tool-form");
const textInput = document.getElementById("text-tool-input");
const textResult = document.getElementById("text-tool-result");

textForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const prompt = textInput.value.trim();
  if (!prompt) return;
  await handleJsonTool({
    url: "/generate-text",
    body: { prompt },
    resultEl: textResult,
  });
});

// ---- IMAGE TOOL ----
const imageForm = document.getElementById("image-tool-form");
const imagePromptInput = document.getElementById("image-tool-prompt");
const imageFileInput = document.getElementById("image-tool-file");
const imageResult = document.getElementById("image-tool-result");

imageForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!imageFileInput.files[0]) {
    imageResult.textContent = "Pilih file gambar terlebih dahulu.";
    return;
  }
  const fd = new FormData();
  fd.append("prompt", imagePromptInput.value || "Jelaskan isi gambar ini.");
  fd.append("image", imageFileInput.files[0]);
  await handleFormDataTool({
    url: "/generate-from-image",
    formData: fd,
    resultEl: imageResult,
  });
});

// ---- DOCUMENT TOOL ----
const docForm = document.getElementById("doc-tool-form");
const docPromptInput = document.getElementById("doc-tool-prompt");
const docFileInput = document.getElementById("doc-tool-file");
const docResult = document.getElementById("doc-tool-result");

docForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!docFileInput.files[0]) {
    docResult.textContent = "Pilih file dokumen terlebih dahulu.";
    return;
  }
  const fd = new FormData();
  fd.append(
    "prompt",
    docPromptInput.value || "Tolong buat ringkasan dari dokumen berikut."
  );
  fd.append("document", docFileInput.files[0]);
  await handleFormDataTool({
    url: "/generate-from-document",
    formData: fd,
    resultEl: docResult,
  });
});

// ---- AUDIO TOOL ----
const audioForm = document.getElementById("audio-tool-form");
const audioPromptInput = document.getElementById("audio-tool-prompt");
const audioFileInput = document.getElementById("audio-tool-file");
const audioResult = document.getElementById("audio-tool-result");

audioForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!audioFileInput.files[0]) {
    audioResult.textContent = "Pilih file audio terlebih dahulu.";
    return;
  }
  const fd = new FormData();
  fd.append(
    "prompt",
    audioPromptInput.value || "Tolong buatkan transkrip dari rekaman berikut."
  );
  fd.append("audio", audioFileInput.files[0]);
  await handleFormDataTool({
    url: "/generate-from-audio",
    formData: fd,
    resultEl: audioResult,
  });
});
