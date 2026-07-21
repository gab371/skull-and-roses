import { useState } from "react";
import { useGame } from "./hooks/useGame";
import { Lobby } from "./components/game/Lobby";
import { Board } from "./components/game/Board";
import { HandPanel } from "./components/game/HandPanel";
import { AuctionPanel } from "./components/game/AuctionPanel";
import { LogConsole } from "./components/game/LogConsole";
import { Skull, Send, FileText, X } from "lucide-react";

export default function App() {
  const game = useGame();
  const [chatInput, setChatInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const handleCopy = () => {
    if (hostPeerId) {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(hostPeerId)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          })
          .catch(() => {
            fallbackCopy(hostPeerId);
          });
      } else {
        fallbackCopy(hostPeerId);
      }
    }
  };

  const fallbackCopy = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Fallback copy failed", err);
    }
    document.body.removeChild(textArea);
  };

  const {
    myPeerId,
    hostPeerId,
    isHost,
    chatMessages,
    gameState,
    status,
    error,
    hostRoom,
    joinRoom,
    toggleReady,
    startGame,
    placeCard,
    startBid,
    raiseBid,
    passBid,
    revealCard,
    nextRound,
    sendChatMessage,
    disconnect,
  } = game;

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput.trim());
    setChatInput("");
  };

  const showLobby = !gameState || gameState.phase === 'LOBBY';

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-between">
      <header className="max-w-7xl mx-auto w-full flex items-center justify-between mb-8 pb-4 border-b border-zinc-900">
        <div className="flex items-center gap-2">
          <Skull className="w-6 h-6 text-rose-500 animate-pulse" />
          <span className="text-xl font-black bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent tracking-tight">
            SKULL
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRules(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 rounded-full border border-zinc-800 font-bold transition-all"
            title="Règles du jeu"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Règles</span>
          </button>

          {gameState && gameState.phase !== 'LOBBY' && (
            <>
              <span className="text-xs text-zinc-400 font-mono bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800">
                Salon : <span className="text-rose-400 font-bold">{hostPeerId}</span>
              </span>
              <button
                onClick={handleCopy}
                className="text-xs px-2.5 py-1.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-350 hover:text-zinc-200 rounded-xl transition-all border border-zinc-700 font-bold"
              >
                {copied ? "Copié !" : "Copier le code"}
              </button>
              <button
                onClick={disconnect}
                className="text-xs px-2.5 py-1.5 bg-rose-950/20 hover:bg-rose-900/20 text-rose-400 border border-rose-900/30 rounded-xl transition-all font-bold"
              >
                Quitter
              </button>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto">
        {showLobby ? (
          <div className="flex items-center justify-center min-h-[70vh]">
            <Lobby
              myPeerId={myPeerId}
              hostPeerId={hostPeerId}
              isHost={isHost}
              players={gameState?.players || []}
              status={status}
              error={error}
              hostRoom={hostRoom}
              joinRoom={joinRoom}
              toggleReady={toggleReady}
              startGame={startGame}
              disconnect={disconnect}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            <div className="lg:col-span-3 space-y-6">
              <Board
                gameState={gameState!}
                myPeerId={myPeerId}
                onRevealCard={revealCard}
                onNextRound={nextRound}
                isHost={isHost}
              />

              {((gameState!.phase) === 'PLACING' || (gameState!.phase) === 'BIDDING') && (
                <div className="space-y-6">
                  <AuctionPanel
                    highestBid={gameState!.highestBid}
                    totalPlaced={gameState!.players.reduce((sum, p) => sum + p.pile.length, 0)}
                    isMyTurn={gameState!.players[gameState!.activePlayerIndex]?.id === myPeerId}
                    phase={gameState!.phase}
                    onStartBid={startBid}
                    onRaiseBid={raiseBid}
                    onPass={passBid}
                  />

                  {gameState!.phase === 'PLACING' && myPeerId && (
                    <HandPanel
                      hand={gameState!.players.find((p) => p.id === myPeerId)?.hand || []}
                      onPlaceCard={placeCard}
                      isMyTurn={gameState!.players[gameState!.activePlayerIndex]?.id === myPeerId}
                      canPlace={
                        (gameState!.players.find((p) => p.id === myPeerId)?.hand.length || 0) > 0
                      }
                    />
                  )}
                </div>
              )}
            </div>

            <div className="space-y-6 h-full flex flex-col">
              <div className="h-[360px] flex flex-col">
                <LogConsole logs={gameState.logs} />
              </div>

              <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-3xl p-5 shadow-xl flex flex-col h-[280px]">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Tchat</h3>
                <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1.5 scrollbar-thin">
                  {chatMessages.map((msg, index) => (
                    <div key={index} className="text-xs leading-relaxed">
                      <span className="font-bold text-zinc-300">{msg.sender} : </span>
                      <span className="text-zinc-400">{msg.text}</span>
                    </div>
                  ))}
                  {chatMessages.length === 0 && (
                    <div className="text-zinc-600 text-center py-8">Aucun message.</div>
                  )}
                </div>
                <form onSubmit={handleSendChat} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Tapez un message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-850 focus:border-rose-500 text-xs text-zinc-200 outline-none transition-all"
                  />
                  <button
                    type="submit"
                    className="w-8 h-8 flex items-center justify-center bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-all shadow-md shadow-rose-950/20"
                    title="Envoyer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto w-full text-center text-[10px] text-zinc-650 py-6 px-4 border-t border-zinc-900 flex justify-between items-center mt-8">
        <div>
          Skull & Roses - Réseau Privé Peer-to-Peer - Version v0.1.0
        </div>
        <a
          href="https://github.com/gab371/skull-and-roses"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:text-rose-500 transition-colors"
        >
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
            <path d="M9 18c-4.51 2-5-2-7-2" />
          </svg>
          <span>Dépôt GitHub</span>
        </a>
      </footer>

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md transition-all">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-2xl text-zinc-100 shadow-2xl relative max-h-[90vh] overflow-y-auto font-sans">
            <button
              onClick={() => setShowRules(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-black bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent mb-4 flex items-center gap-2 border-b border-zinc-800 pb-2">
              💀 Règles : Skull & Roses
            </h2>

            <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
              <section>
                <h3 className="font-bold text-rose-500 uppercase tracking-wide text-xs mb-1">Objectif</h3>
                <p>
                  Être le premier joueur à remporter deux défis (ou le dernier survivant). Un défi consiste à retourner un nombre annoncé de cartes sans jamais tomber sur un Crâne.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-rose-500 uppercase tracking-wide text-xs mb-1">Le Matériel</h3>
                <p>
                  Chaque joueur possède 4 tapis/cartes : 3 Roses (sûres) et 1 Crâne (piège).
                </p>
              </section>

              <section>
                <h3 className="font-bold text-rose-500 uppercase tracking-wide text-xs mb-1">Déroulement du jeu</h3>
                <p className="mb-2">Le joueur actif a deux options à son tour :</p>
                <ul className="list-disc list-inside pl-2 space-y-1.5">
                  <li>
                    <strong className="text-zinc-100">Poser une carte :</strong> Placez une de vos cartes face cachée au-dessus de votre pile.
                  </li>
                  <li>
                    <strong className="text-rose-400">Lancer une enchère :</strong> Annoncez combien de cartes vous pensez pouvoir retourner au total sur la table sans trouver de Crâne. Une fois l'enchère lancée, plus personne ne peut poser de carte.
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="font-bold text-rose-500 uppercase tracking-wide text-xs mb-1">L'Enchère</h3>
                <p>
                  À tour de rôle, chaque joueur doit soit <strong>surenchérir</strong> (annoncer un chiffre plus élevé), soit <strong>passer</strong>. L'enchère s'arrête lorsqu'il ne reste plus qu'un seul enchérisseur actif. Ce joueur doit alors résoudre son défi.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-rose-500 uppercase tracking-wide text-xs mb-1">Résolution du Défi</h3>
                <p className="mb-2">Le joueur ayant remporté l'enchère doit retourner le nombre de cartes annoncé dans l'ordre suivant :</p>
                <ol className="list-decimal list-inside pl-2 space-y-1.5">
                  <li>
                    Il doit d'abord retourner <strong>l'intégralité de sa propre pile</strong> (cartes posées devant lui).
                  </li>
                  <li>
                    Il choisit ensuite les cartes du haut des piles des autres joueurs de son choix, une par une.
                  </li>
                </ol>
                <p className="mt-2">
                  <span className="text-emerald-400 font-bold">Succès :</span> Si le compte est atteint sans Crâne, il gagne 1 point. (Il gagne la partie à 2 points).<br />
                  <span className="text-rose-500 font-bold">Échec :</span> Dès qu'il révèle un Crâne, son défi s'arrête. Il perd définitivement l'une de ses 4 cartes au hasard.
                </p>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
