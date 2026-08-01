import { useState } from "react";
declare const __APP_VERSION__: string;
import type { PeerManagerLike } from "p2play-core";
import { RoomCodeBadge } from "p2play-core";
import { TextChatPanel } from "p2play-core/chat";
import { useGame } from "./hooks/useGame";
import { useBoardExpand } from "./hooks/useBoardExpand";
import { Lobby } from "./components/game/Lobby";
import { Board } from "./components/game/Board";
import { PhaseStatusBar } from "./components/game/PhaseStatusBar";
import { HandPanel } from "./components/game/HandPanel";
import { AuctionPanel } from "./components/game/AuctionPanel";
import { SpectatorView } from "./components/game/SpectatorView";
import { LogConsole } from "./components/game/LogConsole";
import { Skull, FileText, X } from "lucide-react";
import { SoundToggle } from "p2play-core/ui";
import { soundManager } from "./core/soundFX";

interface AppProps {
  isEmbedded?: boolean;
  externalPeerManager?: PeerManagerLike;
  playerName?: string;
  playerAvatar?: string;
  isHost?: boolean;
  lateJoin?: boolean;
  gameConfig?: any;
  hubPhase?: string;
  onExit?: () => void;
}

export default function App({ isEmbedded = false, externalPeerManager, playerName, playerAvatar, isHost, lateJoin, gameConfig, hubPhase, onExit }: AppProps) {
  const game = useGame({ externalPeerManager, isEmbedded, playerName, playerAvatar, isHost, lateJoin, gameConfig, hubPhase });
  const [showRules, setShowRules] = useState(false);

  const {
    myPeerId,
    hostPeerId,
    isHost: gameIsHost,
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

  const showLobby = !gameState || gameState.phase === 'LOBBY';
  const localIsSpectator = !!gameState?.spectators.some((s) => s.id === myPeerId);
  const { expanded: boardExpanded, toggle: toggleExpand } = useBoardExpand(
    showLobby || localIsSpectator,
  );

  return (
    <div
      className={
        boardExpanded
          ? "h-screen overflow-hidden flex flex-col relative"
          : "min-h-screen py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-between"
      }
    >
      {!boardExpanded && (
      <header className="max-w-7xl mx-auto w-full flex items-center justify-between mb-8 pb-4 border-b border-zinc-900">
        <div className="flex items-center gap-2">
          <Skull className="w-6 h-6 text-rose-500 animate-pulse" />
          <span className="text-xl font-serif font-normal bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent tracking-tight">
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

          <SoundToggle soundManager={soundManager} className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 border-zinc-800" />

          {gameState && gameState.phase !== 'LOBBY' && (
            <>
              {hostPeerId && <RoomCodeBadge code={hostPeerId} accentClassName="text-rose-400" />}
              <button
                onClick={isEmbedded && onExit && gameIsHost ? onExit : disconnect}
                className="text-xs px-2.5 py-1.5 bg-rose-950/20 hover:bg-rose-900/20 text-rose-400 border border-rose-900/30 rounded-xl transition-all font-bold"
                title={isEmbedded ? (gameIsHost ? "Retour au Hub" : "Quitter le Hub (la partie continue)") : "Quitter"}
              >
                {isEmbedded ? (gameIsHost ? "← Hub" : "Quitter") : "Quitter"}
              </button>
            </>
          )}
        </div>
      </header>
      )}

      <main
        className={
          boardExpanded
            ? "fixed inset-0 z-40 overflow-auto p-4 sm:p-6 bg-[radial-gradient(circle_at_center,#1b0a0f_0%,#09090b_100%)]"
            : "flex-1 w-full max-w-7xl mx-auto"
        }
      >
        {showLobby ? (
          <div className="flex items-center justify-center min-h-[70vh]">
            <Lobby
              myPeerId={myPeerId}
              hostPeerId={hostPeerId}
              isHost={gameIsHost}
              players={gameState?.players || []}
              spectators={gameState?.spectators || []}
              spectatorLocks={gameState?.spectatorLocks || {}}
              status={status}
              error={error}
              hostRoom={hostRoom}
              joinRoom={joinRoom}
              toggleReady={toggleReady}
              startGame={startGame}
              disconnect={isEmbedded && onExit ? onExit : disconnect}
              onSetRole={game.setRole}
              onLockSpectator={game.lockSpectator}
            />
          </div>
        ) : localIsSpectator ? (
          <div className="flex items-center justify-center min-h-[70vh]">
            <SpectatorView
              gameState={gameState}
              onDisconnect={isEmbedded && onExit ? onExit : disconnect}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <PhaseStatusBar
              gameState={gameState!}
              onNextRound={nextRound}
              isHost={gameIsHost}
              boardExpanded={boardExpanded}
              onToggleExpand={toggleExpand}
            />
            <div
              className={`grid grid-cols-1 gap-6 items-start ${
                boardExpanded ? "xl:grid-cols-5" : "lg:grid-cols-4"
              }`}
            >
            <div className={`space-y-6 ${boardExpanded ? "xl:col-span-4" : "lg:col-span-3"}`}>
              <Board
                gameState={gameState!}
                myPeerId={myPeerId}
                onRevealCard={revealCard}
                boardExpanded={boardExpanded}
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

              <TextChatPanel
                messages={chatMessages}
                onSend={sendChatMessage}
                title="Tchat"
                placeholder="Tapez un message..."
                emptyLabel="Aucun message."
                className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-3xl p-5 shadow-xl flex flex-col h-[280px] text-zinc-100 text-xs"
                scrollbarAccent="rose"
              />
            </div>
          </div>
          </div>
        )}
      </main>

      {!boardExpanded && (
      <footer className="max-w-7xl mx-auto w-full text-center text-[10px] text-zinc-650 py-6 px-4 border-t border-zinc-900 flex justify-between items-center mt-8">
        <div>
          Skull & Roses - Réseau Privé Peer-to-Peer - Version v{__APP_VERSION__}
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
      )}

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
