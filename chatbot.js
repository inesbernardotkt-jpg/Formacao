/* ===== Chatbot de suporte 24h ===== */
  // 👉 URL do nó Webhook do n8n para o chat (método POST).
  // O n8n deve responder em JSON com um campo "reply", ex.: {"reply":"Olá!"}
  const CHAT_WEBHOOK_URL = "https://O-TEU-N8N/webhook-test/chat-rh";

  const chatPanel = document.getElementById("chat-panel");
  const chatToggle = document.getElementById("chat-toggle");
  const chatBody = document.getElementById("chat-body");
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const chatSend = document.getElementById("chat-send");

  // ID de sessão para o n8n manter o contexto da conversa
  let sessionId;
  try {
    sessionId = sessionStorage.getItem("chatSession");
    if (!sessionId) {
      sessionId = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
      sessionStorage.setItem("chatSession", sessionId);
    }
  } catch (e) {
    sessionId = String(Date.now()) + Math.random().toString(16).slice(2);
  }

  function addMsg(text, who) {
    const el = document.createElement("div");
    el.className = "msg " + who;
    el.textContent = text; // textContent evita injeção de HTML
    chatBody.appendChild(el);
    chatBody.scrollTop = chatBody.scrollHeight;
    return el;
  }

  function toggleChat(open) {
    chatPanel.classList.toggle("open", open);
    chatToggle.setAttribute("aria-expanded", open);
    if (open) {
      if (!chatBody.children.length) {
        addMsg("Olá! 👋 Sou o assistente virtual da Vértice RH. Como posso ajudar?", "bot");
      }
      chatInput.focus();
    }
  }

  chatToggle.addEventListener("click", () => toggleChat(!chatPanel.classList.contains("open")));
  document.getElementById("chat-close").addEventListener("click", () => toggleChat(false));

  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    addMsg(text, "user");
    chatInput.value = "";
    chatSend.disabled = true;
    const typing = addMsg("A escrever…", "bot typing");

    try {
      const res = await fetch(CHAT_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId,
          mensagem: text,
          pagina: location.href,
          enviadoEm: new Date().toISOString()
        })
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      // Aceita vários nomes de campo, conforme o nó que usares no n8n
      const reply = data.reply || data.output || data.text || data.message || "";
      typing.remove();
      addMsg(reply || "Desculpe, não consegui obter uma resposta.", "bot");
    } catch (err) {
      console.error(err);
      typing.remove();
      addMsg("De momento não consigo responder. Pode contactar-nos através do formulário ou por e-mail.", "bot");
    } finally {
      chatSend.disabled = false;
      chatInput.focus();
    }
  });
