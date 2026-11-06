/**
 * Clean, ergonomic HUD overlay for the Mannequin Humanoid Player on the 1152x1152 Baseplate.
 * Includes Background Music Player, Custom Audio File Loader (MP3/WAV/OGG), and gait telemetry.
 */

import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Camera,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  Upload,
  Music,
} from 'lucide-react';
import { CameraMode } from '../game/camera';

interface HUDProps {
  speed: number;
  maxSpeed: number;
  altitude: number;
  isGrounded: boolean;
  isSprinting: boolean;
  cameraMode: CameraMode;
  isMuted: boolean;
  isMusicPlaying: boolean;
  trackName: string;
  isCustomTrack: boolean;
  onToggleMute: () => void;
  onToggleMusic: () => void;
  onLoadCustomTrack: (file: File) => void;
  onResetTrack: () => void;
  onRespawn: () => void;
  onCycleCamera: () => void;
  onTouchMove?: (fwd: number, right: number) => void;
  onTouchJump?: (pressed: boolean) => void;
  onTouchSprint?: (pressed: boolean) => void;
}

export const HUD: React.FC<HUDProps> = ({
  speed,
  maxSpeed,
  altitude,
  isGrounded,
  isSprinting,
  cameraMode,
  isMuted,
  isMusicPlaying,
  trackName,
  isCustomTrack,
  onToggleMute,
  onToggleMusic,
  onLoadCustomTrack,
  onResetTrack,
  onRespawn,
  onCycleCamera,
  onTouchMove,
  onTouchJump,
  onTouchSprint,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const isTouchDevice =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  // Determine current gait state
  let gaitStatus = 'Idle';
  if (!isGrounded) {
    gaitStatus = 'Airborne';
  } else if (speed > 1.0) {
    gaitStatus = isSprinting ? 'Sprinting' : 'Walking';
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-4 sm:p-6 overflow-hidden">
      {/* 1. Minimal Top Bar */}
      <header className="pointer-events-auto flex items-center justify-between gap-4 max-w-full">
        {/* Title */}
        <div className="flex items-center gap-3 bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-lg border border-slate-700/60 shadow-lg text-white">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-slate-100 border border-slate-300" />
            <h1 className="text-sm sm:text-base font-bold tracking-tight whitespace-nowrap">
              1152×1152 Baseplate
            </h1>
          </div>
          <span className="text-slate-500 hidden sm:inline" aria-hidden="true">·</span>
          <span className="text-xs sm:text-sm text-slate-300 hidden sm:inline">
            Mannequin Controller
          </span>
        </div>

        {/* Music Player & Controls Bar */}
        <div className="flex items-center gap-2">
          {/* Music Widget */}
          <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow-lg text-xs text-white">
            <button
              onClick={onToggleMusic}
              title={isMusicPlaying ? 'Pause Music' : 'Play Music'}
              className="p-1 hover:bg-slate-800 rounded transition-colors text-amber-400 cursor-pointer"
            >
              {isMusicPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-[10px] text-slate-400">Music</span>
                <span className="text-[9px] font-semibold font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 px-1 py-0.2 rounded">
                  150% Vol
                </span>
              </div>
              <span className="font-medium text-slate-200 max-w-[100px] sm:max-w-[170px] truncate leading-tight">
                {trackName}
              </span>
            </div>

            {/* Load Custom Audio File Button */}
            <label
              title="Load your audio file (MP3, WAV, OGG) with real instruments & vocals"
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 px-2 py-1 rounded text-[11px] font-medium text-sky-300 cursor-pointer transition-colors"
            >
              <Upload className="w-3 h-3" />
              <span className="hidden sm:inline">Load Track</span>
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onLoadCustomTrack(file);
                    // Reset input value so same file can be reloaded if needed
                    e.target.value = '';
                  }
                }}
              />
            </label>

            {/* Switch soundtrack button */}
            <button
              onClick={onResetTrack}
              title={
                trackName === 'Pure Imagination'
                  ? 'Switch to Ambient Synth soundtrack'
                  : 'Switch to Pure Imagination'
              }
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Controls Button */}
          <button
            onClick={() => setShowHelpModal(true)}
            aria-label="Open controls guide"
            className="flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md hover:bg-slate-800 text-slate-200 hover:text-white px-3 py-2 rounded-lg border border-slate-700/60 shadow-lg text-xs transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">Controls</span>
          </button>
        </div>
      </header>

      {/* 2. Optional Mobile Touch Controls */}
      {isTouchDevice && (
        <div className="pointer-events-auto flex items-end justify-between w-full pb-16 px-2 sm:hidden">
          {/* Virtual D-Pad buttons */}
          <div className="grid grid-cols-3 gap-1 bg-slate-950/70 p-2 rounded-xl border border-slate-800">
            <div />
            <button
              onPointerDown={() => onTouchMove?.(1, 0)}
              onPointerUp={() => onTouchMove?.(0, 0)}
              className="w-12 h-12 bg-slate-800 active:bg-slate-700 text-white rounded-lg flex items-center justify-center font-bold text-sm"
            >
              ▲
            </button>
            <div />
            <button
              onPointerDown={() => onTouchMove?.(0, -1)}
              onPointerUp={() => onTouchMove?.(0, 0)}
              className="w-12 h-12 bg-slate-800 active:bg-slate-700 text-white rounded-lg flex items-center justify-center font-bold text-sm"
            >
              ◀
            </button>
            <button
              onPointerDown={() => onTouchMove?.(-1, 0)}
              onPointerUp={() => onTouchMove?.(0, 0)}
              className="w-12 h-12 bg-slate-800 active:bg-slate-700 text-white rounded-lg flex items-center justify-center font-bold text-sm"
            >
              ▼
            </button>
            <button
              onPointerDown={() => onTouchMove?.(0, 1)}
              onPointerUp={() => onTouchMove?.(0, 0)}
              className="w-12 h-12 bg-slate-800 active:bg-slate-700 text-white rounded-lg flex items-center justify-center font-bold text-sm"
            >
              ▶
            </button>
          </div>

          {/* Action buttons (Jump & Sprint) */}
          <div className="flex flex-col gap-2">
            <button
              onPointerDown={() => onTouchSprint?.(true)}
              onPointerUp={() => onTouchSprint?.(false)}
              className="w-14 h-14 bg-amber-600 active:bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-lg"
            >
              SPRINT
            </button>
            <button
              onPointerDown={() => onTouchJump?.(true)}
              onPointerUp={() => onTouchJump?.(false)}
              className="w-16 h-16 bg-sky-600 active:bg-sky-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-xl"
            >
              JUMP
            </button>
          </div>
        </div>
      )}

      {/* 3. Collapsible Bottom Control Dock */}
      <footer className="pointer-events-auto mx-auto w-full max-w-[840px] flex flex-col items-center">
        {/* Collapse Drawer Handle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1.5 bg-slate-950/90 hover:bg-slate-900 border-t border-x border-slate-700/70 text-slate-300 hover:text-white px-4 py-1 rounded-t-lg text-xs font-medium shadow-md transition-colors cursor-pointer mb-[-1px]"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-sky-400" />
              <span>Show Dock</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-sky-400" />
              <span>Hide Dock</span>
            </>
          )}
        </button>

        {/* Dock Panel */}
        <div
          className={`w-full bg-slate-950/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3 sm:p-4 shadow-2xl transition-all duration-300 ${
            isCollapsed
              ? 'translate-y-[120%] opacity-0 pointer-events-none'
              : 'translate-y-0 opacity-100'
          }`}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 items-center">
            {/* Cell 1: Velocity */}
            <div className="flex flex-col bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800">
              <span className="text-[11px] font-medium text-slate-400 tracking-wide uppercase">
                Movement Speed
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-white">
                  {speed.toFixed(1)}
                </span>
                <span className="text-xs text-slate-400 font-mono">studs/s</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono tabular-nums mt-0.5">
                Peak: {maxSpeed.toFixed(1)} studs/s
              </div>
            </div>

            {/* Cell 2: Stance & Gait Status */}
            <div className="flex flex-col bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800">
              <span className="text-[11px] font-medium text-slate-400 tracking-wide uppercase">
                Gait / Stance
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-base sm:text-lg font-bold text-sky-400">
                  {gaitStatus}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {isSprinting ? 'Sprint active (Shift)' : 'Walk mode'}
              </div>
            </div>

            {/* Cell 3: Altitude & Baseplate Area */}
            <div className="flex flex-col bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800">
              <span className="text-[11px] font-medium text-slate-400 tracking-wide uppercase">
                Baseplate Floor
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base sm:text-lg font-semibold font-mono tabular-nums text-white">
                  Y = {altitude.toFixed(1)}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5">
                1152×1152 Stud Surface
              </span>
            </div>

            {/* Cell 4: Quick Controls */}
            <div className="flex items-center justify-between sm:justify-end gap-2">
              {/* Reset to Spawn Pad */}
              <button
                onClick={onRespawn}
                title="Reset to Spawn Pad (R)"
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 hover:text-white px-3 py-2.5 rounded-xl border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>Spawn</span>
              </button>

              {/* Camera Mode Toggle (F5 or C) */}
              <button
                onClick={onCycleCamera}
                title="Toggle 1st / 3rd Person Mode (F5 or C)"
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 hover:text-white px-3 py-2.5 rounded-xl border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4 text-sky-400" />
                <span className="hidden md:inline">{cameraMode}</span>
                <span className="text-[10px] text-slate-400 font-mono hidden lg:inline">[F5]</span>
              </button>

              {/* Audio Mute Toggle */}
              <button
                onClick={onToggleMute}
                title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                className="flex items-center justify-center w-10 h-10 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 hover:text-white rounded-xl border border-slate-700 transition-colors cursor-pointer"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                )}
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* 4. Controls & Music Help Modal */}
      {showHelpModal && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-bold">Controls & Audio Guide</h2>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-white text-sm font-semibold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Custom Music Guide Box */}
            <div className="mt-4 p-3.5 bg-slate-800/80 rounded-xl border border-amber-500/30">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs mb-1.5">
                <Music className="w-4 h-4" />
                <span>Custom Music (Real Vocals & Instruments)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Yes! You can play any audio track with real instruments and lyrics:
              </p>
              <ul className="text-xs text-slate-300 list-disc list-inside mt-1.5 space-y-1">
                <li>Click <strong>Load Track</strong> in the top-right music bar.</li>
                <li>Select any <code className="text-sky-300 font-mono">.mp3</code>, <code className="text-sky-300 font-mono">.wav</code>, <code className="text-sky-300 font-mono">.ogg</code>, or <code className="text-sky-300 font-mono">.m4a</code> file from your computer.</li>
                <li>It will loop seamlessly as you explore the 1152×1152 baseplate!</li>
              </ul>
            </div>

            {/* Key Controls Table */}
            <div className="mt-4 space-y-2.5 text-sm text-slate-300">
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="font-medium text-slate-200">Walk Movement</span>
                <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-xs text-sky-300">
                  W, A, S, D / Arrows
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="font-medium text-slate-200">Sprint</span>
                <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-xs text-sky-300">
                  Shift (Hold)
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="font-medium text-slate-200">Jump</span>
                <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-xs text-sky-300">
                  Spacebar
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="font-medium text-slate-200">1st / 3rd Person View</span>
                <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-xs text-sky-300">
                  F5 / C
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="font-medium text-slate-200">Look Around</span>
                <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-xs text-sky-300">
                  Mouse Drag
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="font-medium text-slate-200">Zoom (3rd Person)</span>
                <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-xs text-sky-300">
                  Scroll Wheel
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="font-medium text-slate-200">Reset to Spawn Pad</span>
                <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-xs text-sky-300">
                  R
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="mt-5 w-full bg-sky-600 hover:bg-sky-500 text-white font-medium py-2 rounded-xl transition-colors cursor-pointer"
            >
              Resume
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
