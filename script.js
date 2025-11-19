document.addEventListener("DOMContentLoaded", function () {
  // --- DOM ELEMENTS ---
  const taskList = document.getElementById("taskList");
  const taskInput = document.getElementById("taskInput");
  const taskQtd = document.getElementById("taskQtd");
  const addTaskButton = document.getElementById("addTask");
  const listaSelecionada = document.getElementById("listaSelecionada");
  const btnRenomearLista = document.getElementById("renomearLista");
  const btnExcluirLista = document.getElementById("excluirLista");

  // --- ESTADO ---
  let listas = loadListas();
  let listaAtual = listaSelecionada.value;

  renderListaAtual();

  // --- EVENTOS ---
  addTaskButton.addEventListener("click", addTask);
  taskList.addEventListener("click", handleTaskActions);
  listaSelecionada.addEventListener("change", trocarLista);
  btnRenomearLista.addEventListener("click", renomearLista);
  btnExcluirLista.addEventListener("click", excluirLista);

  // ===============================
  //  CARREGAR / SALVAR LISTAS
  // ===============================
  function loadListas() {
    const listasSalvas = JSON.parse(localStorage.getItem("listasCompras"));

    // Se nunca foi salvo ou está corrompido:
    if (!listasSalvas || typeof listasSalvas !== "object") {
      return {
        mensal: [],
        semanal: [],
        limpeza: [],
      };
    }

    // Garante que NUNCA falte uma das 3 listas-base
    if (!listasSalvas.mensal) listasSalvas.mensal = [];
    if (!listasSalvas.semanal) listasSalvas.semanal = [];
    if (!listasSalvas.limpeza) listasSalvas.limpeza = [];

    return listasSalvas;
  }

  function saveListas() {
    localStorage.setItem("listasCompras", JSON.stringify(listas));
  }

  // ===============================
  //  TROCAR LISTA
  // ===============================
  function trocarLista() {
    const value = listaSelecionada.value;

    if (value === "__nova__") {
      const nome = prompt("Nome da nova lista:");
      if (!nome) {
        listaSelecionada.value = listaAtual;
        return;
      }

      const key = nome.toLowerCase().replace(/ /g, "_");

      if (listas[key]) {
        alert("Já existe uma lista com esse nome.");
        listaSelecionada.value = listaAtual;
        return;
      }

      listas[key] = [];
      saveListas();

      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = nome;
      listaSelecionada.insertBefore(
        opt,
        listaSelecionada.querySelector('option[value="__nova__"]')
      );

      listaSelecionada.value = key;
      listaAtual = key;
    } else {
      listaAtual = value;
    }

    renderListaAtual();
  }

  // ===============================
  //  RENOMEAR LISTA
  // ===============================
  function renomearLista() {
    if (listaAtual === "__nova__") return;

    const nomeNovo = prompt("Novo nome da lista:");
    if (!nomeNovo) return;

    const keyNova = nomeNovo.toLowerCase().replace(/ /g, "_");

    if (listas[keyNova]) {
      alert("Já existe uma lista com esse nome.");
      return;
    }

    listas[keyNova] = listas[listaAtual];
    delete listas[listaAtual];

    const opt = listaSelecionada.querySelector(`option[value="${listaAtual}"]`);
    opt.value = keyNova;
    opt.textContent = nomeNovo;

    listaAtual = keyNova;
    listaSelecionada.value = keyNova;

    saveListas();
  }

  // ===============================
  //  EXCLUIR LISTA
  // ===============================
  function excluirLista() {
    if (!confirm("Deseja excluir esta lista?")) return;

    delete listas[listaAtual];
    saveListas();

    listaSelecionada.value = "semana";
    listaAtual = "semana";

    renderListaAtual();
  }

  // ===============================
  //  RENDERIZAR LISTA ATUAL
  // ===============================
  function renderListaAtual() {
    taskList.innerHTML = "";

    listas[listaAtual].forEach((t) => {
      const li = createTaskElement(t.text, t.qtd, t.comprado);
      taskList.appendChild(li);
    });

    reorderList();
  }

  // ===============================
  //  ADICIONAR ITEM
  // ===============================
  function addTask() {
    const text = taskInput.value.trim();
    const qtd = parseInt(taskQtd.value) || 1;
    if (text === "") return;

    const li = createTaskElement(text, qtd, false);
    taskList.appendChild(li);

    listas[listaAtual].push({ text, qtd, comprado: false });
    saveListas();

    taskInput.value = "";
    taskQtd.value = "1";
  }

  // ===============================
  //  CRIAR ITEM
  // ===============================
  function createTaskElement(text, qtd, comprado) {
    const li = document.createElement("li");

    li.innerHTML = `
  <input type="checkbox" class="check-comprado" ${comprado ? "checked" : ""}>
  
  <div class="item-info">
    <span class="qtd-badge">${qtd}x</span>
    <span class="item-text">${text}</span>
  </div>

  <button class="delete-button">🗑️</button>
`;

    if (comprado) li.classList.add("comprado");

    addSwipeEvents(li);
    return li;
  }

  // ===============================
  //  SWIPE (direita = comprado, esquerda = excluir)
  // ===============================
  function addSwipeEvents(li) {
    let startX = 0,
      endX = 0;

    li.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
    });

    li.addEventListener("touchmove", (e) => {
      endX = e.touches[0].clientX;
      const diff = endX - startX;

      li.style.transform = `translateX(${diff}px)`;

      if (diff > 40) li.classList.add("swipe-right");
      else li.classList.remove("swipe-right");

      if (diff < -40) li.classList.add("swipe-left");
      else li.classList.remove("swipe-left");
    });

    li.addEventListener("touchend", () => {
      const diff = endX - startX;

      if (diff > 80) {
        const checkbox = li.querySelector(".check-comprado");
        checkbox.checked = !checkbox.checked;
        li.classList.toggle("comprado");
        updateListaFromDOM();
        reorderList();
        saveListas();
      }

      if (diff < -80) {
        li.style.opacity = "0";
        setTimeout(() => {
          li.remove();
          updateListaFromDOM();
          saveListas();
        }, 200);
      }

      li.style.transform = "translateX(0)";
      li.classList.remove("swipe-left", "swipe-right");
    });
  }

  // ===============================
  //  BOTÕES
  // ===============================
  function handleTaskActions(event) {
    const btn = event.target;
    const li = btn.parentElement;

    if (btn.classList.contains("check-comprado")) {
      li.classList.toggle("comprado");
      updateListaFromDOM();
      reorderList();
      saveListas();
    }

    if (btn.classList.contains("delete-button")) {
      li.remove();
      updateListaFromDOM();
      saveListas();
    }
  }

  // ===============================
  //  ATUALIZAR ARRAY A PARTIR DO DOM
  // ===============================
  function updateListaFromDOM() {
    listas[listaAtual] = [...taskList.querySelectorAll("li")].map((li) => {
      const textFull = li.querySelector("span").textContent;
      const text = textFull.replace(/\(\d+x\)/, "").trim();
      const qtd = parseInt(textFull.match(/\((\d+)x\)/)?.[1] || 1);
      const comprado = li.querySelector(".check-comprado").checked;
      return { text, qtd, comprado };
    });
  }

  // ===============================
  //  COMPRADOS NO FINAL
  // ===============================
  function reorderList() {
    const items = [...taskList.children];

    items.sort((a, b) => {
      const A = a.classList.contains("comprado") ? 1 : 0;
      const B = b.classList.contains("comprado") ? 1 : 0;
      return A - B;
    });

    items.forEach((item) => taskList.appendChild(item));
  }

  // ===============================
  //  CALCULADORA A + C
  // ===============================
  let calcValorDigitado = "";
  let calcTotal = parseFloat(localStorage.getItem("resultado") || "0");
  let historico = JSON.parse(localStorage.getItem("historicoCalc") || "[]");

  const display = document.getElementById("resultado");
  const historicoDiv = document.getElementById("historico");

  atualizarDisplay();
  renderHistorico();

  function atualizarDisplay() {
    display.textContent = calcTotal.toFixed(2);
  }

  function renderHistorico() {
    historicoDiv.innerHTML = historico
      .map((item) => `<div>${item}</div>`)
      .join("");
    localStorage.setItem("historicoCalc", JSON.stringify(historico));
  }

  function executar(valor, tipo) {
    if (tipo === "add") calcTotal += valor;
    else if (tipo === "sub") calcTotal -= valor;

    historico.push(
      `${tipo === "add" ? "+" : "-"} ${valor.toFixed(2)} → ${calcTotal.toFixed(
        2
      )}`
    );

    localStorage.setItem("resultado", calcTotal.toFixed(2));

    atualizarDisplay();
    renderHistorico();

    display.classList.remove("invocar", "drenar");
    void display.offsetWidth;

    display.classList.add(tipo === "add" ? "invocar" : "drenar");
  }

  // =============================
  // MULTIPLICAR VALOR UNITÁRIO
  // =============================

  // mostrar box de multiplicação
  document.getElementById("multiplicar").onclick = () => {
    if (!calcValorDigitado) return alert("Digite um valor primeiro.");
    document.getElementById("multiplicarQtd").value = 1;
    document.getElementById("multiplicar-box").classList.remove("hidden");
  };

  // cancelar
  document.getElementById("multiplicarCancelar").onclick = () => {
    document.getElementById("multiplicar-box").classList.add("hidden");
  };

  // aplicar multiplicação
  document.getElementById("multiplicarAplicar").onclick = () => {
    const qtd = parseInt(document.getElementById("multiplicarQtd").value);
    if (!qtd || qtd < 1) return;

    const unitario = parseFloat(calcValorDigitado.replace(",", "."));
    const total = unitario * qtd;

    executar(total, "add");

    calcValorDigitado = "";
    document.getElementById("multiplicar-box").classList.add("hidden");
  };

  // TECLADO NUMÉRICO
  document.querySelectorAll(".num").forEach((btn) => {
    btn.addEventListener("click", () => {
      const char = btn.textContent;

      // Se for vírgula
      if (char === ",") {
        if (calcValorDigitado.includes(",") || calcValorDigitado.includes("."))
          return;
        if (calcValorDigitado === "") calcValorDigitado = "0";
        calcValorDigitado += ",";
        display.textContent = calcValorDigitado;
        return;
      }

      // números normais
      calcValorDigitado += char;
      display.textContent = calcValorDigitado;
    });
  });

  // BACKSPACE
  document.getElementById("backspace").onclick = () => {
    calcValorDigitado = calcValorDigitado.slice(0, -1);
    display.textContent = calcValorDigitado || "0";
  };

  // SOMAR / SUBTRAIR
  document.querySelector(".add").onclick = () => {
    const v = parseFloat((calcValorDigitado || "0").replace(",", "."));
    executar(v, "add");
    calcValorDigitado = "";
  };

  document.querySelector(".sub").onclick = () => {
    const v = parseFloat((calcValorDigitado || "0").replace(",", "."));
    executar(v, "sub");
    calcValorDigitado = "";
  };

  // ATALHOS
  document.querySelectorAll(".atalho").forEach((btn) => {
    btn.addEventListener("click", () => {
      const v = parseFloat(btn.dataset.v);
      executar(v, "add");
    });
  });

  // DESFAZER
  document.getElementById("desfazer").onclick = () => {
    historico.pop();
    if (historico.length === 0) calcTotal = 0;
    else {
      const last = historico[historico.length - 1].split("→")[1].trim();
      calcTotal = parseFloat(last);
    }

    localStorage.setItem("resultado", calcTotal.toFixed(2));
    atualizarDisplay();
    renderHistorico();
  };

  // LIMPAR
  document.getElementById("limpar").onclick = () => {
    if (!confirm("Deseja zerar o total da calculadora?")) return;
    calcTotal = 0;
    historico = [];
    localStorage.setItem("resultado", "0");
    localStorage.setItem("historicoCalc", "[]");
    atualizarDisplay();
    renderHistorico();
  };
});
