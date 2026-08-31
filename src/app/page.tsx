"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Award, BookOpen, CheckCircle2, Clock3, Flame, GraduationCap, Heart,
  History, Play, RotateCcw, ShieldCheck, Timer, Volume2, XCircle,
} from "lucide-react";
import { TOQUES_DATA, type Toque } from "@/data/toques";
import { soundEngine } from "@/lib/soundEngine";
import { getHistoricoProvas, salvarProva, type ProvaRegistro } from "@/lib/storage";

type Tab = "treino" | "prova" | "manual" | "historico";
type Status = "idle" | "correct" | "wrong";
const TOTAL = 10;

function shuffle<T>(values: T[]): T[] {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function MobileApp() {
  const [tab, setTab] = useState<Tab>("treino");
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState(0);
  const [vidas, setVidas] = useState(3);
  const [streak, setStreak] = useState(0);
  const [correto, setCorreto] = useState<Toque | null>(null);
  const [opcoes, setOpcoes] = useState<Toque[]>([]);
  const [selected, setSelected] = useState<Toque | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [playing, setPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [historico, setHistorico] = useState<ProvaRegistro[]>([]);
  const playingRef = useRef(false);

  useEffect(() => setHistorico(getHistoricoProvas()), [tab]);
  useEffect(() => {
    if (!timerActive) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [timerActive]);

  const play = useCallback(async (toque?: Toque | null) => {
    const item = toque ?? correto;
    if (!item || playingRef.current) return;
    playingRef.current = true;
    setPlaying(true);
    try { await soundEngine.playToque(item.audioSrc, item.notasSintese); }
    finally { playingRef.current = false; setPlaying(false); }
  }, [correto]);

  const newQuestion = useCallback(() => {
    const alvo = TOQUES_DATA[Math.floor(Math.random() * TOQUES_DATA.length)];
    const distratores = shuffle(TOQUES_DATA.filter((item) => item.id !== alvo.id)).slice(0, 3);
    setCorreto(alvo);
    setOpcoes(shuffle([alvo, ...distratores]));
    setSelected(null);
    setStatus("idle");
    void play(alvo);
  }, [play]);

  const start = (mode: "treino" | "prova") => {
    setTab(mode); setStarted(true); setRound(0); setScore(0); setGameOver(false);
    setVidas(mode === "treino" ? 3 : 999); setStreak(0); setSeconds(0);
    setTimerActive(mode === "prova");
    window.setTimeout(newQuestion, 0);
  };

  const choose = (option: Toque) => {
    if (status !== "idle" || !correto) return;
    const right = option.id === correto.id;
    setSelected(option);
    setStatus(right ? "correct" : "wrong");
    if (right) { setScore((value) => value + 1); soundEngine.playCorrect(); if (tab === "treino") setStreak((value) => value + 1); }
    else { soundEngine.playWrong(); if (tab === "treino") { setStreak(0); setVidas((value) => Math.max(0, value - 1)); } }
  };

  const finishExam = (finalScore: number) => {
    setTimerActive(false); setGameOver(true);
    const nota = Number(((finalScore / TOTAL) * 10).toFixed(1));
    salvarProva({
      data: new Date().toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }),
      nota, acertos: finalScore, total: TOTAL, tempoSegundos: seconds, aprovado: nota >= 7,
    });
    setHistorico(getHistoricoProvas());
  };

  const next = () => {
    const nextRound = round + 1;
    const finalScore = score;
    if (tab === "prova" && nextRound >= TOTAL) finishExam(finalScore);
    else if (tab === "treino" && (vidas <= 0 || nextRound >= TOTAL)) setGameOver(true);
    else { setRound(nextRound); newQuestion(); }
  };

  const navigate = (nextTab: Tab) => {
    setTimerActive(false); setTab(nextTab);
    if (nextTab === "treino" || nextTab === "prova") setStarted(false);
  };

  const resultNote = Number(((score / TOTAL) * 10).toFixed(1));

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex justify-center selection:bg-red-500">
      <div className="w-full max-w-md min-h-screen bg-neutral-950 flex flex-col border-x border-neutral-800 shadow-2xl pb-24">
        <header className="px-5 py-4 bg-neutral-900/95 backdrop-blur sticky top-0 z-30 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-600 shadow-[0_3px_0_#991b1b] grid place-items-center"><ShieldCheck size={22} /></div>
            <div><span className="text-[10px] font-bold uppercase tracking-[.2em] text-amber-500 block">Prontidão</span><h1 className="font-black leading-tight">Toques de Corneta</h1></div>
          </div>
          {tab === "treino" && started && !gameOver && <div className="flex gap-2"><Badge icon={<Flame size={16} />} value={streak} color="amber"/><Badge icon={<Heart size={16} />} value={vidas} color="red"/></div>}
          {tab === "prova" && started && !gameOver && <div className="flex items-center gap-1.5 bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-1.5 text-amber-400 font-mono font-bold"><Timer size={16}/>{formatTime(seconds)}</div>}
        </header>

        <main className="flex-1 px-5 py-5">
          {(tab === "treino" || tab === "prova") && !started && <Welcome mode={tab} onStart={() => start(tab)} />}

          {(tab === "treino" || tab === "prova") && started && !gameOver && <div className="h-full flex flex-col">
            <div className="h-3.5 rounded-full p-0.5 bg-neutral-800 border border-neutral-700"><div className="h-full rounded-full bg-gradient-to-r from-red-600 to-amber-500 transition-all" style={{ width: `${((round + 1) / TOTAL) * 100}%` }}/></div>
            <section className="flex-1 flex flex-col items-center justify-center py-8">
              <span className="text-xs font-extrabold uppercase tracking-widest text-neutral-400">{tab === "prova" ? `Questão ${round + 1} de ${TOTAL}` : `Toque ${round + 1} de ${TOTAL}`}</span>
              <h2 className="text-xl font-black text-center mt-2 mb-7">Identifique o comando tocado</h2>
              <button aria-label="Ouvir toque" onClick={() => void play()} disabled={playing} className={`w-36 h-32 rounded-3xl flex flex-col items-center justify-center gap-2 transition active:translate-y-1.5 active:shadow-none ${playing ? "bg-amber-600 shadow-[0_6px_0_#92400e]" : "bg-red-600 shadow-[0_6px_0_#991b1b]"}`}><Volume2 className={playing ? "animate-pulse" : ""} size={48}/><span className="text-xs font-black uppercase tracking-wider text-amber-100">{playing ? "Executando..." : "Ouvir toque"}</span></button>
            </section>
            <div className="grid gap-2.5">
              {opcoes.map((option) => {
                const target = option.id === correto?.id; const chosen = option.id === selected?.id;
                let style = "bg-neutral-800 border-neutral-700 shadow-[0_4px_0_#262626]";
                if (status !== "idle") style = target ? "bg-emerald-950 text-emerald-300 border-emerald-500 shadow-[0_4px_0_#059669]" : chosen ? "bg-rose-950 text-rose-300 border-rose-500 shadow-[0_4px_0_#e11d48]" : "opacity-35 bg-neutral-900 border-neutral-800";
                return <button key={option.id} disabled={status !== "idle"} onClick={() => choose(option)} className={`w-full py-3.5 px-4 rounded-2xl border-2 font-black text-left transition active:translate-y-1 flex justify-between ${style}`}><span>{option.nome}</span>{status !== "idle" && target && <CheckCircle2 size={21}/>} {status !== "idle" && chosen && !target && <XCircle size={21}/>}</button>;
              })}
            </div>
            {status !== "idle" && <div className={`mt-4 p-3.5 rounded-2xl flex items-center justify-between border ${status === "correct" ? "bg-emerald-950 border-emerald-700 text-emerald-200" : "bg-rose-950 border-rose-700 text-rose-200"}`}><div><p className="font-black">{status === "correct" ? "Comando correto!" : "Incorreto!"}</p>{status === "wrong" && <p className="text-xs text-neutral-300">Resposta: <b>{correto?.nome}</b></p>}</div><button onClick={next} className={`${status === "correct" ? "bg-emerald-600" : "bg-rose-600"} px-5 py-2.5 rounded-xl font-black shadow-[0_3px_0_rgba(0,0,0,.4)]`}>Continuar</button></div>}
          </div>}

          {(tab === "treino" || tab === "prova") && started && gameOver && <Result mode={tab} score={score} lives={vidas} seconds={seconds} note={resultNote} onRestart={() => start(tab)}/>} 
          {tab === "manual" && <Manual onPlay={(item) => void play(item)} playing={playing}/>} 
          {tab === "historico" && <HistoryView items={historico}/>} 
        </main>

        <footer className="px-5 pb-3 text-center text-[11px] leading-relaxed text-neutral-500">
          <p>
            Fonte institucional de referência dos toques:{" "}
            <a
              href="https://escolatiradentescuiaba.com/toque-de-corneta/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-neutral-400 underline decoration-neutral-700 underline-offset-2 hover:text-amber-400"
            >
              Escola Estadual da Polícia Militar Tiradentes de Cuiabá
            </a>.
          </p>
          <p className="mt-1">Aplicação independente, educacional e sem vínculo oficial com a instituição.</p>
        </footer>

        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 bg-neutral-900/95 backdrop-blur border-t border-neutral-800 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 grid grid-cols-4">
          <NavButton active={tab === "treino"} icon={<Play/>} label="Treino" onClick={() => navigate("treino")}/>
          <NavButton active={tab === "prova"} icon={<GraduationCap/>} label="Prova" onClick={() => navigate("prova")}/>
          <NavButton active={tab === "manual"} icon={<BookOpen/>} label="Manual" onClick={() => navigate("manual")}/>
          <NavButton active={tab === "historico"} icon={<History/>} label="Histórico" onClick={() => navigate("historico")}/>
        </nav>
      </div>
    </div>
  );
}

function Badge({ icon, value, color }: { icon: React.ReactNode; value: number; color: "amber" | "red" }) {
  return <div className={`flex items-center gap-1 font-black px-2.5 py-1 rounded-xl border ${color === "amber" ? "text-amber-400 bg-amber-950/40 border-amber-900" : "text-red-500 bg-red-950/40 border-red-900"}`}>{icon}<span>{value}</span></div>;
}

function Welcome({ mode, onStart }: { mode: "treino" | "prova"; onStart: () => void }) {
  const exam = mode === "prova";
  return <section className="min-h-[70vh] flex flex-col items-center justify-center text-center"><div className={`w-24 h-24 rounded-3xl grid place-items-center mb-6 border-2 ${exam ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "bg-red-500/10 border-red-500/30 text-red-500"}`}>{exam ? <GraduationCap size={48}/> : <Volume2 size={48}/>}</div><p className="text-xs uppercase tracking-[.25em] text-amber-500 font-black">{exam ? "Avaliação" : "Prática livre"}</p><h2 className="text-3xl font-black mt-2">{exam ? "Prova cronometrada" : "Modo treino"}</h2><p className="text-neutral-400 mt-3 max-w-xs">{exam ? "Identifique 10 toques. Nota mínima 7,0 e tempo registrado no histórico." : "Treine com 3 vidas, sequência de acertos e feedback imediato."}</p><button onClick={onStart} className="mt-8 w-full max-w-xs py-4 rounded-2xl bg-red-600 font-black uppercase tracking-wide shadow-[0_5px_0_#991b1b] active:translate-y-1 active:shadow-none">{exam ? "Iniciar prova" : "Começar treino"}</button></section>;
}

function Result({ mode, score, lives, seconds, note, onRestart }: { mode: "treino" | "prova"; score: number; lives: number; seconds: number; note: number; onRestart: () => void }) {
  const exam = mode === "prova"; const approved = note >= 7;
  return <section className="min-h-[70vh] flex flex-col items-center justify-center text-center"><div className="w-24 h-24 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-400 grid place-items-center"><Award size={50}/></div><h2 className="text-2xl font-black mt-5">{exam ? "Resultado da avaliação" : lives > 0 ? "Treino concluído!" : "Fim do treino"}</h2>{exam && <span className={`mt-2 px-4 py-1 rounded-full text-sm font-black ${approved ? "bg-emerald-950 text-emerald-400" : "bg-rose-950 text-rose-400"}`}>{approved ? "APROVADO" : "REPROVADO"}</span>}<div className="grid grid-cols-2 gap-3 w-full mt-6"><Stat label={exam ? "Nota" : "Acertos"} value={exam ? note.toFixed(1) : `${score}/${TOTAL}`}/><Stat label="Tempo" value={formatTime(seconds)}/></div><button onClick={onRestart} className="mt-8 w-full py-4 rounded-2xl bg-red-600 font-black shadow-[0_5px_0_#991b1b] flex items-center justify-center gap-2"><RotateCcw size={20}/>Tentar novamente</button></section>;
}

function Stat({ label, value }: { label: string; value: string }) { return <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4"><p className="text-xs uppercase tracking-wider text-neutral-500 font-bold">{label}</p><p className="text-2xl font-black mt-1">{value}</p></div>; }

function Manual({ onPlay, playing }: { onPlay: (item: Toque) => void; playing: boolean }) {
  return <section><p className="text-xs uppercase tracking-[.2em] text-amber-500 font-black">Referência</p><h2 className="text-2xl font-black mt-1 mb-5">Manual de toques</h2><div className="grid gap-3">{TOQUES_DATA.map((item, index) => <article key={item.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex gap-3"><div className="w-9 h-9 shrink-0 rounded-xl bg-red-950 text-red-400 font-black grid place-items-center">{index + 1}</div><div className="flex-1"><h3 className="font-black">{item.nome}</h3><p className="text-sm text-neutral-400 mt-1 leading-relaxed">{item.descricao}</p></div><button disabled={playing} onClick={() => onPlay(item)} aria-label={`Ouvir ${item.nome}`} className="w-10 h-10 shrink-0 rounded-xl bg-red-600 grid place-items-center disabled:opacity-50"><Volume2 size={20}/></button></article>)}</div></section>;
}

function HistoryView({ items }: { items: ProvaRegistro[] }) {
  return <section><p className="text-xs uppercase tracking-[.2em] text-amber-500 font-black">Desempenho</p><h2 className="text-2xl font-black mt-1 mb-5">Histórico de provas</h2>{items.length === 0 ? <div className="py-20 text-center text-neutral-500"><History size={48} className="mx-auto mb-3 opacity-40"/><p className="font-bold">Nenhuma prova realizada</p><p className="text-sm mt-1">Seus últimos 30 resultados aparecerão aqui.</p></div> : <div className="grid gap-3">{items.map((item) => <article key={item.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center gap-4"><div className={`w-14 h-14 rounded-2xl grid place-items-center font-black text-xl ${item.aprovado ? "bg-emerald-950 text-emerald-400" : "bg-rose-950 text-rose-400"}`}>{item.nota.toFixed(1)}</div><div className="flex-1"><p className="font-black">{item.aprovado ? "Aprovado" : "Reprovado"}</p><p className="text-xs text-neutral-500 mt-1">{item.data} · {item.acertos}/{item.total} acertos</p></div><div className="text-neutral-400 text-sm flex items-center gap-1"><Clock3 size={15}/>{formatTime(item.tempoSegundos)}</div></article>)}</div>}</section>;
}

function NavButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return <button onClick={onClick} className={`flex flex-col items-center gap-1 py-1.5 text-[10px] font-black uppercase tracking-wide transition ${active ? "text-red-500" : "text-neutral-500"}`}><span className={active ? "-translate-y-0.5" : ""}>{icon}</span>{label}</button>;
}
