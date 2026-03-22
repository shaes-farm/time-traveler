# Time Traveler

[![Build Status](https://img.shields.io/github/actions/workflow/status/shaes-farm/time-traveler/ci.yml?branch=main)](https://github.com/shaes-farm/time-traveler/actions)
[![Coverage Status](https://img.shields.io/codecov/c/github/shaes-farm/time-traveler/main.svg)](https://codecov.io/gh/shaes-farm/time-traveler)
[![License](https://img.shields.io/github/license/shaes-farm/time-traveler.svg)](LICENSE)

**Time Traveler** is an advanced temporal content management system for storing, visualizing, and interacting with historical events and narratives. It introduces a fractal timeline metaphor, enabling users to zoom in and out of nested timelines while maintaining semantic and relational context. The system supports a wide range of character types (human, animal, mythological, fictional, organizations, divine, artifacts) and enables multi-dimensional navigation: temporal-first, character-first, and relationship-first views.

---

## Key Features

- **Fractal Timelines:** Zoomable, nested timelines for immersive exploration of history.
- **Multi-Dimensional Navigation:** Switch between temporal, character-centric, and relationship network views.
- **Rich Character Modeling:** Track not just what happened and when, but also who was involved and how they were connected.
- **Cross-Dimensional Queries:** Sophisticated queries across time, character, and relationships.
- **Semantic Categorization:** Flexible grouping and filtering of events and periods.
- **Prehistoric Date Support:** Hybrid temporal system for representing dates from the Big Bang to the far future.
- **Interactive & Collaborative:** Real-time editing, multimedia showcases, and collaborative features.

---

## Architecture & Domain Model

- **Modular Layers:** Presentation, application, and data layers with clear separation of concerns.
- **Core Components:** Temporal engine, visualization engine, semantic engine, content manager, navigation controller.
- **Modern Stack:** React/Next.js frontend, RESTful/GraphQL API, PostgreSQL database, WebSocket support.
- **Extensible Schema:** Comprehensive TypeScript-style models for timelines, periods, events, stories, categories, and characters.
- **Character Extensions:** Dedicated tables and relationships for character profiles, attributes, media, relationships, and event participation.
- **Prehistoric Dates:** JSONB-based temporal data, computed columns for sorting, and UI components for flexible date input and display.

---

## Use Cases

- **Historical Research:** Academic studies, period analysis, and cross-referencing of events.
- **Criminal & Journalistic Investigation:** Timeline reconstruction, pattern recognition, and relationship mapping.
- **Education:** Interactive curriculum timelines and immersive learning experiences.
- **Storytelling & Biography:** Narrative construction, character-centric timelines, and ensemble storytelling.
- **Paleontology & Geology:** Representation of events spanning millions or billions of years.

---

## Development & Deployment

- **Well-Organized Codebase:** Clear separation of components, services, stores, utilities, and types.
- **Testing:** Unit, integration, end-to-end, and performance tests.
- **Security:** Row-level security (RLS) policies, authentication, and authorization.
- **CI/CD:** Automated testing and deployment pipelines.
- **Docker-Based Deployment:** Scalable and production-ready environments.

---

## Getting Started

### Build

```bash
npm install
npm run build
```

### Test

```bash
npm test
```

### Start

```bash
npm start
```

---

## Learn More

- [Product Requirements Document](docs/prd/PRD-0001-time-traveler-system.md)
- [Detailed Architecture & Domain Models](docs/system-design.md)
- [Character Data Model & Migration Guide](docs/system/character-migrations-analysis.md)
- [Prehistoric Date Representation](docs/system/prehistoric-date-representation.md)

---

*Time Traveler empowers users to explore, document, and analyze history across any scale of time, with rich semantic and relational context.*
