const input = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const messages = document.getElementById("messages");
const welcome = document.getElementById("welcome");
const thinking = document.getElementById("thinking");
const chat = document.getElementById("chat");

const newChat = document.getElementById("newChat");
const clearChat = document.getElementById("clearChat");
const serverStatus = document.getElementById("serverStatus");

let conversation = [];

function scrollBottom() {
    requestAnimationFrame(() => {
        chat.scrollTop = chat.scrollHeight;
    });
}

function addMessage(text, type) {
    const message = document.createElement("div");

    message.className = "message " + type;
    message.textContent = text;

    messages.appendChild(message);

    scrollBottom();
}

function setThinking(active) {
    if (active) {
        thinking.classList.add("active");
    } else {
        thinking.classList.remove("active");
    }

    scrollBottom();
}

function resetChat() {
    conversation = [];
    messages.innerHTML = "";
    welcome.style.display = "";
    input.value = "";
    input.style.height = "auto";
    scrollBottom();
}

async function checkServer() {
    try {
        const response = await fetch("/api/status");

        if (!response.ok) {
            throw new Error("Serveur indisponible");
        }

        serverStatus.textContent = "Serveur connecté";
    } catch (error) {
        serverStatus.textContent = "Serveur hors ligne";
    }
}

async function sendMessage(customText = null) {

    const text = customText !== null
        ? customText.trim()
        : input.value.trim();

    if (!text) {
        return;
    }

    if (welcome) {
        welcome.style.display = "none";
    }

    input.value = "";
    input.style.height = "auto";

    addMessage(text, "user");

    conversation.push({
        role: "user",
        content: text
    });

    setThinking(true);

    sendButton.disabled = true;

    try {

        const response = await fetch("/api/chat", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                message: text,
                messages: conversation
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error ||
                data.message ||
                "Erreur du serveur"
            );
        }

        const reply =
            data.reply ||
            data.response ||
            data.message ||
            data.answer;

        if (!reply) {
            throw new Error("NOVA n'a pas retourné de réponse.");
        }

        conversation.push({
            role: "assistant",
            content: reply
        });

        setThinking(false);

        addMessage(reply, "ai");

    } catch (error) {

        setThinking(false);

        addMessage(
            "Impossible de contacter NOVA. " + error.message,
            "ai"
        );

        console.error("NOVA:", error);

    } finally {

        sendButton.disabled = false;

        input.focus();
    }
}

sendButton.addEventListener("click", () => {
    sendMessage();
});

input.addEventListener("keydown", (event) => {

    if (event.key === "Enter" && !event.shiftKey) {

        event.preventDefault();

        sendMessage();
    }
});

input.addEventListener("input", () => {

    input.style.height = "auto";

    input.style.height =
        Math.min(input.scrollHeight, 150) + "px";
});

newChat.addEventListener("click", resetChat);

clearChat.addEventListener("click", resetChat);

document.querySelectorAll(".suggestion").forEach((button) => {

    button.addEventListener("click", () => {

        const prompt = button.dataset.prompt;

        if (prompt) {
            sendMessage(prompt);
        }
    });

});

document.addEventListener("keydown", (event) => {

    if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
    ) {

        event.preventDefault();

        resetChat();

        input.focus();
    }
});

checkServer();
input.focus();