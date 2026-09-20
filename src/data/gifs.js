// ══════════════════════ GIFS DE EXERCÍCIO — gifdotreino.com ══════════════════════
// Mapeamento curado à mão (nome interno → caminho no gifdotreino.com). Só inclui quando
// equipamento e movimento batem com a descrição do exercício — sem gif é melhor que gif errado.
const GIF_BASE = "https://www.gifdotreino.com/";

const GIF_MAP = {
  "Polichinelos": "Exercicios/Funcional e HIT/Polichinelos.gif",
  "Supino inclinado halteres": "Exercicios/Peitoral/Supino Inclinado com Halteres.gif",
  "Rosca martelo": "Exercicios/Bíceps/Rosca martelo.gif",
  "Desenvolvimento Arnold": "Exercicios/Ombros/Desenvolvimento Arnold.gif",
  "Desenv. militar barra": "Exercicios/Ombros/Desenvolvimento militar com barra.gif",
  "Cadeira extensora": "Exercicios/Pernas/Cadeira extensora.gif",
  "Agachamento PIRÂMIDE": "Exercicios/Calistenia/Agachamento.gif",
  "Agachamento PESADO": "Exercicios/Calistenia/Agachamento.gif",
  "Agachamento FORÇA": "Exercicios/Calistenia/Agachamento.gif",
  "Agachamento livre": "Exercicios/Calistenia/Agachamento.gif",
  "Stiff BARRA": "Exercicios/Pernas/Stiff com barra.gif",
  "Mesa flexora": "Exercicios/Pernas/Mesa flexora.gif",
  "Cadeira flexora": "Exercicios/Pernas/Cadeira flexora.gif",
  "Puxada alta": "Exercicios/Costas/Puxada Alta.gif",
  "Remada curvada barra": "Exercicios/Costas/Remada Curvada com Barra.gif",
  "Remada curvada PIRÂMIDE": "Exercicios/Costas/Remada Curvada com Barra.gif",
  "Remada curvada pesada": "Exercicios/Costas/Remada Curvada com Barra.gif",
  "Face pull": "Exercicios/Trapézio/Face Pull.gif",
  "Barra fixa": "Exercicios/Costas/Barra fixa.gif",
  "Barra fixa leve": "Exercicios/Costas/Barra fixa.gif",
  "Paralelas": "Exercicios/Peitoral/Paralelas.gif",
  "Corrida": "Exercicios/Funcional e HIT/Corrida.gif",
  "Caminhada rápida": "Exercicios/Funcional e HIT/Caminhada Rápida.gif",
  "Elevação frontal": "Exercicios/Ombros/Elevação frontal com halteres.gif",
  "Along. peitoral": "Exercicios/Mobilidade/Alongamento Dinâmico do Peitoral.gif",
  "Supino reto BARRA": "Exercicios/Peitoral/Supino Reto.gif",
  "Supino reto barra": "Exercicios/Peitoral/Supino Reto.gif",
  "Crucifixo inclinado": "Exercicios/Peitoral/Crucifixo Inclinado Cross.gif",
  "Elevação lateral CABO": "Exercicios/Ombros/Elevação lateral de braços com cabo.gif",
  "Rosca barra reta PIRÂMIDE": "Exercicios/Bíceps/Rosca Direta com Barra.gif",
  "Leg Press 45°": "Exercicios/Pernas/Leg Press.gif",
  "Terra sumo": "Exercicios/Pernas/Levantamento Terra Sumô.gif",
  "Tríceps corda": "Exercicios/Tríceps/Tríceps pulley corda.gif",
  "Chutes glúteo": "Exercicios/Funcional e HIT/Chutes até o Glúteo.gif",
  "Along. panturrilha": "Exercicios/Mobilidade/Alongamento de panturrilha na parede.gif",
  "Along. quadríceps": "Exercicios/Mobilidade/Alongamento em Pé dos Quadríceps.gif",
  "Along. glúteo": "Exercicios/Mobilidade/Alongamento de Glúteos Deitado.gif",
  "Along. adutores": "Exercicios/Mobilidade/Alongamento dos Adutores em Posição Sentada com Pernas Abertas.gif",
  "Bíceps concentrado": "Exercicios/Bíceps/Rosca concentrada.gif",
  "Voador/Crossover": "Exercicios/Peitoral/Voador na Máquina.gif",
  "Encolhimento trapézio": "Exercicios/Trapézio/Encolhimento com Halteres.gif",
  "Tríceps francês halter": "Exercicios/Tríceps/Tríceps Francês com Halteres.gif",
  "Pullover halter": "Exercicios/Peitoral/Pullover com haltere.gif",
  "Avanço caminhando": "Exercicios/Pernas/Avanço com Halteres.gif",
  "Búlgaro": "Exercicios/Pernas/Agachamento Búlgaro com Halteres.gif",
  "Terra Deadlift": "Exercicios/Costas/Levantamento Terra.gif",
  "Stiff romeno barra": "Exercicios/Costas/Levantamento Terra Romeno.gif",
  "Avanço dinâmico": "Exercicios/Calistenia/Avanço sem Peso Corporal.gif",
  "Elev. panturrilha bilateral": "Exercicios/Calistenia/Elevação de panturrilha em pé.gif",
  "Elev. panturrilha UNILATERAL": "Exercicios/Calistenia/Elevação de Panturrilha em Uma Perna.gif",
  "Elev. panturrilha unilateral": "Exercicios/Calistenia/Elevação de Panturrilha em Uma Perna.gif",
  "Bíceps Scott": "Exercicios/Bíceps/Rosca scott com halteres.gif",
  "Along. posterior": "Exercicios/Mobilidade/Alongamento dos Isquiotibiais Sentado.gif",
  "Along. posterior coxa": "Exercicios/Mobilidade/Alongamento dos Isquiotibiais Sentado.gif",
};

export function getGifUrl(exerciseName) {
  if (!exerciseName) return null;
  const nome = exerciseName.replace(/^↑\s*/, "").trim();
  const path = GIF_MAP[nome];
  if (!path) return null;
  return GIF_BASE + path.split("/").map(encodeURIComponent).join("/");
}
