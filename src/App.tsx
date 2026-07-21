import { useState } from "react";
import { useGame } from "./hooks/useGame";
import { Lobby } from "./components/game/Lobby";
import { Board } from "./components/game/Board";
import { HandPanel } from "./components/game/HandPanel";
import { AuctionPanel } from "./components/game/AuctionPanel";
import { LogConsole } from "./components/game/LogConsole";
import { Skull, Send } from "lucide-react";

export default function App() {
  const game = useGame();
  const [chatInput, setChatInput] = useState("");

  const [copied, setCopied] = useState(false);

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
        {gameState && gameState.phase !== 'LOBBY' && (
          <div className="flex items-center gap-3">
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
          </div>
        )}
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

      <footer className="max-w-7xl mx-auto w-full text-center text-[10px] text-zinc-650 mt-8 pt-4 border-t border-zinc-900">
        Skull & Roses - Réseau Privé Peer-to-Peer - Version 1.0.0
      </footer>
    </div>
  );
}
