import './style.css';
import { Engine, Scene } from '@babylonjs/core';
import { GameManager } from './game/GameManager';
import { registerSW } from 'virtual:pwa-register';

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;

// Engine — cap pixel ratio at 2 for mobile performance
const engine = new Engine(canvas, true, {
  preserveDrawingBuffer: false,
  stencil: false,
  antialias: true,
});
const maxDPR = Math.min(window.devicePixelRatio || 1, 2);
engine.setHardwareScalingLevel(1 / maxDPR);

// Scene
const scene = new Scene(engine);
scene.collisionsEnabled = false;      // We use manual AABB
scene.skipPointerMovePicking = true;  // Perf: skip pointer ray-picking
scene.autoClear = true;

// Game
const game = new GameManager(engine, scene, canvas);
game.init();

// Render loop
engine.runRenderLoop(() => {
  scene.render();
});

// Make generic error handlers
window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
});

// PWA Service Worker Registration
registerSW({
  onNeedRefresh() {
    console.log('New content available, please refresh.');
  },
  onOfflineReady() {
    console.log('NexaRun is ready to play offline!');
  },
});

// Responsive
window.addEventListener('resize', () => {
  engine.resize();
});

// Prevent context menu on long-press (mobile)
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
