// ══════════════════════ AVALIAÇÃO BIOMECÂNICA — BYOFISIO, 19/08/2021 (Bloco 4, só leitura) ══════════════════════
// Fonte única dos achados. Dados DINÂMICOS de corrida (cadência, contato, voo, rigidez) têm 5 anos e
// podem ter mudado (septoplastia, variação de peso, ciclo de parar/voltar) — linha de base histórica,
// nunca medida atual. Estruturais (dorsiflexão, quadril) mudam pouco sem trabalho dirigido.
export const AVALIACAO_2021 = {
  data: "2021-08-19",
  local: "Byofisio",
  profissional: "Bruno Paes de A. Matoso (fisioterapeuta, CREFITO 13-133.526-F)",
  encaminhamento: "Ortopedista Renô Dória",
  tipo: "Relatório funcional de marcha, corrida e baropodometria",
  secoes: [
    { titulo: "Diagnóstico", itens: [
      "Fasciopatia plantar BILATERAL, mais acentuada à direita.",
    ] },
    { titulo: "Achados estruturais", itens: [
      "Limitação bilateral de dorsiflexão de tornozelo em cadeia cinética fechada, mais acentuada à direita.",
      "Dorsiflexão: imagens mostram 64° (esq) / 66° (dir); o texto cita referência ≥42°. Provavelmente ângulos diferentes (tíbia-solo × tíbia-pé) — NÃO comparar até confirmar com o fisioterapeuta qual medida é qual.",
      "Assimetria de rigidez de quadril: 33° esq / 45° dir (referência 40-45°). Trabalho pedido: rotação externa.",
      "Drop pélvico bilateral, mais acentuado à esquerda — déficit da musculatura estabilizadora de quadril, quadrante póstero-lateral.",
      "Tendência a valgo dinâmico no agachamento unipodal.",
    ] },
    { titulo: "Corrida (9 km/h, esteira, 0%)", dinamico: true, itens: [
      "Cadência média 153 PPM — marcada como alterada.",
      "Aterrissagem retropé bilateral.",
      "Tempo de contato: esq 0,320 s / dir 0,300 s.",
      "Tempo de voo: esq 0,070 s / dir 0,075 s — fase de voo aumentada.",
      "Rigidez de membro inferior: esq 24,658 / dir 26,873 kN/m — marcada.",
      "Contato inicial à frente do centro de gravidade (overstriding).",
    ] },
    { titulo: "Baropodometria", itens: [
      "Pronação excessiva de antepé na impulsão, com aumento de pressão no hálux bilateral — tensiona a fáscia na transferência médio-pé → antepé.",
      "Distribuição estática: esq 54,47% / dir 45,53%.",
    ] },
    { titulo: "Recomendações do fisioterapeuta", itens: [
      "Prioridade: mobilidade (ganho de dorsiflexão) e controle motor (quadril póstero-lateral, intrínsecos do pé em atividades unipodais).",
      "Retreinar padrão de corrida: aterrissagem mais perto do centro de gravidade e cadência +5-10% sobre 153 → 161-168 PPM.",
      "Indicação de palmilhas biomecânicas (o relatório registra uso prévio de palmilhas POSTURAIS, que são outra coisa).",
    ] },
  ],
};
