# 💀 Skull & Roses - P2P Edition

[![Deploy to GitHub Pages](https://github.com/gab371/skull-and-roses/actions/workflows/deploy.yml/badge.svg)](https://github.com/gab371/skull-and-roses/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-rose.svg)](https://opensource.org/licenses/MIT)

**Skull & Roses** est un jeu de bluff, d'enchères et de psychologie multijoueur Peer-to-Peer standalone basé sur WebRTC, jouable directement dans votre navigateur sans serveur intermédiaire. 

Inspiré du célèbre jeu de société *Skull*, cette version propose un design épuré, sombre et gothique avec des mécaniques de jeu fluides pour jouer entre amis en réseau privé direct.

---

## 🎮 Démo en Ligne

Jouez directement sur votre navigateur sans aucune installation :
👉 **[Jouer à la démo en ligne](https://gab371.github.io/skull-and-roses/)**

---

## ✨ Fonctionnalités Clés

- **Connexion P2P Standalone** : Connexions directes de navigateur à navigateur grâce à **PeerJS**. Pas de base de données ni de serveur de jeu intermédiaire (seul un serveur de signalement public est utilisé pour connecter les pairs).
- **Design Gothique Sombre** : Interface immersive aux couleurs contrastées de rose et ambre, typographie *Creepster* et effets visuels léchés.
- **Gestion Complète des Enchères** : Interface de mise simple et intuitive avec calcul des totaux de cartes posées.
- **Résolution Assistée** : Le jeu valide automatiquement l'ordre de révélation (vos propres cartes d'abord) et gère l'élimination des cartes perdues en cas de Crâne révélé.
- **Tchat en Direct** : Discussion P2P sécurisée intégrée pour bluffer, négocier et intimider vos adversaires.

---

## 🛠️ Lancement Local

### Prérequis
- **Node.js** (v20 ou supérieur recommandé)
- **npm**

### Instructions

1. **Cloner le projet** :
   ```bash
   git clone https://github.com/gab371/skull-and-roses.git
   cd skull-and-roses
   ```
2. **Installer les dépendances** :
   ```bash
   npm install
   ```
3. **Lancer le serveur de développement** :
   ```bash
   npm run dev
   ```
4. **Ouvrir dans le navigateur** :
   Ouvrez `http://localhost:5173/` (ou le port indiqué par Vite).
   *Pour tester à deux sur la même machine, ouvrez un deuxième onglet ou un autre navigateur.*

5. **Compiler pour la production** :
   ```bash
   npm run build
   ```

---

## 🏛️ Architecture du Projet

Le projet suit des principes stricts de séparation des responsabilités pour garantir la testabilité et la maintenabilité :
- **`/src/core`** : Moteur de jeu pur (gestion des tours, calcul des points, défausse aléatoire) écrit en TypeScript pur, sans aucune dépendance UI ou réseau.
- **`/src/network`** : Gestionnaire de connexion P2P PeerJS et protocole de messages réseau.
- **`/src/hooks`** : Custom hooks liant l'état de jeu réactif et les événements réseau au cycle de vie de React.
- **`/src/components`** : Composants d'interface (plateau de jeu, lobby, modaux de décision).

---

## 📄 Licence

Ce projet est distribué sous licence MIT.
