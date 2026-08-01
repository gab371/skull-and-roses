import { useState } from "react";
import { P2PlayLobby, CopyRoomLinkButton } from "p2play-core";
import { Badge, Button } from "p2play-core/ui";
import type { Player } from "../../core/types";
import { SpectatorRolePanel } from "./SpectatorRolePanel";

interface LobbyProps {
  myPeerId: string | null;
  hostPeerId: string | null;
  isHost: boolean;
  players: Player[];
  spectators?: Player[];
  spectatorLocks?: { [peerId: string]: boolean };
  status: string;
  error: string | null;
  hostRoom: (name: string, avatar: string) => Promise<void>;
  joinRoom: (name: string, avatar: string, roomId: string) => Promise<void>;
  toggleReady: (ready: boolean) => void;
  startGame: () => void;
  disconnect: () => void;
  onSetRole?: (peerId: string, role: 'player' | 'spectator') => void;
  onLockSpectator?: (peerId: string, locked: boolean) => void;
}

const AVATARS = ["💀", "🌹", "😈", "🦊", "🐯", "🦉", "🦁", "🐉"];

export function Lobby({
  myPeerId,
  hostPeerId,
  isHost,
  players,
  spectators = [],
  spectatorLocks = {},
  status,
  error,
  hostRoom,
  joinRoom,
  toggleReady,
  startGame,
  disconnect,
  onSetRole,
  onLockSpectator,
}: LobbyProps) {
  const [localReady, setLocalReady] = useState(false);

  const handleToggleReady = () => {
    const nextState = !localReady;
    setLocalReady(nextState);
    toggleReady(nextState);
  };

  const allReady = players.length >= 2 && players.every((p) => p.isHost || p.isReady);

  if (status === 'CONNECTED' && myPeerId) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6 bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-serif font-normal tracking-wide bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent">
              Salon de Jeu : {hostPeerId}
            </h1>
            {hostPeerId && (
              <CopyRoomLinkButton
                id="lobby-copy-btn"
                code={hostPeerId}
                className="bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300"
              />
            )}
          </div>
          <Badge variant="outline" className="bg-zinc-800 border-zinc-700 text-zinc-400 font-mono">
            {isHost ? "HÔTE" : "INVITÉ"}
          </Badge>
        </div>
        <p className="text-zinc-400 text-sm mb-6">Partagez ce code avec vos amis pour les inviter à jouer.</p>

        <SpectatorRolePanel
          players={players}
          spectators={spectators}
          spectatorLocks={spectatorLocks}
          myPeerId={myPeerId}
          isHost={isHost}
          onSetRole={onSetRole || (() => {})}
          onLockSpectator={onLockSpectator || (() => {})}
        />

        <div className="flex flex-col gap-4 mb-8">
          <h2 className="text-lg font-bold text-zinc-200">
            Joueurs connectés ({players.length})
            {spectators.length > 0 && <span className="text-sky-300/80 text-sm"> · 👁 {spectators.length} spectateur(s)</span>}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-zinc-800/40 border border-zinc-800"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{player.avatar}</span>
                  <div>
                    <span className="font-medium text-zinc-100">{player.name}</span>
                    {player.id === myPeerId && <span className="ml-2 text-xs text-rose-400">(Vous)</span>}
                  </div>
                </div>
                <Badge
                  variant={player.isHost ? "default" : player.isReady ? "secondary" : "outline"}
                  className={
                    player.isHost
                      ? "w-24 justify-center bg-amber-500/10 text-amber-400 border-amber-500/20"
                      : player.isReady
                      ? "w-24 justify-center bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "w-24 justify-center bg-zinc-800 text-zinc-500"
                  }
                >
                  {player.isHost ? "Hôte" : player.isReady ? "Prêt" : "En attente"}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-zinc-800/60">
          {!isHost && (
            <Button
              type="button"
              onClick={handleToggleReady}
              className={`flex-1 h-auto py-3.5 px-6 rounded-2xl font-bold ${
                localReady
                  ? "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/30"
                  : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              }`}
            >
              {localReady ? "Pas Prêt" : "Je suis Prêt !"}
            </Button>
          )}

          {isHost && (
            <Button
              type="button"
              onClick={startGame}
              disabled={!allReady}
              className="flex-1 h-auto py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-zinc-950 font-bold disabled:opacity-40 shadow-lg shadow-rose-500/20"
            >
              Lancer la partie ({players.length} joueur{players.length > 1 ? "s" : ""})
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={disconnect}
            className="h-auto py-3.5 px-6 rounded-2xl bg-zinc-800/40 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-800"
          >
            Quitter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <P2PlayLobby
      title="SKULL"
      subtitle="Bluff, Roses et Crânes en Peer-to-Peer"
      bannerEmoji="💀"
      theme="red"
      avatars={AVATARS}
      status={status}
      error={error}
      maxUsernameLength={14}
      showVoiceToggle={false}
      showCharacterCounter={false}
      subtitleTransform="none"
      usernameLabel="Pseudonyme"
      usernamePlaceholder="Entrez votre nom..."
      avatarLabel="Choisir un Avatar"
      createButtonText="Créer une Table"
      compactHostSection
      joinCodeLabel="Code de la table"
      joinCodePlaceholder="CODE"
      joinButtonText="Rejoindre"
      joinLayout="side-by-side"
      onHost={(username, avatar) => { void hostRoom(username, avatar); }}
      onJoin={(username, avatar, roomCode) => { void joinRoom(username, avatar, roomCode); }}
      classes={{
        root: "max-w-md mx-auto p-8 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl shadow-2xl relative",
        header: "text-center mb-8",
        emoji: "text-5xl inline-block mb-3 animate-bounce",
        title: "text-4xl font-black bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent",
        subtitle: "text-zinc-400 text-sm mt-1",
        content: "space-y-5",
        label: "block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2",
        input: "w-full px-4 py-3 rounded-2xl bg-zinc-950 dark:bg-zinc-950 border border-zinc-800 focus:border-rose-500 text-zinc-150 outline-none transition-all disabled:opacity-50",
        avatarGrid: "grid grid-cols-8 gap-2 bg-zinc-950 p-2.5 rounded-2xl border border-zinc-800/60",
        avatarItem: "text-2xl p-1.5 rounded-xl transition-all flex items-center justify-center aspect-square border-2 border-transparent hover:bg-zinc-850",
        avatarItemSelected: "text-2xl p-1.5 rounded-xl transition-all flex items-center justify-center aspect-square bg-rose-500/20 border-2 border-rose-500 scale-110 shadow-[0_0_12px_rgba(244,63,94,0.3)]",
        hr: "border-t border-zinc-800/60",
        actionGroup: "flex flex-col gap-3",
        createButton: "w-full py-3.5 px-6 rounded-2xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-white/5",
        divider: "relative flex py-2 items-center",
        dividerLine: "flex-grow border-t border-zinc-800/60",
        dividerText: "flex-shrink mx-4 text-zinc-500 text-xs font-bold uppercase tracking-widest",
        joinWrapper: "space-y-2",
        joinGroup: "flex gap-2",
        joinInput: "w-1/3 px-4 py-3 rounded-2xl bg-zinc-950 dark:bg-zinc-950 border border-zinc-800 focus:border-rose-500 text-zinc-150 text-center outline-none transition-all font-mono tracking-wider",
        joinButton: "flex-grow py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-zinc-950 font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-rose-500/15",
        urlNotice: "p-5 bg-zinc-950 border border-zinc-800 rounded-2xl text-left flex flex-col gap-4",
        error: "text-rose-500 text-sm p-3 rounded-xl bg-rose-500/10 border border-rose-500/20",
      }}
    />
  );
}
