# Web Synth & Drum Loop Studio

A browser-based music workstation built with React, Strudel, and the Web Audio API.  
Users can play drum pads, record patterns, save loops, adjust playback speed, change drum kits, and experiment with a built-in keyboard.

---

## Live Demo
https://

---

## Overview

This application functions as a lightweight digital audio workstation (DAW) in the browser.  
It allows users to:

- Play drum pads mapped to multiple drum kits  
- Record drum sequences in real time  
- Save and toggle loops  
- Merge multiple loops into a single Strudel pattern  
- Adjust BPM  
- Control rhythmic density using note-speed settings  
- Interact with a simulated piano keyboard  
- View the actively generated Strudel sequence  
- Experiment with effects (UI only for now)

The system coordinates React state, Strudel pattern generation, and Web Audio sample playback to create an interactive musical environment.

---

## Features

### Drum Pads
Interactive drum pads triggering sounds for Kick, Snare, Closed Hat, Open Hat, and Crash.  
Pad playback adapts to the selected drum kit.

### Drum Kits
Supported kits:  
- Default  
- 808s  
- Acoustic  

Selecting a kit updates both the Web Audio pad sounds and Strudel's sample mappings.

### Loop Recorder
- Record patterns in real time  
- Save patterns into any of four loop slots  
- Loops store:
  - The recorded pattern (including note-speed modifiers)
  - The instrument selected at record time
  - The drum preset used at record time  
- Toggle loops independently  
- Active loops merge into a single Strudel pattern automatically

### Note Speed Control
Allows recording patterns at different rhythmic densities:

- 1x – quarter notes  
- 2x – eighth notes  
- 4x – sixteenth notes  

Patterns use Strudel-compatible modifiers (`bd*2`, `sd*4`, etc.).

### BPM Control
Adjust tempo in real time.

### Keyboard Component
Two-octave on-screen keyboard supporting UI interaction.

### Effects Panel
UI for cutoff, resonance, and reverb values (functional backend to be implemented later).

---

## Technologies

- React  
- Strudel (TidalCycles for the browser)  
- Web Audio API  
- Vite  
- CSS Grid and Flexbox  
- Modular component architecture

---

## Project Structure

