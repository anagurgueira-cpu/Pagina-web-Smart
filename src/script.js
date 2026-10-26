/* SMART - comportamento da página
   1. Mostra o formulário certo quando a pessoa escolhe um perfil.
   2. Deixa mostrar/esconder a senha.
   3. Valida os campos antes de enviar.
   4. Abre/fecha o aviso "Fale com o RH". */

/* MEXA AQUI: cada perfil tem seu texto e tipo de campo. */
const PERFIS = {
  funcionario: {
    titulo: "Entrar como funcionário",
    rotulo: "Matrícula",
    tipo: "text",
    placeholder: "Ex.: 004521",
    autocomplete: "username",
  },
  motorista: {
    titulo: "Entrar como motorista",
    rotulo: "Matrícula",
    tipo: "text",
    placeholder: "Ex.: 004521",
    autocomplete: "username",
  },
  admin: {
    titulo: "Acesso do administrador",
    rotulo: "E-mail corporativo",
    tipo: "email",
    placeholder: "nome@empresa.com",
    autocomplete: "email",
  },
};

/* Pegamos os elementos da página uma vez só, pelo id */
const radios      = document.querySelectorAll('input[name="perfil"]');
const btnAdmin    = document.getElementById("btn-admin");
const aviso       = document.getElementById("aviso-perfil");
const form        = document.getElementById("form-login");
const formTitulo  = document.getElementById("form-titulo");
const rotuloUser  = document.getElementById("usuario-rotulo");
const inputUser   = document.getElementById("usuario");
const inputSenha  = document.getElementById("senha");
const btnOlho     = document.getElementById("btn-olho");
const iconeOlho   = document.getElementById("olho-icone");
const mensagem    = document.getElementById("mensagem");
const btnRh       = document.getElementById("btn-rh");
const notaRh      = document.getElementById("nota-rh");

/* Troca o formulário de acordo com o perfil escolhido */
function selecionarPerfil(chave) {
  const perfil = PERFIS[chave];

  aviso.hidden = true;    // some a caixa "Selecione o perfil..."
  form.hidden  = false;   // aparece o formulário

  formTitulo.textContent = perfil.titulo;
  rotuloUser.textContent = perfil.rotulo;
  inputUser.type         = perfil.tipo;
  inputUser.placeholder  = perfil.placeholder;
  inputUser.autocomplete = perfil.autocomplete;

  btnAdmin.setAttribute("aria-pressed", String(chave === "admin"));

  limparMensagem();
}

/* Quando alguém marca Funcionário ou Motorista */
radios.forEach((radio) => {
  radio.addEventListener("change", () => {
    if (radio.checked) selecionarPerfil(radio.value);
  });
});

/* Botão do administrador: desmarca os cartões e ativa o perfil admin */
btnAdmin.addEventListener("click", () => {
  radios.forEach((r) => (r.checked = false));
  selecionarPerfil("admin");
});

/* Mostrar / esconder senha */
btnOlho.addEventListener("click", () => {
  const mostrando = inputSenha.type === "text";
  inputSenha.type = mostrando ? "password" : "text";
  iconeOlho.setAttribute("href", mostrando ? "#i-eye" : "#i-eye-off");
  btnOlho.setAttribute("aria-label", mostrando ? "Mostrar senha" : "Esconder senha");
});

/* Envio do formulário */
form.addEventListener("submit", (evento) => {
  evento.preventDefault();   // impede a página de recarregar
  limparMensagem();

  let valido = true;
  [inputUser, inputSenha].forEach((campo) => {
    const ok = campo.checkValidity() && campo.value.trim() !== "";
    campo.setAttribute("aria-invalid", String(!ok));
    if (!ok) valido = false;
  });

  if (!valido) {
    mostrarMensagem("Preencha todos os campos corretamente.", true);
    return;
  }

  /* >>> AQUI você liga o login de verdade <<<
     Exemplo com um servidor:

       const resposta = await fetch("https://SEU-SERVIDOR/login", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ usuario: inputUser.value, senha: inputSenha.value }),
       });

     Por enquanto, a página só mostra esta mensagem. */
  mostrarMensagem("Campos preenchidos. O login ainda não está conectado a um sistema.");
});

function mostrarMensagem(texto, erro = false) {
  mensagem.textContent = texto;
  mensagem.classList.toggle("mensagem--erro", erro);
}
function limparMensagem() {
  mensagem.textContent = "";
  mensagem.classList.remove("mensagem--erro");
  [inputUser, inputSenha].forEach((c) => c.removeAttribute("aria-invalid"));
}

/* "Fale com o RH" abre e fecha o aviso */
btnRh.addEventListener("click", () => {
  const abrir = notaRh.hidden;
  notaRh.hidden = !abrir;
  btnRh.setAttribute("aria-expanded", String(abrir));
});