/* ==========================================================
   SMART - painel da cozinha
   ==========================================================
   Usa o objeto SMART (smart-dados.js). A ideia é a mesma do painel do
   funcionário: guardar o "estado" (aqui, o dia escolhido) e redesenhar a
   tela a partir dele toda vez que ele muda. */

const $ = (id) => document.getElementById(id);

function criar(tag, classe, texto) {
  const el = document.createElement(tag);
  if (classe) el.className = classe;
  if (texto !== undefined) el.textContent = texto;
  return el;
}

/* ESTADO: o dia que está sendo visto (texto "AAAA-MM-DD") */
let diaISO = SMART.hojeISO();

/* Soma um número de dias a uma data em texto */
function somarDias(iso, dias) {
  const data = SMART.deISO(iso);
  data.setDate(data.getDate() + dias);
  return SMART.paraISO(data);
}

function desenhar() {
  const previsao = SMART.previsaoDoDia(diaISO);   // null em fim de semana

  $("dia-escolhido").value = diaISO;
  $("data-extenso").textContent = SMART.deISO(diaISO).toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  $("aviso-fim-semana").hidden = previsao !== null;

  desenharResumoETabela(previsao);
  desenharSemana();
}

function desenharResumoETabela(previsao) {
  const corpo = $("tabela-turnos");
  corpo.innerHTML = "";

  if (previsao === null) {
    $("total-refeicoes").textContent = "--";
    $("total-atendidos").textContent = "--";
    $("total-ausencias").textContent = "--";
    return;
  }

  let atendidos = 0, ausencias = 0, refeicoes = 0;

  previsao.forEach((turno) => {
    atendidos += turno.atendidos;
    ausencias += turno.ausencias;
    refeicoes += turno.refeicoes;

    const linha = criar("tr");
    const celulaNome = criar("td", "", turno.nome);
    celulaNome.append(criar("small", "", turno.horario));
    linha.append(
      celulaNome,
      criar("td", "num", turno.atendidos),
      criar("td", "num", turno.ausencias),
      criar("td", "num", turno.refeicoes),
    );
    corpo.append(linha);
  });

  /* Linha de total */
  const total = criar("tr");
  total.append(criar("td", "", "Total"), criar("td", "num", atendidos), criar("td", "num", ausencias), criar("td", "num", refeicoes));
  corpo.append(total);

  $("total-refeicoes").textContent = refeicoes;
  $("total-atendidos").textContent = atendidos;
  $("total-ausencias").textContent = ausencias;
}

/* Segunda a sexta da semana do dia escolhido */
function desenharSemana() {
  const lista = $("lista-semana");
  lista.innerHTML = "";

  const diaSemana = SMART.deISO(diaISO).getDay();            // 0 = domingo
  const segunda = somarDias(diaISO, -((diaSemana + 6) % 7)); // volta até a segunda

  const maxAtendidos = SMART.TURNOS.reduce((soma, t) => soma + t.atendidos, 0);

  for (let i = 0; i < 5; i++) {
    const iso = somarDias(segunda, i);
    const prev = SMART.previsaoDoDia(iso);
    const refeicoes = prev.reduce((soma, t) => soma + t.refeicoes, 0);

    const li = criar("li");
    if (iso === diaISO) li.classList.add("atual");

    li.append(criar("span", "semana__dia", SMART.deISO(iso).toLocaleDateString("pt-BR", { weekday: "short", day: "numeric" })));

    const trilho = criar("span", "semana__trilho");
    const barra = criar("span", "semana__barra");
    barra.style.width = `${(refeicoes / maxAtendidos) * 100}%`;   // largura proporcional (a partir do zero)
    trilho.append(barra);
    li.append(trilho);

    li.append(criar("span", "semana__num", refeicoes));
    lista.append(li);
  }
}

/* ----- Botões do seletor de dia ----- */
$("dia-anterior").addEventListener("click", () => { diaISO = somarDias(diaISO, -1); desenhar(); });
$("dia-seguinte").addEventListener("click", () => { diaISO = somarDias(diaISO, 1);  desenhar(); });
$("dia-hoje").addEventListener("click",     () => { diaISO = SMART.hojeISO();       desenhar(); });
$("dia-escolhido").addEventListener("change", (evento) => {
  if (evento.target.value) { diaISO = evento.target.value; desenhar(); }
});

desenhar();
