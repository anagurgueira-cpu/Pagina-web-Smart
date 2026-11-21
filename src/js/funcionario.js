/* ==========================================================
   SMART - painel do funcionário
   ==========================================================
   Este arquivo usa o objeto SMART (do smart-dados.js) e tem 6 partes:
   1. DADOS do fretado (exemplo) e função que calcula os minutos
   2. Aba Início
   3. Troca de abas
   4. Aba Frequência
   5. Aba Ausência
   6. Aba Reclamações e Perfil

   IDEIA CENTRAL: os dados ficam em objetos/listas e o código MONTA a tela
   a partir deles. Quando os dados vierem de um servidor, só muda de onde
   eles vêm. */

/* ---------- 1. DADOS DO FRETADO (exemplo) ----------
   MEXA AQUI: todos os nomes e minutos são inventados.
   - "min" de cada parada = minutos de viagem desde a parada anterior
   - "ultimaPassada" = posição (começando em 0) da última parada que já passou
   - "minutosAteProxima" = quanto falta para chegar na parada seguinte
   - "seuPonto" = posição da parada do funcionário */
const DADOS = {
  linha: "Linha Terminal Central → Portaria GDM",
  fretado: "1042",
  situacao: "A caminho",
  frequenciaMin: 15,        // de quanto em quanto tempo passa um fretado
  ultimaPassada: 1,
  minutosAteProxima: 2,
  seuPonto: 3,
  paradas: [
    { nome: "Terminal Central",     min: 0 },
    { nome: "Praça da Matriz",      min: 4 },
    { nome: "Avenida Brasil, 450",  min: 3 },
    { nome: "Rua das Flores",       min: 4 },
    { nome: "Posto de Saúde",       min: 5 },
    { nome: "Portaria GDM",         min: 6 },
  ],
};

/* Em quantos minutos o fretado chega na parada de posição "i".
   Devolve null se ele já passou. */
function minutosAteParada(i) {
  if (i <= DADOS.ultimaPassada) return null;

  let total = DADOS.minutosAteProxima;            // até a próxima parada
  for (let k = DADOS.ultimaPassada + 2; k <= i; k++) {
    total += DADOS.paradas[k].min;                // soma os trechos seguintes
  }
  return total;
}

/* Cria um elemento HTML com classe e texto (textContent é seguro:
   nunca interpreta o texto como HTML) */
function criar(tag, classe, texto) {
  const el = document.createElement(tag);
  if (classe) el.className = classe;
  if (texto !== undefined) el.textContent = texto;
  return el;
}

/* Pega um elemento pelo id (atalho) */
const $ = (id) => document.getElementById(id);


/* ---------- 2. ABA INÍCIO ---------- */

function montarPercurso() {
  const lista = $("lista-percurso");
  lista.innerHTML = "";

  DADOS.paradas.forEach((parada, i) => {
    const eta = minutosAteParada(i);
    const li  = criar("li");
    if (eta === null)         li.classList.add("passou");
    if (i === DADOS.seuPonto) li.classList.add("meu");

    li.append(criar("span", "marcador"));

    const nome = criar("span", "parada__nome", parada.nome);
    if (i === DADOS.seuPonto) nome.append(criar("span", "ponto-tag", "Seu ponto"));
    li.append(nome);

    li.append(criar("span", "parada__eta", eta === null ? "Passou" : `${eta} min`));
    lista.append(li);

    /* Logo depois da última parada que passou, entra a linha do fretado */
    if (i === DADOS.ultimaPassada) {
      const linhaBus = criar("li", "onibus-linha");

      const icone = criar("span", "onibus-icone");
      icone.innerHTML = '<svg aria-hidden="true"><use href="#i-bus"></use></svg>';
      linhaBus.append(icone);

      linhaBus.append(criar("span", "parada__nome", `Fretado ${DADOS.fretado} a caminho`));
      linhaBus.append(criar("span", "parada__eta", ""));
      lista.append(linhaBus);
    }
  });
}

function montarResumo() {
  const eta = minutosAteParada(DADOS.seuPonto);

  $("linha-nome").textContent = DADOS.linha;
  $("onibus-num").textContent = DADOS.fretado;
  $("situacao").textContent   = DADOS.situacao;
  $("eta-valor").textContent  = eta === null ? "Já passou" : `${eta} min`;

  /* Próximos fretados: o atual + os seguintes, espaçados pela frequência */
  const lista = $("lista-horarios");
  lista.innerHTML = "";

  const base = eta === null ? DADOS.frequenciaMin : eta;
  for (let n = 0; n < 3; n++) {
    const li = criar("li");
    li.append(criar("span", "", n === 0 && eta !== null ? `Fretado ${DADOS.fretado}` : "Próximo fretado"));
    li.append(criar("span", "", `${base + n * DADOS.frequenciaMin} min`));
    lista.append(li);
  }
}

/* O aviso muda se você registrou ausência para hoje (liga as abas entre si) */
function montarAvisos() {
  const ausenciaHoje = SMART.ausenciaNoDia(SMART.hojeISO());
  $("avisos-texto").textContent = ausenciaHoje
    ? `Você avisou ausência para hoje (${SMART.MOTIVOS[ausenciaHoje.motivo]}).`
    : "Nenhum aviso no momento. Atrasos e mudanças de rota vão aparecer aqui.";
}


/* ---------- 3. TROCA DE ABAS ---------- */

const itensMenu = document.querySelectorAll(".menu__item");

function mostrarAba(nome) {
  /* Esconde todas as seções, menos a escolhida */
  document.querySelectorAll(".aba").forEach((secao) => {
    secao.hidden = secao.id !== `aba-${nome}`;
  });

  /* Marca o botão do menu da aba ativa */
  itensMenu.forEach((item) => {
    if (item.dataset.aba === nome) item.setAttribute("aria-current", "page");
    else item.removeAttribute("aria-current");
  });

  window.scrollTo(0, 0);
}

/* Qualquer elemento com data-aba="..." leva até aquela aba
   (vale para o menu e também para links dentro das seções) */
document.addEventListener("click", (evento) => {
  const alvo = evento.target.closest("[data-aba]");
  if (alvo) mostrarAba(alvo.dataset.aba);
});


/* ---------- 4. ABA FREQUÊNCIA ---------- */

const hoje = SMART.hojeISO();
let mesVisto = new Date();           // o mês que o calendário está mostrando
mesVisto.setDate(1);

/* Texto de cada tipo de dia (usado na dica do dia e na acessibilidade) */
const ROTULO_DIA = {
  folga: "Sem fretado", previsto: "Previsto", hoje: "Hoje",
  presente: "Presente", falta: "Falta sem justificativa",
};
const SIGLA_DIA = { presente: "P", justificada: "J", falta: "F" };

function montarFrequencia() {
  const ano = mesVisto.getFullYear();
  const mes = mesVisto.getMonth();

  $("cal-mes").textContent = mesVisto.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  /* Resumo do mês */
  const r = SMART.resumoDoMes(ano, mes);
  $("freq-percentual").textContent = r.percentual === null ? "--" : `${r.percentual}%`;
  $("freq-presencas").textContent  = r.presencas;
  $("freq-faltas").textContent     = r.faltas;

  const detalhes = Object.entries(r.porMotivo)
    .map(([motivo, qtd]) => `${SMART.MOTIVOS[motivo]}: ${qtd}`)
    .join(", ");
  $("freq-justificadas").textContent = r.justificadas > 0
    ? `Dias justificados (não entram no cálculo): ${r.justificadas}. ${detalhes}.`
    : "Nenhum dia justificado neste mês.";

  /* Calendário */
  const grade = $("cal-dias");
  grade.innerHTML = "";

  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();   // 0 = domingo
  const totalDias = new Date(ano, mes + 1, 0).getDate();

  for (let i = 0; i < primeiroDiaSemana; i++) grade.append(criar("span"));   // espaços vazios

  for (let d = 1; d <= totalDias; d++) {
    const iso = SMART.paraISO(new Date(ano, mes, d));
    const st  = SMART.statusDoDia(iso);

    const celula = criar("div", `dia dia--${st.tipo}`);
    celula.append(criar("span", "", d));
    celula.append(criar("span", "dia__sigla", SIGLA_DIA[st.tipo] || ""));
    if (iso === hoje) celula.classList.add("dia--hoje");

    const rotulo = st.tipo === "justificada" ? `Justificada (${SMART.MOTIVOS[st.motivo]})` : ROTULO_DIA[st.tipo];
    celula.title = `${d}: ${rotulo}`;
    celula.setAttribute("aria-label", `${d}: ${rotulo}`);
    grade.append(celula);
  }
}

$("mes-anterior").addEventListener("click", () => { mesVisto.setMonth(mesVisto.getMonth() - 1); montarFrequencia(); });
$("mes-seguinte").addEventListener("click", () => { mesVisto.setMonth(mesVisto.getMonth() + 1); montarFrequencia(); });


/* ---------- 5. ABA AUSÊNCIA ---------- */

const formAusencia = $("form-ausencia");

function periodoTexto(a) {
  return !a.fim || a.fim === a.inicio
    ? SMART.formatarData(a.inicio)
    : `${SMART.formatarData(a.inicio)} a ${SMART.formatarData(a.fim)}`;
}

function montarAusencias() {
  const lista = $("lista-ausencias");
  lista.innerHTML = "";

  const registros = SMART.listarAusencias().sort((a, b) => (a.inicio < b.inicio ? 1 : -1));   // mais recentes primeiro

  if (registros.length === 0) {
    lista.append(criar("li", "vazio vazio--solto", "Você ainda não registrou nenhuma ausência."));
    return;
  }

  registros.forEach((a) => {
    const li = criar("li", "registro");

    const topo = criar("div", "registro__topo");
    topo.append(criar("span", "registro__periodo", periodoTexto(a)));
    topo.append(criar("span", "chip", SMART.MOTIVOS[a.motivo]));
    li.append(topo);

    if (a.obs) li.append(criar("p", "registro__obs", a.obs));

    const rodape = criar("div", "registro__rodape");
    rodape.append(criar("span", "", "Registrado"));
    const remover = criar("button", "link", "Remover");
    remover.type = "button";
    remover.dataset.remover = a.id;             // guarda o id no próprio botão
    rodape.append(remover);
    li.append(rodape);

    lista.append(li);
  });
}

/* Clique em "Remover": um único "ouvinte" na lista serve para todos os botões */
$("lista-ausencias").addEventListener("click", (evento) => {
  const botao = evento.target.closest("[data-remover]");
  if (!botao) return;
  SMART.removerAusencia(Number(botao.dataset.remover));
  atualizarTudo();
});

formAusencia.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const msg = $("aus-msg");
  msg.className = "mensagem";

  const motivo = $("aus-motivo").value;
  const inicio = $("aus-inicio").value;
  const fim    = $("aus-fim").value;
  const obs    = $("aus-obs").value.trim();

  if (!inicio) {
    msg.textContent = "Informe a data inicial.";
    msg.classList.add("mensagem--erro");
    return;
  }
  if (fim && fim < inicio) {
    msg.textContent = "A data final não pode ser antes da inicial.";
    msg.classList.add("mensagem--erro");
    return;
  }

  SMART.salvarAusencia({ motivo, inicio, fim, obs });
  formAusencia.reset();
  atualizarTudo();

  msg.textContent = "Ausência registrada. Ela já aparece no seu calendário.";
  msg.classList.add("mensagem--ok");
});


/* ---------- 6. ABA RECLAMAÇÕES E PERFIL ---------- */

const CATEGORIAS = {
  atraso: "Atraso", lotacao: "Fretado lotado", limpeza: "Limpeza e conforto",
  motorista: "Motorista", rota: "Rota ou ponto de embarque", outro: "Outro assunto",
};

function montarReclamacoes() {
  const lista = $("lista-reclamacoes");
  lista.innerHTML = "";

  const registros = SMART.listarReclamacoes().sort((a, b) => b.id - a.id);

  if (registros.length === 0) {
    lista.append(criar("li", "vazio vazio--solto", "Você ainda não enviou nenhuma reclamação."));
    return;
  }

  registros.forEach((r) => {
    const li = criar("li", "registro");

    const topo = criar("div", "registro__topo");
    topo.append(criar("span", "registro__periodo", CATEGORIAS[r.categoria]));
    topo.append(criar("span", "chip", "Enviada"));
    li.append(topo);

    li.append(criar("p", "registro__obs", r.texto));
    li.append(criar("div", "registro__rodape", SMART.formatarData(r.data)));
    lista.append(li);
  });
}

$("form-reclamacao").addEventListener("submit", (evento) => {
  evento.preventDefault();
  const msg = $("rec-msg");
  msg.className = "mensagem";

  const texto = $("rec-texto").value.trim();
  if (texto.length < 10) {
    msg.textContent = "Descreva o que aconteceu com pelo menos 10 letras.";
    msg.classList.add("mensagem--erro");
    return;
  }

  SMART.salvarReclamacao({ categoria: $("rec-categoria").value, texto, data: SMART.hojeISO() });
  evento.target.reset();
  montarReclamacoes();

  msg.textContent = "Reclamação enviada.";
  msg.classList.add("mensagem--ok");
});

function montarPerfil() {
  const p = SMART.PERFIL;
  const turno = SMART.TURNOS[p.turno];

  /* Iniciais do nome para o círculo dourado */
  $("perfil-iniciais").textContent = p.nome.split(" ").map((parte) => parte[0]).slice(0, 2).join("");
  $("perfil-nome").textContent       = p.nome;
  $("perfil-matricula").textContent  = p.matricula;
  $("perfil-setor").textContent      = p.setor;
  $("perfil-turno").textContent      = `${turno.nome} (${turno.horario})`;
  $("perfil-linha").textContent      = p.linha;
  $("perfil-ponto").textContent      = p.ponto;
  $("perfil-embarque").textContent   = p.embarque;
}


/* ---------- Início ---------- */

/* Redesenha o que depende dos registros de ausência */
function atualizarTudo() {
  montarAusencias();
  montarFrequencia();
  montarAvisos();
}

montarPercurso();
montarResumo();
montarReclamacoes();
montarPerfil();
atualizarTudo();
