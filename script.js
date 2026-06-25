/* ==========================================================================
   INICIO: DADOS SIMULADOS (BANCO DE DADOS FALSO)
   ========================================================================== */

// Array central de lotes — todas as páginas leem daqui
const bancoDeLotes = [
    {
        id: "LOTE-GRI-001",
        especie: "Grilo",
        dataEclosao: "2026-05-11", // 45 dias atrás
        quantidadeKg: 5.0,
        tempMedia10d: 26.2,
        ativo: true
    },
    {
        id: "LOTE-GRI-002",
        especie: "Grilo",
        dataEclosao: "2026-05-11", // 45 dias atrás
        quantidadeKg: 4.5,
        tempMedia10d: 23.5, // abaixo de 25 — bloqueado
        ativo: true
    },
    {
        id: "LOTE-LAR-003",
        especie: "Larva",
        dataEclosao: "2026-06-03", // 22 dias atrás
        quantidadeKg: 2.0,
        tempMedia10d: 25.8,
        ativo: true
    }
];

// Histórico de alimentação simulado
const historicoAlimentacao = [
    { data: "24/06/2026 08:00", lote: "LOTE-GRI-001", dieta: "Suplemento de Cálcio", qtd: 4.50, operador: "João Silva" },
    { data: "23/06/2026 18:30", lote: "LOTE-LAR-003", dieta: "Mix Crescimento Acelerado", qtd: 1.20, operador: "Maria Souza" }
];

// Usuário logado (null = não logado)
let usuarioLogado = null;

/* FIM: DADOS SIMULADOS */


/* ==========================================================================
   INICIO: REGRAS DE NEGOCIO
   ========================================================================== */

function calcularDiasDesdeEclosao(dataEclosaoStr) {
    const hoje = new Date();
    const eclosao = new Date(dataEclosaoStr);
    const diffMs = hoje - eclosao;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function validarProntoParaColheita(lote) {
    const dias = calcularDiasDesdeEclosao(lote.dataEclosao);
    const tempOk = lote.tempMedia10d >= 25;
    const diasOk = dias >= 45;
    return { aprovado: tempOk && diasOk, dias, tempOk, diasOk };
}

function gerarIdLote(especie) {
    const prefixo = especie === "Grilo" ? "GRI" : "LAR";
    const num = String(bancoDeLotes.filter(l => l.especie === especie).length + 1).padStart(3, "0");
    return `LOTE-${prefixo}-${num}`;
}

/* FIM: REGRAS DE NEGOCIO */


/* ==========================================================================
   INICIO: SISTEMA DE LOGIN / AUTENTICACAO
   ========================================================================== */

const USUARIOS_VALIDOS = [
    { usuario: "admin", senha: "1234", nome: "Administrador" },
    { usuario: "joao", senha: "bugfarm", nome: "João Silva" },
    { usuario: "maria", senha: "bugfarm", nome: "Maria Souza" }
];

function abrirModalLogin() {
    document.getElementById("modal-login").style.display = "flex";
}

function fecharModalLogin() {
    document.getElementById("modal-login").style.display = "none";
}

function tentarLogin(usuario, senha) {
    const encontrado = USUARIOS_VALIDOS.find(u => u.usuario === usuario && u.senha === senha);
    if (encontrado) {
        usuarioLogado = encontrado;
        fecharModalLogin();
        atualizarUILogin();
        return true;
    }
    return false;
}

function fazerLogout() {
    usuarioLogado = null;
    atualizarUILogin();
}

function atualizarUILogin() {
    const btnLogin = document.getElementById("login-btn");
    const spanUsername = document.getElementById("username");
    const overlay = document.getElementById("overlay-bloqueio");

    if (usuarioLogado) {
        if (btnLogin) {
            btnLogin.innerHTML = '<img src="https://github.com/Tuzakiz/Bug-Farm-Tech/blob/main/Logout.png?raw=true" alt="Sair" class="icone-logout">';
            btnLogin.classList.add("btn-logout-ativo");
            btnLogin.title = "Sair";
        }
        if (spanUsername) spanUsername.innerText = usuarioLogado.nome;
        if (overlay) overlay.style.display = "none";
    } else {
        if (btnLogin) {
            btnLogin.innerText = "Login";
            btnLogin.classList.remove("btn-logout-ativo");
            btnLogin.title = "";
        }
        if (spanUsername) spanUsername.innerText = "User";
        if (overlay) overlay.style.display = "flex";
        abrirModalLogin();
    }
}

function inicializarLogin() {
    const btnLogin = document.getElementById("login-btn");
    if (btnLogin) {
        btnLogin.addEventListener("click", function () {
            if (usuarioLogado) {
                fazerLogout();
            } else {
                abrirModalLogin();
            }
        });
    }

    const formLogin = document.getElementById("form-login-modal");
    if (formLogin) {
        formLogin.addEventListener("submit", function (e) {
            e.preventDefault();
            const usuario = document.getElementById("input-usuario").value.trim();
            const senha = document.getElementById("input-senha").value.trim();
            const erro = document.getElementById("erro-login");

            if (tentarLogin(usuario, senha)) {
                formLogin.reset();
                if (erro) erro.style.display = "none";
            } else {
                if (erro) erro.style.display = "block";
            }
        });
    }

    // Primeiro acesso — exibe modal
    if (!usuarioLogado) {
        atualizarUILogin();
    }
}

/* FIM: SISTEMA DE LOGIN / AUTENTICACAO */


/* ==========================================================================
   INICIO: SENSOR DO BOTAO MENU (TOGGLE SIDEBAR)
   ========================================================================== */

function inicializarToggleSidebar() {
    const botoesToggle = document.querySelectorAll(".btn-toggle");
    const barraLateral = document.querySelector(".sidebar");

    botoesToggle.forEach(botao => {
        botao.addEventListener("click", function () {
            barraLateral.classList.toggle("escondido");
        });
    });
}

/* FIM: SENSOR DO BOTAO MENU */


/* ==========================================================================
   INICIO: SISTEMA DE TROCA DE ABAS
   ========================================================================== */

function inicializarNavegacao() {
    const conteudoPrincipal = document.querySelector(".conteudo-principal");

    document.addEventListener("click", function (evento) {
        const linkElemento = evento.target.closest(".menu-navegacao a");
        if (!linkElemento) return;

        evento.preventDefault();

        if (!usuarioLogado) {
            abrirModalLogin();
            return;
        }

        document.querySelectorAll(".menu-navegacao a").forEach(l => l.classList.remove("ativo"));
        linkElemento.classList.add("ativo");

        const paginaAlvo = linkElemento.getAttribute("data-pagina");
        if (!paginaAlvo) return;

        fetch(`${paginaAlvo}.html`)
            .then(r => {
                if (!r.ok) throw new Error(`Não encontrado: ${paginaAlvo}.html`);
                return r.text();
            })
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, "text/html");
                const novo = doc.querySelector(".conteudo-principal");
                conteudoPrincipal.innerHTML = novo ? novo.innerHTML : html;
                inicializarPaginaAtual(paginaAlvo);
            })
            .catch(() => {
                conteudoPrincipal.innerHTML = `
                    <div style="padding:20px;border-left:4px solid #ff4444;background:#221111;">
                        <h1 style="color:#ff4444;margin-top:0;">Erro ao Carregar</h1>
                        <p>Não foi possível carregar <strong>"${paginaAlvo}"</strong>.</p>
                    </div>`;
            });
    });
}

// Chama a função certa dependendo de qual aba foi carregada
function inicializarPaginaAtual(pagina) {
    const p = pagina.toLowerCase();
    if (p === "index" || p === "dashboard") inicializarDashboard();
    if (p === "lotes") inicializarLotes();
    if (p === "monitoramento") inicializarMonitoramento();
    if (p === "colheita") inicializarColheita();
    if (p === "alimentacao") inicializarAlimentacao();
}

/* FIM: SISTEMA DE TROCA DE ABAS */


/* ==========================================================================
   INICIO: PAGINA - DASHBOARD (INDEX)
   ========================================================================== */

function inicializarDashboard() {
    const totalLotesEl = document.getElementById("totalLotes");
    const tempMediaEl = document.getElementById("tempMediaGlobal");
    const statusEl = document.getElementById("statusSanitario");

    const lotesAtivos = bancoDeLotes.filter(l => l.ativo);
    const tempMedia = lotesAtivos.reduce((acc, l) => acc + l.tempMedia10d, 0) / (lotesAtivos.length || 1);

    if (totalLotesEl) totalLotesEl.innerText = lotesAtivos.length;
    if (tempMediaEl) tempMediaEl.innerText = tempMedia.toFixed(1) + " °C";
    if (statusEl) {
        if (tempMedia >= 25) {
            statusEl.innerText = "Normal";
            statusEl.style.color = "#44ff44";
        } else {
            statusEl.innerText = "⚠️ Risco Biológico";
            statusEl.style.color = "#ff4d4d";
        }
    }
}

/* FIM: PAGINA - DASHBOARD */


/* ==========================================================================
   INICIO: PAGINA - LOTES
   ========================================================================== */

function inicializarLotes() {
    renderizarTabelaLotes();

    const form = document.getElementById("formCadastroLote");
    if (!form) return;

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const especie = document.getElementById("tipoInseto").value;
        const dataEclosao = document.getElementById("dataEclosao").value;
        const qtd = parseFloat(document.getElementById("quantidadeInicial").value);

        const novoLote = {
            id: gerarIdLote(especie),
            especie,
            dataEclosao,
            quantidadeKg: qtd,
            tempMedia10d: 25.5, // valor padrão simulado
            ativo: true
        };

        bancoDeLotes.push(novoLote);
        renderizarTabelaLotes();
        form.reset();

        mostrarFeedback("lote-feedback", ` Lote ${novoLote.id} cadastrado com sucesso!`, "sucesso");
    });
}

function renderizarTabelaLotes() {
    const tbody = document.getElementById("tabelaLotesBody");
    if (!tbody) return;

    if (bancoDeLotes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="texto-centro">Nenhum lote cadastrado ainda.</td></tr>`;
        return;
    }

    tbody.innerHTML = bancoDeLotes.map(lote => {
        const dias = calcularDiasDesdeEclosao(lote.dataEclosao);
        const { aprovado } = validarProntoParaColheita(lote);
        let badgeClass, badgeTexto;

        if (aprovado) {
            badgeClass = "status-badge-aprovado";
            badgeTexto = "Pronto para Colheita";
        } else if (dias >= 45) {
            badgeClass = "status-badge-bloqueado";
            badgeTexto = "Bloqueado (Risco Bio)";
        } else {
            badgeClass = "status-badge-crescimento";
            badgeTexto = `Em Crescimento (${dias}d)`;
        }

        return `
            <tr>
                <td>${lote.id}</td>
                <td>${lote.especie}</td>
                <td>${lote.dataEclosao}</td>
                <td><span class="${badgeClass}">${badgeTexto}</span></td>
            </tr>`;
    }).join("");
}

/* FIM: PAGINA - LOTES */


/* ==========================================================================
   INICIO: PAGINA - MONITORAMENTO
   ========================================================================== */

function inicializarMonitoramento() {
    // Ponteiros já vêm no HTML com posição simulada
    // Formulário de calibração
    const form = document.querySelector(".conteudo-principal form");
    if (!form) return;

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        const temp = parseFloat(document.getElementById("temp-atual").value);
        const umi = parseFloat(document.getElementById("umidade-atual").value);

        // Atualiza os valores exibidos
        const metricas = document.querySelectorAll(".valor-metrica");
        if (metricas[0]) metricas[0].innerText = temp.toFixed(1) + "°C";
        if (metricas[1]) metricas[1].innerText = umi.toFixed(0) + "%";

        // Move os ponteiros proporcionalmente
        // Temp: faixa 0-40°C → ponteiro em % da barra
        const pontTemp = document.getElementById("ponteiro-temp");
        if (pontTemp) pontTemp.style.left = Math.min(Math.max((temp / 40) * 100, 2), 98) + "%";

        // Umidade: faixa 0-100%
        const pontUmi = document.getElementById("ponteiro-umi");
        if (pontUmi) pontUmi.style.left = Math.min(Math.max(umi, 2), 98) + "%";

        mostrarFeedback("monitoramento-feedback", " Calibração atualizada!", "sucesso");
    });
}

/* FIM: PAGINA - MONITORAMENTO */


/* ==========================================================================
   INICIO: PAGINA - COLHEITA
   ========================================================================== */

function inicializarColheita() {
    renderizarTabelaColheita();

    const form = document.querySelector("#form-rendimento");
    if (!form) return;

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        const loteId = document.getElementById("lote-colhido").value;
        const pesoBruto = document.getElementById("peso-bruto").value;
        const pesoFarinha = document.getElementById("peso-farinha").value;

        // Remove o lote do banco (simulando colheita)
        const idx = bancoDeLotes.findIndex(l => l.id === loteId);
        if (idx !== -1) bancoDeLotes[idx].ativo = false;

        mostrarFeedback("colheita-feedback",
            `Estoque registrado: ${pesoFarinha}kg de farinha de ${loteId} (bruto: ${pesoBruto}kg)`,
            "sucesso");

        renderizarTabelaColheita();
        form.reset();
        popularSelectColheita();
    });
}

function renderizarTabelaColheita() {
    const tbody = document.getElementById("tabelaColheitaBody");
    if (!tbody) return;

    const lotesAtivos = bancoDeLotes.filter(l => l.ativo);

    tbody.innerHTML = lotesAtivos.map(lote => {
        const { aprovado, dias, tempOk, diasOk } = validarProntoParaColheita(lote);
        let badgeClass, badgeTexto, btnTexto, btnDisabled;

        if (aprovado) {
            badgeClass = "status-badge-aprovado";
            badgeTexto = "Aprovado / Pronto";
            btnTexto = "Iniciar Colheita";
            btnDisabled = "";
        } else if (!diasOk) {
            badgeClass = "status-badge-crescimento";
            badgeTexto = "Em Crescimento";
            btnTexto = "Aguardando Prazo";
            btnDisabled = "disabled";
        } else {
            badgeClass = "status-badge-bloqueado";
            badgeTexto = "Bloqueado (Risco Bio)";
            btnTexto = "Bloqueado Sanitariamente";
            btnDisabled = "disabled";
        }

        return `
            <tr>
                <td>${lote.id}</td>
                <td>${dias} dias</td>
                <td>${lote.tempMedia10d.toFixed(1)} °C</td>
                <td><span class="${badgeClass}">${badgeTexto}</span></td>
                <td><button type="button" class="btn-colheita" data-lote="${lote.id}" ${btnDisabled}>${btnTexto}</button></td>
            </tr>`;
    }).join("") || `<tr><td colspan="5" style="text-align:center;padding:20px;color:rgb(154,154,154);">Nenhum lote ativo.</td></tr>`;

    // Evento de clique nos botões de colheita
    tbody.querySelectorAll(".btn-colheita:not([disabled])").forEach(btn => {
        btn.addEventListener("click", function () {
            const loteId = this.getAttribute("data-lote");
            // Scroll para o formulário de rendimento
            document.getElementById("form-rendimento")?.scrollIntoView({ behavior: "smooth" });
            const sel = document.getElementById("lote-colhido");
            if (sel) sel.value = loteId;
        });
    });

    popularSelectColheita();
}

function popularSelectColheita() {
    const sel = document.getElementById("lote-colhido");
    if (!sel) return;
    const lotesAprovados = bancoDeLotes.filter(l => l.ativo && validarProntoParaColheita(l).aprovado);
    sel.innerHTML = `<option value="">-- Selecione o lote colhido --</option>` +
        lotesAprovados.map(l => `<option value="${l.id}">${l.id}</option>`).join("");
}

/* FIM: PAGINA - COLHEITA */


/* ==========================================================================
   INICIO: PAGINA - ALIMENTACAO
   ========================================================================== */

function inicializarAlimentacao() {
    // Popula o select de lotes
    const selLote = document.getElementById("lote-alvo");
    if (selLote) {
        selLote.innerHTML = `<option value="" disabled selected>-- Escolha um lote ativo --</option>` +
            bancoDeLotes.filter(l => l.ativo).map(l =>
                `<option value="${l.id}">${l.id} (${l.especie})</option>`
            ).join("");
    }

    renderizarHistoricoAlimentacao();

    const form = document.getElementById("form-alimentacao");
    if (!form) return;

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const lote = document.getElementById("lote-alvo").value;
        const dataHora = document.getElementById("data-trato").value;
        const dieta = document.getElementById("tipo-dieta").options[document.getElementById("tipo-dieta").selectedIndex].text;
        const qtd = parseFloat(document.getElementById("quantidade-kg").value);

        // Formata a data
        const d = new Date(dataHora);
        const dataFormatada = `${d.toLocaleDateString("pt-BR")} ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;

        historicoAlimentacao.unshift({
            data: dataFormatada,
            lote,
            dieta,
            qtd,
            operador: usuarioLogado ? usuarioLogado.nome : "Operador"
        });

        renderizarHistoricoAlimentacao();
        form.reset();
        mostrarFeedback("alimentacao-feedback", "✅ Alimentação gravada com sucesso!", "sucesso");
    });
}

function renderizarHistoricoAlimentacao() {
    const tbody = document.querySelector("#tabela-historico-alimentacao tbody");
    if (!tbody) return;

    tbody.innerHTML = historicoAlimentacao.map(r => `
        <tr>
            <td>${r.data}</td>
            <td><strong>${r.lote}</strong></td>
            <td>${r.dieta}</td>
            <td>${r.qtd.toFixed(2)}</td>
            <td>${r.operador}</td>
        </tr>`).join("");
}

/* FIM: PAGINA - ALIMENTACAO */


/* ==========================================================================
   INICIO: UTILITARIO - FEEDBACK VISUAL
   ========================================================================== */

function mostrarFeedback(id, mensagem, tipo) {
    let el = document.getElementById(id);
    if (!el) {
        el = document.createElement("div");
        el.id = id;
        const ref = document.querySelector(".conteudo-principal section") ||
                    document.querySelector(".conteudo-principal");
        if (ref) ref.prepend(el);
    }
    el.innerText = mensagem;
    el.className = "feedback-" + tipo;
    el.style.cssText = `
        padding: 12px 16px;
        border-radius: 6px;
        margin-bottom: 16px;
        font-weight: bold;
        font-size: 13px;
        background: ${tipo === "sucesso" ? "rgba(68,255,68,0.1)" : "rgba(255,77,77,0.1)"};
        color: ${tipo === "sucesso" ? "#44ff44" : "#ff4d4d"};
        border-left: 4px solid ${tipo === "sucesso" ? "#44ff44" : "#ff4d4d"};
    `;
    setTimeout(() => el.remove(), 4000);
}

/* FIM: UTILITARIO - FEEDBACK VISUAL */


/* ==========================================================================
   INICIO: INICIALIZACAO GERAL
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    inicializarToggleSidebar();
    inicializarNavegacao();
    inicializarLogin();
    inicializarDashboard(); // página inicial é o dashboard
});

/* FIM: INICIALIZACAO GERAL */