# Time Traveler System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Design](#architecture-design)
3. [Domain Models](#domain-models)
4. [User Experience Design](#user-experience-design)
5. [API Specifications](#api-specifications)
6. [Deployment Strategy](#deployment-strategy)
7. [Use Cases & Applications](#use-cases--applications)
8. [Development Guidelines](#development-guidelines)

## System Overview

Time Traveler is a sophisticated temporal content management system designed for storing, visualizing, and interacting with historical events and narratives. The system provides a fractal approach to time visualization, allowing users to zoom in and out of temporal periods while maintaining semantic relationships between events.

### Core Purpose
- **Storytelling**: Enable rich narrative construction across temporal dimensions
- **Historical Documentation**: Preserve and organize historically significant experiences
- **Criminal Investigation**: Track and correlate events across timelines for investigative purposes
- **Educational Tools**: Provide immersive learning experiences through interactive temporal navigation
- **Research Applications**: Support academic and professional temporal data analysis

### Key Innovation
The system extends traditional linear timeline visualization by implementing a "fractal time" metaphor, where each event can contain its own nested timeline, creating a multi-dimensional temporal navigation experience.

## Architecture Design

### High-Level System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Presentation  │    │   Application   │    │      Data       │
│     Layer       │    │     Layer       │    │     Layer       │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ Timeline Views  │◄──►│ Event Manager   │◄──►│ Event Store     │
│ Fractal UI      │    │ Period Manager  │    │ Period Store    │
│ Showcase        │    │ Category Manager│    │ Category Store  │
│ Navigation      │    │ Story Manager   │    │ Story Store     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Component Architecture

#### Core Components
1. **Temporal Engine**: Manages time-based calculations and relationships
2. **Visualization Engine**: Renders fractal timelines and 2D representations
3. **Semantic Engine**: Handles categorization and cross-referencing
4. **Content Manager**: Manages multimedia showcases and event details
5. **Navigation Controller**: Manages zoom levels and timeline transitions

#### Data Flow Architecture
```
User Input → Navigation Controller → Temporal Engine → Data Layer
     ↓              ↓                    ↓              ↓
UI Updates ← Visualization Engine ← Semantic Engine ← Content Manager
```

### Technology Stack Considerations
- **Frontend**: Modern JavaScript framework (React/Next.js)
- **Backend**: RESTful API with temporal query capabilities
- **Database**: Graph database or time-series optimized storage
- **Caching**: Redis for frequently accessed temporal ranges
- **Real-time**: WebSocket support for collaborative editing

## Domain Models

### Core Entity Relationships

```
Timeline (1) ──── (n) Period ──── (n) Event ──── (n) Story
    │                  │              │              │
    │                  │              │              │
    └─── Categories ───┴──── Metadata ┴─── Content ──┘
                             │              │
                             │              │
                        (n) Actor ──────────┘
                             │
                        ActorProfile
```

### Actor Model
```typescript
interface Actor {
  id: string
  name: string
  type: ActorType
  profile: ActorProfile
  birth?: DateTime
  death?: DateTime
  events: Event[]
  stories: Story[]
  relationships: ActorRelationship[]
  aliases: string[]
  metadata: ActorMetadata
}

enum ActorType {
  HUMAN = 'human',
  ANIMAL = 'animal',
  MYTHOLOGICAL = 'mythological',
  FICTIONAL = 'fictional',
  ORGANIZATION = 'organization',
  DIVINE = 'divine',
  ARTIFACT = 'artifact'
}

interface ActorProfile {
  biography: string
  images: MediaObject[]
  attributes: ActorAttribute[]
  significance: SignificanceLevel
  culturalContext: string[]
  physicalDescription?: string
  species?: string // for animals
  breed?: string // for specific animal breeds
  domain?: string // for divine/mythological beings
}

interface ActorRelationship {
  id: string
  relatedActor: Actor
  relationshipType: RelationshipType
  startDate?: DateTime
  endDate?: DateTime
  description: string
  events: Event[] // events where this relationship was significant
}

enum RelationshipType {
  FAMILY = 'family',
  PROFESSIONAL = 'professional',
  FRIENDSHIP = 'friendship',
  RIVALRY = 'rivalry',
  OWNER_PET = 'owner_pet',
  TRAINER_TRAINEE = 'trainer_trainee',
  CREATOR_CREATION = 'creator_creation',
  WORSHIP = 'worship',
  COLLABORATION = 'collaboration'
}
```

### Event Model
```typescript
interface Event {
  id: string
  title: string
  description: string
  startTime: DateTime
  endTime?: DateTime
  duration?: Duration
  type: EventType
  categories: Category[]
  stories: Story[]
  actors: EventActor[] // NEW: Actors participating in this event
  metadata: EventMetadata
  parentEvent?: Event
  childEvents: Event[]
  spatialData?: SpatialCoordinates
}

interface EventActor {
  actor: Actor
  role: ActorRole
  significance: ParticipationLevel
  description?: string
}

enum ActorRole {
  PROTAGONIST = 'protagonist',
  ANTAGONIST = 'antagonist',
  WITNESS = 'witness',
  PARTICIPANT = 'participant',
  VICTIM = 'victim',
  BENEFICIARY = 'beneficiary',
  PERFORMER = 'performer',
  COMPETITOR = 'competitor',
  OWNER = 'owner',
  CREATOR = 'creator',
  OBSERVER = 'observer'
}

enum ParticipationLevel {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  MINOR = 'minor',
  MENTIONED = 'mentioned'
}
```

### Story Model
```typescript
interface Story {
  id: string
  title: string
  content: StoryContent
  multimedia: MediaObject[]
  author: Author
  createdAt: DateTime
  updatedAt: DateTime
  events: Event[]
  actors: Actor[] // NEW: Actors featured in this story
  visibility: VisibilityLevel
  tags: string[]
  perspective?: Actor // whose perspective the story is told from
}
```

### Period Model
```typescript
interface Period {
  id: string
  name: string
  description: string
  startDate: DateTime
  endDate: DateTime
  characteristics: string[]
  events: Event[]
  childPeriods: Period[]
  parentPeriod?: Period
  significance: SignificanceLevel
}
```

### Timeline Model
```typescript
interface Timeline {
  id: string
  title: string
  description: string
  owner: User
  periods: Period[]
  events: Event[]
  categories: Category[]
  visibility: VisibilityLevel
  zoomLevels: ZoomLevel[]
  fractalDepth: number
}
```

### Category Model
```typescript
interface Category {
  id: string
  name: string
  description: string
  color: string
  icon?: string
  parentCategory?: Category
  childCategories: Category[]
  filterRules: FilterRule[]
}
```

## User Experience Design

### User Personas & Journeys

#### 1. The Historian
**Goal**: Document and explore historical events with rich context
**Journey**: Create timeline → Add events → Categorize → Add multimedia → Share

#### 2. The Investigator
**Goal**: Track event sequences and identify patterns
**Journey**: Import data → Filter events → Correlate timelines → Generate reports

#### 3. The Educator
**Goal**: Create engaging learning experiences
**Journey**: Design curriculum timeline → Add interactive content → Set learning objectives

#### 4. The Storyteller
**Goal**: Craft compelling narratives across time
**Journey**: Plan story arc → Place events → Add rich media → Assign actors → Publish narrative

#### 5. The Biographer
**Goal**: Document the life and experiences of a specific individual or creature
**Journey**: Create actor profile → Research life events → Build personal timeline → Add relationships → Publish biography

### Interface Design Principles

#### Fractal Navigation
- **Zoom Metaphor**: Seamless scaling from millennia to minutes
- **Context Preservation**: Always show temporal context during navigation
- **Smooth Transitions**: Animated transitions between zoom levels

#### Information Hierarchy
```
Master Timeline
├── Period Overview
├── Event Clusters
└── Individual Events
    ├── Event Details
    ├── Participating Actors
    ├── Story Content
    └── Multimedia Showcase

Actor-Centric View
├── Actor Profile
├── Life Timeline
├── Event Participation
└── Relationship Network
```

#### Interaction Patterns
- **Progressive Disclosure**: Reveal detail levels based on zoom
- **Contextual Actions**: Show relevant tools based on selected elements
- **Multi-Perspective Navigation**: Switch between temporal, actor-centric, and event-centric views
- **Actor Relationship Mapping**: Visualize connections between actors across time
- **Cross-Dimensional Filtering**: Filter events by time, category, and actor participation
- **Collaborative Features**: Real-time editing and commenting
- **Responsive Design**: Adapt to various screen sizes and orientations

### Navigation Modes & Views

#### 1. Temporal View (Default)
Traditional timeline-based navigation with fractal zoom capabilities
- **Focus**: Chronological sequence of events
- **Actor Integration**: Actors appear as participants within events
- **Use Case**: Understanding historical progression

#### 2. Actor-Centric View
Biography-focused navigation centered on individual actors
- **Focus**: Life journey of selected actor(s)
- **Event Integration**: Events displayed as milestones in actor's life
- **Use Case**: Character studies, biographical research

#### 3. Relationship Network View
Graph-based visualization of actor relationships over time
- **Focus**: Connections and interactions between actors
- **Temporal Integration**: Relationship evolution across time periods
- **Use Case**: Social network analysis, understanding influence patterns

#### 4. Multi-Actor Comparative View
Parallel timeline display for multiple actors
- **Focus**: Simultaneous life journeys and intersections
- **Event Integration**: Shared events highlighted across timelines
- **Use Case**: Comparative biography, ensemble storytelling

### Wireframe Structure

#### Temporal View Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Header: Navigation, Search, User Menu, Timeline Selector    │
├─────────────────────────────────────────────────────────────┤
│ Left Sidebar: Categories, Filters, Zoom Controls            │
├─────────────────┬───────────────────────────────────────────┤
│ Timeline View   │ Right Sidebar: Event Details, Showcase    │
│                 │                                           │
│ [Timeline Area] │ [Event Information Panel]                 │
│   • Events      │   • Actor Participants                    │
│   • Actors      │   • Actor Roles                           │
│                 │                                           │
│ [Fractal View]  │ [Multimedia Showcase]                     │
├─────────────────┴───────────────────────────────────────────┤
│ Footer: Status, Timeline Controls, Export Options           │
└─────────────────────────────────────────────────────────────┘
```

#### Actor-Centric View Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Header: Actor Search, Timeline Toggle, View Selector        │
├─────────────────────────────────────────────────────────────┤
│ Left Sidebar: Actor Profile, Relationships, Filters         │
├─────────────────┬───────────────────────────────────────────┤
│ Actor Timeline  │ Right Sidebar: Event Context, Media       │
│                 │                                           │
│ [Life Events]   │ [Event Details Panel]                     │
│ [Milestones]    │   • Other Participants                    │
│ [Relationships] │   • Event Significance                    │
│                 │                                           │
│ [Network View]  │ [Actor Media Gallery]                     │
├─────────────────┴───────────────────────────────────────────┤
│ Footer: Actor Navigation, Export Biography                  │
└─────────────────────────────────────────────────────────────┘
```

## API Specifications

### RESTful Endpoints

#### Timeline Management
```
GET    /api/timelines              # List all timelines
POST   /api/timelines              # Create new timeline
GET    /api/timelines/{id}         # Get timeline details
PUT    /api/timelines/{id}         # Update timeline
DELETE /api/timelines/{id}         # Delete timeline
```

#### Event Management
```
GET    /api/events                 # List events (with filtering)
POST   /api/events                 # Create new event
GET    /api/events/{id}            # Get event details
PUT    /api/events/{id}            # Update event
DELETE /api/events/{id}            # Delete event
GET    /api/events/{id}/children   # Get child events (fractal)
GET    /api/events/{id}/actors     # Get all actors in event
POST   /api/events/{id}/actors     # Add actor to event
DELETE /api/events/{id}/actors/{actorId} # Remove actor from event
```

#### Actor Management
```
GET    /api/actors                 # List all actors (with filtering)
POST   /api/actors                 # Create new actor
GET    /api/actors/{id}            # Get actor profile
PUT    /api/actors/{id}            # Update actor profile
DELETE /api/actors/{id}            # Delete actor
GET    /api/actors/{id}/events     # Get all events for actor
GET    /api/actors/{id}/timeline   # Get actor's personal timeline
GET    /api/actors/{id}/relationships # Get actor relationships
POST   /api/actors/{id}/relationships # Create relationship
PUT    /api/actors/{id}/relationships/{relId} # Update relationship
```

#### Temporal Queries
```
GET    /api/events/range           # Get events in date range
GET    /api/events/search          # Full-text search with temporal filters
GET    /api/periods/{id}/events    # Get events within period
GET    /api/categories/{id}/events # Get categorized events
GET    /api/actors/{id}/events/range # Get actor events in date range
GET    /api/actors/search          # Search actors by name, type, attributes
GET    /api/events/participants    # Get events by actor participation
GET    /api/relationships/network  # Get relationship network data
```

### GraphQL Schema (Alternative)
```graphql
type Timeline {
  id: ID!
  title: String!
  periods: [Period!]!
  events(filter: EventFilter): [Event!]!
  categories: [Category!]!
  actors(filter: ActorFilter): [Actor!]!
}

type Event {
  id: ID!
  title: String!
  startTime: DateTime!
  endTime: DateTime
  stories: [Story!]!
  children: [Event!]!
  parent: Event
  actors: [EventActor!]!
}

type Actor {
  id: ID!
  name: String!
  type: ActorType!
  profile: ActorProfile!
  birth: DateTime
  death: DateTime
  events: [Event!]!
  stories: [Story!]!
  relationships: [ActorRelationship!]!
  timeline: [Event!]! # chronological events for this actor
}

type EventActor {
  actor: Actor!
  role: ActorRole!
  significance: ParticipationLevel!
  description: String
}

type Query {
  timeline(id: ID!): Timeline
  actor(id: ID!): Actor
  actorsInEvent(eventId: ID!): [EventActor!]!
  eventsForActor(actorId: ID!): [Event!]!
  eventsInRange(start: DateTime!, end: DateTime!): [Event!]!
  actorRelationships(actorId: ID!): [ActorRelationship!]!
  searchEvents(query: String!, temporal: Boolean): [Event!]!
  searchActors(query: String!, type: ActorType): [Actor!]!
}

type Mutation {
  createActor(input: CreateActorInput!): Actor!
  updateActor(id: ID!, input: UpdateActorInput!): Actor!
  addActorToEvent(eventId: ID!, actorId: ID!, role: ActorRole!): EventActor!
  createRelationship(input: CreateRelationshipInput!): ActorRelationship!
}
```

### WebSocket Events
```javascript
// Real-time collaboration
socket.on('timeline:updated', (data) => {})
socket.on('event:created', (event) => {})
socket.on('event:updated', (event) => {})
socket.on('actor:created', (actor) => {})
socket.on('actor:updated', (actor) => {})
socket.on('relationship:created', (relationship) => {})
socket.on('user:joined', (user) => {})

// Actor-specific events
socket.on('actor:timeline:updated', (actorId, events) => {})
socket.on('event:actor:added', (eventId, actor) => {})
socket.on('event:actor:removed', (eventId, actorId) => {})
```

## Deployment Strategy

### Environment Architecture

#### Development Environment
```yaml
services:
  web:
    image: time-traveler:dev
    ports: ["3000:3000"]
  api:
    image: time-traveler-api:dev
    ports: ["3001:3001"]
  database:
    image: neo4j:latest
    ports: ["7687:7687", "7474:7474"]
  redis:
    image: redis:alpine
    ports: ["6379:6379"]
```

#### Production Environment
```yaml
# Docker Compose for production
version: '3.8'
services:
  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
  
  app:
    image: time-traveler:prod
    replicas: 3
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
  
  database:
    image: neo4j:enterprise
    volumes:
      - neo4j_data:/data
    environment:
      - NEO4J_AUTH=neo4j/${NEO4J_PASSWORD}
```

### Scaling Considerations

#### Horizontal Scaling
- **Load Balancing**: Nginx with multiple app instances
- **Database Clustering**: Neo4j cluster for high availability
- **CDN Integration**: Static asset distribution
- **Microservices**: Split timeline, event, and story services

#### Performance Optimization
- **Caching Strategy**: Redis for timeline data and user sessions
- **Database Indexing**: Optimize temporal and spatial queries
- **Lazy Loading**: Progressive timeline rendering
- **Compression**: Gzip/Brotli for API responses

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy Time Traveler
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: npm test
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: docker-compose up -d
```

## Use Cases & Applications

### 1. Criminal Investigation
**Scenario**: Detective tracking suspect movements
- **Timeline Creation**: Import evidence data automatically
- **Event Correlation**: Link events across multiple timelines
- **Pattern Recognition**: Identify temporal anomalies
- **Report Generation**: Export findings with evidence links

### 2. Historical Research
**Scenario**: Academic studying medieval period
- **Period Definition**: Create hierarchical time periods
- **Source Integration**: Link primary source documents
- **Cross-referencing**: Connect events across regions
- **Collaboration**: Share timelines with research team

### 3. Educational Curriculum
**Scenario**: Teacher creating interactive history lesson
- **Learning Objectives**: Define educational goals per period
- **Multimedia Integration**: Add videos, images, documents
- **Student Interaction**: Enable timeline exploration
- **Assessment Tools**: Track student engagement

### 4. Journalistic Investigation
**Scenario**: Reporter investigating corporate scandal
- **Data Import**: Process leaked documents and emails
- **Timeline Reconstruction**: Piece together event sequence
- **Actor Mapping**: Identify key players and their roles
- **Relationship Analysis**: Map connections between executives, regulators, and whistleblowers
- **Source Protection**: Manage sensitive information
- **Publication**: Export timeline for article integration

### 5. Animal Biography Documentation
**Scenario**: Documenting the life of Seabiscuit, the famous racehorse
- **Actor Profile Creation**: Create detailed profile for Seabiscuit
- **Career Timeline**: Document racing career, major victories, defeats
- **Relationship Mapping**: Connect with trainers, jockeys, owners, rival horses
- **Event Participation**: Link to specific races, training sessions, public appearances
- **Legacy Documentation**: Connect to cultural impact and modern references

### 6. Mythological Storytelling
**Scenario**: Creating interactive timeline of Greek mythology
- **Divine Actor Profiles**: Create profiles for gods, goddesses, heroes
- **Relationship Networks**: Map complex family trees and alliances
- **Mythical Events**: Document battles, quests, transformations
- **Cross-Cultural References**: Connect similar stories across cultures
- **Educational Integration**: Create learning paths through mythological narratives

## Development Guidelines

### Code Organization
```
src/
├── components/           # Reusable UI components
│   ├── Timeline/
│   ├── Event/
│   ├── Actor/           # NEW: Actor-related components
│   │   ├── ActorProfile.js
│   │   ├── ActorTimeline.js
│   │   ├── RelationshipNetwork.js
│   │   └── ActorParticipation.js
│   └── Showcase/
├── services/            # Business logic and API calls
│   ├── TimelineService.js
│   ├── EventService.js
│   ├── ActorService.js  # NEW: Actor management
│   ├── RelationshipService.js # NEW: Relationship management
│   └── StoryService.js
├── stores/              # State management
│   ├── timelineStore.js
│   ├── actorStore.js    # NEW: Actor state management
│   └── userStore.js
├── utils/               # Helper functions
│   ├── timeUtils.js
│   ├── actorUtils.js    # NEW: Actor-related utilities
│   └── visualization.js
└── types/               # TypeScript definitions
    ├── index.ts
    └── actor.ts         # NEW: Actor type definitions
```

### Testing Strategy
- **Unit Tests**: Component and service testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: User workflow testing
- **Performance Tests**: Timeline rendering benchmarks

### Documentation Standards
- **Code Comments**: Temporal logic explanation required
- **API Documentation**: OpenAPI/Swagger specifications
- **User Documentation**: Interactive help system
- **Developer Guides**: Setup and contribution guidelines

### Security Considerations
- **Authentication**: JWT-based user authentication
- **Authorization**: Role-based timeline access
- **Data Privacy**: GDPR compliance for personal historical data
- **Input Validation**: Prevent temporal paradoxes in data entry
- **Audit Trails**: Track all timeline modifications

## Human/Actor Dimension Integration

The Actor dimension represents a fundamental expansion of the Time Traveler system, adding a biographical and relational layer to temporal storytelling. This dimension enables the system to track not just *what* happened and *when*, but also *who* was involved and *how* they were connected.

### Core Concepts

#### Actor Types & Scope
The system supports diverse actor types to accommodate various storytelling contexts:
- **Human**: Historical figures, family members, professionals, witnesses
- **Animal**: Pets, working animals, wildlife, racing animals, performing animals
- **Mythological**: Gods, goddesses, legendary creatures, folkloric beings
- **Fictional**: Literary characters, cultural icons, archetypal figures
- **Organization**: Companies, institutions, governments, societies
- **Divine**: Religious figures, spiritual entities, deified persons
- **Artifact**: Significant objects with biographical importance (ships, buildings, artworks)

#### Multi-Dimensional Navigation
The Actor dimension creates three primary navigation paradigms:

1. **Temporal-First**: Traditional timeline view with actor participation visible within events
2. **Actor-First**: Biography-centered view showing an individual's life journey
3. **Relationship-First**: Network view emphasizing connections between actors across time

#### Cross-Dimensional Queries
The system enables sophisticated queries that span temporal and actor dimensions:
- "Show all events where Napoleon and Wellington were both participants"
- "Display the life timeline of Secretariat with racing victories highlighted"
- "Map the relationship network of Greek gods during the Trojan War period"
- "Find all interactions between Einstein and Bohr between 1920-1930"

### Implementation Considerations

#### Database Design
The actor dimension requires careful consideration of:
- **Graph Relationships**: Actor-to-actor relationships with temporal validity
- **Participation Records**: Detailed records of how actors participated in events
- **Biographical Data**: Rich profile information with multimedia support
- **Relationship Evolution**: How connections between actors changed over time

#### Performance Optimization
- **Actor Indexing**: Efficient querying of actors by name, type, and attributes
- **Relationship Caching**: Fast retrieval of actor networks and connections
- **Timeline Materialization**: Pre-computed actor timelines for common queries
- **Faceted Search**: Multi-dimensional filtering by time, actor, and event characteristics

#### User Experience Implications
- **Progressive Disclosure**: Reveal actor information contextually based on current view
- **Visual Differentiation**: Clear visual indicators for different actor types
- **Relationship Visualization**: Intuitive graph representations of actor connections
- **Context Switching**: Seamless transitions between temporal and biographical views

*This actor dimension transforms Time Traveler from a pure temporal system into a rich, multi-dimensional platform for biographical and relational storytelling, suitable for everything from family histories to complex historical analyses.*

---

*This documentation serves as the foundation for the Time Traveler temporal management system. For specific implementation details, refer to the individual component documentation and API specifications.*
