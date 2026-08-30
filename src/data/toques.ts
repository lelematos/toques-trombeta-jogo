export interface Toque {
  id: string;
  nome: string;
  audioSrc: string;
  descricao: string;
  notasSintese: number[];
}

export const TOQUES_DATA: Toque[] = [
  { id: "a-vontade", nome: "À vontade", audioSrc: "/audio/a-vontade.mp3", descricao: "Permite o relaxamento da tropa na posição.", notasSintese: [261.6, 329.6, 392, 523.2] },
  { id: "apresentar-arma", nome: "Apresentar arma", audioSrc: "/audio/apresentar-arma.mp3", descricao: "Comando de continência com armamento.", notasSintese: [392, 523.2, 392, 523.2] },
  { id: "cobrir", nome: "Cobrir", audioSrc: "/audio/cobrir.mp3", descricao: "Alinhamento e cobertura em forma.", notasSintese: [329.6, 392, 523.2] },
  { id: "descansar", nome: "Descansar", audioSrc: "/audio/descansar.mp3", descricao: "Passagem da posição de sentido para repouso.", notasSintese: [523.2, 392, 329.6, 261.6] },
  { id: "descansar-arma", nome: "Descansar arma", audioSrc: "/audio/descansar-arma.mp3", descricao: "Retorno da arma à posição de descanso.", notasSintese: [523.2, 392, 261.6] },
  { id: "direita-volver", nome: "Direita volver", audioSrc: "/audio/direita-volver.mp3", descricao: "Giro de 90 graus para o flanco direito.", notasSintese: [261.6, 392, 523.2] },
  { id: "esquerda-volver", nome: "Esquerda volver", audioSrc: "/audio/esquerda-volver.mp3", descricao: "Giro de 90 graus para o flanco esquerdo.", notasSintese: [261.6, 329.6, 392] },
  { id: "firme", nome: "Firme", audioSrc: "/audio/firme.mp3", descricao: "Cessação de movimentos ou preparo para nova ordem.", notasSintese: [523.2, 523.2] },
  { id: "meia-volta-volver", nome: "Meia volta volver", audioSrc: "/audio/meia-volta-volver.mp3", descricao: "Giro de 180 graus pela esquerda.", notasSintese: [261.6, 329.6, 392, 523.2, 392] },
  { id: "ombro-arma", nome: "Ombro arma", audioSrc: "/audio/ombro-arma.mp3", descricao: "Elevação da arma até a posição no ombro.", notasSintese: [329.6, 392, 523.2, 659.2] },
  { id: "sentido", nome: "Sentido", audioSrc: "/audio/sentido.mp3", descricao: "Atenção máxima, imobilidade e prontidão.", notasSintese: [261.6, 523.2] },
];
