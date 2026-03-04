# AI Context – RotGym / StronGO Project

## Project Overview

This repository is a fork of GORILAPP.

The goal is to adapt it into a personal training application focused on structured strength training and long-term progression tracking.

The app will evolve into a personal training system rather than a generic fitness tracker.

Possible product name candidates:
- StronGO
- RotGym

Naming is not final.

---

# Core Philosophy

This app should focus on:

- structured workouts
- measurable progress
- simplicity in the gym
- offline-first functionality

The goal is to create a personal training tool that is fast, reliable, and distraction-free.

---

# Technical Stack

Current stack inherited from GORILAPP:

Frontend:
- React
- Vite

Data:
- Dexie (IndexedDB)

Charts:
- Recharts

App type:
- Progressive Web App (PWA)

Future plan:
- Capacitor wrapper for mobile apps

---

# Current Architecture (from GORILAPP)

Database tables:

workouts  
exercises  
sessions  
sets  
notes

Data flow:

Workout → Exercises → Sets  
Sessions store performed workouts.  
Sets store reps, weight, and effort metrics.

All data is stored locally using IndexedDB via Dexie.

---

# Planned Extensions

The following features must be added without breaking the existing architecture.

## Body Metrics

Add a new Dexie store:

bodyMetrics

Fields:

id  
date  
weightKg  
optionalNotes

Height should be stored in profile settings.

BMI calculation:

BMI = weightKg / (heightMeters^2)

BMI does not need to be stored in the database and should be calculated dynamically.

---

# Progress Tracking Improvements

Progress screen should support:

- weight evolution chart
- BMI evolution
- strength progression per exercise
- training frequency metrics

Charts should use the existing Recharts system.

---

# Workout Structure Upgrade

Workouts should support training blocks.

Example structure:

Workout
Block (Strength)
Exercise
Block (Volume)
Exercise
Block (Pump)
Exercise

The UI should clearly represent these blocks.

---

# Design Principles

When modifying the code:

- Do not break existing workout tracking functionality.
- Keep database migrations safe.
- Avoid unnecessary complexity.
- Maintain offline-first architecture.
- Keep UI fast and simple.

---

# Development Workflow Expectations

Before making significant changes:

1. Analyze the repository structure.
2. Explain the current architecture.
3. Propose a modification plan.
4. Then implement changes.

Never modify multiple critical systems at once without explanation.

---

# Future Features (not required now)

Possible future improvements:

- PR (personal record) detection
- weekly volume tracking
- step tracking via mobile sensors
- integration with HealthKit / Health Connect
- smart weight progression suggestions

These features should not affect the current architecture design.

---

# Goal of This Project

Create a clean, maintainable personal training app optimized for:

- strength training
- progressive overload
- body weight tracking
- long-term consistency