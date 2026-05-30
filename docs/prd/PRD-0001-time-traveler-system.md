# Time Traveler: Product Requirements Document

**Version 1.0** | March 2026  
**Status:** MVP Specification  
**Target Audience:** Developers, Technical Reference

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [System Capabilities & Features](#2-system-capabilities--features)
3. [User Stories & Workflows](#3-user-stories--workflows)
4. [Functional Requirements](#4-functional-requirements)
5. [Technical Architecture](#5-technical-architecture)
6. [Hybrid Temporal System](#6-hybrid-temporal-system)
7. [User Interface Requirements](#7-user-interface-requirements)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [API Design](#9-api-design)
10. [Domain Glossary](#10-domain-glossary)
11. [Success Criteria & Metrics](#11-success-criteria--metrics)
12. [Appendices](#12-appendices)

---

## 1. Product Overview

### 1.1 Vision

Time Traveler is a temporal content management system for storing, visualizing, and interacting with historical events and narratives across the full span of time—from the Big Bang (13.8 billion years ago) through the present and into the speculative future.

The long-term vision is to create a global repository of human historical knowledge: a comprehensive, collaborative platform for event recording and storytelling that becomes a browsable, beautiful graphical view of time and history. The system gives researchers and the curious insight into the events that have shaped our lives through cause and effect, revealing patterns and connections across vast temporal scales.

### 1.2 Core Purpose

Time Traveler serves multiple interconnected purposes:

- **Historical Documentation**: Comprehensive recording of events from cosmological origins to modern day
- **Narrative Development**: Tools for constructing rich, multi-layered stories across time
- **Hypothesis Formation**: Exploring cause-and-effect relationships and historical patterns
- **Research & Investigation**: Correlating events, tracking relationships, identifying temporal patterns
- **Education**: Interactive temporal navigation for immersive learning experiences
- **Collaborative Knowledge Building**: Community-driven historical content creation and curation

### 1.3 Key Innovations

Time Traveler introduces several unique capabilities that distinguish it from conventional timeline tools:

**1. Fractal Time Navigation**

Events can contain nested sub-events, creating a multi-dimensional temporal hierarchy. Users zoom seamlessly from billion-year geological scales down to individual seconds, with each zoom level revealing appropriate detail. A period like "The Mesozoic Era" contains nested periods (Triassic, Jurassic, Cretaceous), which contain geological stages, which contain specific extinction or speciation events.

**2. Hybrid Temporal System**

Structured JSONB date representation extends beyond SQL date type limitations to support prehistoric, geological, and cosmological dates with precision metadata, uncertainty ranges, and scientific dating context. The system handles everything from "13.8 billion years ago" to "March 15, 44 BCE at 2:30 PM" with equal facility.

**3. Multi-Dimensional Character System**

Seven character types (Human, Animal, Mythological, Fictional, Organization, Divine, Artifact) with temporally-scoped relationships and event participation tracking. Characters are not just names—they're entities with lifespans, relationships, and roles in events that evolve over time.

**4. Narrative Development Through Events**

Events are not isolated data points—they're narrative building blocks. The story system layers narrative structure over historical events, enabling multiple perspectives, different tellings, and hypothesis exploration. The same event can appear in different stories with different interpretations.

**5. Hypothesis Formation & Pattern Recognition**

By correlating events across time, tracking character relationships, and visualizing temporal patterns, the system supports historical research and investigative journalism. Users can ask questions like "What events connect these three people?" or "What happened in the decade before this transformation?"

### 1.4 Target Users & Use Cases

Time Traveler is designed to serve diverse user communities, each with specialized needs:

#### 1.4.1 Geological & Cosmological Researchers

**Use Case**: A paleontologist creates a Mesozoic Era timeline (252–66 MYA) with logarithmic scale for overview and linear scale when zoomed to a specific stage. Characters represent species, with temporal birth/death marking emergence/extinction dates. Relationships track evolutionary lineages. Events document geological phenomena, impact events, and climate shifts.

**Key Features**: Prehistoric temporal support, uncertainty ranges, geological period metadata, species as characters, logarithmic visualization.

#### 1.4.2 Criminal & Investigative Journalists

**Use Case**: An investigator builds a private timeline with CE exact dates and spatial data for geographic correlation. Characters include suspects, witnesses, victims, executives, regulators, and whistleblowers. The relationship network reveals connections between seemingly unrelated individuals. Comparative view shows parallel movements and synchronized activities.

**Key Features**: Private timelines, precise modern dates with time-of-day, spatial data, character relationships, bulk import, selective sharing via collaborators.

#### 1.4.3 Mythological & Cultural Storytellers

**Use Case**: A writer creates a Greek mythology timeline spanning from cosmological origins to the Trojan War (c. 1200 BCE). Characters include mythological figures and divine entities. Relationships track family lines (Zeus → Heracles), rivalries (Athena vs. Poseidon), and worship patterns. Fractal nesting organizes myths within narrative arcs (Labors of Heracles as nested events within the Heroic Age).

**Key Features**: Mythological and divine character types, relationship tracking, nested story arcs, mixing historical and mythological precision levels.

#### 1.4.4 Biographers & Biographical Researchers

**Use Case**: A researcher documents Seabiscuit's life as an animal biography. Character type is `animal`, species `horse`, breed `Thoroughbred`, birth 1933 CE, death 1947 CE. Events include races, appearances, injuries, and career milestones. Relationships connect trainers, jockeys, owners, and rival horses. Character-centric view presents the complete life timeline.

**Key Features**: Animal character type with species/breed fields, character-centric timeline views, relationship tracking, biographical narrative support.

#### 1.4.5 Historical Educators & Students

**Use Case**: A history teacher creates curriculum timelines for different historical periods. Students explore events, drill down into detail, and discover connections between seemingly unrelated events. Fractal navigation allows starting at a high-level overview ("World War II") and zooming into specific battles, political decisions, and personal stories.

**Key Features**: Hierarchical period organization, fractal navigation, rich media support, multiple narrative perspectives, curated content library.

#### 1.4.6 Personal Historians & Genealogists

**Use Case**: A family historian documents multiple generations with birth, marriage, death, and life events. Character relationships track family trees. Events range from personal milestones to historical events that affected the family. Stories capture oral histories and family narratives.

**Key Features**: Human character type, family relationship tracking, photo/document attachment, private timelines, narrative layering.

#### 1.4.7 Science Fiction & Speculative Writers

**Use Case**: A writer creates speculative future timelines exploring alternate histories or future scenarios. Events extend beyond the present into hypothetical futures. Precision levels support speculative dates ("circa 2150 CE"). Fictional characters interact with historical figures in alternate timeline scenarios.

**Key Features**: Future date support, fictional character type, multiple timeline comparison, speculative precision levels.

### 1.5 Success Metrics

Time Traveler's success will be measured by:

**Content Metrics:**

- Depth and breadth of curated historical content
- Number of user-contributed timelines and events
- Coverage across temporal scales (cosmological → modern)
- Quality and accuracy of temporal data

**User Engagement:**

- Active content creators (storytellers, researchers, educators)
- Time spent exploring and navigating timelines
- Cross-linking between events, characters, and narratives
- Community contributions to shared knowledge base

**Technical Performance:**

- Page load times consistently under 2 seconds
- Query performance for complex temporal range searches
- Smooth visualization and navigation across vast time scales
- System uptime and reliability

**Platform Growth:**

- Transition from solo passion project to collaborative platform
- User adoption across diverse use cases
- Integration with external historical databases and APIs
- Mobile application reach

### 1.6 Long-Term Roadmap

While Time Traveler is developed as a passion project without fixed timelines, the long-term roadmap includes:

**Collaborative Features:**

- Real-time collaborative editing (multiple users editing same timeline simultaneously)
- Comment threads on events and timelines
- Review and approval workflows for contributed content
- Version history and change tracking

**Mobile Applications:**

- Native iOS and Android apps
- Touch-optimized timeline navigation
- Offline access to downloaded timelines
- Mobile-friendly temporal input

**Advanced Visualization:**

- 3D timeline views with spatial dimensions
- Network graphs of character relationships over time
- Heat maps showing temporal density of events
- Animated timeline playback

**Data Integration:**

- Import from Wikipedia, historical databases
- Export to academic formats (BibTeX, citation managers)
- Public API for third-party integrations
- Bulk import from structured data sources

**Enhanced Analytics:**

- Pattern detection across timelines
- Statistical analysis of temporal distributions
- Correlation discovery between character interactions and events
- Visualization of causal chains

---

## 2. System Capabilities & Features

This section provides a high-level overview of Time Traveler's capabilities, organized by user role. Detailed functional specifications for each capability are provided in Section 4.

### 2.1 Admin/Creator Capabilities

These features are available to users with Editor or Admin roles who create and manage temporal content.

#### 2.1.1 Timeline Management

Create, edit, delete, and publish timelines. Timelines are the top-level organizational structure containing events and periods. Users can set timeline type (general, biographical, comparative), define temporal scope (start/end dates), assign subject characters for biographical timelines, and control visibility (private, public, shared).

Publishing workflow allows timelines to exist in draft state before being made publicly visible. Unpublishing removes content from public view without deletion.

#### 2.1.2 Event Management

Full CRUD operations for events with rich temporal data input. Events support:

- Hybrid temporal data (Big Bang to present)
- Nested sub-events for fractal navigation
- Event types (milestone, period, incident, discovery, creation, destruction, transformation, migration, conflict, ceremony)
- Importance ratings (1-10 scale)
- Location data (free-text and structured spatial coordinates)
- Parent-child relationships for hierarchical event organization

Events can exist independently or be associated with one or more timelines.

#### 2.1.3 Period Management

Define and manage historical periods with start and end temporal data. Periods support:

- Hierarchical organization (periods within periods)
- Significance levels (low, medium, high, critical)
- Characteristic tags describing the period
- Association with multiple timelines
- Geological and cosmological period metadata

Examples: "Mesozoic Era" containing "Triassic", "Jurassic", "Cretaceous" periods; "Industrial Revolution" containing "First Industrial Revolution", "Second Industrial Revolution" sub-periods.

#### 2.1.4 Character Management

Create and manage characters across seven types: Human, Animal, Mythological, Fictional, Organization, Divine, Artifact. Each character includes:

- Biographical information
- Birth and death temporal data
- Aliases and alternative names
- Cultural context
- Type-specific fields (species/breed for animals, domain for divine entities)
- Physical descriptions
- Significance levels

Characters serve as connective tissue across events, enabling biographical timelines and relationship networks.

#### 2.1.5 Character Relationships

Define and manage relationships between characters with temporal scope. Relationship types include:

- Family (parent, sibling, spouse, etc.)
- Professional (colleague, employer, employee)
- Friendship and rivalry
- Ownership (owner-pet, trainer-trainee)
- Creative (creator-creation)
- Religious (worship, devotion)
- Adversarial (enemy, opponent)
- Mentorship (mentor-student)

Relationships can have start and end temporal data, allowing tracking of how relationships evolve over time. Relationship networks visualize connections between characters across temporal spans.

#### 2.1.6 Story Management

Create narrative structures layered over historical events. Stories provide:

- Narrative perspective (first-person, third-person, omniscient)
- Perspective character assignment
- Story-specific character roles (protagonist, supporting, mentioned, narrator)
- Association with events and periods
- Sub-titles and detailed narrative content
- Tagging for categorization

Stories enable multiple tellings of the same events, different interpretations, and hypothesis exploration. A single event can appear in multiple stories with different narrative contexts.

#### 2.1.7 Category Management

Hierarchical categorization system for organizing content. Categories support:

- Nested hierarchy (categories within categories)
- Color coding for visual distinction
- Icon assignment for quick recognition
- Multiple category assignment per event
- Description and metadata

Examples: "War" → "World Wars" → "World War II"; "Science" → "Physics" → "Quantum Mechanics".

#### 2.1.8 Media Management

Hybrid media handling with two storage approaches:

**Supabase Storage (small files only):**

- User avatars and profile images
- Small event images (thumbnails, diagrams)
- Size limit: 5MB per file
- Stored in public Supabase Storage buckets

**External URL embedding (preferred for large media):**

- YouTube/Vimeo video embeds
- Audio from SoundCloud, Spotify, etc.
- Images from CDNs (Imgur, Cloudinary, etc.)
- Documents from Google Drive, Dropbox, etc.
- System renders embeds inline with proper aspect ratios

Media can be associated with events, characters, and timelines. Sort ordering controls display sequence for multiple media items.

#### 2.1.9 Bulk Import/Export

**Import capabilities:**

- CSV and JSON event import via Edge Function
- Temporal data validation during import
- Error reporting with row-level detail
- Batch processing for large datasets
- Support for events, characters, categories in structured formats

**Export capabilities:**

- Timeline export to PDF (formatted report)
- JSON export (structured data for backup or migration)
- Embeddable HTML snippets for external websites
- CSV export for analysis in spreadsheet tools

#### 2.1.10 Access Control & Permissions

Role-based permission system with three levels:

**Admins (highest system authority):**

- Full access to all system content and settings
- User management capabilities
- System configuration
- Curated content library management

**Editors (creator accounts):**

- Create and manage their own timelines, events, periods, characters, stories, categories, and media
- Control visibility of their own content (private, public, shared)
- Invite viewers to their private content
- Cannot access or modify other users' content

**Viewers (invited users):**

- Read-only access to specific private/unpublished content they've been invited to
- Cannot create or modify content
- Can browse and explore shared content within their access scope

Row Level Security (RLS) policies enforce these permissions at the database level, ensuring security regardless of API access path.

#### 2.1.11 Publishing Workflow

Content exists in two states:

**Unpublished (draft):**

- Visible only to the content owner and invited viewers
- Can be edited freely
- Not included in public search or browse
- Suitable for work-in-progress content

**Published:**

- Visible to all users (public browsing)
- Timestamp recorded at publish time
- Can be unpublished (returns to private state)
- Included in public search and discovery

Publishing is granular per entity—timelines, events, characters, periods, and stories each have independent published flags.

#### 2.1.12 Content Versioning

Track changes to content over time:

- Edit history showing what changed and when
- Updated timestamps on all entities
- Audit trail for collaborative content
- Ability to see who made changes (in shared timelines)

Note: Full version control with rollback is a future enhancement. Initial implementation tracks timestamps and update metadata only.

### 2.2 Public/Reader Capabilities

These features are available to all users, including anonymous visitors browsing published content.

#### 2.2.1 Master Timeline Browsing

The primary entry point for public users. The master timeline presents:

- Horizontal infinite scroll through history
- Pre-filtered timelines showing major historical trends
- Temporal positioning based on logarithmic or linear scale
- Visual indicators of timeline density (eras with many events vs. sparse eras)
- Click-through to drill into specific timelines

Filtering is based on timeline significance and importance ratings set by admins, ensuring the master view shows the most impactful historical narratives.

#### 2.2.2 Fractal Navigation

Seamless zoom in and out across temporal scales:

- Start at billion-year overview (Big Bang to present)
- Zoom into million-year periods (geological eras)
- Zoom into thousand-year periods (ancient civilizations)
- Zoom into century-level detail (modern history)
- Zoom into individual events (battles, inventions, births)
- Zoom into sub-events (phases of a battle, steps in an invention)

Each zoom level reveals appropriate detail. Fractal navigation preserves context—users always know where they are in the broader temporal structure.

#### 2.2.3 Timeline Visualization

Rich visual representation of temporal data:

**Logarithmic scale (default for long timescales):**

- Each order of magnitude gets equal visual space
- Prevents prehistoric events from crushing to the left edge
- Smooth transitions when zooming

**Linear scale (optional toggle):**

- Traditional proportional time representation
- Better for timelines spanning similar orders of magnitude
- User preference persists across sessions

**Visual elements:**

- Events rendered as points or spans on the timeline
- Periods shown as colored bands
- Character participation indicated with avatars or icons
- Uncertainty ranges displayed as visual error bars
- Importance affects size/prominence of event markers

#### 2.2.4 Event Detail Views

Clicking an event opens a detailed view showing:

- Full temporal information with formatted display
- Event type, importance, location
- Complete description and narrative detail
- Associated characters with roles and significance
- Related media (images, videos, embeds)
- Categories and tags
- Parent event context (if nested)
- Child events (if fractal parent)
- Links to related timelines
- Stories that reference this event

Rich typography and layout ensure readability and visual appeal.

#### 2.2.5 Character-Centric Views

Alternative navigation paradigm centered on characters:

**Character profile page:**

- Biographical information
- Birth and death temporal data
- Physical description and cultural context
- Profile image or avatar

**Character timeline:**

- All events this character participated in, chronologically ordered
- Role and significance in each event
- Visual journey through character's life or existence
- Filtering by role type (protagonist, witness, etc.)

**Relationship network:**

- Graph visualization of character's relationships
- Temporal scope of relationships shown
- Connections to other characters
- Ability to explore connected characters (network traversal)

#### 2.2.6 Period Exploration

Browse history by defined periods:

- Hierarchical period browser (drill down from eras to epochs)
- Events filtered by period membership
- Period characteristics and descriptions
- Nested periods shown with visual indentation
- Significance indicators

Enables exploration patterns like "Show me all events in the Mesozoic Era" or "What happened during the Renaissance?"

#### 2.2.7 Story Reading

Narrative views of events with interpretive context:

- Story list and discovery
- Story detail pages with full narrative
- Associated events shown in story context
- Character roles within the story
- Perspective and narrator type indicators
- Multiple stories about the same events (comparative reading)

Stories transform raw historical data into compelling narratives, supporting different interpretations and tellings.

#### 2.2.8 Search and Filtering

Comprehensive search and filter capabilities:

**Full-text search (post-MVP):**

- Search across events, characters, stories, timelines
- PostgreSQL full-text search with ranking
- Search results with context snippets
- Faceted filtering (refine by type, era, category)

**Temporal range filtering:**

- "Show events between [start] and [end]"
- Temporal input components for defining ranges
- Supports all eras and precision levels
- Inclusive/exclusive boundary options

**Category filtering:**

- Filter by one or more categories
- Hierarchical category selection
- Combined with temporal filters

**Character filtering:**

- "Show events involving this character"
- Filter by character role or significance
- Multiple character intersection (events with all selected characters)

#### 2.2.9 Temporal Comparison

Multi-timeline view for comparative analysis:

- Display 2-4 timelines in parallel
- Aligned by temporal position
- Shared events highlighted
- Visual connections between related events across timelines
- Synchronized scrolling and zooming

Use cases: Comparing parallel developments (computing history vs. electrical science), biographical comparisons (two leaders' lives), cause-and-effect across domains.

#### 2.2.10 Real-Time Updates

Supabase Realtime integration for live updates:

**Live content updates:**

- New published events appear without page refresh
- Edited events update in real-time
- Deleted events remove from view

**Presence indicators (for shared timelines):**

- Show which other users are viewing the same timeline
- Avatar indicators for active viewers
- Last-seen timestamps

**Broadcast channels:**

- Real-time notifications for timeline updates
- Collaborative awareness (who's editing what)

Note: Real-time collaborative editing (multiple users editing simultaneously) is a future enhancement. Initial implementation provides awareness and live content updates only.

### 2.3 System-Level Capabilities

#### 2.3.1 Curated Content Library

A reference collection of approximately 100 pre-curated historical events covering major milestones across all of human history and cosmological/geological time. This is not a system feature but a content bootstrap:

**Purpose:**

- Provides high-quality reference implementation of temporal data
- Demonstrates proper use of precision levels, uncertainty, geological metadata
- Offers users a starting point for their own timelines
- Can be used as teaching examples

**Organization:**

- Organized into compelling narrative timelines (e.g., "History of Computing", "Big Bang to Present", "History of Aviation")
- Each event includes complete temporal metadata
- Characters, relationships, and stories interconnect events
- Proper categorization and tagging

**Import mechanism:**

- Users can selectively import events, timelines, characters from the library
- Optional—users start with empty databases and choose what to import
- Import preserves all relationships and metadata
- Users can modify imported content after import

This content is maintained separately and updated periodically by admins.

#### 2.3.2 Authentication & User Management

User account system via Supabase Auth:

**Account creation:**

- Email/password registration
- Magic link authentication (passwordless)
- OAuth providers (Google, GitHub, etc.)

**User profiles:**

- Profile information (name, username, bio)
- Avatar image (uploaded to Supabase Storage)
- Social links
- Public profile pages showing user's published timelines

**Anonymous browsing:**

- Public content accessible without account
- No authentication required for read-only access
- Account required only for content creation

**Role assignment:**

- Default role: Editor (can create and manage own content)
- Admin role assigned manually by system administrators
- Viewer role granted via invitation to private content

#### 2.3.3 Spatial Data Support

Geographic coordinates and location metadata for events:

**Free-text location:**

- Human-readable location strings (e.g., "Rome, Italy", "Pacific Ocean")
- No validation or geocoding required
- Supports historical place names that no longer exist

**Structured spatial data (JSONB):**

- Latitude/longitude coordinates
- Bounding boxes for large areas
- Elevation data
- Spatial precision indicators

**Future enhancements:**

- Map visualization of events
- Geographic filtering ("events near this location")
- Spatial-temporal queries ("what happened here during this period")
- Geocoding service integration (Edge Function to convert text → coordinates)

---

## 3. User Stories & Workflows

This section provides concrete user journeys through the Time Traveler system, organized by persona and use case.

### 3.1 Personas

#### 3.1.1 The Historian (Editor/Creator)

**Profile:** Academic or amateur historian creating detailed historical timelines

**Goals:**

- Create accurate, well-researched timelines
- Document sources and maintain quality standards
- Share knowledge with students and the public

**Pain points:** Current tools don't handle prehistoric dates, lack proper temporal precision, or force all content into rigid structures

**Example:** Dr. Sarah Chen, university history professor creating curriculum timelines

#### 3.1.2 The Storyteller (Editor/Creator)

**Profile:** Writer or creative professional exploring narratives through time

**Goals:**

- Build compelling story arcs across events
- Track character relationships and development
- Present multiple perspectives on historical events

**Pain points:** Timeline tools are too dry and factual, don't support narrative layering

**Example:** James Rodriguez, historical fiction author researching Renaissance Florence

#### 3.1.3 The Genealogist (Editor/Creator)

**Profile:** Family historian tracking ancestry and personal history

**Goals:**

- Document family tree with life events
- Preserve family stories and memories
- Share private timelines with relatives

**Pain points:** Genealogy tools focus on trees, not timelines; can't integrate historical context

**Example:** Maria Santos, researching her family's migration from Portugal in the 1800s

#### 3.1.4 The Scientist (Editor/Creator)

**Profile:** Researcher working with geological, paleontological, or cosmological timescales

**Goals:**

- Create accurate timelines spanning millions/billions of years
- Document uncertainty and dating methods
- Visualize temporal relationships between events

**Pain points:** No tools support BYA/MYA dates, let alone with proper metadata and uncertainty

**Example:** Dr. Alan Park, paleontologist documenting Mesozoic Era extinctions

#### 3.1.5 The Student (Viewer/Reader)

**Profile:** High school or college student exploring historical content

**Goals:**

- Understand historical events in temporal context
- Explore timelines created by educators
- See relationships between events across different regions

**Pain points:** Textbooks present isolated facts, hard to see big picture and connections

**Example:** Emma Thompson, AP History student studying World War II

#### 3.1.6 The Curious Reader (Viewer/Reader)

**Profile:** General public interested in history and exploration

**Goals:**

- Browse interesting historical timelines
- Learn about events they didn't know about
- Understand how events connect and influence each other

**Pain points:** Wikipedia is overwhelming, lacks visual temporal context

**Example:** Michael Lee, software engineer with casual interest in computing history

### 3.2 Core User Journeys

#### 3.2.1 Journey: Create First Timeline (The Historian)

**Actor:** Dr. Sarah Chen (new user, historian)

**Goal:** Create a timeline about the Space Race for her university course

**Pre-conditions:** User has registered and logged in

**Steps:**

1. **Arrive at dashboard**
   - Sees empty state: "Welcome to Time Traveler"
   - Primary action: "Create Your First Timeline"
   - Secondary action: "Explore Curated Content"

2. **Click "Create Your First Timeline"**
   - Modal/form appears with timeline creation fields
   - Fills in:
     - Title: "The Space Race: 1955-1975"
     - Summary: "Competition between USA and USSR for spaceflight supremacy"
     - Timeline type: General
     - Start date: 1955 CE
     - End date: 1975 CE

3. **Submit timeline creation**
   - Timeline saved successfully
   - Redirected to timeline detail page
   - Sees empty timeline with temporal axis (1955-1975)
   - Primary action: "Add Your First Event"

4. **Click "Add Your First Event"**
   - Event creation form appears
   - Fills in:
     - Title: "Sputnik 1 Launch"
     - Date: October 4, 1957 CE (using TemporalInput component)
     - Event type: Milestone
     - Importance: 9
     - Location: Baikonur Cosmodrome, Kazakhstan
     - Summary: "First artificial satellite successfully placed in orbit"

5. **Submit event creation**
   - Event appears on timeline at correct position (1957)
   - Marker sized appropriately (importance 9 = large)
   - Tooltip shows summary on hover

6. **Add more events**
   - Repeats step 4-5 for additional events:
     - Gagarin's flight (1961)
     - Apollo 11 Moon landing (1969)
     - Apollo-Soyuz joint mission (1975)

7. **Publish timeline**
   - Clicks "Publish" button in timeline header
   - Confirmation dialog: "Make this timeline public?"
   - Confirms
   - Timeline now visible in master timeline view

**Success criteria:**

- Timeline created with appropriate temporal scope
- Multiple events added and positioned correctly
- Timeline published and discoverable by other users

**Alternative flows:**

- User imports curated content instead of creating from scratch
- User abandons creation (draft saved automatically)

---

#### 3.2.2 Journey: Import Curated Content (The Student)

**Actor:** Emma Thompson (student exploring platform)

**Goal:** Import a curated World War II timeline to study for exam

**Pre-conditions:** User has registered and logged in

**Steps:**

1. **Navigate to "Import from Library"**
   - Clicks "Explore Curated Content" from dashboard
   - Sees list of ~15 curated timelines

2. **Browse curated timelines**
   - Scrolls through list
   - Sees "Major Wars and Conflicts" timeline
   - Clicks to preview

3. **Preview timeline**
   - Sees timeline visualization with events
   - Event list shows: WWI, WWII, Korean War, Vietnam War, etc.
   - Decides WWII events are relevant

4. **Select specific events to import**
   - Expands "World War II" section
   - Sees sub-events: Pearl Harbor, D-Day, Battle of Stalingrad, etc.
   - Checks boxes for:
     - Pearl Harbor Attack (Dec 7, 1941)
     - D-Day Invasion (June 6, 1944)
     - Atomic bombings (Aug 1945)
     - VE Day, VJ Day

5. **Choose import mode**
   - Selects "Import and customize" (editable copies)
   - Option to create new timeline or add to existing
   - Chooses "Create new timeline: WWII Study Guide"

6. **Complete import**
   - Clicks "Import Selected Events"
   - Progress indicator shows import
   - Success message: "4 events imported"
   - Redirected to new timeline

7. **Customize imported content**
   - Reviews events
   - Adds personal notes to event details
   - Adds category tags: "Study for exam"
   - Keeps timeline private (for personal use)

**Success criteria:**

- User successfully imports subset of curated events
- Events copied to user's account (editable)
- User can customize without affecting library

**Alternative flows:**

- User imports entire timeline (not cherry-picked events)
- User chooses "as-is" mode (read-only reference)

---

#### 3.2.3 Journey: Create Character Biography Timeline (The Genealogist)

**Actor:** Maria Santos (family historian)

**Goal:** Document her grandfather's life journey from Portugal to Brazil

**Pre-conditions:** User is logged in

**Steps:**

1. **Create character: Grandfather**
   - Navigates to Characters section
   - Clicks "Add Character"
   - Fills in:
     - Name: "João Santos"
     - Character type: Human
     - Birth: 1920 CE, Porto, Portugal
     - Death: 2010 CE, São Paulo, Brazil
     - Biography: "Immigrated to Brazil in 1948..."

2. **Create biographical timeline**
   - Clicks "Create Timeline" from character profile
   - System pre-fills:
     - Title: "Life of João Santos"
     - Timeline type: Biographical
     - Subject character: João Santos
     - Temporal scope: 1920-2010 CE
   - User confirms

3. **Add life events**
   - Birth (1920, Porto)
   - Immigration to Brazil (1948)
   - Marriage (1950)
   - First child born (1952)
   - Career milestone: opened bakery (1965)
   - Retirement (1985)
   - Death (2010, São Paulo)

4. **Associate other family members**
   - Creates character: "Maria da Silva Santos" (wife)
   - Creates relationship: João → Maria (family: spouse, 1950-2010)
   - Associates Maria with marriage event and children's births

5. **Add media**
   - Uploads photos:
     - Immigration documents (1948)
     - Wedding photo (1950)
     - Bakery storefront (1965)
   - Attaches to corresponding events

6. **Add historical context**
   - Searches for "Portugal 1940s" events
   - Finds curated event: "Portuguese Estado Novo regime"
   - Adds to timeline for context (explains why family left)

7. **Share with family**
   - Sets visibility: Shared
   - Invites family members as viewers:
     - Sister: viewer role
     - Cousins: viewer role
   - Family members receive access immediately

8. **Keep private, don't publish**
   - Keeps timeline unpublished (family only)
   - Not visible in public master timeline

**Success criteria:**

- Character created with complete biographical data
- Life events chronologically ordered on timeline
- Family relationships documented
- Photos attached to events
- Shared privately with invited family members

**Alternative flows:**

- User publishes timeline (makes grandfather's story public)
- User creates multiple character timelines (ancestors)

---

#### 3.2.4 Journey: Build Geological Timeline with Uncertainty (The Scientist)

**Actor:** Dr. Alan Park (paleontologist)

**Goal:** Create a timeline of Mesozoic Era mass extinctions with proper scientific metadata

**Pre-conditions:** User is logged in

**Steps:**

1. **Create period: Mesozoic Era**
   - Navigates to Periods section
   - Creates period:
     - Title: "Mesozoic Era"
     - Start: 252 MYA
     - End: 66 MYA
     - Significance: Critical
     - Characteristics: ["Age of Dinosaurs", "Breakup of Pangaea", "Warm climate"]

2. **Create nested periods**
   - Creates child periods:
     - Triassic (252-201 MYA)
     - Jurassic (201-145 MYA)
     - Cretaceous (145-66 MYA)

3. **Create timeline for extinctions**
   - Title: "Mesozoic Mass Extinctions"
   - Type: General
   - Temporal scope: 252-66 MYA
   - Associates with Mesozoic Era period

4. **Add Permian-Triassic extinction event**
   - Uses TemporalInput component:
     - Year: 252
     - Era: MYA
     - Precision: Estimated
     - Uncertainty: ±0.5 MYA
     - Geological period: "Permian-Triassic boundary"
     - Dating method: "Radiometric (U-Pb)"
     - Confidence level: High
   - Summary: "Largest mass extinction, ~96% of marine species"
   - Importance: 10 (critical)

5. **Add Triassic-Jurassic extinction**
   - Year: 201 MYA
   - Uncertainty: ±1 MYA
   - Dating method: "Radiometric (Ar-Ar)"
   - Geological period: "Triassic-Jurassic boundary"

6. **Add K-Pg extinction (dinosaurs)**
   - Year: 66 MYA
   - Uncertainty: ±0.07 MYA
   - Dating method: "Radiometric (Ar-Ar on tektites)"
   - Confidence: High
   - Geological period: "Cretaceous-Paleogene boundary"
   - Add spatial data: Chicxulub crater location (21.3°N, 89.5°W)
   - Add detailed description with impact theory

7. **Create nested events (K-Pg)**
   - Parent event: "K-Pg Extinction Event"
   - Child events:
     - "Chicxulub Impact" (66.043 MYA, exact moment)
     - "Global wildfires" (66.043-66.042 MYA, hours after)
     - "Impact winter begins" (66.042 MYA)
     - "Mass die-off" (66.04-65.8 MYA, ~200,000 years)

8. **Visualization review**
   - Views timeline in logarithmic scale
   - All three extinction events visible despite wide temporal span
   - Uncertainty ranges shown as error bars
   - Nested K-Pg events visible when zoomed in

9. **Publish for academic community**
   - Publishes timeline
   - Shares on academic networks
   - Other researchers can reference and cite

**Success criteria:**

- Geological periods created with proper MYA dates
- Events include uncertainty ranges and dating methods
- Nested events show fractal detail
- Timeline visualizes correctly in logarithmic scale
- Published and shareable with research community

**Alternative flows:**

- User adds characters (species) involved in extinctions
- User creates story about extinction theories

---

#### 3.2.5 Journey: Discover and Explore Content (The Curious Reader)

**Actor:** Michael Lee (casual reader, anonymous user)

**Goal:** Browse historical computing timelines to learn about early computers

**Pre-conditions:** User arrives at public homepage (not logged in)

**Steps:**

1. **Land on master timeline homepage**
   - Sees horizontal infinite scroll timeline
   - Multiple timelines visible as tracks:
     - "Big Bang to Present"
     - "History of Computing"
     - "World Wars and Conflicts"
     - "Evolution of Life"
   - Timeline tracks filtered by importance (≥7 by default)

2. **Scroll through master timeline**
   - Horizontal scroll to explore time periods
   - Pans from Big Bang (13.8 BYA) toward present
   - Logarithmic scale shows all eras

3. **Notice "History of Computing" timeline**
   - Timeline highlighted (featured status)
   - Hover shows tooltip: "From Babbage to AI, 200 years of computational innovation"
   - Clicks timeline track

4. **Drill into "History of Computing" timeline**
   - Smooth zoom transition
   - Other timelines fade out
   - Computing timeline expands to full viewport
   - Breadcrumb appears: "Home > History of Computing"

5. **Browse events on timeline**
   - Sees events chronologically:
     - Babbage's Analytical Engine (1837)
     - First electronic computer ENIAC (1945)
     - Transistor invention (1947)
     - First microprocessor (1971)
     - Personal computer revolution (1975-1985)
     - World Wide Web (1989)
   - Hovers over events to read summaries in tooltips

6. **Click on "ENIAC Completion (1945)"**
   - Event detail page opens
   - Shows:
     - Full description with historical context
     - Location: University of Pennsylvania
     - Associated characters: John Mauchly, J. Presper Eckert
     - Categories: Computer Science, World War II
     - Historical photos (embedded media)
   - Related events listed: "Colossus (1943)", "UNIVAC I (1951)"

7. **Explore character: John Mauchly**
   - Clicks character link from event
   - Character profile page shows:
     - Biography
     - Birth-death dates
     - Timeline of participation (all events Mauchly was involved in)
     - Relationship network (connected to Eckert, von Neumann)

8. **Use search to find more**
   - Searches "transistor"
   - Results show:
     - Event: Transistor invention (1947)
     - Event: First transistor radio (1954)
     - Character: William Shockley
   - Clicks result to explore

9. **Decide to create account**
   - Impressed by content, wants to create own timeline
   - Clicks "Sign Up"
   - Registers account
   - Now can create and save content

**Success criteria:**

- Anonymous user can browse public content
- Master timeline provides engaging entry point
- Drill-down navigation is smooth and intuitive
- Event details are rich and informative
- Character relationships are discoverable
- Search helps find specific content
- User motivated to create account

**Alternative flows:**

- User uses temporal range filter to focus on specific era
- User filters by category
- User shares timeline link with friends

---

### 3.3 Administrative Workflows

#### 3.3.1 Journey: Curate Library Content (The Admin)

**Actor:** System administrator

**Goal:** Add high-quality historical events to the curated library

**Pre-conditions:** User is logged in as Admin

**Steps:**

1. **Navigate to admin dashboard**
   - Special admin section visible
   - "Manage Curated Library" option

2. **Create library timeline**
   - Creates timeline:
     - Title: "History of Aviation"
     - Mark as library content (metadata flag)
     - Published: true

3. **Add curated events via bulk import**
   - Uploads CSV with 50 aviation events:
     - Wright Brothers first flight (1903)
     - First transatlantic flight (1927)
     - Jet engine invention (1939)
     - Sound barrier broken (1947)
     - Boeing 747 introduction (1970)
     - Space Shuttle (1981)
   - Each event has:
     - Complete temporal data
     - Sources and citations
     - Proper categorization
     - Quality descriptions

4. **Review and edit events**
   - Manually reviews each imported event
   - Verifies dates against authoritative sources
   - Ensures neutral tone and accuracy
   - Adds missing details

5. **Add characters**
   - Creates characters for key figures:
     - Wright Brothers
     - Charles Lindbergh
     - Amelia Earhart
   - Associates with relevant events

6. **Publish library timeline**
   - Timeline now visible in curated library
   - Users can import events

7. **Monitor usage**
   - Dashboard shows import metrics
   - "History of Aviation" imported by 45 users this month

**Success criteria:**

- High-quality events added to library
- Content meets quality standards (accuracy, completeness)
- Available for user import
- Usage tracked and monitored

---

#### 3.3.2 Journey: Moderate User Content (The Admin)

**Actor:** System administrator

**Goal:** Review and moderate reported content

**Pre-conditions:** User content has been reported for quality/appropriateness

**Steps:**

1. **Receive moderation alert**
   - Dashboard shows flagged content notification
   - User reported timeline: "Conspiracy Theories About Moon Landing"

2. **Review content**
   - Opens timeline for review
   - Reads events and descriptions
   - Assesses accuracy and appropriateness

3. **Take action**
   - Determines content violates quality standards (misinformation)
   - Options:
     - Unpublish (make private)
     - Delete entirely
     - Contact user for corrections
   - Chooses: Unpublish, notify user

4. **Notify user**
   - Sends message explaining moderation action
   - Provides guidance on quality standards
   - User can appeal or revise content

**Success criteria:**

- Flagged content reviewed promptly
- Appropriate moderation action taken
- User notified of changes
- Platform maintains quality standards

---

### 3.4 Collaboration Workflows

#### 3.4.1 Journey: Collaborative Timeline Editing (Two Educators)

**Actor:** Dr. Sarah Chen invites colleague Dr. Robert Martinez to collaborate

**Goal:** Build comprehensive WWII timeline together

**Pre-conditions:** Both users have accounts

**Steps:**

1. **Sarah creates timeline**
   - Creates "World War II: Complete Timeline"
   - Adds initial events (Pearl Harbor, D-Day, etc.)

2. **Sarah invites Robert as editor**
   - Opens timeline settings
   - Clicks "Invite Collaborator"
   - Enters Robert's email
   - Assigns role: Editor
   - Robert receives notification

3. **Robert accepts and views timeline**
   - Clicks notification link
   - Timeline appears in "Shared with me" section
   - Can view and edit events

4. **Simultaneous editing (Realtime)**
   - Sarah adds event: "Battle of Midway"
   - Robert sees event appear immediately (Realtime update)
   - Presence indicator shows "Sarah is online"

5. **Robert adds complementary events**
   - Adds European theater events
   - Sarah focused on Pacific theater
   - Events merge seamlessly

6. **Coordination via comments (future)**
   - Robert leaves comment: "Should we add more context about Lend-Lease?"
   - Sarah responds, adds suggested event

7. **Publish timeline together**
   - Sarah (owner) publishes timeline
   - Both names credited as collaborators

**Success criteria:**

- Collaborator invitation works smoothly
- Multiple editors can work simultaneously
- Realtime updates prevent conflicts
- Timeline published with co-credit

---

### 3.5 Edge Cases and Error Handling

#### 3.5.1 Journey: Recover from Invalid Temporal Data

**Actor:** User creating prehistoric event

**Goal:** Fix validation errors to successfully create event

**Steps:**

1. **User creates K-Pg extinction event**
   - Enters year: 66, era: MYA
   - Mistakenly also fills in month: March
   - Clicks Save

2. **Validation error appears**
   - Error message: "Month and day cannot be specified for prehistoric dates (MYA). Please remove month/day fields."
   - Month field highlighted in red
   - Form does not submit

3. **User corrects error**
   - Clears month field
   - Clicks Save again

4. **Event saved successfully**
   - Success message appears
   - Event appears on timeline

**Success criteria:**

- Validation prevents invalid data
- Error messages are clear and actionable
- User can correct and retry without data loss

---

#### 3.5.2 Journey: Handle Year 0 Prohibition

**Actor:** User creating ancient event

**Steps:**

1. **User creates event: "Birth of Jesus"**
   - Enters year: 0, era: CE
   - Clicks Save

2. **Validation error**
   - Error: "Year 0 does not exist. Use 1 BCE or 1 CE."
   - Suggests: "Did you mean 1 CE?"

3. **User corrects**
   - Changes to: year 1, era: CE
   - Event saves successfully

**Success criteria:**

- Historical accuracy enforced (no year 0)
- Helpful suggestion provided
- User educated about calendar system

---

### 3.6 Success Paths Summary

For Time Traveler to succeed, users must be able to complete these core journeys smoothly:

1. ✅ **Create first timeline** (onboarding success)
2. ✅ **Add events with temporal data** (core functionality)
3. ✅ **Import curated content** (quick start, learning)
4. ✅ **Publish and share** (community building)
5. ✅ **Browse and discover** (reader engagement)
6. ✅ **Search and explore** (discoverability)
7. ✅ **Collaborate** (teamwork and co-creation)

If users can complete these journeys without friction, the platform achieves product-market fit.

---

## 4. Functional Requirements

This section provides detailed specifications for each entity and feature in the Time Traveler system. Requirements are organized by entity type and functional domain.

### 4.1 Timeline Requirements

Timelines are the top-level organizational structure for temporal content. They contain events and periods, and can represent anything from cosmological history to individual biographies.

#### 4.1.1 Core Fields

| Field                  | Type          | Required | Constraints                              | Description                               |
| ---------------------- | ------------- | -------- | ---------------------------------------- | ----------------------------------------- |
| `id`                   | UUID          | Yes      | Primary key, auto-generated              | Unique identifier                         |
| `user_id`              | UUID          | Yes      | References auth.users                    | Owner of the timeline                     |
| `slug`                 | VARCHAR(100)  | Yes      | Unique per user, URL-safe                | URL-friendly identifier                   |
| `title`                | VARCHAR(2000) | Yes      | 1-2000 characters                        | Display name                              |
| `summary`              | TEXT          | No       | -                                        | Brief description                         |
| `detail`               | TEXT          | No       | -                                        | Full description with Markdown support    |
| `scale`                | VARCHAR(2000) | No       | -                                        | Human-readable temporal scope description |
| `temporal_data`        | JSONB         | Yes      | Valid TemporalData object                | Start date                                |
| `end_temporal_data`    | JSONB         | No       | Valid TemporalData object                | End date (optional)                       |
| `timeline_type`        | VARCHAR(50)   | Yes      | Enum: general, biographical, comparative | Type of timeline                          |
| `subject_character_id` | UUID          | No       | References characters(id)                | Subject for biographical timelines        |
| `visibility`           | VARCHAR(20)   | Yes      | Enum: private, public, shared            | Access control                            |
| `fractal_depth`        | INTEGER       | Yes      | Default: 5, Range: 1-10                  | Maximum nesting levels for events         |
| `metadata`             | JSONB         | No       | -                                        | Extensible metadata                       |
| `published`            | BOOLEAN       | Yes      | Default: false                           | Publication status                        |
| `published_at`         | TIMESTAMPTZ   | No       | Set when published=true                  | Publication timestamp                     |
| `created_at`           | TIMESTAMPTZ   | Yes      | Auto-generated                           | Creation timestamp                        |
| `updated_at`           | TIMESTAMPTZ   | Yes      | Auto-updated                             | Last modification timestamp               |

#### 4.1.2 Timeline Types

**General Timeline:**

- Default type for most historical timelines
- No subject character required
- Can contain any events and periods
- Examples: "History of Computing", "World War II", "Mesozoic Era"

**Biographical Timeline:**

- Centers on a specific character
- `subject_character_id` must be set
- Events are typically filtered to those involving the subject
- Character-centric views prioritize biographical timelines
- Examples: "Life of Julius Caesar", "Seabiscuit's Racing Career"

**Comparative Timeline:**

- Designed for side-by-side comparison with other timelines
- Events aligned by temporal position
- Visual highlighting of overlaps and connections
- Examples: "Computing vs. Electrical Science", "Napoleon vs. Wellington"

#### 4.1.3 Visibility and Access Control

**Private:**

- Visible only to owner (user_id)
- Can invite viewers via timeline_collaborators
- Not included in public search or browse
- Published flag ignored (always treated as unpublished)

**Public:**

- Visible to all users when published=true
- Included in public search and master timeline
- When published=false, treated as private

**Shared:**

- Accessible to invited collaborators via timeline_collaborators
- Collaborator roles determine read/write permissions
- Can be published (becomes publicly visible) or unpublished (collaborators-only)

#### 4.1.4 Slug Generation

- Generated from title on creation
- Lowercase, spaces replaced with hyphens
- Non-alphanumeric characters removed (except hyphens)
- Maximum 100 characters
- Uniqueness enforced per user (user_id + slug unique index)
- If collision detected, append numeric suffix (e.g., "world-war-2", "world-war-2-2")

#### 4.1.5 Temporal Scope Validation

- If both `temporal_data` and `end_temporal_data` are present, start must be before end
- Validation uses `sort_order_years` comparison
- Zero-duration timelines (start = end) are valid for point-in-time events
- Temporal scope should encompass all contained events (soft validation, warnings only)

#### 4.1.6 Publishing Workflow

**Draft State (published=false):**

- Initial state on creation
- Editable without restrictions
- Not visible in public views
- Can be shared with collaborators

**Published State (published=true):**

- `published_at` timestamp set to current time
- Visible in public browse and search (if visibility=public)
- Still editable (unpublish to make major changes)
- Included in master timeline if significance criteria met

**Unpublishing:**

- Set published=false
- `published_at` timestamp preserved (shows when it was last public)
- Returns to draft state
- Removed from public views immediately

#### 4.1.7 Fractal Depth

- Controls maximum nesting levels for events within this timeline
- Default: 5 levels (event → sub-event → sub-sub-event → ...)
- Range: 1 (no nesting) to 10 (deep hierarchies)
- Affects visualization complexity and performance
- Recommended: 3-5 for most timelines

#### 4.1.8 Metadata Structure

The `metadata` JSONB field supports extensible attributes:

```json
{
  "tags": ["science", "technology"],
  "sources": ["https://example.com/source"],
  "collaborator_notes": "Work in progress",
  "visualization_preferences": {
    "default_scale": "logarithmic",
    "color_scheme": "earth-tones"
  }
}
```

No required fields—entirely optional and user-defined.

### 4.2 Event Requirements

Events are the fundamental temporal data points representing specific occurrences in time.

#### 4.2.1 Core Fields

| Field                 | Type          | Required | Constraints                         | Description                            |
| --------------------- | ------------- | -------- | ----------------------------------- | -------------------------------------- |
| `id`                  | UUID          | Yes      | Primary key, auto-generated         | Unique identifier                      |
| `user_id`             | UUID          | Yes      | References auth.users               | Owner of the event                     |
| `slug`                | VARCHAR(100)  | Yes      | Unique per user, URL-safe           | URL-friendly identifier                |
| `title`               | VARCHAR(2000) | Yes      | 1-2000 characters                   | Display name                           |
| `summary`             | TEXT          | No       | -                                   | Brief description                      |
| `detail`              | TEXT          | No       | -                                   | Full description with Markdown support |
| `event_type`          | VARCHAR(100)  | Yes      | Enum: see 4.2.2                     | Category of event                      |
| `temporal_data`       | JSONB         | Yes      | Valid TemporalData object           | Start date/time                        |
| `sort_order_years`    | BIGINT        | Yes      | Generated from temporal_data        | Sortable temporal value                |
| `computed_start_date` | TIMESTAMPTZ   | No       | Generated for CE dates              | PostgreSQL timestamp                   |
| `end_temporal_data`   | JSONB         | No       | Valid TemporalData object           | End date/time for durations            |
| `sort_order_end`      | BIGINT        | No       | Generated from end_temporal_data    | Sortable end value                     |
| `computed_end_date`   | TIMESTAMPTZ   | No       | Generated for CE end dates          | PostgreSQL end timestamp               |
| `location`            | VARCHAR(2000) | No       | -                                   | Free-text location                     |
| `spatial_data`        | JSONB         | No       | -                                   | Structured coordinates                 |
| `importance`          | INTEGER       | Yes      | Default: 5, Range: 1-10             | Significance rating                    |
| `parent_event_id`     | UUID          | No       | References events(id), CASCADE      | Parent for nested events               |
| `timeline_id`         | UUID          | No       | References timelines(id), SET NULL  | Primary timeline association           |
| `metadata`            | JSONB         | No       | -                                   | Extensible metadata                    |
| `search_vector`       | TSVECTOR      | Yes      | Generated from title/summary/detail | Full-text search index                 |
| `published`           | BOOLEAN       | Yes      | Default: false                      | Publication status                     |
| `published_at`        | TIMESTAMPTZ   | No       | Set when published=true             | Publication timestamp                  |
| `created_at`          | TIMESTAMPTZ   | Yes      | Auto-generated                      | Creation timestamp                     |
| `updated_at`          | TIMESTAMPTZ   | Yes      | Auto-updated                        | Last modification timestamp            |

#### 4.2.2 Event Types

| Type             | Description                            | Examples                                                     |
| ---------------- | -------------------------------------- | ------------------------------------------------------------ |
| `milestone`      | Significant achievement or marker      | Moon landing, graduation, invention patent                   |
| `period`         | Extended duration with start and end   | World War II, Ice Age, presidency                            |
| `incident`       | Sudden occurrence                      | Earthquake, assassination, discovery announcement            |
| `discovery`      | Scientific or exploratory finding      | DNA structure, new species, archaeological find              |
| `creation`       | Making of artifact or work             | Painting completion, building construction, software release |
| `destruction`    | End or demolition                      | Building collapse, extinction event, demolition              |
| `transformation` | Change in state or form                | Political revolution, metamorphosis, phase transition        |
| `migration`      | Movement of people, animals, or things | Human migration, bird migration, data migration              |
| `conflict`       | Battle, war, or dispute                | Battle of Waterloo, legal case, labor strike                 |
| `ceremony`       | Ritual or formal event                 | Coronation, wedding, treaty signing                          |

#### 4.2.3 Parent-Child Relationships (Fractal Nesting)

**Rules:**

- Events can have a parent event via `parent_event_id`
- Maximum nesting depth controlled by timeline's `fractal_depth`
- Parent event's temporal scope should contain child event (soft validation)
- Circular references prevented (child cannot be ancestor of parent)
- Orphan events (no parent) represent top-level events

**Use cases:**

- "World War II" event contains "Battle of Stalingrad" which contains "Day 1", "Day 2", etc.
- "Apollo 11 Mission" contains "Launch", "Moon Landing", "Return to Earth"
- "Evolution of Life" contains geological eras, which contain epochs, which contain speciation events

**Visualization:**

- Fractal zoom reveals child events
- Parent context always visible (breadcrumb navigation)
- Hierarchical tree view available as alternative to timeline

#### 4.2.4 Timeline Association

- Events can belong to zero or one "primary" timeline via `timeline_id`
- Events can be associated with multiple timelines via `timeline_events` junction table
- Setting `timeline_id` provides default context but doesn't restrict associations
- Events without `timeline_id` are standalone (accessible via search or character views)

#### 4.2.5 Temporal Data Validation

All temporal data must conform to the hybrid temporal system specifications (Section 6):

**Required validations:**

- `temporal_data` must be a valid TemporalData object
- Era-specific field restrictions (no month/day for prehistoric eras)
- BCE year 0 prohibition
- If `end_temporal_data` present, end must be after start (sort_order_end > sort_order_years)
- Precision level must match era conventions

**Generated columns:**

- `sort_order_years` automatically computed from `temporal_data`
- `computed_start_date` automatically computed for CE dates
- Same for end date fields

#### 4.2.6 Importance Scoring

- Scale: 1 (trivial) to 10 (world-changing)
- Affects visualization: higher importance = larger markers, more prominent display
- Filters master timeline (only events with importance ≥ 7 appear in default view)
- Subjective rating set by content creator
- Guidelines:
  - 10: Civilization-changing events (World Wars, major inventions, mass extinctions)
  - 7-9: Nationally significant or field-defining events
  - 4-6: Regionally significant or personally important
  - 1-3: Minor details or context events

#### 4.2.7 Location Data

**Free-text location (`location` field):**

- Human-readable string: "Rome, Italy", "Pacific Ocean", "Chicxulub crater, Mexico"
- Supports historical names no longer in use
- No validation or geocoding
- Used for display purposes

**Structured spatial data (`spatial_data` JSONB):**

```json
{
  "latitude": 21.3,
  "longitude": -89.5,
  "elevation": 0,
  "precision": "approximate",
  "bounds": {
    "north": 22.0,
    "south": 20.0,
    "east": -89.0,
    "west": -90.0
  },
  "place_id": "ChIJ...",
  "geocoded_from": "Chicxulub crater"
}
```

Optional fields, no required structure. Used for future map visualizations and spatial queries.

#### 4.2.8 Slug Generation

Same rules as timeline slugs (see 4.1.4).

#### 4.2.9 Search Vector

- Generated column using PostgreSQL `to_tsvector()`
- Concatenates `title`, `summary`, and `detail` fields
- Indexed with GIN index for fast full-text search
- Automatically updated on insert/update
- Language: English (configurable for future internationalization)

#### 4.2.10 Publishing Workflow

Same workflow as timelines (see 4.1.6):

- Draft → Published → Unpublished cycle
- Independent of timeline publication status
- Published events can exist in unpublished timelines (accessible via direct link)

### 4.3 Period Requirements

Periods define spans of time with thematic or temporal coherence. They organize events into eras, ages, epochs, and other temporal divisions.

#### 4.3.1 Core Fields

| Field               | Type          | Required | Constraints                       | Description                            |
| ------------------- | ------------- | -------- | --------------------------------- | -------------------------------------- |
| `id`                | UUID          | Yes      | Primary key, auto-generated       | Unique identifier                      |
| `user_id`           | UUID          | Yes      | References auth.users             | Owner of the period                    |
| `slug`              | VARCHAR(100)  | Yes      | Unique per user, URL-safe         | URL-friendly identifier                |
| `title`             | VARCHAR(2000) | Yes      | 1-2000 characters                 | Display name                           |
| `summary`           | TEXT          | No       | -                                 | Brief description                      |
| `detail`            | TEXT          | No       | -                                 | Full description with Markdown support |
| `temporal_data`     | JSONB         | Yes      | Valid TemporalData object         | Start date                             |
| `sort_order_start`  | BIGINT        | Yes      | Generated from temporal_data      | Sortable start value                   |
| `end_temporal_data` | JSONB         | No       | Valid TemporalData object         | End date (required for closed periods) |
| `sort_order_end`    | BIGINT        | No       | Generated from end_temporal_data  | Sortable end value                     |
| `parent_period_id`  | UUID          | No       | References periods(id), CASCADE   | Parent for nested periods              |
| `significance`      | VARCHAR(20)   | Yes      | Enum: low, medium, high, critical | Importance level                       |
| `characteristics`   | TEXT[]        | No       | Array of strings                  | Defining attributes                    |
| `published`         | BOOLEAN       | Yes      | Default: false                    | Publication status                     |
| `published_at`      | TIMESTAMPTZ   | No       | Set when published=true           | Publication timestamp                  |
| `created_at`        | TIMESTAMPTZ   | Yes      | Auto-generated                    | Creation timestamp                     |
| `updated_at`        | TIMESTAMPTZ   | Yes      | Auto-updated                      | Last modification timestamp            |

#### 4.3.2 Hierarchical Organization

- Periods can nest within other periods via `parent_period_id`
- No depth limit (unlike events which respect timeline's fractal_depth)
- Child periods should temporally fit within parent period (soft validation)
- Visualization shows hierarchy with indentation or nested bands

**Example hierarchy:**

```
Phanerozoic Eon (541 MYA - present)
  ├─ Paleozoic Era (541-252 MYA)
  │   ├─ Cambrian Period (541-485 MYA)
  │   ├─ Ordovician Period (485-444 MYA)
  │   └─ ...
  ├─ Mesozoic Era (252-66 MYA)
  │   ├─ Triassic Period (252-201 MYA)
  │   ├─ Jurassic Period (201-145 MYA)
  │   └─ Cretaceous Period (145-66 MYA)
  └─ Cenozoic Era (66 MYA - present)
```

#### 4.3.3 Characteristics

The `characteristics` array stores defining attributes of the period:

Examples:

- Mesozoic Era: `["dominance of dinosaurs", "breakup of Pangaea", "warm climate", "no ice caps"]`
- Renaissance: `["humanism", "artistic flourishing", "scientific inquiry", "rediscovery of classical texts"]`
- Industrial Revolution: `["mechanization", "urbanization", "steam power", "factory system"]`

Each characteristic is a brief phrase (recommended: 2-6 words).

#### 4.3.4 Significance Levels

| Level      | Usage                      | Examples                                              |
| ---------- | -------------------------- | ----------------------------------------------------- |
| `critical` | Civilization-defining eras | World Wars, Industrial Revolution, formation of Earth |
| `high`     | Major historical divisions | Centuries, dynasties, geological periods              |
| `medium`   | Notable spans              | Decades, reigns, cultural movements                   |
| `low`      | Minor divisions            | Seasons, phases, brief campaigns                      |

Affects visualization prominence and master timeline filtering.

#### 4.3.5 Timeline Association

Periods associate with timelines via `period_timelines` junction table (many-to-many). A single period can span multiple timelines (e.g., "Bronze Age" appears in both European and Asian history timelines).

#### 4.3.6 Temporal Validation

- `end_temporal_data` required for closed periods (periods with defined end)
- Ongoing periods (like "Holocene Epoch - present") can omit `end_temporal_data`
- Start must be before end when both present
- Validation uses `sort_order_start` and `sort_order_end` comparison

### 4.4 Character Requirements

Characters represent entities that participate in events: people, animals, organizations, artifacts, mythological beings, fictional characters, and divine entities.

#### 4.4.1 Core Fields (All Character Types)

| Field                  | Type          | Required | Constraints                           | Description                        |
| ---------------------- | ------------- | -------- | ------------------------------------- | ---------------------------------- |
| `id`                   | UUID          | Yes      | Primary key, auto-generated           | Unique identifier                  |
| `user_id`              | UUID          | Yes      | References auth.users                 | Owner of the character             |
| `slug`                 | VARCHAR(100)  | Yes      | Unique per user, URL-safe             | URL-friendly identifier            |
| `name`                 | VARCHAR(2000) | Yes      | 1-2000 characters                     | Display name                       |
| `character_type`       | VARCHAR(50)   | Yes      | Enum: see 4.4.2                       | Type of character                  |
| `biography`            | TEXT          | No       | -                                     | Life story or description          |
| `aliases`              | TEXT[]        | No       | Array of strings                      | Alternative names                  |
| `cultural_context`     | TEXT[]        | No       | Array of strings                      | Cultural/historical context        |
| `physical_description` | TEXT          | No       | -                                     | Appearance details                 |
| `significance`         | VARCHAR(20)   | Yes      | Enum: low, medium, high, critical     | Historical importance              |
| `birth_temporal`       | JSONB         | No       | Valid TemporalData object             | Birth/creation/founding date       |
| `death_temporal`       | JSONB         | No       | Valid TemporalData object             | Death/destruction/dissolution date |
| `profile_data`         | JSONB         | No       | -                                     | Type-specific extensible data      |
| `metadata`             | JSONB         | No       | -                                     | General extensible metadata        |
| `search_vector`        | TSVECTOR      | Yes      | Generated from name/biography/aliases | Full-text search index             |
| `published`            | BOOLEAN       | Yes      | Default: false                        | Publication status                 |
| `published_at`         | TIMESTAMPTZ   | No       | Set when published=true               | Publication timestamp              |
| `created_at`           | TIMESTAMPTZ   | Yes      | Auto-generated                        | Creation timestamp                 |
| `updated_at`           | TIMESTAMPTZ   | Yes      | Auto-updated                          | Last modification timestamp        |

#### 4.4.2 Character Types

The system supports seven character types, each with specialized fields:

##### Human

Standard biographical character. Most common type.

**Additional fields:**

- `species`: VARCHAR(500) - Always "Homo sapiens" or left NULL
- `breed`: NULL (not applicable)
- `domain`: NULL (not applicable)

**Birth/Death temporal:**

- Birth: Date of birth
- Death: Date of death (NULL if still living)

**Use cases:** Historical figures, biographical subjects, family members

##### Animal

Non-human animals (pets, famous animals, prehistoric species).

**Additional fields:**

- `species`: VARCHAR(500) - Required (e.g., "Equus caballus" or "Horse")
- `breed`: VARCHAR(500) - Optional (e.g., "Thoroughbred", "German Shepherd")
- `domain`: NULL (not applicable)

**Birth/Death temporal:**

- Birth: Date of birth or capture
- Death: Date of death or last sighting

**Use cases:** Seabiscuit, Laika, extinct species (as individual or representative)

##### Mythological

Beings from mythology and folklore.

**Additional fields:**

- `species`: NULL or mythological classification (e.g., "Titan", "Hero")
- `breed`: NULL
- `domain`: VARCHAR(500) - Area of influence (e.g., "Sea and Earthquakes" for Poseidon)

**Birth/Death temporal:**

- Birth: Mythological origin or first appearance in sources
- Death: Mythological death or disappearance

**Cultural context:** Important for specifying mythological tradition (e.g., "Greek", "Norse", "Egyptian")

**Use cases:** Zeus, Heracles, Beowulf, Sun Wukong

##### Fictional

Characters from literature, film, games, and other creative works.

**Additional fields:**

- `species`: Optional (e.g., "Human", "Hobbit", "Android")
- `breed`: NULL
- `domain`: NULL

**Profile data should include:**

```json
{
  "source_work": "The Lord of the Rings",
  "author": "J.R.R. Tolkien",
  "first_appearance": "1954"
}
```

**Birth/Death temporal:**

- Birth: In-universe birth date
- Death: In-universe death date

**Use cases:** Sherlock Holmes, Frodo Baggins, HAL 9000

##### Organization

Groups, institutions, companies, governments.

**Additional fields:**

- `species`: NULL
- `breed`: NULL
- `domain`: VARCHAR(500) - Area of activity (e.g., "Technology", "Government", "Religion")

**Profile data should include:**

```json
{
  "organization_type": "Corporation",
  "headquarters": "Cupertino, CA",
  "industry": "Technology"
}
```

**Birth/Death temporal:**

- Birth: Founding date
- Death: Dissolution date (NULL if still active)

**Use cases:** Apple Inc., Roman Empire, NASA, Catholic Church

##### Divine

Gods, goddesses, and other worshipped entities.

**Additional fields:**

- `species`: NULL or classification (e.g., "Deity", "Angel", "Spirit")
- `breed`: NULL
- `domain`: VARCHAR(500) - Required (e.g., "Thunder and Sky" for Zeus)

**Profile data should include:**

```json
{
  "pantheon": "Greek",
  "worship_regions": ["Greece", "Rome", "Mediterranean"],
  "symbols": ["Lightning bolt", "Eagle", "Oak tree"]
}
```

**Birth/Death temporal:**

- Generally NULL (eternal beings) or mythological origin stories
- Death: Very rare (apotheosis, mythological death)

**Cultural context:** Specifies religious/mythological tradition

**Use cases:** Zeus, Odin, Amaterasu, YHWH

##### Artifact

Significant objects, artworks, documents, or relics.

**Additional fields:**

- `species`: NULL
- `breed`: NULL
- `domain`: VARCHAR(500) - Type of artifact (e.g., "Artwork", "Weapon", "Document")

**Profile data should include:**

```json
{
  "material": "Bronze",
  "dimensions": "Life-sized",
  "creator": "Unknown Greek sculptor",
  "current_location": "British Museum"
}
```

**Birth/Death temporal:**

- Birth: Creation/completion date
- Death: Destruction date (NULL if extant)

**Use cases:** Mona Lisa, Excalibur, Rosetta Stone, Declaration of Independence

#### 4.4.3 Aliases

Array of alternative names:

- Nicknames: "Alexander the Great" alias for "Alexander III of Macedon"
- Historical names: "Constantinople" and "Byzantium" for Istanbul
- Titles: "The Conqueror" for William I
- Translated names: "Zeus" and "Jupiter" (Greek vs. Roman)

#### 4.4.4 Significance Levels

Same as periods (critical, high, medium, low). Affects prominence in character network visualizations and search rankings.

#### 4.4.5 Profile Data Structure

The `profile_data` JSONB field stores type-specific extensible attributes not covered by dedicated columns. See examples in 4.4.2 above. No required schema—entirely user-defined.

### 4.5 Character Relationship Requirements

Relationships connect characters across time, enabling network analysis and biographical context.

#### 4.5.1 Core Fields

| Field                  | Type         | Required | Constraints                        | Description                 |
| ---------------------- | ------------ | -------- | ---------------------------------- | --------------------------- |
| `id`                   | UUID         | Yes      | Primary key, auto-generated        | Unique identifier           |
| `user_id`              | UUID         | Yes      | References auth.users              | Owner of the relationship   |
| `character_id`         | UUID         | Yes      | References characters(id), CASCADE | Source character            |
| `related_character_id` | UUID         | Yes      | References characters(id), CASCADE | Target character            |
| `relationship_type`    | VARCHAR(100) | Yes      | Enum: see 4.5.2                    | Type of relationship        |
| `description`          | TEXT         | No       | -                                  | Context and details         |
| `start_temporal`       | JSONB        | No       | Valid TemporalData object          | When relationship began     |
| `end_temporal`         | JSONB        | No       | Valid TemporalData object          | When relationship ended     |
| `metadata`             | JSONB        | No       | -                                  | Extensible metadata         |
| `created_at`           | TIMESTAMPTZ  | Yes      | Auto-generated                     | Creation timestamp          |
| `updated_at`           | TIMESTAMPTZ  | Yes      | Auto-updated                       | Last modification timestamp |

#### 4.5.2 Relationship Types

| Type               | Description                | Examples                                             |
| ------------------ | -------------------------- | ---------------------------------------------------- |
| `family`           | Family relationships       | Parent-child, siblings, spouses, cousins             |
| `professional`     | Work relationships         | Colleagues, employer-employee, business partners     |
| `friendship`       | Social bonds               | Friends, companions, allies                          |
| `rivalry`          | Competitive relationships  | Opponents, competitors, adversaries                  |
| `owner_pet`        | Ownership of animals       | Pet ownership, handler relationships                 |
| `trainer_trainee`  | Teaching relationships     | Teacher-student, coach-athlete, master-apprentice    |
| `creator_creation` | Creator and created entity | Artist-artwork, inventor-invention, author-character |
| `worship`          | Religious devotion         | Worshipper-deity, follower-saint                     |
| `collaboration`    | Joint work                 | Co-authors, research partners, band members          |
| `enemy`            | Hostile relationships      | Wartime enemies, blood feuds                         |
| `mentor_student`   | Formal mentorship          | Academic advisor, career mentor, guide               |

#### 4.5.3 Directionality

Relationships are **directed** from `character_id` to `related_character_id`. This matters for asymmetric relationships:

- "Caesar → Brutus: enemy" (from Caesar's perspective)
- "Brutus → Caesar: betrayal" (from Brutus's perspective)

For symmetric relationships (friendship, collaboration), the application can query in both directions or create reciprocal relationship records.

#### 4.5.4 Temporal Scope

- `start_temporal`: When the relationship began
- `end_temporal`: When the relationship ended (NULL for ongoing relationships)
- Both optional (relationships without temporal scope are atemporal)
- Enables tracking relationship evolution over time

**Examples:**

- Caesar and Brutus friendship: start 59 BCE, end 44 BCE (assassination)
- Watson and Crick collaboration: start 1951, end 1953 (DNA discovery)
- Ongoing relationships have NULL `end_temporal`

#### 4.5.5 Uniqueness Constraints

A unique index on `(character_id, related_character_id, relationship_type)` prevents duplicate relationships. However:

- Same character pair can have multiple relationship types (friend AND colleague)
- Reciprocal relationships (A→B and B→A) are allowed and encouraged for symmetric types

#### 4.5.6 Self-Relationship Prevention

`CHECK (character_id != related_character_id)` constraint prevents characters from relating to themselves.

#### 4.5.7 Description Field

Free-text context for the relationship:

- "Met at Cambridge in 1951, collaborated on DNA structure research"
- "Father-son relationship, strained due to political differences"
- "Trainer from 1936-1940, led to 11 major race wins"

### 4.6 Story Requirements

Stories provide narrative structure layered over historical events, enabling multiple perspectives and interpretations.

#### 4.6.1 Core Fields

| Field                      | Type          | Required | Constraints                                  | Description                          |
| -------------------------- | ------------- | -------- | -------------------------------------------- | ------------------------------------ |
| `id`                       | UUID          | Yes      | Primary key, auto-generated                  | Unique identifier                    |
| `user_id`                  | UUID          | Yes      | References auth.users                        | Owner of the story                   |
| `slug`                     | VARCHAR(100)  | Yes      | Unique per user, URL-safe                    | URL-friendly identifier              |
| `title`                    | VARCHAR(2000) | Yes      | 1-2000 characters                            | Display name                         |
| `sub_title`                | VARCHAR(2000) | No       | -                                            | Optional subtitle                    |
| `summary`                  | TEXT          | No       | -                                            | Brief description                    |
| `detail`                   | TEXT          | No       | -                                            | Full narrative with Markdown support |
| `perspective_character_id` | UUID          | No       | References characters(id), SET NULL          | POV character                        |
| `narrator_type`            | VARCHAR(50)   | No       | Enum: see 4.6.2                              | Narrative voice                      |
| `tags`                     | TEXT[]        | No       | Array of strings                             | Categorization tags                  |
| `search_vector`            | TSVECTOR      | Yes      | Generated from title/subtitle/summary/detail | Full-text search index               |
| `published`                | BOOLEAN       | Yes      | Default: false                               | Publication status                   |
| `published_at`             | TIMESTAMPTZ   | No       | Set when published=true                      | Publication timestamp                |
| `created_at`               | TIMESTAMPTZ   | Yes      | Auto-generated                               | Creation timestamp                   |
| `updated_at`               | TIMESTAMPTZ   | Yes      | Auto-updated                                 | Last modification timestamp          |

#### 4.6.2 Narrator Types

| Type           | Description                                            | Usage                                       |
| -------------- | ------------------------------------------------------ | ------------------------------------------- |
| `first_person` | "I" narration, perspective character tells their story | Autobiographies, personal accounts, diaries |
| `third_person` | "He/She/They" narration, external narrator             | Most historical narratives, biographies     |
| `omniscient`   | All-knowing narrator with access to all perspectives   | Epic narratives, comprehensive histories    |

When `narrator_type` is `first_person`, `perspective_character_id` should be set to indicate whose perspective.

#### 4.6.3 Event Associations

Stories connect to events via `story_events` junction table (many-to-many). A story can reference multiple events, and an event can appear in multiple stories.

**Use cases:**

- "The Fall of Rome" story includes multiple sack events, political changes, and migrations
- Battle of Waterloo appears in "Napoleon's Downfall" story AND "Wellington's Triumph" story (different interpretations)

#### 4.6.4 Period Associations

Stories can also associate with periods via `story_periods` junction table. This is useful for stories spanning entire eras:

- "The Age of Exploration" story associates with the period "15th-17th Century Exploration"
- "Rise and Fall of Dinosaurs" story associates with "Mesozoic Era" period

#### 4.6.5 Character Roles in Stories

Characters participate in stories with specific roles via `story_characters` junction table:

| Role          | Description                                           |
| ------------- | ----------------------------------------------------- |
| `protagonist` | Main character(s) of the story                        |
| `supporting`  | Important secondary characters                        |
| `mentioned`   | Referenced but not central                            |
| `narrator`    | Character telling the story (first-person narratives) |

Multiple characters can have the same role (multiple protagonists).

#### 4.6.6 Tags

Free-form tags for categorization:

- Genre tags: "tragedy", "triumph", "mystery", "exploration"
- Thematic tags: "war", "discovery", "betrayal", "friendship"
- Geographic tags: "European", "Pacific", "Mediterranean"

### 4.7 Category Requirements

Categories provide hierarchical organization for events and other entities.

#### 4.7.1 Core Fields

| Field                | Type          | Required | Constraints                        | Description                   |
| -------------------- | ------------- | -------- | ---------------------------------- | ----------------------------- |
| `id`                 | UUID          | Yes      | Primary key, auto-generated        | Unique identifier             |
| `user_id`            | UUID          | Yes      | References auth.users              | Owner of the category         |
| `slug`               | VARCHAR(100)  | Yes      | Unique per user, URL-safe          | URL-friendly identifier       |
| `title`              | VARCHAR(2000) | Yes      | 1-2000 characters                  | Display name                  |
| `description`        | TEXT          | No       | -                                  | Explanation of category scope |
| `color`              | VARCHAR(7)    | No       | Hex color code (#RRGGBB)           | Visual color coding           |
| `icon`               | VARCHAR(100)  | No       | Icon identifier or emoji           | Visual icon                   |
| `parent_category_id` | UUID          | No       | References categories(id), CASCADE | Parent for hierarchy          |
| `created_at`         | TIMESTAMPTZ   | Yes      | Auto-generated                     | Creation timestamp            |
| `updated_at`         | TIMESTAMPTZ   | Yes      | Auto-updated                       | Last modification timestamp   |

#### 4.7.2 Hierarchical Structure

- Categories nest infinitely via `parent_category_id`
- No depth limit
- Visualization shows hierarchy with indentation or tree structure

**Example hierarchy:**

```
Science
  ├─ Physics
  │   ├─ Quantum Mechanics
  │   └─ Relativity
  ├─ Biology
  │   ├─ Evolution
  │   └─ Genetics
  └─ Chemistry
War
  ├─ World Wars
  │   ├─ World War I
  │   └─ World War II
  └─ Ancient Conflicts
```

#### 4.7.3 Color Coding

- Optional hex color value (#RRGGBB format)
- Used for visual distinction in timeline views
- Events inherit category color (if multiple categories, use first or blend)
- No validation beyond format (any hex color valid)

#### 4.7.4 Icon Specification

- Optional icon identifier or emoji
- Examples: "🔬" (science), "⚔️" (war), "🎨" (art)
- Can be icon library identifiers (e.g., "lucide:flask" for React icon libraries)
- Display logic in UI layer

#### 4.7.5 Event Association

Events associate with categories via `event_categories` junction table (many-to-many). Events can have multiple categories:

- Moon landing: "Space Exploration", "Technology", "Cold War"
- Renaissance painting completion: "Art", "Renaissance", "Italy"

### 4.8 Media Requirements

Media entities represent images, videos, audio, and documents associated with events, characters, and timelines.

#### 4.8.1 Core Fields

| Field             | Type         | Required | Constraints                         | Description                       |
| ----------------- | ------------ | -------- | ----------------------------------- | --------------------------------- |
| `id`              | UUID         | Yes      | Primary key, auto-generated         | Unique identifier                 |
| `user_id`         | UUID         | Yes      | References auth.users               | Owner of the media                |
| `slug`            | VARCHAR(100) | Yes      | Unique per user, URL-safe           | URL-friendly identifier           |
| `alt_text`        | TEXT         | No       | -                                   | Accessibility description         |
| `caption`         | TEXT         | No       | -                                   | Display caption                   |
| `storage_path`    | TEXT         | No       | Supabase Storage path               | Path for uploaded files           |
| `url`             | TEXT         | Yes      | Valid URL                           | Access URL (Supabase or external) |
| `media_type`      | VARCHAR(50)  | Yes      | Enum: image, video, audio, document | Type of media                     |
| `width`           | INTEGER      | No       | -                                   | Pixel width (images/videos)       |
| `height`          | INTEGER      | No       | -                                   | Pixel height (images/videos)      |
| `file_size_bytes` | BIGINT       | No       | -                                   | File size                         |
| `mime_type`       | VARCHAR(200) | No       | -                                   | MIME type (e.g., "image/jpeg")    |
| `metadata`        | JSONB        | No       | -                                   | Extensible metadata               |
| `created_at`      | TIMESTAMPTZ  | Yes      | Auto-generated                      | Creation timestamp                |
| `updated_at`      | TIMESTAMPTZ  | Yes      | Auto-updated                        | Last modification timestamp       |

#### 4.8.2 Media Types

| Type       | Description    | Examples                                       |
| ---------- | -------------- | ---------------------------------------------- |
| `image`    | Static images  | Photos, paintings, diagrams, screenshots       |
| `video`    | Video content  | YouTube embeds, historical footage, animations |
| `audio`    | Audio content  | Recordings, music, speeches, podcasts          |
| `document` | Text documents | PDFs, historical documents, research papers    |

#### 4.8.3 Storage Strategy: Hybrid Approach

**Supabase Storage (small files, <5MB):**

- User avatars
- Event thumbnails and small images
- Icons and diagrams
- Stored in `media` bucket (public)
- `storage_path` contains bucket path (e.g., "avatars/user-123/profile.jpg")
- `url` is Supabase public URL

**External URLs (large files, preferred):**

- YouTube/Vimeo videos
- High-resolution images on CDNs (Imgur, Cloudinary)
- Audio on streaming services (SoundCloud, Spotify)
- Documents on cloud storage (Google Drive, Dropbox)
- `storage_path` is NULL
- `url` is external URL
- System renders appropriate embeds

#### 4.8.4 File Size Limit

- Supabase Storage uploads limited to **5MB per file**
- Client-side validation before upload
- Server-side validation in Edge Function
- Recommend external hosting for larger files

#### 4.8.5 Association with Entities

Media associates with entities via junction tables:

**Events:** `event_media` (many-to-many)

- `sort_order` field controls display sequence
- Multiple images in a gallery

**Characters:** `character_media` (many-to-many)

- `is_primary` flag indicates profile picture
- Multiple images per character (portraits, photos across lifespan)

**Timelines:** Direct reference or via timeline's events

#### 4.8.6 Alt Text Requirements

- Required for accessibility (WCAG 2.1 compliance)
- Describes image content for screen readers
- Should be detailed enough to convey meaning
- Client-side validation warns if missing

#### 4.8.7 URL Validation

- Must be valid HTTP/HTTPS URL
- Client-side validation checks format
- For external embeds, system attempts to render and falls back to link if unsupported
- No server-side validation that URL is accessible (broken links possible)

#### 4.8.8 Metadata Structure

The `metadata` JSONB field stores extensible attributes:

```json
{
  "photographer": "Unknown",
  "date_taken": "1969-07-20",
  "camera": "Hasselblad 500EL",
  "copyright": "Public Domain",
  "exif": { "exposure": "1/250", "aperture": "f/5.6" },
  "embed_params": { "autoplay": false, "controls": true }
}
```

No required fields—entirely optional.

### 4.9 Access Control Requirements

Access control is enforced via Row Level Security (RLS) policies and role-based permissions.

#### 4.9.1 Role Definitions

**Admin:**

- Highest system authority
- Can view and edit all content (regardless of user_id or published status)
- Can manage user accounts and roles
- Can manage curated content library
- Can configure system settings
- Assigned manually via database role or admin interface

**Editor:**

- Standard creator account
- Can create, edit, delete their own content (where user_id matches auth.uid())
- Cannot access other users' private/unpublished content
- Can publish/unpublish their own content
- Can invite viewers to their private content
- Default role for all registered users

**Viewer:**

- Limited read-only access
- Can view published public content (same as anonymous users)
- Can view private/unpublished content if invited via `timeline_collaborators`
- Cannot create, edit, or delete any content
- Granted by invitation from content owners

#### 4.9.2 Admin Capabilities

Admins have full CRUD access to all tables:

- Read all content (published and unpublished, all users)
- Edit any content for moderation purposes
- Delete inappropriate or harmful content
- Manage curated content library
- Assign/revoke admin and editor roles
- View system analytics and usage metrics

**Implementation:** RLS policies include `OR is_admin()` clause where `is_admin()` checks user role.

#### 4.9.3 Editor Capabilities

Editors have CRUD access to their own content:

**Create:**

- Timelines, events, periods, characters, stories, categories, media
- All entities created with `user_id = auth.uid()`

**Read:**

- Own content (published or unpublished)
- Other users' published content
- Content they're invited to via `timeline_collaborators`

**Update:**

- Only own content (where `user_id = auth.uid()`)
- Cannot modify other users' content

**Delete:**

- Only own content (where `user_id = auth.uid()`)
- Cascade deletes handle junction tables automatically

#### 4.9.4 Viewer Capabilities

Viewers have read-only access:

**Read:**

- All published public content
- Private content they're invited to (via `timeline_collaborators`)

**No write access:**

- Cannot create, update, or delete any entities

#### 4.9.5 Row Level Security Patterns

**Content tables (events, timelines, etc.):**

```sql
-- Read: published content OR own content OR invited content
CREATE POLICY "read_events" ON events FOR SELECT USING (
  published = true OR
  user_id = auth.uid() OR
  is_admin() OR
  EXISTS (
    SELECT 1 FROM timeline_collaborators tc
    WHERE tc.timeline_id = events.timeline_id
      AND tc.user_id = auth.uid()
  )
);

-- Write: own content only (or admin)
CREATE POLICY "write_events" ON events FOR ALL USING (
  user_id = auth.uid() OR is_admin()
);
```

**Junction tables (no user_id):**

```sql
-- Read: can read if can read parent entity
CREATE POLICY "read_event_categories" ON event_categories FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_categories.event_id
      AND (events.published = true OR events.user_id = auth.uid() OR is_admin())
  )
);

-- Write: can write if own parent entity
CREATE POLICY "write_event_categories" ON event_categories FOR ALL USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_categories.event_id
      AND (events.user_id = auth.uid() OR is_admin())
  )
);
```

#### 4.9.6 Timeline Collaborators

The `timeline_collaborators` table enables selective sharing:

| Field         | Type        | Description                       |
| ------------- | ----------- | --------------------------------- |
| `timeline_id` | UUID        | References timelines(id), CASCADE |
| `user_id`     | UUID        | References auth.users             |
| `role`        | VARCHAR(50) | Enum: viewer, editor, admin       |
| `created_at`  | TIMESTAMPTZ | Invitation timestamp              |

**Role permissions within a shared timeline:**

- **viewer**: Read-only access to timeline and associated events (even if unpublished)
- **editor**: Can add/edit/delete events within the timeline, cannot delete timeline itself
- **admin**: Full control (edit timeline settings, manage collaborators, delete timeline)

**RLS extension:**
Policies check `timeline_collaborators` role to determine write permissions for timeline-associated content.

#### 4.9.7 Invitation Mechanism

**Invite workflow:**

1. Timeline owner (editor) adds row to `timeline_collaborators` with invitee's user_id
2. Role defaults to `viewer` unless specified
3. Invitee gains immediate access (no acceptance required)
4. Invitee sees timeline in "Shared with me" section

**Revoke workflow:**

1. Timeline owner deletes row from `timeline_collaborators`
2. Invitee loses access immediately

**Future enhancement:** Email notifications, acceptance workflow, invitation links.

#### 4.9.8 Permission Inheritance

- Events inherit permissions from their primary `timeline_id`
- If timeline is shared with editor role, collaborator can edit events
- If timeline is shared with viewer role, collaborator can only read events
- Events without `timeline_id` are not shareable (owner-only)

### 4.10 Bulk Import Requirements

Bulk import enables loading large datasets via CSV or JSON files.

#### 4.10.1 Supported File Formats

**CSV:**

- Standard comma-separated values
- UTF-8 encoding required
- First row must be header with column names
- Supports events, characters, categories

**JSON:**

- Structured JSON format matching database schema
- Supports all entity types
- Can include relationships and nested structures
- UTF-8 encoding required

#### 4.10.2 CSV Structure for Events

Required columns:

- `title`: Event title (string, max 2000 chars)
- `temporal_year`: Numeric year value
- `temporal_era`: One of CE, BCE, KYA, MYA, BYA

Optional columns:

- `summary`: Brief description
- `detail`: Full description
- `temporal_month`: 1-12 (CE/BCE only)
- `temporal_day`: 1-31 (CE/BCE only)
- `temporal_precision`: exact, circa, approximate, estimated, geological
- `temporal_uncertainty`: Plus/minus years
- `event_type`: milestone, period, incident, etc.
- `location`: Free-text location
- `importance`: 1-10
- `timeline_slug`: Associate with existing timeline by slug
- `categories`: Comma-separated category slugs
- `characters`: Comma-separated character slugs with optional roles

**Example CSV:**

```csv
title,temporal_year,temporal_era,temporal_precision,event_type,importance,location,summary
Moon Landing,1969,CE,exact,milestone,10,"Sea of Tranquility, Moon","Apollo 11 successfully lands on the Moon"
Chicxulub Impact,66,MYA,estimated,incident,10,"Yucatan Peninsula, Mexico","Asteroid impact causes mass extinction"
```

#### 4.10.3 JSON Schema for Events

```json
{
  "events": [
    {
      "title": "Moon Landing",
      "summary": "Apollo 11 successfully lands on the Moon",
      "detail": "...",
      "temporal_data": {
        "year": 1969,
        "month": 7,
        "day": 20,
        "era": "CE",
        "precision": "exact"
      },
      "event_type": "milestone",
      "importance": 10,
      "location": "Sea of Tranquility, Moon",
      "timeline_slug": "space-exploration",
      "categories": ["space", "technology"],
      "characters": [
        { "slug": "neil-armstrong", "role": "protagonist" },
        { "slug": "buzz-aldrin", "role": "protagonist" }
      ]
    }
  ]
}
```

#### 4.10.4 Temporal Data Parsing and Validation

**CSV parsing:**

- Separate columns for year, era, month, day, precision
- Assembled into TemporalData object by import function
- Validated against Zod schema before insert

**JSON parsing:**

- `temporal_data` field expected as nested object
- Validated against Zod schema directly
- Malformed temporal data rejects the row

**Validation rules:**

- All hybrid temporal system rules apply (see Section 6)
- BCE year 0 rejected
- Prehistoric dates with month/day rejected
- Invalid era/precision combinations rejected

#### 4.10.5 Error Handling and Reporting

**Validation errors:**

- Each row validated independently
- Invalid rows logged with row number and reason
- Valid rows proceed to import
- No all-or-nothing transaction (partial imports allowed)

**Import summary:**

```json
{
  "total_rows": 100,
  "imported": 95,
  "rejected": 5,
  "errors": [
    { "row": 12, "error": "Temporal data invalid: Year 0 BCE does not exist" },
    { "row": 34, "error": "Missing required field: title" },
    {
      "row": 67,
      "error": "Invalid event_type: 'battle' (must be one of: milestone, period, ...)"
    }
  ]
}
```

#### 4.10.6 Row-Level Error Messages

Each error includes:

- **Row number** (1-indexed, matching CSV line or JSON array index)
- **Field name** (if field-specific error)
- **Error description** (human-readable message)
- **Suggested fix** (when applicable)

Examples:

- "Row 12: temporal_era 'MYA' cannot have temporal_month field. Remove month/day columns for prehistoric dates."
- "Row 34: timeline_slug 'ancient-rome' not found. Create timeline first or remove this column."
- "Row 67: importance must be between 1 and 10, got 15."

#### 4.10.7 Partial Import Strategy

**Default behavior:**

- Process all rows
- Import valid rows
- Skip invalid rows
- Return summary with counts and error details

**Alternative (strict mode):**

- Validate all rows first
- If any validation errors, reject entire import
- Return error list without importing
- User can fix errors and re-upload

Strict mode available as option in import UI.

#### 4.10.8 Relationship Preservation During Import

**Slug-based references:**

- CSV can reference existing entities by slug (timeline_slug, category slugs, character slugs)
- Import function looks up entity by slug + user_id
- If not found, logs warning and skips association (doesn't fail entire row)

**Creating relationships:**

- Junction table rows created automatically for categories, characters
- Many-to-many associations handled in single import

**Example:**

```csv
title,categories,characters
Moon Landing,"space,technology","neil-armstrong:protagonist,buzz-aldrin:protagonist"
```

Parses as:

- Event created
- Two event_categories rows created (space, technology)
- Two event_characters rows created with roles

#### 4.10.9 Duplicate Detection Strategies

**Slug-based:**

- If slug already exists for this user, skip or update (user chooses)
- "Skip duplicates" mode: ignore rows with existing slugs
- "Update duplicates" mode: overwrite existing entities with new data

**Title-based:**

- Fuzzy matching on title field (optional)
- If similar title found, prompt user to confirm
- Helps prevent accidental duplicates

**No deduplication:**

- Default mode: import all rows, generate unique slugs with numeric suffixes
- Fastest but may create duplicates

#### 4.10.10 Import Summary Reporting

After import completion, display:

- Total rows processed
- Successfully imported count
- Rejected count with error details
- Warnings (e.g., missing references)
- Downloadable error log (CSV or JSON)
- Link to imported entities (view timeline or event list)

**UI feedback:**

- Progress bar during import
- Real-time count updates
- "Cancel import" button (for long imports)
- Success/failure notifications

### 4.11 Export Requirements

Export enables users to download their timelines and events in various formats.

#### 4.11.1 Export Formats

**PDF:**

- Formatted document with timeline visualization
- Event list with details
- Character profiles
- Suitable for printing and archival

**JSON:**

- Complete structured data dump
- Includes all entity fields and relationships
- Can be re-imported
- Suitable for backup and migration

**Embeddable HTML:**

- Self-contained HTML snippet
- Includes CSS and minimal JS
- Can be embedded in external websites
- Interactive timeline view

**CSV:**

- Tabular event data
- For analysis in spreadsheet tools
- Limited to events (not full entity graph)

#### 4.11.2 PDF Export Format and Layout

**Cover page:**

- Timeline title and summary
- Author information
- Date range (formatted temporal scope)
- Export date

**Timeline visualization:**

- Horizontal timeline graphic
- Events positioned temporally
- Color-coded by category
- Importance indicated by marker size

**Event list:**

- Chronologically ordered
- Each event gets subsection:
  - Title and temporal data (formatted display)
  - Summary and detail
  - Location
  - Characters involved (with roles)
  - Categories
  - Associated media (images embedded, videos as links)

**Character profiles (if included):**

- Biographical sections for each character
- Timeline of character's event participation

**Appendices:**

- Period definitions
- Category descriptions
- Sources and references

**Styling:**

- Professional typography (serif body, sans-serif headers)
- Page numbers and table of contents
- Consistent color scheme (matches timeline)

#### 4.11.3 JSON Export Structure

Complete data dump including:

```json
{
  "version": "1.0",
  "export_date": "2026-02-14T10:30:00Z",
  "user": {
    "id": "uuid",
    "username": "historian"
  },
  "timeline": {
    "id": "uuid",
    "title": "History of Computing",
    "temporal_data": { ... },
    "end_temporal_data": { ... },
    ...
  },
  "events": [
    {
      "id": "uuid",
      "title": "ENIAC Completion",
      "temporal_data": { ... },
      ...
    }
  ],
  "characters": [ ... ],
  "periods": [ ... ],
  "stories": [ ... ],
  "categories": [ ... ],
  "relationships": {
    "event_characters": [ ... ],
    "character_relationships": [ ... ],
    ...
  },
  "media": [ ... ]
}
```

**Includes:**

- All entities related to the timeline
- Junction table relationships
- Complete temporal data structures
- User-defined metadata

**Excludes:**

- Generated columns (sort_order_years, search_vector)
- User password hashes
- System timestamps (created_at, updated_at) — optional

#### 4.11.4 Embeddable HTML Generation

**Requirements:**

- Single HTML file (no external dependencies)
- Inline CSS and JavaScript
- Responsive design (mobile-friendly)
- Lightweight (<500KB including data)

**Features:**

- Interactive timeline navigation
- Event detail popups
- Temporal filtering
- Search (client-side)
- No server-side dependencies

**Usage:**

```html
<iframe src="timeline-export.html" width="100%" height="600px"></iframe>
```

Or embed directly in page content.

**Customization options:**

- Color scheme
- Font choices
- Display density (compact vs. spacious)
- Feature toggles (show/hide characters, categories, etc.)

#### 4.11.5 CSV Export for Analysis

**Columns:**

- `title`: Event title
- `temporal_year`: Numeric year (converted from sort_order_years)
- `temporal_era`: Era string
- `temporal_display`: Formatted display string
- `summary`: Brief description
- `detail`: Full description
- `event_type`: Event type
- `importance`: 1-10
- `location`: Free-text location
- `latitude`: From spatial_data (if present)
- `longitude`: From spatial_data (if present)
- `categories`: Comma-separated category titles
- `characters`: Comma-separated character names
- `published`: true/false

**Purpose:**

- Import into Excel, Google Sheets for analysis
- Generate charts and graphs
- Statistical analysis of temporal distributions
- Geographic mapping (if coordinates present)

#### 4.11.6 Export Scope Selection

**Options:**

- Single timeline (all related entities)
- Multiple timelines (batch export)
- All user content (complete account backup)
- Selected entities (cherry-pick events, characters, etc.)

**UI:**

- Checkboxes for entity selection
- "Select all" / "Deselect all" shortcuts
- Preview of export size and entity counts

#### 4.11.7 Export Includes Related Entities

When exporting a timeline:

- Include all events in timeline (via timeline_events junction)
- Include all characters involved in those events
- Include all periods associated with timeline
- Include all stories referencing those events
- Include all media associated with events/characters
- Include all categories applied to events

**Relationship preservation:**

- Junction tables exported to maintain associations
- Foreign key references preserved (by ID or slug)

#### 4.11.8 Temporal Data Formatting in Exports

**PDF and HTML:**

- Use formatted display strings from TemporalService
- Human-readable: "March 15, 44 BCE", "66 ± 1 MYA"

**JSON:**

- Raw TemporalData objects (full structure)
- Enables re-import without loss

**CSV:**

- Separate columns for components (year, era, month, day, precision)
- Additional column for formatted display string
- Maintains both machine-readable and human-readable forms

### 4.12 Search Requirements

Full-text search enables discovering events, characters, stories, and timelines across the system.

#### 4.12.1 Full-Text Search Scope

Search across the following entities:

- **Events**: title, summary, detail
- **Characters**: name, biography, aliases
- **Stories**: title, subtitle, summary, detail
- **Timelines**: title, summary, detail

#### 4.12.2 PostgreSQL tsvector Implementation

**Generated columns:**
Each searchable table has a `search_vector` column:

```sql
search_vector TSVECTOR GENERATED ALWAYS AS (
  to_tsvector('english',
    coalesce(title, '') || ' ' ||
    coalesce(summary, '') || ' ' ||
    coalesce(detail, ''))
) STORED
```

**Index:**

```sql
CREATE INDEX idx_events_search ON events USING GIN (search_vector);
```

**Query:**

```sql
SELECT * FROM events
WHERE search_vector @@ to_tsquery('english', 'moon & landing')
ORDER BY ts_rank(search_vector, to_tsquery('english', 'moon & landing')) DESC;
```

#### 4.12.3 Search Ranking and Relevance

**Ranking factors:**

- **Text match score**: PostgreSQL's `ts_rank()` function
- **Importance**: Events with higher importance ranked higher
- **Published status**: Published content ranked above unpublished
- **Recency**: Recently created/updated content boosted slightly

**Combined ranking:**

```sql
ts_rank(search_vector, query) * (importance / 10.0) * (CASE WHEN published THEN 1.2 ELSE 1.0 END)
```

#### 4.12.4 Search Result Formatting with Snippets

**Result structure:**

```json
{
  "entity_type": "event",
  "id": "uuid",
  "title": "Moon Landing",
  "snippet": "Apollo 11 successfully <mark>lands</mark> on the <mark>Moon</mark>",
  "temporal_display": "July 20, 1969",
  "importance": 10,
  "url": "/events/moon-landing"
}
```

**Snippet generation:**

- Use `ts_headline()` function to highlight matches
- Truncate to 150-200 characters around matches
- Indicate truncation with "..."

#### 4.12.5 Faceted Filtering

After initial search, refine results by:

**Entity type:**

- Events
- Characters
- Stories
- Timelines

**Era (for events):**

- CE
- BCE
- KYA
- MYA
- BYA

**Category:**

- Display top 10 categories in results
- Checkbox filters

**Importance (for events):**

- Slider: 1-10
- Default: show all

**Published status (for own content):**

- Published only (default)
- Include drafts

**Facet counts:**
Show count of results in each facet:

- "Events (42)"
- "Characters (7)"
- "Stories (3)"

#### 4.12.6 Temporal Range Search

Combine text search with temporal filtering:

**UI:**

- Search input field
- Temporal range inputs (two TemporalInput components for start/end)
- "Apply filter" button

**Query:**

```sql
SELECT * FROM events
WHERE search_vector @@ to_tsquery('english', :query)
  AND sort_order_years BETWEEN :start AND :end
ORDER BY ts_rank(...) DESC;
```

**Use case:**

- "Search for 'war' between 1900 CE and 2000 CE"
- "Search for 'dinosaur' in MYA era"

#### 4.12.7 Character Participation Search

Find events involving specific character(s):

**Single character:**

```sql
SELECT e.* FROM events e
JOIN event_characters ec ON e.id = ec.event_id
WHERE ec.character_id = :character_id
  AND e.search_vector @@ to_tsquery('english', :query)
ORDER BY e.sort_order_years;
```

**Multiple characters (intersection):**
Find events where ALL selected characters participated:

```sql
SELECT e.* FROM events e
WHERE (
  SELECT COUNT(DISTINCT ec.character_id)
  FROM event_characters ec
  WHERE ec.event_id = e.id
    AND ec.character_id = ANY(:character_ids)
) = array_length(:character_ids, 1)
ORDER BY e.sort_order_years;
```

**UI:**

- Character multi-select dropdown
- "Events with all selected" vs. "Events with any selected" toggle

#### 4.12.8 Category Filtering

**Single category:**

```sql
SELECT e.* FROM events e
JOIN event_categories ec ON e.id = ec.event_id
WHERE ec.category_id = :category_id
ORDER BY e.sort_order_years;
```

**Multiple categories (union):**

```sql
SELECT DISTINCT e.* FROM events e
JOIN event_categories ec ON e.id = ec.event_id
WHERE ec.category_id = ANY(:category_ids)
ORDER BY e.sort_order_years;
```

**Hierarchical category filtering:**
When category selected, include child categories automatically:

```sql
WITH RECURSIVE category_tree AS (
  SELECT id FROM categories WHERE id = :category_id
  UNION ALL
  SELECT c.id FROM categories c
  JOIN category_tree ct ON c.parent_category_id = ct.id
)
SELECT e.* FROM events e
JOIN event_categories ec ON e.id = ec.event_id
WHERE ec.category_id IN (SELECT id FROM category_tree)
ORDER BY e.sort_order_years;
```

#### 4.12.9 Combined Search Filters

All filters can be combined:

- Text query AND temporal range AND category AND character

**Query builder pattern:**
Start with base query, add WHERE clauses conditionally based on active filters.

**Example combined query:**
"Find events about 'revolution' between 1700 CE and 1900 CE in category 'Political' involving character 'Napoleon'"

#### 4.12.10 Search Performance Requirements

**Target performance:**

- Simple text search: <200ms
- Combined filters (3+ filters): <500ms
- Complex character intersection: <1000ms

**Optimization strategies:**

- GIN indexes on search_vector columns
- BTREE indexes on sort_order_years, importance
- Covering indexes on junction tables
- Query result caching (client-side with TanStack Query)

**Performance monitoring:**

- Log slow queries (>1s) for analysis
- Use EXPLAIN ANALYZE to verify index usage
- Track 95th percentile search times

### 4.13 Real-Time Requirements

Supabase Realtime enables live content updates and presence awareness.

#### 4.13.1 Supabase Realtime Channel Structure

**Channel naming:**

- Timeline-specific: `timeline:{timeline_id}`
- User-specific: `user:{user_id}`
- Global: `public:events`

**Example:**

```typescript
const channel = supabase.channel(`timeline:${timelineId}`);
```

#### 4.13.2 PostgreSQL Change Subscriptions

Subscribe to database changes (INSERT, UPDATE, DELETE):

```typescript
channel
  .on(
    "postgres_changes",
    {
      event: "*", // or 'INSERT', 'UPDATE', 'DELETE'
      schema: "public",
      table: "events",
      filter: `timeline_id=eq.${timelineId}`,
    },
    (payload) => {
      // Handle change
      console.log("Event changed:", payload);
    },
  )
  .subscribe();
```

**Payload structure:**

```json
{
  "eventType": "INSERT",
  "new": { "id": "uuid", "title": "New Event", ... },
  "old": null,
  "schema": "public",
  "table": "events"
}
```

**Supported events:**

- INSERT: `new` contains inserted row, `old` is null
- UPDATE: `new` contains updated row, `old` contains previous values
- DELETE: `new` is null, `old` contains deleted row

#### 4.13.3 Presence Tracking for Active Users

Track who's currently viewing a timeline:

```typescript
const presenceState = {
  user_id: userId,
  username: username,
  avatar_url: avatarUrl,
  viewing_since: new Date().toISOString(),
};

channel.track(presenceState);

channel.on("presence", { event: "sync" }, () => {
  const state = channel.presenceState();
  // state is { [userId]: [presenceState, ...] }
  setActiveUsers(Object.values(state).flat());
});
```

**UI display:**

- Avatar list of active users
- "3 people viewing" indicator
- Tooltip on hover showing usernames

#### 4.13.4 Broadcast Messages for Collaborative Awareness

Send custom messages between clients:

```typescript
// Send message
channel.send({
  type: "broadcast",
  event: "cursor_move",
  payload: { userId, position: { x, y } },
});

// Receive message
channel.on("broadcast", { event: "cursor_move" }, (payload) => {
  updateRemoteCursor(payload);
});
```

**Use cases:**

- Cursor position sharing (collaborative editing)
- "User X is editing event Y" notifications
- Typing indicators
- Selection synchronization

#### 4.13.5 Real-Time Content Update Propagation

**Pattern:**

1. User A creates/updates/deletes event
2. PostgREST operation succeeds
3. PostgreSQL triggers Realtime broadcast
4. All clients subscribed to channel receive notification
5. Clients update UI (via TanStack Query cache invalidation)

**Client-side handling:**

```typescript
channel.on(
  "postgres_changes",
  { event: "*", schema: "public", table: "events" },
  (payload) => {
    queryClient.invalidateQueries({ queryKey: ["events", timelineId] });
  },
);
```

**Optimistic updates:**
Client can update UI immediately on user action, then reconcile if Realtime notification differs:

```typescript
const { mutate } = useMutation({
  mutationFn: updateEvent,
  onMutate: async (newData) => {
    // Optimistically update
    queryClient.setQueryData(["event", eventId], newData);
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(["event", eventId], context.previousData);
  },
});
```

#### 4.13.6 Connection Management and Reconnection

**Auto-reconnection:**
Supabase Realtime client handles reconnection automatically:

- Detects connection loss
- Exponential backoff retry
- Resubscribes to channels on reconnect

**Client-side state:**

```typescript
const [connectionStatus, setConnectionStatus] = useState("connected");

channel.on("system", {}, (payload) => {
  if (payload.status === "CHANNEL_ERROR") setConnectionStatus("error");
  if (payload.status === "SUBSCRIBED") setConnectionStatus("connected");
});
```

**UI feedback:**

- "Connecting..." indicator
- "Connection lost" warning
- "Reconnected" confirmation

#### 4.13.7 Client-Side Cache Invalidation Patterns

**Surgical invalidation:**
Invalidate only affected queries:

```typescript
// Event updated → invalidate event detail and event list
queryClient.invalidateQueries({ queryKey: ["event", payload.new.id] });
queryClient.invalidateQueries({ queryKey: ["events", timelineId] });

// Character updated → invalidate character profile and related events
queryClient.invalidateQueries({ queryKey: ["character", payload.new.id] });
queryClient.invalidateQueries({
  queryKey: ["character-events", payload.new.id],
});
```

**Batch invalidation:**
For bulk operations, invalidate broader scopes:

```typescript
// Multiple events changed → invalidate entire timeline
queryClient.invalidateQueries({ queryKey: ["timeline", timelineId] });
```

#### 4.13.8 Subscription Filtering

**Per-timeline filtering:**

```typescript
filter: `timeline_id=eq.${timelineId}`;
```

**Per-user filtering:**

```typescript
filter: `user_id=eq.${userId}`;
```

**Published content only:**

```typescript
filter: `published=eq.true`;
```

**Combined filters:**

```typescript
filter: `timeline_id=eq.${timelineId}&published=eq.true`;
```

#### 4.13.9 Real-Time Performance Considerations

**Connection limits:**

- Supabase Realtime free tier: 200 concurrent connections
- Pro tier: 500 concurrent connections
- Monitor active connection count

**Message throttling:**

- Avoid sending too many broadcasts (rate limit: 10/second per client)
- Debounce cursor moves and other high-frequency events

**Selective subscription:**

- Only subscribe to channels user is actively viewing
- Unsubscribe when navigating away
- Use channel cleanup on component unmount

**Bandwidth optimization:**

- Broadcast only minimal data (IDs, not full objects)
- Let clients fetch full data via REST API if needed
- Use presence state for small amounts of data (<1KB per user)

### 4.14 Curated Content Library

A reference collection of high-quality historical events to bootstrap user timelines.

#### 4.14.1 Content Scope

**Approximate size:**

- ~100 major historical events
- Organized into 10-15 thematic timelines
- Spanning full temporal range (Big Bang to present)

**Example timelines:**

- "Big Bang to Present: Cosmological History"
- "History of Computing"
- "History of Aviation"
- "History of Electrical Science"
- "Development of the Automobile"
- "History of Radio"
- "Major Wars and Conflicts"
- "Scientific Revolutions"
- "Geological Timeline"
- "Evolution of Life on Earth"

**Coverage goals:**

- Major cosmological events (Big Bang, formation of Earth, etc.)
- Geological eras and extinction events
- Human prehistory (evolution, migrations)
- Ancient civilizations (Egypt, Greece, Rome, China, etc.)
- Medieval period
- Renaissance and Enlightenment
- Industrial Revolution
- Modern history (World Wars, Space Age, Digital Age)
- Contemporary events (late 20th/early 21st century)

#### 4.14.2 Quality Standards for Curated Content

**Temporal data quality:**

- Precise dates for modern events (CE with exact dates)
- Proper geological/cosmological metadata for prehistoric events
- Uncertainty ranges for estimated dates
- Dating methods and sources documented

**Narrative quality:**

- Clear, informative summaries (2-3 sentences)
- Detailed descriptions with context
- Neutral tone (avoid bias)
- Proper citations and sources

**Categorization:**

- Appropriate categories assigned
- Character associations where relevant
- Importance ratings calibrated consistently

**Accuracy:**

- Cross-referenced with authoritative sources
- Dates verified against academic sources
- Cultural sensitivity in describing historical events

#### 4.14.3 Import Selection Interface

**UI components:**

**Timeline browser:**

- List of curated timelines with descriptions
- Event count per timeline
- Temporal scope (e.g., "13.8 BYA - Present")
- Preview timeline visualization

**Selective import:**

- Checkbox per timeline (import entire timeline)
- Expandable event list with checkboxes (cherry-pick events)
- "Import all" / "Deselect all" shortcuts
- Selected item count and estimated size

**Import options:**

- "Import as-is" (read-only reference)
- "Import and customize" (editable copies)
- "Link to library" (updates when library updates)

#### 4.14.4 Selective Import Mechanism

**User workflow:**

1. Navigate to "Import from Library" section
2. Browse curated timelines
3. Select timeline(s) or individual events
4. Choose import mode (as-is vs. customizable)
5. Confirm import
6. Content copied to user's account (user_id set to current user)

**Behind the scenes:**

- Content duplicated from library to user's tables
- UUIDs regenerated (new IDs)
- `user_id` set to importing user
- Relationships preserved (character associations, categories, etc.)
- Slugs may be modified to avoid conflicts

**Import modes:**

**As-is (read-only reference):**

- Creates read-only copies
- User cannot edit imported content
- Future: library updates propagate to user's copy

**Import and customize:**

- Creates editable copies
- User can modify title, temporal data, add details
- No connection to library (independent content)

#### 4.14.5 Relationship Preservation During Import

**Character associations:**

- If event references character in library, import character too (unless already exists)
- Junction table (event_characters) rows created

**Category associations:**

- Categories imported as well
- User's existing categories checked for duplicates (by title)
- Reuse if match found, create new if not

**Timeline associations:**

- If importing entire timeline, all events associate with imported timeline
- If importing cherry-picked events, create new timeline or add to existing (user chooses)

**Media:**

- External URLs copied as-is
- Supabase Storage files: link to library bucket (shared public URLs)

#### 4.14.6 Content Update Mechanism

**Library versioning:**

- Library content maintained by admins
- Version number tracked (e.g., v1.2)
- Release notes describe changes

**User update workflow (future enhancement):**

- Users notified when library updates
- "Update my imported content" button
- Compare changes before applying
- Choose which updates to apply

**Initial implementation:**

- No automatic updates
- Users import static snapshots
- Re-import manually if desired

#### 4.14.7 Library Organization Structure

**Database structure:**

##### **Option A: Separate admin-owned content**

- Library content owned by admin user (user_id = admin UUID)
- Published and marked with `metadata.is_library_content = true`
- Regular RLS allows public read access
- Import duplicates to user's account

##### **Option B: Dedicated library tables**

- Separate tables: `library_timelines`, `library_events`, etc.
- No user_id (shared content)
- Import copies to regular tables

**Recommendation:** Option A (simpler, reuses existing tables and RLS)

**Admin management:**

- Admin interface for creating/editing library content
- Bulk import for seeding library (CSV/JSON)
- Review and approval workflow for community contributions (future)

This completes the Functional Requirements section with comprehensive specifications for all entities, features, and workflows.

---

## 5. Technical Architecture

This section provides a high-level overview of the system architecture. For detailed implementation specifications, see the Technical Design Document (system-design-v3.md).

### 5.1 Architecture Overview

Time Traveler follows a modern JAMstack architecture with serverless backend services.

```text
┌─────────────────────────────────────────────────────────────────┐
│  CLIENT LAYER (Vercel)                                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Next.js 16+ Application (App Router)                    │   │
│  │  - React 19+ components                                  │   │
│  │  - TypeScript strict mode                                │   │
│  │  - shadcn/ui + Tailwind CSS                              │   │
│  │  - D3.js timeline visualization                          │   │
│  │  - TanStack Query (server state)                         │   │
│  │  - Zustand (client state)                                │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ↑ HTTPS/WSS
┌─────────────────────────────────────────────────────────────────┐
│  API LAYER (Supabase-managed)                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────────────────┐    │
│  │ PostgREST   │  │ Realtime    │  │ Edge Functions        │    │
│  │ Auto-gen    │  │ WebSocket   │  │ (Deno Runtime)        │    │
│  │ REST API    │  │ Presence    │  │ - Bulk import         │    │
│  │ from schema │  │ Broadcast   │  │ - Export generation   │    │
│  └─────────────┘  └─────────────┘  │ - Image processing    │    │
│                                    │ - Geocoding           │    │
│  ┌─────────────┐  ┌─────────────┐  └───────────────────────┘    │
│  │ Auth        │  │ Storage     │                               │
│  │ Email/OAuth │  │ Public/     │                               │
│  │ Magic links │  │ Private     │                               │
│  └─────────────┘  └─────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│  DATA LAYER (PostgreSQL via Supabase)                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  PostgreSQL Database                                     │   │
│  │  - JSONB hybrid temporal storage                         │   │
│  │  - Generated sort columns                                │   │
│  │  - Row Level Security (RLS)                              │   │
│  │  - Full-text search (tsvector + GIN indexes)             │   │
│  │  - Database functions (read-only queries)                │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Technology Stack

#### 5.2.1 Frontend

| Component         | Technology               | Purpose                                         |
| ----------------- | ------------------------ | ----------------------------------------------- |
| Framework         | Next.js 16+ (App Router) | Server-side rendering, routing, optimization    |
| UI Library        | React 19+                | Component-based UI, hooks, concurrent features  |
| Language          | TypeScript (strict mode) | Type safety, developer experience               |
| Component Library | shadcn/ui + Radix UI     | Accessible, customizable components             |
| Styling           | Tailwind CSS             | Utility-first CSS, design system                |
| Visualization     | D3.js + SVG              | Timeline rendering, data visualization          |
| Charts            | Recharts                 | Statistical charts and graphs                   |
| Server State      | TanStack Query           | Caching, background refetch, optimistic updates |
| Client State      | Zustand                  | UI state, navigation, view modes                |
| Forms             | React Hook Form + Zod    | Form validation, type-safe schemas              |

**Why Next.js:**

- Server-side rendering improves initial load performance
- App Router provides file-based routing and layouts
- Integrated with Vercel for seamless deployment
- Built-in optimization (image, font, code splitting)

**Why TanStack Query:**

- Automatic caching reduces API calls
- Background refetch keeps data fresh
- Optimistic updates for instant feedback
- Surgical cache invalidation with Realtime

#### 5.2.2 Backend

| Component | Technology                 | Purpose                                    |
| --------- | -------------------------- | ------------------------------------------ |
| Platform  | Supabase                   | Backend-as-a-Service, PostgreSQL hosting   |
| Database  | PostgreSQL 15+             | Relational database, JSONB support         |
| API       | PostgREST (auto-generated) | REST API from database schema              |
| Real-time | Supabase Realtime          | WebSocket connections, presence, broadcast |
| Auth      | Supabase Auth              | User management, JWT tokens, OAuth         |
| Storage   | Supabase Storage           | File uploads, public/private buckets       |
| Functions | Edge Functions (Deno)      | Serverless compute, async processing       |

**Why Supabase:**

- Auto-generated REST API eliminates backend code
- Row Level Security handles authorization at database level
- Real-time features built-in (WebSocket)
- Generous free tier, predictable pricing
- PostgreSQL provides powerful querying and JSONB support

**Why PostgREST over custom API:**

- Zero backend code to maintain
- Automatic API updates when schema changes
- TypeScript types generated directly from schema
- Proven performance and security
- RLS ensures authorization without application logic

#### 5.2.3 Database Design Principles

**UUIDs as primary keys:**

- Client-side ID generation for optimistic updates
- No guessable sequential IDs
- Natural fit with Supabase Auth

**JSONB for flexible structures:**

- Temporal data stored as structured JSONB
- Extensible metadata fields
- Queryable with PostgreSQL JSON operators

**Generated columns:**

- `sort_order_years` computed from `temporal_data`
- `search_vector` for full-text search
- `computed_start_date` for CE dates (PostgreSQL TIMESTAMPTZ)

**Row Level Security:**

- All authorization at database level
- Policies enforce visibility and ownership
- Works consistently across PostgREST, Edge Functions, direct SQL

**No stored procedures for CRUD:**

- Direct PostgREST operations preferred
- Database functions reserved for complex read queries only
- Cascade constraints handle delete dependencies

### 5.3 Data Flow Patterns

#### 5.3.1 Read Pattern (Timeline View)

```text
User navigates to timeline page
    ↓
Next.js SSR fetches initial data (Supabase server client)
    ↓
Page renders with data (fast first paint)
    ↓
Client hydrates with TanStack Query
    ↓
Background refetch updates data if stale
    ↓
Realtime subscription receives live updates
    ↓
Cache invalidation triggers re-render
```

**Performance optimizations:**

- Server-side rendering for initial load
- Static generation for public timelines
- Client-side caching reduces API calls
- Realtime updates prevent polling

#### 5.3.2 Write Pattern (Create Event)

```text
User submits event form
    ↓
Zod schema validates input (client-side)
    ↓
TanStack Query mutation called
    ↓
Optimistic update (UI shows success immediately)
    ↓
PostgREST INSERT via Supabase client
    ↓
RLS policy validates user owns timeline
    ↓
Database constraint validation (JSONB, foreign keys)
    ↓
Success response → confirm optimistic update
    OR
Error response → rollback optimistic update, show error
    ↓
Realtime broadcast to subscribed clients
    ↓
Other clients invalidate cache, refetch
```

**Error handling:**

- Client-side validation prevents invalid requests
- Database validation catches edge cases
- Optimistic updates rollback on error
- User sees immediate feedback (success or error)

#### 5.3.3 Search Pattern

```text
User types search query
    ↓
Debounce (300ms)
    ↓
TanStack Query mutation (search is mutation, not query)
    ↓
PostgREST query with tsvector match
    ↓
PostgreSQL full-text search (GIN index)
    ↓
Results ranked by ts_rank + importance
    ↓
Facets computed (entity counts)
    ↓
Results returned with snippets (ts_headline)
    ↓
UI renders results with highlighting
```

**Performance:**

- Debounce prevents excessive requests
- GIN indexes make search fast (<200ms)
- Results paginated (50 per page)
- Facets computed efficiently

#### 5.3.4 Real-Time Collaboration Pattern

```text
User opens timeline
    ↓
Subscribe to Realtime channel (timeline:{id})
    ↓
Send presence state (join)
    ↓
Receive presence sync (see who else is online)
    ↓
User A creates event
    ↓
PostgreSQL triggers Realtime broadcast
    ↓
User B receives postgres_changes event
    ↓
User B invalidates event query cache
    ↓
TanStack Query refetches events
    ↓
User B's UI updates (sees new event)
```

**Presence awareness:**

- Track active users in channel
- Show avatars of online users
- Update when users join/leave

### 5.4 Authentication and Authorization

#### 5.4.1 Authentication Flow

```text
User visits login page
    ↓
Chooses auth method:
  - Email + password
  - Magic link (passwordless)
  - OAuth (Google, GitHub, etc.)
    ↓
Supabase Auth handles verification
    ↓
JWT token issued (stored in httpOnly cookie)
    ↓
Profile created via database trigger (auth.users → profiles)
    ↓
User redirected to dashboard
    ↓
Token included in all API requests (Authorization header)
    ↓
Token refreshed automatically before expiration
```

**Session management:**

- JWT tokens expire after configurable period (default: 1 hour)
- Refresh tokens stored securely (httpOnly cookie)
- Automatic refresh on client
- Logout invalidates session

#### 5.4.2 Authorization (Row Level Security)

**Enforcement points:**

- All RLS policies run on every database query
- Policies use `auth.uid()` to check current user
- PostgREST, Edge Functions, direct SQL all respect RLS

**Policy patterns:**

**Public content (read):**

```sql
published = true
```

**Own content (read/write):**

```sql
user_id = auth.uid()
```

**Shared content (read):**

```sql
EXISTS (
  SELECT 1 FROM timeline_collaborators
  WHERE timeline_id = events.timeline_id
    AND user_id = auth.uid()
)
```

**Admin override:**

```sql
is_admin() -- Custom function checks user role
```

#### 5.4.3 Permission Model

| Role      | Capabilities                                                  |
| --------- | ------------------------------------------------------------- |
| Admin     | Full access to all content, user management, system settings  |
| Editor    | Create/edit/delete own content, publish, invite collaborators |
| Viewer    | View published public content + invited private content       |
| Anonymous | View published public content only                            |

### 5.5 File Storage

#### 5.5.1 Storage Strategy

**Supabase Storage (public bucket):**

- User avatars
- Small event images (<5MB)
- Thumbnails and icons
- Public URLs, no authentication required

**External URLs:**

- Large images (>5MB) - hosted on CDN
- Videos - YouTube, Vimeo embeds
- Audio - streaming service links
- Documents - Google Drive, Dropbox, etc.

**Why hybrid approach:**

- Supabase free tier: 1GB storage limit
- External hosting handles large files
- Embeds render natively (YouTube player, etc.)
- Users control their own large media

#### 5.5.2 Upload Flow

```text
User selects file
    ↓
Client validates:
  - File size (<5MB for upload)
  - File type (image, video, audio, document)
    ↓
If >5MB → show warning, recommend external hosting
    ↓
If <5MB → upload to Supabase Storage
    ↓
Generate unique filename (UUID + extension)
    ↓
Upload to public bucket (/media/{user_id}/{filename})
    ↓
Get public URL
    ↓
Create media entity in database with URL
    ↓
Associate with event/character
```

**Image processing (Edge Function):**

- Trigger on upload
- Generate thumbnail
- Extract EXIF metadata
- Update media entity with dimensions, file size

### 5.6 Deployment Architecture

#### 5.6.1 Environments

| Environment | Purpose              | URL                                            |
| ----------- | -------------------- | ---------------------------------------------- |
| Development | Local development    | [http://localhost:3000](http://localhost:3000) |
| Staging     | Testing, PR previews | {pr-number}.vercel.app                         |
| Production  | Live application     | timetraveler.app (example)                     |

**Database:**

- Development: Local Supabase (Docker)
- Staging: Supabase project (free tier)
- Production: Supabase project (Pro tier)

#### 5.6.2 CI/CD Pipeline

```text
Developer pushes to GitHub
    ↓
GitHub Actions triggered
    ↓
Run checks:
  - TypeScript compilation
  - ESLint
  - Unit tests
  - Integration tests
    ↓
If PR → Deploy to Vercel preview
    ↓
If main branch → Deploy to production
    ↓
Database migrations (if any):
  - Apply via Supabase CLI
  - Generate new TypeScript types
  - Commit types to repo
```

**Zero-downtime deployments:**

- Vercel handles canary deployments
- Database migrations backward-compatible
- Feature flags for gradual rollout

#### 5.6.3 Type Generation

```text
Database schema changes
    ↓
Run: supabase db diff
    ↓
Generate migration file
    ↓
Apply migration: supabase db push
    ↓
Generate types: supabase gen types typescript
    ↓
Commit types to repo
    ↓
Frontend automatically typed
```

**Benefits:**

- End-to-end type safety
- Autocomplete for database queries
- Compile-time error detection
- No manual type maintenance

### 5.7 Performance Optimization

#### 5.7.1 Frontend Optimizations

**Code splitting:**

- Route-based splitting (automatic with Next.js App Router)
- Dynamic imports for heavy components (D3 timeline)
- Lazy loading below-the-fold content

**Image optimization:**

- Next.js Image component (automatic)
- WebP format with JPEG fallback
- Responsive images (srcset)
- Lazy loading

**Caching:**

- TanStack Query cache (5-10 minute staleTime)
- Browser cache for static assets
- CDN caching for public pages

**Bundle size:**

- Tree shaking removes unused code
- Tailwind purges unused CSS
- Minification and compression (Brotli)

#### 5.7.2 Backend Optimizations

**Database:**

- Indexes on all foreign keys
- GIN indexes for full-text search
- Composite indexes for common queries
- Connection pooling (Supabase default)

**Queries:**

- Cursor-based pagination (not offset)
- Select only needed columns
- Join optimization (avoid N+1)
- Query result caching (TanStack Query)

**API:**

- Rate limiting (Supabase built-in)
- Edge caching for public content
- Batch operations for bulk updates

### 5.8 Monitoring and Observability

#### 5.8.1 Application Monitoring

**Error tracking:**

- Sentry (or similar) for exception tracking
- Source maps for readable stack traces
- User context attached to errors

**Performance monitoring:**

- Vercel Analytics for Web Vitals
- Custom metrics for timeline rendering
- Database query performance (slow query log)

**Real User Monitoring:**

- Track actual user experience
- Page load times (P50, P95, P99)
- API latency
- Error rates

#### 5.8.2 Infrastructure Monitoring

**Supabase Dashboard:**

- Database size and growth
- API request volume
- Realtime connection count
- Edge Function invocations

**Alerts:**

- Database approaching free tier limit
- Error rate spike
- Performance degradation
- Downtime detection

#### 5.8.3 Logging

**Client-side:**

- Console errors in development
- Structured logging in production (sent to Sentry)
- User actions tracked for debugging

**Server-side:**

- Edge Function logs (Supabase dashboard)
- Database errors logged
- Authentication events tracked

### 5.9 Security Considerations

#### 5.9.1 Data Protection

**In transit:**

- HTTPS only (enforced by Vercel)
- WSS for Realtime connections
- JWT tokens in Authorization header

**At rest:**

- Database encrypted (Supabase default)
- Sensitive data never logged
- File storage encrypted

**Input validation:**

- Client-side: Zod schemas
- Server-side: PostgreSQL constraints
- SQL injection prevented (parameterized queries via PostgREST)

#### 5.9.2 Authentication Security

**Password requirements:**

- Minimum 8 characters
- Hashed with bcrypt (Supabase Auth handles)
- Never stored in application code

**Session security:**

- JWT tokens signed with secret
- Tokens expire (configurable TTL)
- Refresh tokens rotated
- Logout invalidates tokens

**OAuth security:**

- State parameter prevents CSRF
- Tokens never exposed to client
- Supabase Auth handles flow

#### 5.9.3 Authorization Security

**RLS enforcement:**

- Every query checks policies
- No bypassing via application code
- Admin functions use explicit is_admin() check

**Least privilege:**

- Database roles limited to needed permissions
- Service role key protected (server-side only)
- Anon key used for client (limited permissions)

### 5.10 Scalability Considerations

#### 5.10.1 Current Limits (Free Tier)

**Supabase Free Tier:**

- 500 MB database storage
- 2 GB database egress/month
- 50,000 monthly active users
- 1 GB file storage
- 200 concurrent Realtime connections

**Strategies to stay within limits:**

- Aggressive client-side caching
- External media hosting
- Pagination limits result size
- Monitor usage dashboard

#### 5.10.2 Scaling Path (Pro Tier)

**When to upgrade:**

- Database >400 MB (80% of free tier)
- Egress >1.5 GB/month
- Need more than 200 concurrent Realtime users
- Want daily automated backups

**Pro tier benefits:**

- 8 GB database storage
- 250 GB egress/month
- Daily backups with PITR
- 500 concurrent Realtime connections
- Dedicated compute resources

#### 5.10.3 Horizontal Scaling

**Database:**

- Supabase Pro: Read replicas (future)
- Materialized views for expensive queries
- Partitioning for very large tables (future)

**Frontend:**

- Vercel scales automatically (serverless)
- Global CDN for static assets
- Edge caching for dynamic content

**Edge Functions:**

- Automatically scale with load
- Stateless (no session affinity needed)
- Timeout: 30s (design for async processing)

### 5.11 Disaster Recovery

#### 5.11.1 Backup Strategy

**Automated backups (Pro tier):**

- Daily full backups (7-day retention)
- Point-in-time recovery (PITR)
- Cross-region replication (optional)

**Manual backups:**

- User-initiated exports (JSON format)
- Can be re-imported if data loss
- Recommended before major changes

#### 5.11.2 Recovery Procedures

**Data loss scenarios:**

1. User accidentally deletes content → Restore from PITR (if Pro tier)
2. Database corruption → Restore from daily backup
3. Complete Supabase outage → Restore to new project from backup

**Recovery time objectives:**

- RTO (Recovery Time Objective): <4 hours
- RPO (Recovery Point Objective): <24 hours (last backup)

---

**Note:** For detailed database schema, API specifications, and implementation patterns, refer to the Technical Design Document (system-design-v3.md).

---

## 6. Hybrid Temporal System

The hybrid temporal system is the most critical and complex component of Time Traveler. It enables the system to represent dates across the full span of time—from the Big Bang (13.8 billion years ago) through the present day—while maintaining sortability, queryability, and human readability.

### 6.1 The Problem

Standard date systems have fundamental limitations:

- **PostgreSQL TIMESTAMPTZ**: Limited to 4713 BCE – 294276 CE (unusable for prehistoric dates)
- **JavaScript Date**: Limited to approximately ±270,000 years from epoch
- **VARCHAR strings**: No sorting, no range queries, no validation

The hybrid system solves this by storing temporal data as structured JSONB with generated sort columns for efficient querying.

### 6.2 TemporalData Structure

All temporal data is stored in `temporal_data` JSONB columns with the following structure:

```json
{
  "year": 66,
  "month": 3,
  "day": 15,
  "hour": 14,
  "minute": 30,
  "second": 0,
  "era": "MYA",
  "precision": "approximate",
  "uncertainty": 1000000,
  "geological_period": "Cretaceous-Paleogene boundary",
  "geological_epoch": "Late Cretaceous",
  "cosmological_epoch": null,
  "display_format": "geological",
  "dating_method": "radiometric",
  "confidence_level": "high",
  "source": "Chicxulub impact layer analysis"
}
```

**Required Fields:**

- `year` (number): Numeric year value, meaning depends on era
- `era` (string): One of `CE`, `BCE`, `KYA`, `MYA`, `BYA`
- `precision` (string): One of `exact`, `circa`, `approximate`, `estimated`, `geological`

**Optional Fields (CE/BCE only):**

- `month` (1-12): Calendar month
- `day` (1-31): Day of month
- `hour` (0-23): Hour of day
- `minute` (0-59): Minute
- `second` (0-59): Second

**Optional Metadata (all eras):**

- `uncertainty` (number): Plus/minus range in years (e.g., 1000000 for ±1 million years)
- `geological_period` (string): Geological period name (e.g., "Cretaceous", "Jurassic")
- `geological_epoch` (string): Geological epoch (e.g., "Paleocene", "Eocene")
- `cosmological_epoch` (string): Cosmological context (e.g., "Big Bang", "Recombination")
- `display_format` (string): One of `standard`, `scientific`, `geological`, `cosmological`
- `dating_method` (string): How the date was determined (e.g., "radiometric", "stratigraphy")
- `confidence_level` (string): One of `high`, `medium`, `low`
- `source` (string): Citation or reference for the temporal data

### 6.3 Era Definitions

| Era | Name               | Range                      | Use Case                     |
| --- | ------------------ | -------------------------- | ---------------------------- |
| CE  | Common Era         | Year 1 – present           | Modern historical dates      |
| BCE | Before Common Era  | Year 1 BCE – infinite past | Ancient history              |
| KYA | Thousand Years Ago | 1,000 – 999,999 years      | Recent prehistory, Ice Age   |
| MYA | Million Years Ago  | 1 – 999 million years      | Dinosaurs, geological eras   |
| BYA | Billion Years Ago  | 1 – 13.8 billion years     | Formation of Earth, Big Bang |

### 6.4 Era Conversion Logic

Each era maps to a unified numeric timeline for sorting and range queries. The conversion formula generates the `sort_order_years` column:

```sql
CASE
  WHEN (temporal_data->>'era') = 'CE'  THEN  (temporal_data->>'year')::BIGINT
  WHEN (temporal_data->>'era') = 'BCE' THEN -(temporal_data->>'year')::BIGINT
  WHEN (temporal_data->>'era') = 'KYA' THEN -(temporal_data->>'year')::BIGINT * 1000
  WHEN (temporal_data->>'era') = 'MYA' THEN -(temporal_data->>'year')::BIGINT * 1000000
  WHEN (temporal_data->>'era') = 'BYA' THEN -(temporal_data->>'year')::BIGINT * 1000000000
  ELSE 0
END
```

**Examples:**

- CE 2024 → `2024`
- 44 BCE → `-44`
- 12 KYA → `-12000`
- 66 MYA → `-66000000`
- 13.8 BYA → `-13800000000`

This creates a continuous numeric axis where negative values represent the past and positive values represent CE dates.

### 6.5 Sort Order Computation

The `sort_order_years` column is a **generated column** (PostgreSQL `GENERATED ALWAYS AS ... STORED`). This means:

- Values are automatically computed on insert/update
- The column is indexed for fast sorting and range queries
- No application code needed to maintain sort order
- Guaranteed consistency between JSONB and sort column

Both start and end dates have separate sort columns:

- `temporal_data` → `sort_order_years`
- `end_temporal_data` → `sort_order_end`

This separation enables proper range overlap queries.

### 6.6 Precision Level Semantics

| Precision     | Meaning                                  | Display Example               | Use Case                             |
| ------------- | ---------------------------------------- | ----------------------------- | ------------------------------------ |
| `exact`       | Known to the specified unit              | "March 15, 44 BCE at 2:30 PM" | Modern documented events             |
| `circa`       | Approximate, within a few years          | "c. 1450 CE"                  | Historical events with unclear dates |
| `approximate` | Rough estimate, decades/centuries        | "~12,000 years ago"           | Archaeological estimates             |
| `estimated`   | Scientific estimate with uncertainty     | "66 ± 1 MYA"                  | Radiometric dating results           |
| `geological`  | Geological time period, not precise date | "Late Cretaceous (66 MYA)"    | Geological events                    |

### 6.7 Uncertainty Representation

The `uncertainty` field represents a plus/minus range in years:

- Stored as a single number (the range in each direction)
- Display format: `[year] ± [uncertainty] [era]`
- Example: `{ year: 66, era: "MYA", uncertainty: 1000000 }` → "66 ± 1 MYA"
- Used primarily with `estimated` and `geological` precision levels

### 6.8 Era-Specific Field Validation

**CE and BCE dates:**

- May include `month`, `day`, `hour`, `minute`, `second`
- All time components are optional (can specify just year, or year-month, etc.)
- Invalid combinations rejected (e.g., February 30, hour 25)

**Prehistoric dates (KYA, MYA, BYA):**

- Must NOT include `month`, `day`, `hour`, `minute`, `second`
- Validation error if these fields are present
- Only `year` and era-specific metadata allowed

### 6.9 BCE Year 0 Enforcement

Historically, there is no year 0. The calendar goes directly from 1 BCE to 1 CE.

**Validation rules:**

- `year: 0` with `era: "BCE"` is **invalid** and rejected
- `year: 0` with `era: "CE"` is **invalid** and rejected
- Temporal comparison logic accounts for the skip (1 BCE + 1 year = 1 CE)

### 6.10 Computed TIMESTAMPTZ Column

For CE dates within PostgreSQL's range (after 4713 BCE), a `computed_start_date` TIMESTAMPTZ column is generated:

```sql
CASE
  WHEN (temporal_data->>'era') = 'CE'
    AND (temporal_data->>'year')::BIGINT > -4712
  THEN make_timestamptz(
    (temporal_data->>'year')::INT,
    COALESCE((temporal_data->>'month')::INT, 1),
    COALESCE((temporal_data->>'day')::INT, 1),
    COALESCE((temporal_data->>'hour')::INT, 0),
    COALESCE((temporal_data->>'minute')::INT, 0),
    COALESCE((temporal_data->>'second')::NUMERIC, 0)
  )
  ELSE NULL
END
```

This enables:

- Native PostgreSQL date functions for modern dates
- Time zone conversion (stored as UTC, displayed in user's time zone)
- Date arithmetic (add/subtract intervals)

**Important:** Prehistoric dates have `NULL` in the computed column and rely entirely on `sort_order_years`.

### 6.11 Display Format Auto-Selection

When `display_format` is not explicitly set, the system automatically chooses based on era and precision:

| Era    | Precision    | Auto-Selected Format | Example Output             |
| ------ | ------------ | -------------------- | -------------------------- |
| CE/BCE | exact, circa | `standard`           | "March 15, 44 BCE"         |
| CE/BCE | approximate  | `standard`           | "c. 1450 CE"               |
| KYA    | any          | `scientific`         | "12 ± 0.5 KYA"             |
| MYA    | geological   | `geological`         | "Late Cretaceous (66 MYA)" |
| MYA    | estimated    | `scientific`         | "66 ± 1 MYA"               |
| BYA    | any          | `cosmological`       | "Big Bang (13.8 BYA)"      |

Users can override this by explicitly setting `display_format` in the temporal data.

### 6.12 Start/End Date Separation

Events and periods have two temporal columns:

- `temporal_data` (start date) → `sort_order_years`
- `end_temporal_data` (end date) → `sort_order_end`

**Why separate columns:**

- **Range overlap queries**: Finding events that overlap a time range requires comparing both start and end boundaries
- **Simpler validation**: Each JSONB object has one clear schema
- **Cleaner API**: TemporalService functions work on a single temporal object at a time

**For point-in-time events:** `end_temporal_data` is `NULL` or equal to `temporal_data`.

### 6.13 Range Overlap Queries

To find events that overlap a temporal range `[query_start, query_end]`:

```sql
WHERE sort_order_years <= query_end
  AND (sort_order_end >= query_start OR sort_order_end IS NULL)
```

This logic correctly handles:

- Point events (start = end)
- Ongoing events (end is NULL)
- Period events with explicit end dates

### 6.14 Client-Side TemporalService

All temporal logic lives in a TypeScript `TemporalService` class (not in the database):

**Responsibilities:**

- `toSortableYears(temporal: TemporalData): number` - Converts temporal data to sort order
- `formatDisplay(temporal: TemporalData): string` - Generates human-readable display string
- `createFromDate(date: Date): TemporalData` - Converts JavaScript Date to TemporalData
- `createFromYear(year: number, era: Era): TemporalData` - Creates temporal data from year/era
- `isBefore(a: TemporalData, b: TemporalData): boolean` - Temporal comparison
- `isAfter(a: TemporalData, b: TemporalData): boolean` - Temporal comparison
- `overlaps(a: TemporalData, aEnd: TemporalData, b: TemporalData, bEnd: TemporalData): boolean` - Range overlap
- `autoSelectDisplayFormat(temporal: TemporalData): DisplayFormat` - Chooses display format

The service is pure TypeScript with no database dependencies, making it testable and reusable across components.

### 6.15 Zod Schema Validation

Temporal data is validated using Zod schemas on both client and server:

```typescript
export const temporalDataSchema = z
  .object({
    year: z.number(),
    month: z.number().min(1).max(12).optional(),
    day: z.number().min(1).max(31).optional(),
    hour: z.number().min(0).max(23).optional(),
    minute: z.number().min(0).max(59).optional(),
    second: z.number().min(0).max(59).optional(),
    era: z.enum(["CE", "BCE", "KYA", "MYA", "BYA"]),
    precision: z.enum([
      "exact",
      "circa",
      "approximate",
      "estimated",
      "geological",
    ]),
    uncertainty: z.number().optional(),
    geological_period: z.string().optional(),
    geological_epoch: z.string().optional(),
    cosmological_epoch: z.string().optional(),
    display_format: z
      .enum(["standard", "scientific", "geological", "cosmological"])
      .optional(),
    dating_method: z.string().optional(),
    confidence_level: z.enum(["high", "medium", "low"]).optional(),
    source: z.string().optional(),
  })
  .refine(
    (data) => {
      // BCE year 0 validation
      if (data.era === "BCE" && data.year === 0) return false;
      if (data.era === "CE" && data.year === 0) return false;

      // Prehistoric eras cannot have month/day/time
      if (["KYA", "MYA", "BYA"].includes(data.era)) {
        if (data.month || data.day || data.hour || data.minute || data.second) {
          return false;
        }
      }

      return true;
    },
    { message: "Invalid temporal data configuration" },
  );
```

**Validation occurs:**

- Client-side in form inputs (immediate feedback)
- Server-side in API routes (security/integrity)
- During bulk import (reject invalid rows)

### 6.16 Temporal Input Component Behavior

The `TemporalInput` component is a single unified form element that adapts based on era selection:

**All eras show:**

- Year input (number)
- Era selector (dropdown: CE, BCE, KYA, MYA, BYA)
- Precision selector (dropdown: exact, circa, approximate, estimated, geological)

**CE/BCE additionally show:**

- Month selector (1-12, optional)
- Day selector (1-31, optional, validated against month)
- Hour/minute/second inputs (optional, only if day is specified)

**Prehistoric eras (KYA/MYA/BYA) additionally show:**

- Uncertainty input (±years)
- Geological period input (text, autocomplete from known periods)
- Geological epoch input (text, autocomplete)
- Dating method input (text)
- Confidence level selector (high/medium/low)

**All eras show conditionally:**

- Cosmological epoch input (only for BYA or significant KYA/MYA events)
- Source input (optional citation field)

**Live preview:**

- As user types, a read-only preview shows the formatted display string
- Updates in real-time using `TemporalService.formatDisplay()`

### 6.17 Inline Validation Feedback

The temporal input component provides immediate inline validation:

**Error messages:**

- "Year 0 does not exist. Use 1 BCE or 1 CE."
- "Month and day cannot be specified for prehistoric dates."
- "Please select an era."
- "Year must be a positive number."
- "Invalid date: February 30 does not exist."
- "Hour must be between 0 and 23."

**Warning messages:**

- "Consider adding uncertainty range for geological dates."
- "Dating method helps document the source of this temporal data."

**Visual feedback:**

- Invalid fields show red border and error icon
- Valid fields show green checkmark
- Optional fields show subtle helper text

### 6.18 Geological Context Fields

The geological metadata fields are **optional** but recommended for prehistoric dates:

- `geological_period`: Broad divisions like "Cretaceous", "Jurassic", "Triassic"
- `geological_epoch`: Subdivisions like "Paleocene", "Eocene", "Oligocene"
- `dating_method`: How the date was determined (e.g., "radiometric", "stratigraphy", "biostratigraphy")
- `confidence_level`: Assessment of dating accuracy

**Usage patterns:**

- For well-established geological events (K-Pg boundary), include full metadata
- For estimated dates with uncertainty, include confidence level
- For archaeological finds, include dating method for scholarly reference

### 6.19 Cosmological Context

The `cosmological_epoch` field is used for universe-scale events:

- "Big Bang" (13.8 BYA)
- "Recombination" (380,000 years after Big Bang)
- "Formation of first stars" (100-200 million years after Big Bang)
- "Formation of Earth" (4.54 BYA)
- "Formation of Moon" (4.51 BYA)

This field is optional but helps provide context for cosmological timelines.

### 6.20 Logarithmic Scale Computation

For visualization, events spanning billions of years need logarithmic positioning:

```typescript
function computeLogPosition(sortOrderYears: number): number {
  return Math.sign(sortOrderYears) * Math.log10(Math.abs(sortOrderYears) + 1);
}
```

**Why logarithmic:**

- Linear scale makes prehistoric events invisible (crushed to the left edge)
- Log scale spreads events across the timeline proportionally
- User can toggle between linear and log views

**Display position formula:**

- Big Bang (−13.8B years) → log position ≈ −10.14
- Formation of Earth (−4.54B years) → log position ≈ −9.66
- Dinosaurs (−66M years) → log position ≈ −7.82
- Ice Age (−12K years) → log position ≈ −4.08
- 2024 CE → log position ≈ 3.31

This creates visually balanced timelines where each order of magnitude gets equal space.

### 6.21 Temporal Data Migration Strategy

If importing temporal data from external sources, the system must handle invalid data:

**Import validation:**

- Parse temporal data and validate against Zod schema
- Reject rows with invalid temporal structure
- Log validation errors with row number and reason

**Fallback strategies:**

- If era is missing but year > 0, default to CE
- If precision is missing, default to "approximate"
- If month/day are specified for prehistoric dates, strip them and log warning
- If year 0 is encountered, reject the row (cannot auto-correct)

**Reporting:**

- Bulk import returns summary: X rows imported, Y rows rejected
- Detailed error log available for download

### 6.22 Read-Only Temporal Display

Temporal data is rendered differently depending on context:

**Timeline view (compact):**

- Show era and year only: "66 MYA", "1450 CE", "12 KYA"
- Use color coding by era (blue for CE, gray for BCE, earth tones for prehistoric)
- Display uncertainty as error bars on timeline visualization

**Event card (medium):**

- Show formatted display: "Late Cretaceous (66 MYA)", "March 15, 44 BCE"
- Include precision indicator icon (exact = pin, circa = ~, approximate = ?, geological = layers)
- Show geological period if present

**Event detail page (full):**

- Show complete formatted display with all metadata
- Display uncertainty range if present: "66 ± 1 MYA"
- Show geological/cosmological context in separate metadata section
- Include dating method and confidence level
- Link to source if provided

### 6.23 Sorting and Filtering in Views

**Sorting:**

- All event lists sort by `sort_order_years` ASC (oldest first) by default
- User can toggle to DESC (newest first)
- Sort is fast due to BTREE index on `sort_order_years`

**Filtering:**

- Range filter: "Show events between [start] and [end]"
- User inputs two temporal values via TemporalInput component
- Backend converts to sort_order_years and executes range query
- Era filter: "Show only MYA events", "Show only CE/BCE events"
- Precision filter: "Show only exact dates", "Show only geological estimates"

**Filter UI:**

- Collapsible filter panel on timeline view
- Applied filters shown as chips (removable)
- Clear all filters button

### 6.24 Time Zone Handling

**Storage:**

- All CE dates with time components are stored as UTC in `computed_start_date` TIMESTAMPTZ
- PostgreSQL automatically handles time zone conversion on insert

**Display:**

- Frontend detects user's browser time zone (`Intl.DateTimeFormat().resolvedOptions().timeZone`)
- CE dates are displayed in user's local time zone
- Time zone label shown for ambiguous cases: "March 15, 44 BCE 2:30 PM EST"

**Recommendation:**

- For historical events before modern time zones existed, time components should be avoided
- For modern events (20th-21st century), time zone is important and should be stored as UTC

### 6.25 Temporal Comparison Logic

The TemporalService provides comparison functions:

```typescript
isBefore(a: TemporalData, b: TemporalData): boolean {
  return this.toSortableYears(a) < this.toSortableYears(b);
}

isAfter(a: TemporalData, b: TemporalData): boolean {
  return this.toSortableYears(a) > this.toSortableYears(b);
}

overlaps(
  aStart: TemporalData,
  aEnd: TemporalData | null,
  bStart: TemporalData,
  bEnd: TemporalData | null
): boolean {
  const aStartYears = this.toSortableYears(aStart);
  const aEndYears = aEnd ? this.toSortableYears(aEnd) : aStartYears;
  const bStartYears = this.toSortableYears(bStart);
  const bEndYears = bEnd ? this.toSortableYears(bEnd) : bStartYears;

  return aStartYears <= bEndYears && aEndYears >= bStartYears;
}

contains(
  period: { start: TemporalData, end: TemporalData | null },
  event: TemporalData
): boolean {
  const eventYears = this.toSortableYears(event);
  const periodStart = this.toSortableYears(period.start);
  const periodEnd = period.end ? this.toSortableYears(period.end) : Infinity;

  return eventYears >= periodStart && eventYears <= periodEnd;
}
```

These functions are used throughout the UI to determine event relationships.

### 6.26 Query Performance Requirements

Temporal queries must not impact the 2-second page load target:

**Indexing strategy:**

- BTREE index on `sort_order_years` (fast sorting and range scans)
- BTREE index on `(timeline_id, sort_order_years)` for timeline-specific queries
- BTREE index on `(sort_order_years, sort_order_end)` for range overlap queries

**Query optimization:**

- Use indexed sort columns, never sort by JSONB fields directly
- Limit result sets with cursor-based pagination (default 50 events per page)
- For master timeline view, pre-compute aggregations (count of events per time bucket)

**Performance targets:**

- Timeline view with 100 events: < 200ms query time
- Range filter across 10,000 events: < 500ms query time
- Event detail page with temporal metadata: < 100ms query time

**Monitoring:**

- Log slow queries (> 1s) for investigation
- Use `EXPLAIN ANALYZE` to verify index usage
- Track 95th percentile query times in production

---

## 7. User Interface Requirements

This section defines the visual design system, interaction patterns, and component specifications for Time Traveler. The design philosophy emphasizes simplicity, modernism, minimalism, and high functionality with soft, warm colors, suitable contrast, and a flat surface aesthetic.

### 7.1 Design System Foundation

#### 7.1.1 Component Library

**Primary framework:**

- **shadcn/ui** as component library foundation
- Built on **Radix UI** primitives (accessibility and unstyled components)
- **Tailwind CSS** for styling and theming
- **Headless UI** for complex interactions where shadcn doesn't provide coverage

**Benefits:**

- Accessibility built-in (WCAG 2.1 AA compliant out of the box)
- Copy-paste component architecture (full control over code)
- TypeScript-first with excellent type safety
- Customizable via Tailwind configuration

#### 7.1.2 Design Tokens

Design tokens are the atomic values that define the visual language. All tokens are defined in Tailwind configuration and CSS variables for theme switching.

**Token categories:**

- Colors (primary, secondary, accent, neutral, semantic, era-specific)
- Spacing (consistent scale for margins, padding, gaps)
- Typography (font families, sizes, weights, line heights)
- Border radius (subtle rounding for modern feel)
- Shadows (elevation system for depth)
- Animation (easing curves, durations, delays)

**Implementation:**

```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: { /* design tokens */ },
    spacing: { /* 4px base unit */ },
    fontSize: { /* type scale */ },
    // ...
  }
}
```

CSS variables for theme switching:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  /* ... */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... */
}
```

#### 7.1.3 Light and Dark Themes

**Light theme (default):**

- Clean white backgrounds with subtle warm tint
- Dark text with excellent contrast
- Soft shadows for elevation
- Warm accent colors

**Dark theme:**

- Deep charcoal backgrounds (not pure black)
- Light text optimized for readability
- Reduced shadow intensity
- Slightly desaturated colors for eye comfort

**Theme switching:**

- User preference stored in localStorage
- Respects system preference (prefers-color-scheme)
- Smooth transition between themes (CSS transitions)
- Theme toggle in user menu

### 7.2 Design Tokens

#### 7.2.1 Color Palette

**Primary colors:**

- Primary: Warm blue (#4F7CAC) - brand identity, interactive elements
- Primary hover: Darker blue (#3D5C7D)
- Primary muted: Light blue background (#E8F1F8)

**Neutral grays:**

- Background: #FAFAFA (light), #1A1A1A (dark)
- Surface: #FFFFFF (light), #242424 (dark)
- Border: #E5E5E5 (light), #3A3A3A (dark)
- Muted text: #737373 (light), #A3A3A3 (dark)
- Foreground text: #171717 (light), #FAFAFA (dark)

**Semantic colors:**

- Success: Warm green (#10B981)
- Error: Soft red (#EF4444)
- Warning: Amber (#F59E0B)
- Info: Sky blue (#3B82F6)

**Soft, warm palette:**
All colors have slight warm temperature shift (more red/yellow, less pure blue/gray) to create inviting atmosphere while maintaining professional appearance.

#### 7.2.2 Era-Specific Colors

Colors for temporal eras, used in timeline visualization and event markers.

> **Revised in fidelity-2 (Milestone 6).** The original palette (warm blue / amber / earth brown / forest green / cosmic purple) was **replaced** because it failed the project's red-green colorblindness constraint: brown, amber, and forest green cluster in the warm-to-yellow-green band where deuteranopic/protanopic users lose separation. The finalized palette spreads the five eras **evenly around the color wheel** to maximize inter-era hue distance. **Hue is never the sole signal** — the `TemporalDisplay` primitive also renders the literal era code (`CE`/`BCE`/`KYA`/`MYA`/`BYA`) in a mono typographic treatment, so the distinction survives total color loss.
>
> **Source of truth:** `packages/ui/src/styles/tokens.css` (`--color-era-*`), mirrored in `tokens.ts`. The OKLCH values below are canonical; if they drift from the token file, the token file wins. See [docs/design/admin/03-aesthetic-notes.md](../design/admin/03-aesthetic-notes.md) § _Era palette (finalized)_.

Finalized palette (dark mode — the only mode in fidelity-2):

| Era | Dark Theme (canonical)           | Hue  | Description         |
| --- | -------------------------------- | ---- | ------------------- |
| CE  | `oklch(0.78 0.10 60)` — amber    | 60°  | Modern              |
| BCE | `oklch(0.78 0.10 100)` — gold    | 100° | Ancient, historical |
| KYA | `oklch(0.74 0.09 200)` — teal    | 200° | Prehistoric         |
| MYA | `oklch(0.74 0.09 260)` — blue    | 260° | Geological          |
| BYA | `oklch(0.74 0.10 320)` — magenta | 320° | Cosmological, vast  |

Light-theme era values are **deferred** along with the rest of light mode (fidelity-2 is dark-default, no light toggle); they will be derived from these hues when a light theme is introduced.

**Contrast validation:**
All era colors are validated against the dark surface tokens for WCAG AA (3:1 for UI components) and re-checked for red-green colorblind separation across the full five-era set together (not pairwise).

#### 7.2.3 Spacing Scale

**4px base unit**, Fibonacci-inspired scale:

| Token        | Value | Usage                               |
| ------------ | ----- | ----------------------------------- |
| `spacing-0`  | 0px   | No space                            |
| `spacing-1`  | 4px   | Tight spacing, icon gaps            |
| `spacing-2`  | 8px   | Small gaps between related elements |
| `spacing-3`  | 12px  | Comfortable spacing                 |
| `spacing-4`  | 16px  | Default spacing (most common)       |
| `spacing-5`  | 20px  | Section spacing                     |
| `spacing-6`  | 24px  | Large gaps                          |
| `spacing-8`  | 32px  | Major section breaks                |
| `spacing-10` | 40px  | Page-level spacing                  |
| `spacing-12` | 48px  | Hero sections                       |
| `spacing-16` | 64px  | Extra large spacing                 |

**Application:**

- Component padding: `spacing-4` (16px)
- Form field gaps: `spacing-4`
- Card spacing: `spacing-6`
- Page margins: `spacing-8` or `spacing-10`

#### 7.2.4 Typography Scale

**Font families:**

- **UI/Sans-serif**: Inter (primary), system-ui fallback
- **Content/Serif**: Merriweather (event details, stories), Georgia fallback
- **Monospace**: JetBrains Mono (code, data), monospace fallback

**Type scale:**

| Token       | Size | Line Height | Weight | Usage                    |
| ----------- | ---- | ----------- | ------ | ------------------------ |
| `text-xs`   | 12px | 16px        | 400    | Captions, helper text    |
| `text-sm`   | 14px | 20px        | 400    | Secondary text, metadata |
| `text-base` | 16px | 24px        | 400    | Body text (default)      |
| `text-lg`   | 18px | 28px        | 400    | Emphasized body          |
| `text-xl`   | 20px | 28px        | 500    | Subheadings              |
| `text-2xl`  | 24px | 32px        | 600    | Section headings         |
| `text-3xl`  | 30px | 36px        | 600    | Page headings            |
| `text-4xl`  | 36px | 40px        | 700    | Hero headings            |
| `text-5xl`  | 48px | 1           | 700    | Display text             |

**Font weights:**

- Regular: 400 (body text)
- Medium: 500 (emphasized text, labels)
- Semibold: 600 (headings)
- Bold: 700 (hero headings, very strong emphasis)

**Line height optimization:**

- Tighter line heights for headings (better visual rhythm)
- Generous line heights for body text (readability)

#### 7.2.5 Border Radius

**Subtle rounding** for modern but not overly playful aesthetic:

| Token          | Value  | Usage                           |
| -------------- | ------ | ------------------------------- |
| `rounded-sm`   | 2px    | Buttons, inputs, small elements |
| `rounded`      | 4px    | Cards, containers (default)     |
| `rounded-md`   | 6px    | Larger cards, modals            |
| `rounded-lg`   | 8px    | Hero sections, prominent panels |
| `rounded-full` | 9999px | Avatars, pills, badges          |

**Flat surface feel:**

- Avoid excessive rounding
- Prefer `rounded` (4px) for most elements
- Full rounding only for circular/pill elements

#### 7.2.6 Shadow System

**Subtle elevation** for depth without heavy shadows:

| Token       | Definition                  | Usage                         |
| ----------- | --------------------------- | ----------------------------- |
| `shadow-sm` | 0 1px 2px rgba(0,0,0,0.05)  | Subtle lift (inputs, buttons) |
| `shadow`    | 0 1px 3px rgba(0,0,0,0.1)   | Default elevation (cards)     |
| `shadow-md` | 0 4px 6px rgba(0,0,0,0.1)   | Medium elevation (dropdowns)  |
| `shadow-lg` | 0 10px 15px rgba(0,0,0,0.1) | High elevation (modals)       |
| `shadow-xl` | 0 20px 25px rgba(0,0,0,0.1) | Maximum elevation (popovers)  |

**Dark theme adjustments:**

- Reduced shadow opacity (darker backgrounds need less shadow)
- Subtle glow instead of shadow for dark mode

**Flat aesthetic:**

- Most elements use `shadow-sm` or `shadow`
- Heavy shadows (`shadow-lg`, `shadow-xl`) reserved for modals and critical UI

#### 7.2.7 Animation System

**Easing curves:**

- `ease-in-out`: Smooth start and end (default)
- `ease-out`: Quick start, slow end (UI responses)
- `ease-in`: Slow start, quick end (dismissing elements)

**Durations:**

- `duration-75`: 75ms (micro-interactions, hover states)
- `duration-150`: 150ms (button presses, focus states)
- `duration-300`: 300ms (transitions, modal open/close)
- `duration-500`: 500ms (page transitions, theme switching)

**Respect reduced motion:**

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 7.3 Temporal Input Component

The temporal input component is the most complex and critical UI element, enabling users to input dates across all eras with appropriate metadata.

#### 7.3.1 Component Overview

**Single unified component** that morphs based on era selection:

- Component name: `TemporalInput`
- Props: `value`, `onChange`, `label`, `error`, `disabled`, `required`
- Returns: TemporalData object (validated via Zod schema)

**Layout:**

- Vertical stacked layout (mobile-first)
- Grouped related fields (year/month/day together)
- Live preview pane at bottom
- Responsive: single column on mobile, two columns on desktop

#### 7.3.2 Era Selector

**Type:** Segmented control (radio button group styled as tabs)

**Options:** CE | BCE | KYA | MYA | BYA

**Styling:**

- Horizontal pill-style selector
- Active era: filled background (primary color)
- Inactive eras: transparent background, border
- Icons optional (calendar for CE/BCE, layers for geological)

**Behavior:**

- Clicking era switches all visible fields
- Fields animate in/out based on era-specific requirements
- Previously entered data preserved when switching back

**Accessibility:**

- Radio buttons with custom styling
- Keyboard navigation (arrow keys)
- Screen reader announces "Era: Common Era selected"

#### 7.3.3 Year Input

**Type:** Number input with optional decimal support

**Styling:**

- Standard text input
- Right-aligned for numeric data
- Placeholder: "Year" or "13.8" (for BYA)

**Validation:**

- Positive numbers only
- Decimals allowed for BYA/MYA (e.g., 13.8 BYA)
- Integers for CE/BCE/KYA
- Year 0 rejected (BCE and CE)
- Real-time validation with error message

**Behavior:**

- Auto-focuses when component mounts
- Increment/decrement with arrow keys
- Step size: 1 for CE/BCE/KYA, 0.1 for MYA/BYA

#### 7.3.4 Month and Day Selectors

**Visibility:** CE and BCE only (hidden for prehistoric eras)

**Month:**

- Dropdown select: "January" - "December"
- Optional (can specify year-only)
- Placeholder: "Month (optional)"

**Day:**

- Number input (1-31)
- Validation based on selected month (February 30 rejected)
- Optional
- Disabled if month not selected

**Animation:**

- Slide in from right when CE/BCE selected
- Slide out to right when switching to prehistoric era
- Smooth 300ms transition

#### 7.3.5 Time Inputs

**Visibility:** CE/BCE only, and only if day is specified

**Fields:** Hour (0-23) | Minute (0-59) | Second (0-59)

**Layout:**

- Horizontal row of three number inputs
- Colon separators between fields
- Compact sizing

**Behavior:**

- All optional (can specify just hour, or hour:minute)
- 24-hour format
- Real-time validation

#### 7.3.6 Precision Selector

**Type:** Dropdown select

**Options:** Exact | Circa | Approximate | Estimated | Geological

**Default:** Exact for CE/BCE, Estimated for prehistoric

**Styling:**

- Standard dropdown
- Icon indicators for each precision type

**Behavior:**

- Changes live preview formatting
- "Geological" precision shows additional fields

#### 7.3.7 Uncertainty Input

**Visibility:** Shows when precision is "Estimated" or "Geological"

**Type:** Number input with unit label

**Layout:**

- ± symbol prefix
- Number input
- Unit label: "years" (or "million years" for MYA)

**Placeholder:** "Uncertainty range (optional)"

**Example:** `± 1` for "66 ± 1 MYA"

#### 7.3.8 Geological Metadata Inputs

**Visibility:** Prehistoric eras (KYA, MYA, BYA) or when precision is "Geological"

**Fields:**

1. **Geological Period** (text input with autocomplete)
   - Suggestions: "Cretaceous", "Jurassic", "Triassic", "Paleozoic", etc.
   - Optional
   - Helper text: "e.g., Cretaceous, Jurassic"

2. **Geological Epoch** (text input with autocomplete)
   - Suggestions: "Paleocene", "Eocene", "Oligocene", etc.
   - Optional
   - Helper text: "Subdivision of period"

3. **Dating Method** (text input)
   - Examples: "Radiometric", "Stratigraphy", "Biostratigraphy"
   - Optional
   - Helper text: "How this date was determined"

4. **Confidence Level** (segmented control)
   - Options: High | Medium | Low
   - Optional
   - Visual indicators (green/yellow/red)

**Layout:**

- Two-column grid on desktop
- Single column on mobile
- Collapsible section: "Geological Metadata (optional)"

#### 7.3.9 Cosmological Epoch Input

**Visibility:** BYA era or when event is cosmological in nature

**Type:** Text input with autocomplete

**Suggestions:**

- "Big Bang"
- "Recombination"
- "Formation of first stars"
- "Formation of Earth"
- "Formation of Moon"

**Placeholder:** "Cosmological context (optional)"

#### 7.3.10 Live Preview Pane

**Location:** Bottom of component (always visible)

**Content:**

- Formatted display string using TemporalService.formatDisplay()
- Updates in real-time as user types
- Shows exactly how the date will appear in the UI

**Styling:**

- Light background (muted primary color)
- Larger text (text-lg)
- Read-only
- Icon indicating preview (eye icon)

**Examples:**

- "March 15, 44 BCE"
- "Cretaceous-Paleogene boundary (~66 MYA)"
- "Big Bang (~14 BYA)"

#### 7.3.11 Validation Feedback

**Inline errors:**

- Red border on invalid fields
- Error icon (exclamation circle)
- Error message below field
- Appears immediately on blur

**Error messages:**

- "Year 0 does not exist. Use 1 BCE or 1 CE."
- "Month and day cannot be specified for prehistoric dates."
- "Please enter a valid year."
- "February 30 does not exist."

**Warning messages:**

- Yellow/amber styling
- "Consider adding uncertainty range for estimated dates."
- "Dating method helps document the source of this temporal data."

**Success states:**

- Green checkmark icon when field valid
- Subtle green border
- Only shows after user interaction

#### 7.3.12 Field Show/Hide Logic

**Animation:**

- Fields slide in/out with 300ms ease-in-out
- Fade opacity 0 → 1 (in) or 1 → 0 (out)
- Maintain layout space during transition (no jarring jumps)

**Logic table:**

| Era | Year | Month/Day | Time       | Geological | Cosmological |
| --- | ---- | --------- | ---------- | ---------- | ------------ |
| CE  | ✓    | ✓         | ✓ (if day) | ✗          | ✗            |
| BCE | ✓    | ✓         | ✓ (if day) | ✗          | ✗            |
| KYA | ✓    | ✗         | ✗          | ✓          | ✗            |
| MYA | ✓    | ✗         | ✗          | ✓          | ✗            |
| BYA | ✓    | ✗         | ✗          | ✓          | ✓            |

#### 7.3.13 Accessibility

**Keyboard navigation:**

- Tab through all fields in logical order
- Shift+Tab for reverse navigation
- Arrow keys in segmented controls (era, precision)
- Enter to submit (if in form context)

**Screen reader support:**

- All fields have accessible labels (via `<label>` or `aria-label`)
- Error messages linked with `aria-describedby`
- Live region announces preview updates
- Fieldset with legend for grouped inputs

**Focus management:**

- Visible focus indicators on all fields
- Focus moved to error field on validation failure
- Tab trapping in modal contexts

#### 7.3.14 Mobile-Responsive Layout

**Mobile (<768px):**

- Single column layout
- Stacked fields
- Full-width inputs
- Era selector wraps to two rows if needed
- Larger tap targets (44x44px minimum)

**Desktop (>768px):**

- Two-column grid for geological metadata
- Horizontal time inputs
- Wider era selector
- Side-by-side month/day

### 7.4 Timeline Visualization

The timeline visualization is the centerpiece of the public interface, enabling users to explore temporal data across vast scales.

#### 7.4.1 Rendering Technology

**Primary: D3.js with SVG**

**Rationale:**

- D3.js provides powerful data binding and transformation
- SVG ensures crisp rendering at any zoom level
- Excellent accessibility (SVG elements have semantic meaning)
- Easier to add interactivity (hover, click) vs. Canvas

**Fallback: Canvas for very large datasets**

- If timeline has >5000 events, use Canvas for performance
- Hybrid approach: Canvas for events, SVG for axis and labels
- Virtualization: only render visible events

**Implementation libraries:**

- d3-scale for temporal scaling
- d3-axis for timeline axis
- d3-zoom for zoom/pan behavior
- d3-selection for DOM manipulation

#### 7.4.2 Horizontal Scrollable Timeline

**Layout:**

- Timeline runs horizontally (left = past, right = future/present)
- Infinite horizontal scroll (no boundaries)
- Viewport shows portion of timeline
- Scroll position persists in URL (deep linking)

**Scroll behavior:**

- Smooth scrolling with momentum
- Mouse drag to pan
- Arrow keys for incremental pan
- Home/End keys jump to timeline start/end

#### 7.4.3 Logarithmic Scale

**Default for timelines spanning >3 orders of magnitude**

**Formula:**

```javascript
position = sign(sortOrderYears) * Math.log10(Math.abs(sortOrderYears) + 1);
```

**Benefits:**

- Prehistoric events visible (not crushed to left edge)
- Each order of magnitude gets equal visual space
- Smooth zoom transitions

**Visual indicators:**

- Axis labels show log scale (1, 10, 100, 1K, 10K, 100K, 1M, 10M, 100M, 1B, 10B)
- "Log scale" badge in corner
- Toggle to switch to linear

#### 7.4.4 Linear Scale Option

**User-toggled alternative**

**Formula:**

```javascript
position = sortOrderYears;
```

**Better for:**

- Timelines with similar-magnitude events (e.g., all 20th century)
- Precise temporal spacing important
- Educational contexts where log scale confuses

**Toggle control:**

- Button in timeline controls: "Log" | "Linear"
- Icon indicators (logarithmic curve vs. straight line)

#### 7.4.5 Event Markers

**Visual representation:**

| Event Type     | Shape            | Size (importance 1-10) |
| -------------- | ---------------- | ---------------------- |
| milestone      | Circle           | 4px-16px radius        |
| period         | Rectangle (span) | Height: 8px-32px       |
| incident       | Diamond          | 6px-20px               |
| discovery      | Star             | 8px-24px               |
| creation       | Triangle (up)    | 8px-20px               |
| destruction    | Triangle (down)  | 8px-20px               |
| transformation | Hexagon          | 8px-20px               |
| migration      | Arrow            | 10px-24px              |
| conflict       | Cross            | 8px-20px               |
| ceremony       | Pentagon         | 8px-20px               |

**Color:**

- Default: Era color (per §7.2.2 — e.g. CE amber, BCE gold, KYA teal, MYA blue, BYA magenta)
- Override: Category color if assigned
- Multiple categories: blend or stripe pattern

**Importance scaling:**

- Linear scale: `radius = 4 + (importance * 1.2)`
- Higher importance = larger marker
- Ensures visibility of critical events

#### 7.4.6 Hover Interactions

**On hover:**

- Marker slightly enlarges (scale: 1.2)
- Cursor changes to pointer
- Tooltip appears (300ms delay)

**Tooltip content:**

- Event title (bold)
- Formatted temporal display
- Summary (first 100 characters)
- Importance indicator (stars or rating)
- "Click for details" hint

**Tooltip styling:**

- Dark background with white text (high contrast)
- Positioned above marker (or below if near top edge)
- Arrow pointing to marker
- Max width: 300px
- Smooth fade-in animation

#### 7.4.7 Click Interactions

**Single event click:**

- Open event detail modal
- Or navigate to event detail page (user preference)
- Smooth zoom to event if not fully visible

**Period click:**

- Drill down into period (zoom to show period's events)
- Breadcrumb updates with period name

**Nested event indicator click:**

- Zoom into parent event to show children (fractal navigation)

#### 7.4.8 Zoom Controls

**Mouse wheel:**

- Scroll up: zoom in (increase magnification)
- Scroll down: zoom out (decrease magnification)
- Zoom centered on cursor position

**Pinch-to-zoom (mobile/tablet):**

- Two-finger pinch: zoom in/out
- Smooth inertia on release

**Zoom buttons:**

- `+` and `−` buttons in corner
- Click to zoom in/out by fixed increment (2x)
- Keyboard shortcuts: `+` / `-` keys

**Zoom limits:**

- Minimum: show entire timeline in viewport
- Maximum: 1 year per 100px (or 1 day for modern timelines)

**Zoom level indicator:**

- Badge showing current zoom (e.g., "1M years per 100px")
- Helps users understand temporal granularity

#### 7.4.9 Pan Controls

**Click-drag:**

- Click and hold on timeline background
- Drag left/right to pan
- Cursor changes to grab hand
- Momentum scrolling (continues after release)

**Arrow keys:**

- Left/Right: pan 100px
- Shift+Left/Right: pan 500px (fast pan)
- Smooth animation (300ms ease-out)

**Minimap (optional):**

- Small overview timeline at bottom
- Shows entire timeline with viewport indicator
- Click to jump to position
- Drag viewport indicator to pan

#### 7.4.10 Timeline Axis

**Adaptive granularity:**

- Axis labels automatically adjust to zoom level
- Zoomed out: "1 BYA", "100 MYA", "10 MYA"
- Zoomed in: "1800", "1850", "1900", "1950"
- Very zoomed in: "Jan 1", "Feb 1", "Mar 1"

**Tick marks:**

- Major ticks: labeled
- Minor ticks: unlabeled (visual rhythm)
- Tick density adapts to zoom (never overcrowded)

**Axis position:**

- Bottom of timeline (horizontal)
- Sticky when scrolling vertically (if multi-track)

#### 7.4.11 Period Bands

**Visual representation:**

- Colored background rectangles spanning period duration
- Semi-transparent (30% opacity) to not obscure events
- Stacked if periods overlap (nested periods above parent)

**Color:**

- Period-specific color (user-defined or default)
- Era color if no specific color assigned

**Labels:**

- Period name centered in band
- Font size proportional to band width
- Truncate if too long ("Cretaceo..." with tooltip)

**Interaction:**

- Hover: tooltip with full period details
- Click: zoom to period (filter events to this period)

#### 7.4.12 Character Participation Indicators

**On event markers:**

- Small avatar icons overlaid on bottom of marker
- Max 3 visible (additional count: "+2")
- Circular avatars (24px diameter)

**Hover:**

- Tooltip shows character names and roles
- "Protagonist: Julius Caesar, Supporting: Mark Antony"

**Click character avatar:**

- Open character profile
- Or filter timeline to events involving this character

#### 7.4.13 Uncertainty Visualization

**Error bars for ±uncertainty:**

- Horizontal bar extending left/right from marker
- Lighter color (50% opacity of marker color)
- Caps at both ends
- Width proportional to uncertainty value

**Example:**

- Event at 66 MYA with ±1 MYA uncertainty
- Bar extends from 65 MYA to 67 MYA

**Hover:**

- Tooltip shows "66 ± 1 MYA"

#### 7.4.14 Nested Event Indicators

**Icon on parent events:**

- Small chevron-down icon in corner of marker
- Indicates children exist
- Badge with child count (e.g., "3")

**Visual emphasis:**

- Parent markers slightly larger
- Different stroke (dashed border)

**Interaction:**

- Click to drill down (zoom into parent, show children)
- Breadcrumb updates: "Timeline > Period > Event"

### 7.5 Master Timeline Interface

The master timeline is the homepage for public users, showing major historical timelines in a browsable format.

#### 7.5.1 Layout

**Horizontal infinite scroll:**

- Primary content area (full width)
- Horizontal scrollable container
- Multiple timelines stacked vertically (tracks)
- Smooth kinetic scrolling

**Vertical tracks:**

- Each timeline occupies a horizontal track
- Track height: 80px-200px (based on timeline importance)
- Padding between tracks: 24px
- Max visible tracks: 5-8 (viewport dependent)

#### 7.5.2 Timeline Filtering

**Default filter: importance ≥ 7**

**User adjustable:**

- Slider in controls: "Show timelines with importance ≥ [value]"
- Range: 1-10
- Updates in real-time
- Persisted in localStorage

**Filtering logic:**

- Timeline importance determined by:
  - Explicit timeline importance field (future)
  - Or average importance of top events
  - Or admin curation flag

**Indicators:**

- Badge showing active filter: "Showing 12 timelines (importance ≥ 7)"

#### 7.5.3 Visual Hierarchy

**Featured timelines (importance 9-10):**

- Larger track height (200px)
- Bolder title font (text-2xl semibold)
- More prominent background color
- Icon or illustration (optional)

**Secondary timelines (importance 7-8):**

- Standard track height (120px)
- Normal title font (text-xl)
- Subtle background

**Timeline title display:**

- Timeline title on left (sticky during horizontal scroll)
- Title fades to background color on right (gradient mask)
- Temporal scope subtitle: "13.8 BYA - Present"

#### 7.5.4 Timeline Preview on Hover

**Hover state:**

- Timeline track brightens (10% lighter background)
- Cursor changes to pointer
- Tooltip appears (500ms delay)

**Tooltip content:**

- Timeline title (if truncated)
- Summary (2-3 sentences)
- Event count: "127 events"
- Temporal scope: "1900 CE - 2025 CE"
- "Click to explore" hint

**Tooltip styling:**

- Matches standard tooltip design
- Max width: 400px
- Positioned above track (or below if near top)

#### 7.5.5 Click to Drill Down

**On timeline click:**

- Smooth zoom animation (500ms ease-in-out)
- Timeline expands to full viewport
- Master timeline fades out
- Breadcrumb appears: "Home > History of Computing"

**Animation sequence:**

1. Track expands vertically (fills viewport height)
2. Other tracks fade out and slide offscreen
3. Timeline content zooms in (events become visible)
4. Controls fade in (zoom, pan, filter)

**URL updates:**

- Route changes to `/timelines/{slug}`
- Browser back button returns to master timeline

#### 7.5.6 Breadcrumb Navigation

**Location:** Top-left corner (sticky)

**Format:**

- Home > Timeline Name > Period Name > Event Name
- Clickable segments (navigate up hierarchy)
- Separator: chevron-right icon (›)

**Styling:**

- Text-sm font
- Muted text color
- Active segment: semibold
- Hover: underline

**Interaction:**

- Click "Home" returns to master timeline
- Click timeline name shows full timeline view
- Click period name zooms to period
- Current location (rightmost) not clickable

#### 7.5.7 "Jump to Date" Feature

**Trigger:** Button in timeline controls: "Jump to..."

**Modal:**

- Title: "Jump to Date"
- TemporalInput component
- "Go" button

**Behavior:**

- User enters temporal data
- System converts to sort_order_years
- Timeline pans/zooms to show this date
- If date out of timeline range, show message

**Use cases:**

- "Jump to 1969 CE" to see Apollo 11 landing
- "Jump to 66 MYA" to see K-Pg extinction
- "Jump to Big Bang" (13.8 BYA)

#### 7.5.8 Current Viewport Indicator

**Location:** Top-right corner

**Display:**

- Current temporal range visible in viewport
- Format: "Showing: 1900 - 1950 CE"
- Updates dynamically as user pans/zooms

**Styling:**

- Badge component
- Monospace font for precision
- Muted background

### 7.6 Navigation Patterns

#### 7.6.1 Breadcrumb Navigation

Covered in section 7.5.6 above. Applies throughout fractal hierarchy.

#### 7.6.2 Back Button Behavior

**Browser back button:**

- Integrated with Next.js router
- Navigates up one level in hierarchy
- Preserves scroll position and zoom level (where possible)

**In-app back button:**

- Visible in breadcrumb or top-left corner
- Keyboard shortcut: Escape key
- Same behavior as browser back

#### 7.6.3 Forward Navigation

**Drill-down actions:**

- Click timeline → view timeline
- Click period → zoom to period
- Click event → view event detail
- Click nested event indicator → show sub-events

**Each action:**

- Updates URL (adds to browser history)
- Updates breadcrumb
- Smooth transition animation

#### 7.6.4 Sidebar Navigation

**Admin interface only** (desktop >1024px)

**Structure:**

- Fixed left sidebar (240px width)
- Collapsible (toggle button)
- Collapsed width: 64px (icons only)

**Navigation items:**

- Dashboard (home)
- Timelines
- Events
- Characters
- Stories
- Categories
- Media
- Settings

**Styling:**

- Active item: primary background
- Hover: subtle background
- Icons + labels (labels hidden when collapsed)
- Dividers between sections

#### 7.6.5 Global Search

**Location:** Header (always visible)

**Trigger:**

- Click search icon or input field
- Keyboard shortcut: `/` key

**Behavior:**

- Expands search input (full-width on mobile)
- Focus moves to input
- Search-as-you-type (300ms debounce)
- Results appear in dropdown

**Results dropdown:**

- Max 10 results
- Grouped by entity type (Events, Characters, Stories)
- Highlight matching text
- "View all results" link at bottom

**Keyboard navigation:**

- Arrow keys to navigate results
- Enter to select
- Escape to close

#### 7.6.6 User Menu

**Location:** Top-right corner (header)

**Trigger:** Click avatar or username

**Menu items:**

- Profile
- My Timelines
- Settings
- Theme (Light/Dark toggle)
- Help & Documentation
- Logout

**Styling:**

- Dropdown menu (shadcn/ui DropdownMenu component)
- Avatar image (or initials if no image)
- Username below avatar
- Dividers between sections

#### 7.6.7 Context-Sensitive Actions

**Floating Action Button (FAB) - Admin only:**

- Bottom-right corner
- Context changes based on current view:
  - Timeline view: "Add Event"
  - Characters list: "Add Character"
  - Event detail: "Edit Event"

**Toolbar (desktop):**

- Top of content area
- Actions relevant to current view:
  - Event list: Filter, Sort, Bulk actions
  - Event detail: Edit, Delete, Share, Duplicate

### 7.7 Loading States

#### 7.7.1 Skeleton Screens

**Usage:** List views (events, timelines, characters)

**Design:**

- Placeholder rectangles mimicking content structure
- Subtle shimmer animation (left to right gradient)
- Match actual content layout (height, spacing)

**Example (event list item):**

```
┌─────────────────────────────────────┐
│ ▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂         ▂▂▂▂ │  ← Title + date
│ ▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂ │  ← Summary
│ ▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂ │
└─────────────────────────────────────┘
```

**Animation:**

- Shimmer from left to right (2s duration, infinite loop)
- Pause on prefers-reduced-motion

#### 7.7.2 Spinner for Short Operations

**Usage:** Operations <2 seconds (API calls, form submissions)

**Design:**

- Circular spinner (shadcn/ui Spinner component)
- Primary color
- Size: 24px (default), 16px (inline), 48px (large)

**Placement:**

- Centered in container
- Or inline with text: "Loading..." [spinner]

**Accessibility:**

- `role="status"`
- `aria-live="polite"`
- "Loading" text (visually hidden but announced)

#### 7.7.3 Progress Bar for Long Operations

**Usage:** Operations >2 seconds (bulk import, export, file uploads)

**Design:**

- Horizontal bar showing % complete
- Indeterminate mode (if progress unknown)
- Estimated time remaining (optional)

**Styling:**

- Height: 4px (thin) or 8px (prominent)
- Primary color fill
- Muted background
- Smooth animation

**Additional feedback:**

- Text above bar: "Importing events... 45/100"
- Cancel button (if operation cancellable)

#### 7.7.4 Progressive Enhancement

**Strategy:**

- Render static content first (SSR with Next.js)
- Hydrate with interactivity after JavaScript loads
- Show loading indicators for data that requires client-side fetch

**Example (event detail page):**

1. Server renders title, temporal data, summary (from SSR)
2. Client loads media gallery (shows skeleton while loading)
3. Related events load last (below the fold)

#### 7.7.5 Optimistic Updates

**Pattern:**

- Update UI immediately on user action
- Show success state before server confirms
- Rollback on server error

**Example (publish event):**

```typescript
const { mutate } = useMutation({
  mutationFn: publishEvent,
  onMutate: async (eventId) => {
    // Optimistically set published=true
    queryClient.setQueryData(["event", eventId], (old) => ({
      ...old,
      published: true,
      published_at: new Date(),
    }));
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(["event", eventId], context.previousData);
  },
});
```

**UI feedback:**

- Button disabled + spinner during mutation
- Success checkmark (500ms) then return to normal
- Error toast if mutation fails

#### 7.7.6 Descriptive Loading Text

**Avoid generic:** "Loading..."

**Use specific:**

- "Loading events..."
- "Creating timeline..."
- "Searching historical events..."
- "Generating PDF export..."

**Benefits:**

- User knows what's happening
- Provides context if operation is slow
- Better accessibility (screen readers announce action)

### 7.8 Empty States

#### 7.8.1 New User Onboarding

**Trigger:** Dashboard with no content (new account)

**Design:**

- Hero section with welcome message
- Illustration (timeline icon or abstract temporal graphic)
- Primary action button: "Create Your First Timeline"
- Secondary link: "Explore Curated Content"

**Copy:**

- **Title:** "Welcome to Time Traveler"
- **Body:** "Start your journey through time by creating your first timeline. Explore events from the Big Bang to the present day."

#### 7.8.2 Empty Timeline

**Trigger:** Timeline with zero events

**Design:**

- Centered message in timeline viewport
- Illustration (empty timeline or plus icon)
- Primary action: "Add Your First Event"
- Helper text: "Events are the building blocks of your timeline"

**Copy:**

- **Title:** "No events yet"
- **Body:** "Add events to bring this timeline to life"

#### 7.8.3 No Search Results

**Trigger:** Search query returns zero results

**Design:**

- Centered message
- Magnifying glass icon (crossed out)
- Suggestions for refining search

**Copy:**

- **Title:** "No results found for '{query}'"
- **Suggestions:**
  - Try different keywords
  - Remove filters (with "Clear filters" button)
  - Check spelling
  - Browse timelines instead

#### 7.8.4 No Characters

**Trigger:** Characters list is empty

**Design:**

- Illustration (person silhouette or avatar icon)
- Primary action: "Add Your First Character"
- Helper text explaining character purpose

**Copy:**

- **Title:** "No characters yet"
- **Body:** "Characters connect events and enable biographical timelines. Add people, animals, organizations, or other entities."

#### 7.8.5 Empty Category

**Trigger:** Filter by category, no events match

**Design:**

- Message in filtered list
- Category name in title
- Action to remove filter or add event to category

**Copy:**

- **Title:** "No events in '{category name}'"
- **Actions:**
  - "Clear filter"
  - "Add event to this category"

#### 7.8.6 Empty State Illustrations

**Style:**

- Simple, friendly line-art icons
- Warm color palette (matching brand)
- Not overly detailed or cute (professional)
- 200x200px max size

**Illustrations for each state:**

- Empty timeline: horizontal line with dotted outline
- No search results: magnifying glass with question mark
- No characters: person silhouette with plus
- No events: calendar with plus
- New user: rocket or compass (journey metaphor)

### 7.9 Form Design

#### 7.9.1 Layout

**Label position:** Above input (vertical stacking)

**Reasoning:**

- Better for responsive design (labels don't wrap)
- Better for screen readers (natural reading order)
- Faster scanning (F-pattern reading)

**Spacing:**

- Label to input: 8px (spacing-2)
- Input to next label: 24px (spacing-6)
- Grouped fields (fieldset): 16px between items

#### 7.9.2 Input Styling

**Text inputs:**

- Border: 1px solid (border color from theme)
- Background: surface color (white or dark-surface)
- Padding: 12px 16px (comfortable hit target)
- Border radius: 4px (rounded)
- Font: text-base (16px) to prevent mobile zoom

**States:**

- Default: neutral border
- Focus: primary color border (2px), subtle glow shadow
- Disabled: reduced opacity (60%), cursor not-allowed
- Error: red border, red text
- Success: green border, green checkmark

**Placeholder:**

- Muted text color
- Concise hint (not full instructions)
- Example: "Enter year" not "Please enter the year value"

#### 7.9.3 Button Variants

**Primary:**

- Solid primary color background
- White text
- Shadow-sm elevation
- Hover: slightly darker
- Active: scale down (0.98)

**Secondary:**

- Border only (1px primary color)
- Primary color text
- Transparent background
- Hover: light primary background (10% opacity)

**Ghost:**

- No border, no background
- Primary color text
- Hover: light background

**Destructive:**

- Red background (error color)
- White text
- Used for delete, remove actions
- Confirmation required before action

**Sizes:**

- Small: 32px height, text-sm
- Default: 40px height, text-base
- Large: 48px height, text-lg

#### 7.9.4 Fieldset Grouping

**Usage:** Group related inputs (e.g., temporal data components)

**Structure:**

```html
<fieldset>
  <legend>Event Details</legend>
  <!-- inputs -->
</fieldset>
```

**Styling:**

- Legend: semibold, text-lg
- Border around fieldset (subtle, optional)
- Padding: 16px

#### 7.9.5 Inline Validation

**Timing:**

- Validate on blur (not on every keystroke)
- Exception: password strength (real-time feedback helpful)

**Error display:**

- Error icon (exclamation-circle) left of message
- Error text below input (red, text-sm)
- Error border on input

**Success display:**

- Green checkmark icon right side of input
- Subtle green border
- No text (checkmark is sufficient)

#### 7.9.6 Error Messages

**Best practices:**

- Specific (not "Invalid input")
- Actionable (tell user how to fix)
- Polite (no blame: "Please enter" not "You must enter")

**Examples:**

- ✅ "Email must include an @ symbol"
- ❌ "Invalid email"
- ✅ "Password must be at least 8 characters"
- ❌ "Password too short"

#### 7.9.7 Help Text

**Placement:** Below input, before error message

**Styling:**

- Muted text color (secondary)
- text-sm font size
- Icon optional (info-circle)

**Content:**

- Concise guidance
- Examples when helpful
- Character count for limited fields

**Example:**

```
[Title input]
Create a descriptive title for your event. 100 characters max.
```

### 7.10 Modal and Dialog Patterns

#### 7.10.1 Confirm Dialogs

**Usage:** Destructive actions (delete, remove, unpublish)

**Structure:**

- Title: "Are you sure?"
- Description: Explanation of consequences
- Two buttons: "Cancel" (secondary) | "Delete" (destructive)

**Example:**

```
Title: Delete Event?
Description: This will permanently delete "Moon Landing" and remove it from all timelines. This action cannot be undone.
Buttons: [Cancel] [Delete Event]
```

**Accessibility:**

- Focus on "Cancel" by default (safer)
- Escape key cancels
- Destructive action requires explicit click

#### 7.10.2 Modal Forms

**Usage:** Create/edit operations

**Layout:**

- Header with title + close button
- Scrollable body with form fields
- Footer with action buttons

**Sizing:**

- Small: 400px max-width (simple forms)
- Medium: 600px (default)
- Large: 800px (complex forms, temporal input)
- Full-screen on mobile

**Behavior:**

- Click outside to close (optional, user preference)
- Escape to close
- Focus trapped within modal
- Background dimmed (overlay)

#### 7.10.3 Drawer/Sidebar

**Usage:** Filters, settings, secondary content

**Layout:**

- Slides in from right (or left)
- Full height
- Width: 320px (default), 480px (wide)
- Header, body, footer sections

**Animation:**

- Slide in: 300ms ease-out
- Overlay fade in simultaneously

**Close triggers:**

- Close button (X in header)
- Click overlay
- Escape key

#### 7.10.4 Toast Notifications

**Usage:** Transient feedback (success, error, info)

**Positioning:**

- Bottom-right corner (desktop)
- Bottom-center (mobile)
- Stacked if multiple toasts

**Duration:**

- Success: 3 seconds, auto-dismiss
- Error: 5 seconds or until dismissed
- Info: 4 seconds

**Content:**

- Icon (checkmark, X, info, warning)
- Title (optional)
- Message (concise, 1-2 sentences)
- Action button (optional, e.g., "Undo")
- Close button (X)

**Styling:**

- Shadow-lg elevation
- Background: success (green), error (red), info (blue), default (neutral)
- White or black text (high contrast)
- Rounded corners (rounded-md)

#### 7.10.5 Alert Banners

**Usage:** Important system messages (persistent)

**Positioning:** Top of page (below header)

**Types:**

- Info: neutral background, info icon
- Warning: amber background, warning icon
- Error: red background, error icon
- Success: green background, checkmark icon

**Content:**

- Icon left
- Message (bold title + body text)
- Dismiss button (X) right
- Optional action button

**Example:**

```
[⚠] Your free tier database is 80% full. Upgrade to Pro or remove unused content. [Upgrade] [X]
```

### 7.11 Admin Interface

> **Note:** Concrete information-architecture wireframes for the admin interface (characters + events CRUD + relationships editor) are documented in [`docs/design/admin/`](../design/admin/). The wireframes are fidelity-1 (IA + interaction) and serve as the IA spec for fidelity-2 (in-tree React in `apps/admin`). Divergences between the wireframes and this section have been reconciled (#127): auto-save and the "Shared" status badge were adopted into the wireframes, the card view alternative was dropped from this section (see §7.11.2), and mobile/tablet responsive specifics were deferred to a future fidelity step (see §7.11.1).

#### 7.11.1 Layout

**Two-column desktop layout:**

- Fixed sidebar: 240px (collapsible to 64px)
- Main content: remaining width
- Header: full width above sidebar and content

> **Responsive design deferred.** Mobile (<768px drawer) and tablet (768–1024px auto-collapse) layouts are not in scope for the initial admin implementation. The fidelity-1 wireframes are desktop-first ([`docs/design/admin/02-wireframes/00-app-shell.md`](../design/admin/02-wireframes/00-app-shell.md)). Responsive layout specifics will be revisited when usage patterns justify the additional surface. (Reconciled in #127.)

#### 7.11.2 Entity Lists

**Structure:**

- Header with title, filters, search, create button
- Table layout (see admin design wireframes for the canonical row patterns)
- Pagination or infinite scroll footer

> **Card view deferred.** Entity lists in the admin carry 6+ filter axes plus rich metadata (era + uncertainty, importance, participant count, category badges); a card grid degrades these into less-scannable tiles. The fidelity-1 wireframes commit to table-only ([`docs/design/admin/03-aesthetic-notes.md`](../design/admin/03-aesthetic-notes.md) — "Tables are the primary list pattern"). Revisit if and when a use case emerges where cards add value over tables. (Reconciled in #127.)

**Table columns (events example):**

- Title (with link to detail)
- Temporal data (formatted)
- Timeline (with link)
- Status (badge — Published / Draft / Shared per §7.11.5)
- Actions (edit, delete icons)

**Actions:**

- Hover row: show action buttons
- Checkbox for multi-select
- Bulk actions toolbar appears when items selected

#### 7.11.3 Create/Edit Forms

**Layout:**

- Full-page or modal (depending on complexity)
- Sections with headings (Event Details, Temporal Data, Associations)
- Sticky footer with Save/Cancel buttons

**Auto-save (draft):**

- Auto-save every 30 seconds to draft state
- Indicator: "Draft saved at 10:32 AM"
- Prevents data loss

#### 7.11.4 Bulk Actions

**Selection:**

- Checkboxes in list view
- "Select all" checkbox in header
- Count of selected items shown

**Toolbar:**

- Appears at top when items selected
- Actions: Delete, Publish, Unpublish, Add to Category
- Confirmation before destructive actions

#### 7.11.5 Status Indicators

**Published:**

- Green badge: "Published"
- Eye icon

**Draft:**

- Gray badge: "Draft"
- Pencil icon

**Shared:**

- Blue badge: "Shared"
- Users icon + count

### 7.12 Public Interface

#### 7.12.1 Layout

**Clean, content-focused:**

- No sidebar (maximizes content width)
- Header: logo, search, user menu (if logged in)
- Main content: full width (max 1400px centered)
- Footer: minimal (links, copyright)

#### 7.12.2 Master Timeline as Homepage

Covered in section 7.5.

#### 7.12.3 Event Detail Pages

**Layout:**

- Hero section: title, temporal data, location
- Body: summary + detail (rich text, Markdown)
- Sidebar: metadata (categories, characters, timeline)
- Media gallery: images, videos, embeds
- Related events: links to other events

**Typography:**

- Serif font for body text (Merriweather)
- Generous line height (1.7)
- Max-width: 700px (readable line length)

#### 7.12.4 Character Profile Pages

**Sections:**

- Header: name, type, birth-death
- Biography (rich text)
- Timeline of participation (visual timeline)
- Relationship network (graph or list)
- Associated events (list)

#### 7.12.5 Story Reading Experience

**Layout:**

- Article format (full-width, max 800px centered)
- Title, subtitle, author (if available)
- Perspective character indicator
- Body: rich text with Markdown support
- Referenced events: inline links or sidebar
- Navigation: previous/next story

**Typography:**

- Serif font (Merriweather) for storytelling
- Slightly larger font (text-lg)
- Ample line height (1.8)

### 7.13 Feedback and Controls

#### 7.13.1 Hover States

**All interactive elements:**

- Brightness increase (10% lighter)
- Or background color change
- Cursor: pointer
- Transition: 150ms ease-out

#### 7.13.2 Active/Pressed States

**Buttons:**

- Scale down slightly (transform: scale(0.98))
- Brightness decrease (slightly darker)
- Duration: 75ms (feels immediate)

#### 7.13.3 Disabled States

**Visual:**

- Opacity: 60%
- Cursor: not-allowed
- No hover effects

**Accessibility:**

- `disabled` attribute on form elements
- `aria-disabled="true"` on custom elements
- Tooltip explaining why disabled (optional)

#### 7.13.4 Focus Indicators

**Keyboard focus:**

- 2px solid outline (primary color)
- Offset: 2px from element
- Visible on all interactive elements
- Never `outline: none` without custom replacement

**Focus-visible (modern browsers):**

- Focus ring only appears for keyboard navigation
- Not for mouse clicks (reduces visual noise)

#### 7.13.5 Tooltips

**Trigger:**

- Hover (300ms delay)
- Keyboard focus (immediate)

**Positioning:**

- Above element (default)
- Below if near top edge
- Auto-adjust to stay in viewport

**Content:**

- Concise (1 sentence max)
- No critical information (must be accessible elsewhere)

**Styling:**

- Dark background, white text
- Small arrow pointing to element
- text-sm font
- Max-width: 250px

#### 7.13.6 Contextual Help

**Help icons (?):**

- Small icon next to labels or complex features
- Hover or click for explanation
- Popover with detailed help text

**Help text examples:**

- Temporal precision: "Exact means the date is known to the specified unit. Circa indicates approximate, within a few years."
- Importance: "Rate the significance of this event from 1 (trivial) to 10 (civilization-changing)."

### 7.14 Responsive Breakpoints

#### 7.14.1 Mobile (<768px)

**Layout:**

- Single column
- Stacked navigation (drawer/slide-in)
- Full-width components

**Timeline:**

- Vertical orientation (scroll down instead of horizontal)
- Simplified controls (larger touch targets)
- Zoom via pinch-to-zoom only

**Forms:**

- Full-width inputs
- Larger tap targets (min 44x44px)
- Hide optional fields (expandable sections)

#### 7.14.2 Tablet (768-1024px)

**Layout:**

- Hybrid: some two-column layouts
- Sidebar collapses to icons-only
- Timeline horizontal (but narrower viewport)

**Forms:**

- Two-column grids for some fields
- Standard tap targets

#### 7.14.3 Desktop (>1024px)

**Layout:**

- Full feature set
- Sidebar navigation (admin)
- Multi-column forms
- Side-by-side comparisons

**Timeline:**

- Full horizontal timeline with all controls
- Hover interactions (tooltips, markers)
- Keyboard shortcuts active

This completes Section 7: User Interface Requirements with comprehensive specifications for the design system, all major components, and interaction patterns.

---

## 8. Non-Functional Requirements

This section specifies quality attributes and constraints that define how the system should perform and behave, rather than what it should do.

### 8.1 Performance Requirements

#### 8.1.1 Page Load Times

**Target: Initial page render within 2 seconds**

- Time to First Byte (TTFB): <500ms
- First Contentful Paint (FCP): <1.5s
- Largest Contentful Paint (LCP): <2.0s
- Time to Interactive (TTI): <3.0s

Measured on:

- Desktop: broadband connection (>10 Mbps)
- Mobile: 4G connection (>5 Mbps)
- Baseline hardware: mid-range devices (not flagship)

**Optimization strategies:**

- Server-side rendering for initial page load
- Code splitting and lazy loading
- Image optimization and lazy loading
- Minimal JavaScript on initial load
- Preloading critical resources

#### 8.1.2 API Response Times

**REST API endpoints:**

- Simple queries (single entity by ID): <100ms
- List queries with filters (paginated): <300ms
- Complex queries (joins, aggregations): <500ms
- Database functions (temporal range queries): <500ms

**Edge Functions:**

- Bulk import processing: <30s (timeout limit)
- Export generation (PDF, JSON): <10s for typical timeline
- Image processing: <5s per image

**Measured at:** 95th percentile (P95) - 95% of requests meet target

#### 8.1.3 Search Performance

**Full-text search:**

- Simple text query: <200ms
- Text query with filters (category, temporal range): <500ms
- Character participation search: <500ms
- Combined filters (3+ active): <1000ms

**Measured at:** P95 for result sets up to 1000 items

**Performance degradation:**

- Graceful degradation for large result sets
- Pagination limits result size (50 items per page)
- Warning message if query takes >2s

#### 8.1.4 Timeline Rendering Performance

**Visualization frame rate:**

- Smooth scrolling at 60fps (16.67ms per frame)
- Zoom transitions at 60fps
- No janky animations or stuttering

**Rendering targets:**

- Timelines with <100 events: instant render (<100ms)
- Timelines with 100-1000 events: <500ms initial render
- Timelines with 1000+ events: progressive rendering with loading indicator

**Optimization strategies:**

- Canvas or SVG rendering (not DOM elements for every event)
- Virtualization for long event lists
- Throttled zoom/pan handlers
- RequestAnimationFrame for smooth animations

#### 8.1.5 Database Query Optimization

**Indexed queries:**

- Queries using indexed columns: <200ms
- Range scans on sort_order_years: <300ms
- Full-text search (GIN index): <500ms

**Query analysis:**

- All production queries run through EXPLAIN ANALYZE
- Queries >1s logged for investigation
- Index coverage verified for critical queries

**Indexing strategy:**

- BTREE indexes on foreign keys
- GIN indexes on search_vector columns
- Composite indexes on frequently joined columns
- Covering indexes where beneficial

#### 8.1.6 Client-Side Caching

**TanStack Query configuration:**

- `staleTime: 5 minutes` for entity data (events, characters, timelines)
- `staleTime: 10 minutes` for reference data (categories, periods)
- `cacheTime: 30 minutes` (how long unused data stays in cache)
- Background refetch on window focus for critical data

**Cache invalidation:**

- Surgical invalidation on mutations (only affected queries)
- Realtime updates trigger invalidation
- Manual cache clearing available (user preference)

#### 8.1.7 Asset Optimization

**Images:**

- Next.js Image component for automatic optimization
- WebP format with JPEG fallback
- Responsive images (srcset for different screen sizes)
- Lazy loading below the fold
- Maximum 5MB per uploaded image

**JavaScript:**

- Code splitting by route
- Dynamic imports for heavy components
- Tree shaking to remove unused code
- Minification and compression (gzip/brotli)

**CSS:**

- Tailwind CSS purging (remove unused classes)
- Critical CSS inlined in <head>
- Non-critical CSS deferred

#### 8.1.8 Lazy Loading and Pagination

**Event lists:**

- Paginated (50 events per page by default)
- Infinite scroll or "Load more" button (user preference)
- Cursor-based pagination (not offset-based)

**Media galleries:**

- Images lazy loaded when entering viewport
- Thumbnails load first, full resolution on click

**Timeline visualization:**

- Progressive rendering (render visible portion first)
- Events outside viewport not rendered until scrolled

#### 8.1.9 Input Debouncing

**Search-as-you-type:**

- 300ms debounce on search input
- Show loading indicator during search
- Cancel in-flight requests on new input

**Temporal filters:**

- 500ms debounce on temporal range inputs
- Prevent rapid filter changes from overwhelming API

**Auto-save:**

- 1000ms debounce on form inputs (draft saving)
- Visual indicator showing save status

### 8.2 Scalability Requirements

#### 8.2.1 Free Tier Constraints

**Supabase Free Tier limits (as of 2026):**

- Database storage: 500 MB
- Database egress: 2 GB per month
- Monthly Active Users (MAU): 50,000
- File storage: 1 GB
- Storage egress: 2 GB per month
- Edge Function invocations: 500,000 per month
- Active projects: 2
- Automatic pause: after 7 days of inactivity

**Design strategies to stay within limits:**

**Database storage optimization:**

- Store large text in compressed format (future)
- External media hosting (not Supabase Storage)
- Periodic cleanup of unused data
- Monitor storage usage in admin dashboard

**Egress optimization:**

- Aggressive client-side caching
- Pagination to limit data transfer
- Request only needed fields (select specific columns)
- CDN for static assets (reduces Supabase egress)

**File storage strategy:**

- User avatars only (<1 MB each)
- Small event images (<5 MB each)
- Everything else via external URLs
- Estimate: 1 GB supports ~1000 avatar images

**MAU tracking:**

- Monitor authentication events
- 50K MAU supports large user base
- Unlikely to hit limit in early stages

#### 8.2.2 Growth Targets

**Year 1 (Free Tier):**

- 100 active creators (editors)
- 1,000 monthly readers
- 10,000 total events across all timelines
- 100 MB database usage

**Year 2 (Pro Tier - $25/month):**

- 1,000 active creators
- 10,000 monthly readers
- 100,000 total events
- 2 GB database usage

**Year 3+ (Team/Enterprise):**

- 10,000+ active creators
- 100,000+ monthly readers
- 1M+ total events
- Dedicated infrastructure

#### 8.2.3 Database Scalability

**Indexing for large datasets:**

- All foreign keys indexed
- Composite indexes on common query patterns
- Partial indexes for frequently filtered subsets
- Regular VACUUM and ANALYZE operations

**Query optimization at scale:**

- Avoid N+1 queries (use joins or batch fetching)
- Limit result sets (pagination mandatory)
- Materialized views for expensive aggregations (future)
- Read replicas for read-heavy workloads (Supabase Pro feature)

**Data archival strategy (future):**

- Soft delete unpublished content older than 2 years
- Archive inactive user accounts
- Compress old event detail text
- Separate "cold storage" for historical data

#### 8.2.4 Concurrent User Capacity

**Free Tier target:**

- 100 concurrent users (simultaneous requests)
- 500 requests per minute
- Realtime: 200 concurrent connections

**Pro Tier target:**

- 1,000 concurrent users
- 5,000 requests per minute
- Realtime: 500 concurrent connections

**Load handling:**

- Graceful degradation under high load
- Rate limiting prevents abuse
- Queue system for bulk operations (Edge Functions)
- Client-side retry with exponential backoff

#### 8.2.5 Geographic Distribution

**Global CDN:**

- Static assets served via Vercel Edge Network
- Sub-100ms latency for asset delivery worldwide

**Database location:**

- Supabase database in single region (user chooses on setup)
- Recommended: US East or EU West for broad coverage
- Future: Multi-region read replicas for global read performance

### 8.3 Browser Compatibility

**Supported browsers (last 2 versions):**

- Chrome/Chromium (including Edge)
- Firefox
- Safari (macOS and iOS)

**Minimum browser features required:**

- ES2020+ JavaScript support
- CSS Grid and Flexbox
- Fetch API and Promises
- Web Storage (localStorage, sessionStorage)
- WebSocket (for Realtime)

**Testing strategy:**

- Automated tests on Chrome (primary)
- Manual testing on Firefox, Safari, Edge
- No polyfills for legacy browsers
- Clear "unsupported browser" message if detected

**Progressive enhancement:**

- Core functionality works without JavaScript (where possible)
- Enhanced features require modern JavaScript
- Graceful fallbacks for missing features

### 8.4 Responsive Design

#### 8.4.1 Breakpoints

| Breakpoint | Width      | Target Devices         |
| ---------- | ---------- | ---------------------- |
| Mobile     | <768px     | Smartphones            |
| Tablet     | 768-1024px | Tablets, small laptops |
| Desktop    | >1024px    | Laptops, desktops      |

#### 8.4.2 Mobile-First Read-Only Views

**Required mobile support:**

- Public timeline browsing
- Event detail pages
- Character profiles
- Story reading
- Search and filtering

**Mobile-optimized features:**

- Touch-friendly tap targets (minimum 44x44px)
- Swipe gestures for navigation
- Bottom navigation bar (thumb-friendly)
- Collapsible filters and menus
- Simplified timeline visualization (stacked view, not horizontal scroll)

**Performance on mobile:**

- Page loads <3s on 4G
- Minimal JavaScript execution
- Lazy load images aggressively
- Reduce animation complexity

#### 8.4.3 Desktop-Only Admin Interface

**Minimum width: 1024px**

Admin features (content creation, editing, bulk operations) are desktop-only:

- Complex forms require larger screens
- Temporal input component needs space
- Multi-column layouts
- Drag-and-drop interfaces

**Mobile admin behavior:**

- Detect screen width <1024px
- Show message: "Admin features require desktop browser"
- Provide link to mobile-optimized read-only view
- Future: Progressive Web App for offline admin (post-MVP)

#### 8.4.4 Adaptive Timeline Visualization

**Mobile (portrait):**

- Vertical timeline (scrolls down)
- Events stacked chronologically
- Tap to expand event details

**Tablet (landscape):**

- Horizontal timeline (scrolls left-right)
- Simplified zoom controls
- Touch-friendly event markers

**Desktop:**

- Full-featured horizontal timeline
- Mouse wheel zoom
- Keyboard shortcuts
- Hover tooltips

### 8.5 Accessibility Requirements

#### 8.5.1 WCAG 2.1 Level AA Compliance

Target compliance with Web Content Accessibility Guidelines 2.1 Level AA across all user-facing features.

#### 8.5.2 Semantic HTML

**Proper heading hierarchy:**

- Single `<h1>` per page
- Logical heading levels (no skipping from h2 to h4)
- Headings describe content structure

**Landmark regions:**

- `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`
- ARIA landmarks where HTML5 elements insufficient
- Skip links to main content

**Semantic elements:**

- `<article>` for events, stories, character profiles
- `<section>` for major page divisions
- `<button>` for actions, `<a>` for navigation
- `<form>` with proper labels and fieldsets

#### 8.5.3 Keyboard Navigation

**All interactive elements accessible via keyboard:**

- Tab order follows logical reading order
- Focus visible at all times (clear focus indicators)
- Escape key closes modals and dismisses overlays
- Arrow keys for list navigation
- Enter/Space for activation

**Keyboard shortcuts (optional, documented):**

- `/` to focus search
- `?` to show keyboard help
- `n` for new event (when in timeline view)
- `Esc` to cancel/close

**Focus management:**

- Focus moved to modal on open
- Focus restored to trigger element on close
- Skip links for main navigation

#### 8.5.4 Screen Reader Support

**ARIA labels and descriptions:**

- Images have alt text (enforced for uploaded images)
- Buttons and links have descriptive labels
- Form inputs have associated labels
- Icon-only buttons have aria-label
- Complex widgets (timeline) have aria-describedby

**Live regions:**

- Status messages announced (aria-live="polite")
- Errors announced immediately (aria-live="assertive")
- Loading states communicated

**Accessible names:**

- All interactive elements have accessible names
- Computed from content, aria-label, or aria-labelledby

#### 8.5.5 Color Contrast

**Contrast ratios (WCAG AA):**

- Normal text (<18pt): 4.5:1
- Large text (≥18pt or 14pt bold): 3:1
- UI components (borders, icons): 3:1

**Color not sole indicator:**

- Error states have text + icon (not just red)
- Required fields marked with asterisk (not just red)
- Timeline events differentiated by shape + color

**High contrast mode support:**

- Respect prefers-contrast media query
- Borders visible in high contrast
- Text remains readable

#### 8.5.6 Focus Indicators

**Visible focus styles:**

- 2px solid outline on focused elements
- High contrast color (blue or system accent)
- Sufficient offset from element boundary
- Never `outline: none` without custom replacement

**Focus trap in modals:**

- Focus cycles within modal
- Tab wraps from last to first element
- Shift+Tab wraps backwards

#### 8.5.7 Accessible Animations

**Motion preferences:**

- Respect `prefers-reduced-motion` media query
- Reduce/disable animations when user prefers
- Essential animations (loading indicators) remain but simplified

**No seizure-inducing content:**

- No flashing content >3 times per second
- Parallax effects disabled for users who prefer reduced motion

#### 8.5.8 Form Accessibility

**Labels and errors:**

- Every input has associated label (explicit or aria-label)
- Required fields indicated with asterisk + "required" text
- Error messages linked with aria-describedby
- Inline validation provides immediate feedback

**Error prevention:**

- Clear instructions before form submission
- Confirmation dialogs for destructive actions
- Ability to review and correct before final submit

#### 8.5.9 Alternative Content for Visualizations

**Timeline visualizations:**

- Accessible data table alternative
- Chronological event list view
- Sortable and filterable

**Character relationship networks:**

- Tabular view of relationships
- List view with grouping

**Keyboard access to interactive visualizations:**

- Arrow keys for navigation
- Enter to select
- Tooltip content accessible via keyboard

### 8.6 Security Requirements

#### 8.6.1 Authentication and Authorization

**Row Level Security (RLS):**

- All access control enforced at database level
- RLS policies on all tables
- No data leakage via misconfigured policies
- Admin override with explicit is_admin() check

**Authentication:**

- Supabase Auth handles password hashing (bcrypt)
- Magic link and OAuth supported
- No passwords stored in application code
- Session tokens stored securely (httpOnly cookies)

**Authorization:**

- Three-tier permission model (Admin, Editor, Viewer)
- Permissions checked on every request (RLS)
- No client-side-only authorization checks

#### 8.6.2 SQL Injection Prevention

**Parameterized queries only:**

- All Supabase client queries use parameterized inputs
- No raw SQL string concatenation
- Database functions use safe parameter binding

**Input validation:**

- All user input validated before database operations
- Zod schemas enforce type safety
- Maximum length limits on text fields

#### 8.6.3 Cross-Site Scripting (XSS) Prevention

**Input sanitization:**

- User-generated content sanitized before rendering
- Markdown parsed with DOMPurify or equivalent
- No dangerouslySetInnerHTML without sanitization

**Content Security Policy:**

- Strict CSP headers restrict script sources
- Inline scripts require nonces
- No eval() or Function() constructors
- External scripts from trusted CDNs only

**Output encoding:**

- React escapes content by default
- Explicit encoding for unusual contexts

#### 8.6.4 HTTPS and Transport Security

**HTTPS enforcement:**

- All traffic over HTTPS (enforced by Vercel)
- No mixed content (HTTP resources in HTTPS pages)
- HSTS headers enabled

**Supabase connection:**

- API calls to Supabase over HTTPS
- WebSocket connections over WSS (secure)

#### 8.6.5 Sensitive Data Protection

**No logging of sensitive data:**

- Passwords never logged
- Authentication tokens never logged
- API keys never exposed to client

**Secure storage:**

- Supabase Storage access control (public/private buckets)
- Signed URLs for private content (short-lived)
- User avatars in public bucket (world-readable)

**Personal data handling:**

- User email addresses not displayed publicly
- Profile information visibility controlled by user
- Private timelines not indexed by search engines

#### 8.6.6 Rate Limiting

**API endpoint protection:**

- Rate limiting on authentication endpoints (prevent brute force)
- Rate limiting on bulk import (prevent abuse)
- Rate limiting on search (prevent DoS)

**Implementation:**

- Supabase built-in rate limiting
- Additional rate limiting via Vercel middleware (if needed)

**Rate limits:**

- Authentication: 10 requests per minute per IP
- API mutations: 100 requests per minute per user
- Search: 60 requests per minute per user
- Bulk import: 1 concurrent operation per user

#### 8.6.7 Content Security Policy

**CSP headers:**

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{random}' https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  media-src 'self' https:;
  connect-src 'self' https://*.supabase.co;
  frame-ancestors 'none';
```

**Prevents:**

- Injection of malicious scripts
- Clickjacking attacks
- Data exfiltration

### 8.7 Data Integrity

#### 8.7.1 Database Constraints

**Foreign key constraints:**

- All relationships enforced with FK constraints
- CASCADE delete removes dependent rows automatically
- SET NULL for optional references (e.g., timeline_id on events)

**Unique constraints:**

- Slugs unique per user (composite unique index)
- Prevent duplicate relationships (unique index on character pairs + type)

**Check constraints:**

- Event importance 1-10
- Era values limited to enum
- Temporal data structure validated (via application, not DB)

#### 8.7.2 Temporal Data Validation

**Client-side (Zod):**

- TemporalData schema enforced on form input
- Immediate feedback on invalid data
- Prevents submission of malformed temporal data

**Server-side (Zod):**

- Same schema applied in API routes
- Double validation prevents bypassing client checks
- Rejects invalid requests with 400 Bad Request

**Database-level:**

- Generated columns (sort_order_years) always consistent
- Computed columns (computed_start_date) always accurate

#### 8.7.3 Transaction Handling

**Multi-step operations:**

- Event creation with junction table inserts
- Wrapped in logical transaction (client-side coordination)
- Failure handling: log error, allow user to retry

**Atomic operations:**

- Single-entity creates/updates/deletes are atomic (PostgreSQL guarantee)
- Concurrent updates handled by database (last-write-wins)

**Future: Optimistic locking:**

- Version column on entities
- Concurrent edit detection
- Conflict resolution UI

### 8.8 Reliability and Availability

#### 8.8.1 Uptime Targets

**Target: 99.9% uptime (Vercel Pro SLA: 99.99%)**

- Downtime budget: ~43 minutes per month (99.9%)
- Dependent on Supabase and Vercel availability
- Planned maintenance windows communicated in advance

#### 8.8.2 Graceful Degradation

**Realtime failure:**

- Fall back to polling (every 30s) if WebSocket disconnects
- User notified of degraded mode
- Functionality preserved, just not real-time

**API timeout handling:**

- Show loading state for slow requests
- Cancel button for long operations
- Timeout after 30s with retry option

**Partial feature failure:**

- If search fails, show message but allow browsing
- If export fails, user can retry or contact support

#### 8.8.3 Error Boundaries

**React error boundaries:**

- Top-level boundary catches all errors
- Component-level boundaries for critical sections
- Display user-friendly error message
- Provide "Reload" button
- Log error details for investigation

**Error recovery:**

- Local errors don't crash entire app
- State preserved where possible
- User can continue working after error

#### 8.8.4 Client-Side Error Recovery

**Automatic retry:**

- Network errors retry with exponential backoff
- Maximum 3 retries before showing error
- User-initiated manual retry always available

**Offline detection:**

- Detect loss of network connection
- Show "You're offline" banner
- Queue mutations for when connection restored (future)

#### 8.8.5 User-Facing Error Messages

**Principles:**

- Human-readable (no stack traces)
- Actionable (tell user what to do)
- Specific (not just "Something went wrong")

**Examples:**

- "Unable to save event. Please check your internet connection and try again."
- "This timeline couldn't be loaded. It may have been deleted or you don't have permission to view it."
- "Search is temporarily unavailable. Try again in a moment."

### 8.9 Backup and Disaster Recovery

#### 8.9.1 Automated Backups

**Supabase backups:**

- Free tier: No automated backups (use export feature)
- Pro tier: Daily automated backups (7-day retention)
- Point-in-time recovery (PITR): Pro tier feature

**Recommendation:**

- Upgrade to Pro tier before significant data accumulation
- Backups essential for production use

#### 8.9.2 User-Initiated Export

**Backup mechanism:**

- Users can export timelines as JSON (complete data dump)
- Export includes all related entities
- Can be re-imported if data lost

**Frequency recommendation:**

- After significant content creation
- Before major edits or deletions
- Monthly for active creators

#### 8.9.3 Database Migration Rollback

**Migration strategy:**

- All migrations versioned and tracked
- Test migrations on staging environment
- Rollback scripts prepared for each migration

**Deployment process:**

1. Apply migration to staging
2. Verify functionality
3. Apply to production
4. Monitor for errors
5. Rollback if critical issues detected

#### 8.9.4 Disaster Recovery Runbook

**Documentation includes:**

- Backup restoration procedure
- Database migration rollback steps
- Supabase support contact information
- Incident communication templates
- Recovery time objectives (RTO): <4 hours
- Recovery point objectives (RPO): <24 hours (last backup)

### 8.10 Monitoring and Observability

#### 8.10.1 Error Tracking

**Implementation:**

- Sentry or similar error tracking service
- Captures unhandled exceptions
- Source maps for readable stack traces
- User context attached (user_id, route)

**Error categories:**

- JavaScript errors (client-side)
- API errors (4xx, 5xx responses)
- Database errors (query failures)
- Edge Function errors

#### 8.10.2 Performance Monitoring

**Web Vitals tracking:**

- Largest Contentful Paint (LCP)
- First Input Delay (FID)
- Cumulative Layout Shift (CLS)
- Time to First Byte (TTFB)

**Real User Monitoring (RUM):**

- Vercel Analytics provides Web Vitals
- Track performance by route
- Identify slow pages and components

**Alerts:**

- Performance degradation (LCP >2.5s for 75th percentile)
- Error rate spike (>5% of requests)
- API latency increase (>1s for P95)

#### 8.10.3 Database Query Logging

**Slow query logging:**

- Log queries >1s execution time
- Include query text, parameters, execution plan
- Review weekly for optimization opportunities

**Query metrics:**

- Count of queries per endpoint
- Average execution time
- Cache hit rate (for repeated queries)

#### 8.10.4 API Endpoint Metrics

**Metrics tracked:**

- Request count (per endpoint)
- Response time (P50, P95, P99)
- Error rate (percentage of 4xx, 5xx responses)
- Throughput (requests per second)

**Dashboards:**

- Supabase dashboard for database metrics
- Vercel Analytics for deployment and function metrics
- Custom dashboards for business metrics (events created, searches performed)

#### 8.10.5 Real-Time Connection Monitoring

**Realtime metrics:**

- Active connection count
- Message throughput
- Connection errors and reconnections
- Presence state size

**Alerts:**

- Connection count approaching limit
- High reconnection rate (network issues)
- Message delivery failures

#### 8.10.6 Client-Side Error Reporting

**Automatic reporting:**

- Unhandled promise rejections
- React error boundary catches
- Failed API requests (after retries exhausted)

**User-initiated reporting:**

- "Report a problem" button
- Captures user description + system state
- Includes recent actions (breadcrumb trail)

#### 8.10.7 Privacy-Respecting Analytics

**User behavior tracking:**

- Page views and navigation patterns
- Feature usage (search, filters, export)
- Content creation metrics (events created, timelines published)

**Privacy protection:**

- No personally identifiable information (PII) in analytics
- User IDs hashed before sending to analytics service
- Respect "Do Not Track" browser setting
- Comply with GDPR/CCPA requirements

**Analytics service options:**

- Vercel Analytics (built-in, privacy-friendly)
- Plausible or Simple Analytics (GDPR-compliant alternatives)
- Self-hosted Umami (maximum privacy)

### 8.11 Internationalization

#### 8.11.1 Initial Language Support

**English only:**

- All UI text in English (US)
- Documentation in English
- Error messages in English

#### 8.11.2 i18n-Ready Architecture

**Code structure:**

- No hardcoded strings in components
- Extract text to constant files or translation keys
- Use React i18next library (or Next.js i18n)

**Date and time formatting:**

- Use Intl.DateTimeFormat API (locale-aware)
- Temporal display formatting respects user locale
- Time zones handled correctly (UTC storage, local display)

**Number formatting:**

- Use Intl.NumberFormat API
- Currency formatting (if prices added in future)

#### 8.11.3 Future Language Support

**Planned languages (priority order):**

1. Spanish
2. French
3. German
4. Chinese (Simplified)
5. Japanese

**Translation process:**

- Professional translation (not machine translation)
- Community contributions reviewed by native speakers
- Context provided for translators (where text appears)

**Right-to-left (RTL) support:**

- Not in initial version
- Architecture supports future RTL (CSS logical properties)

### 8.12 Offline Capabilities

#### 8.12.1 Internet Connection Required

**No offline mode in initial version:**

- All features require active internet connection
- No service worker caching
- No offline data persistence

#### 8.12.2 Offline Detection

**Connection monitoring:**

- Detect when user goes offline (navigator.onLine)
- Display "You're offline" banner
- Disable interactive features
- Prevent mutation attempts

**Reconnection handling:**

- Detect when connection restored
- Remove offline banner
- Re-enable features
- Optionally refetch data (cache may be stale)

#### 8.12.3 Future Offline Support

**Progressive Web App (PWA):**

- Service worker for asset caching
- Read-only access to previously viewed content
- Queue mutations for sync when online

**Scope:**

- Timeline browsing offline (cached data)
- Event details offline (if previously viewed)
- No content creation offline (requires server)

### 8.13 Code Quality and Testing

#### 8.13.1 TypeScript Configuration

**Strict mode enabled:**

- `strict: true` in tsconfig.json
- `noImplicitAny: true`
- `strictNullChecks: true`
- `noUncheckedIndexedAccess: true`

**Type safety:**

- Generated types from Supabase schema
- Zod schemas for runtime validation
- No `any` types (use `unknown` and type guards)

#### 8.13.2 Code Consistency

**Tooling:**

- ESLint for code quality rules
- Prettier for formatting
- Pre-commit hooks (Husky + lint-staged)

**Rules enforced:**

- Consistent naming conventions
- Import order and grouping
- Unused variable detection
- Console.log detection (only in dev)

#### 8.13.3 Testing Strategy

**Unit tests:**

- TemporalService functions (100% coverage)
- Utility functions and helpers
- Zod schema validation
- Pure component logic

**Integration tests:**

- API route handlers
- Database operations (RLS policies)
- Supabase client interactions

**End-to-end tests:**

- Critical user flows (Playwright):
  - Create timeline → add events → publish
  - Search → view results → open event detail
  - Browse master timeline → drill into timeline → view event
- Run on every PR before merge

**Code coverage targets:**

- Business logic: >80%
- UI components: >60% (focus on logic, not JSX)
- Overall: >70%

#### 8.13.4 Performance Testing

**Load testing:**

- Simulate 100 concurrent users (free tier target)
- Identify bottlenecks
- Verify rate limiting works

**Stress testing:**

- Test behavior under degraded conditions
- Verify graceful degradation
- Ensure no data loss under load

### 8.14 Developer Experience

#### 8.14.1 Development Environment

**Fast feedback loops:**

- Hot Module Replacement (HMR) in Next.js dev mode
- Development build time <30s
- Type checking in IDE (VS Code, Cursor)
- ESLint and Prettier on save

**Local development:**

- Supabase CLI for local database
- Seed scripts for test data
- Mock Edge Functions for offline dev

#### 8.14.2 Type Safety

**Database types:**

- Generated via `supabase gen types typescript`
- Regenerated on schema changes
- Committed to repo (version controlled)

**API types:**

- Shared types between client and server
- Zod schemas as single source of truth
- Runtime validation + compile-time checking

#### 8.14.3 Documentation

**Required documentation:**

- README with setup instructions
- Architecture overview document
- API documentation (generated from code)
- Database schema diagram
- Deployment guide

**Code comments:**

- Complex algorithms explained
- Temporal system edge cases documented
- RLS policies annotated with intent

#### 8.14.4 Error Messages

**Development mode:**

- Detailed error messages with stack traces
- Suggestions for common mistakes
- Links to documentation

**Production mode:**

- User-friendly generic messages
- Detailed errors logged to monitoring service
- Error IDs for support correlation

---

## 9. API Design

This section describes the API patterns and conventions used in Time Traveler. Detailed endpoint specifications are generated from the database schema and accessible via Supabase documentation.

### 9.1 API Philosophy

Time Traveler uses a **schema-first API design** where the database schema defines the API surface. Supabase's PostgREST automatically generates REST endpoints from PostgreSQL tables, views, and functions.

**Benefits:**

- No manual API coding required
- API always matches database schema
- TypeScript types generated automatically
- Consistent patterns across all entities
- Self-documenting (OpenAPI spec available)

**Trade-offs:**

- Less flexibility for complex custom logic
- Schema changes affect API immediately
- Edge Functions needed for non-CRUD operations

### 9.2 PostgREST API Patterns

#### 9.2.1 Base URL Structure

All API requests go through Supabase:

```
https://{project-id}.supabase.co/rest/v1/{table}
```

**Authentication:**

- Anon key for client-side requests (read public content)
- Service role key for server-side/admin (bypasses RLS)
- JWT token in Authorization header for authenticated requests

#### 9.2.2 CRUD Operations

**Create (INSERT):**

```typescript
const { data, error } = await supabase
  .from("events")
  .insert({
    user_id: session.user.id,
    slug: "moon-landing",
    title: "Apollo 11 Moon Landing",
    temporal_data: {
      year: 1969,
      month: 7,
      day: 20,
      era: "CE",
      precision: "exact",
    },
    importance: 10,
  })
  .select()
  .single();
```

**Read (SELECT):**

```typescript
// Get all events in timeline
const { data } = await supabase
  .from("events")
  .select("*")
  .eq("timeline_id", timelineId)
  .order("sort_order_years", { ascending: true });

// Get single event with related data
const { data } = await supabase
  .from("events")
  .select(
    `
    *,
    timeline:timelines(*),
    categories:event_categories(category:categories(*)),
    characters:event_characters(
      character:characters(*),
      role,
      significance
    )
  `,
  )
  .eq("id", eventId)
  .single();
```

**Update:**

```typescript
const { error } = await supabase
  .from("events")
  .update({ title: "New Title", updated_at: new Date().toISOString() })
  .eq("id", eventId);
```

**Delete:**

```typescript
const { error } = await supabase.from("events").delete().eq("id", eventId);
// Cascades to junction tables automatically
```

#### 9.2.3 Filtering and Querying

**Equality:**

```typescript
.eq('user_id', userId)
.eq('published', true)
```

**Comparison:**

```typescript
.gte('importance', 7)  // Greater than or equal
.lt('sort_order_years', 0)  // Less than (prehistoric)
```

**Text search:**

```typescript
.ilike('title', '%moon%')  // Case-insensitive partial match
.textSearch('search_vector', 'moon & landing')  // Full-text search
```

**Range queries:**

```typescript
// Events between two dates
.gte('sort_order_years', startYear)
.lte('sort_order_years', endYear)
```

**Complex filters:**

```typescript
.or('published.eq.true,user_id.eq.' + userId)  // OR condition
```

#### 9.2.4 Nested Relations (Joins)

PostgREST supports nested resource embedding:

```typescript
// Get timeline with all events and their characters
const { data } = await supabase
  .from("timelines")
  .select(
    `
    id,
    title,
    temporal_data,
    events:timeline_events(
      event:events(
        *,
        characters:event_characters(
          character:characters(id, name, character_type),
          role
        )
      )
    )
  `,
  )
  .eq("id", timelineId)
  .single();
```

**Response structure:**

```json
{
  "id": "uuid",
  "title": "History of Computing",
  "temporal_data": { ... },
  "events": [
    {
      "event": {
        "id": "uuid",
        "title": "ENIAC Completion",
        "characters": [
          {
            "character": {
              "id": "uuid",
              "name": "John Mauchly",
              "character_type": "human"
            },
            "role": "creator"
          }
        ]
      }
    }
  ]
}
```

#### 9.2.5 Pagination

**Cursor-based pagination (preferred):**

```typescript
const PAGE_SIZE = 50;

const { data } = await supabase
  .from("events")
  .select("*")
  .order("sort_order_years")
  .range(0, PAGE_SIZE - 1); // First page: 0-49

// Next page
const { data } = await supabase
  .from("events")
  .select("*")
  .order("sort_order_years")
  .range(50, 99); // Second page: 50-99
```

**Cursor using last item:**

```typescript
// After getting first page, use last item's sort_order_years
const lastSortOrder = firstPageData[firstPageData.length - 1].sort_order_years;

const { data } = await supabase
  .from("events")
  .select("*")
  .gt("sort_order_years", lastSortOrder)
  .order("sort_order_years")
  .limit(PAGE_SIZE);
```

#### 9.2.6 Counting Results

```typescript
const { count } = await supabase
  .from("events")
  .select("*", { count: "exact", head: true }) // head: true returns count only
  .eq("timeline_id", timelineId);
```

### 9.3 Database Functions (RPC)

For queries that cannot be expressed through PostgREST filters, use database functions.

#### 9.3.1 Calling Functions

```typescript
const { data } = await supabase.rpc("events_in_temporal_range", {
  p_start_years: -66000000, // 66 MYA
  p_end_years: 0, // Present
  p_timeline_id: timelineId,
});
```

#### 9.3.2 Common Functions

**Temporal range queries:**

```typescript
// Find events overlapping a temporal range
await supabase.rpc("events_in_temporal_range", {
  p_start_years: startSortOrder,
  p_end_years: endSortOrder,
  p_timeline_id: timelineId, // optional filter
});
```

**Character network:**

```typescript
// Get character relationship network (recursive)
await supabase.rpc("character_network", {
  p_character_id: characterId,
  p_depth: 2, // levels of relationships
});
```

**Shared events:**

```typescript
// Events involving multiple characters (intersection)
await supabase.rpc("events_shared_by_characters", {
  p_character_ids: [characterId1, characterId2],
});
```

**User metrics:**

```typescript
// Dashboard metrics
await supabase.rpc("get_user_metrics", {
  p_user_id: userId,
});
```

### 9.4 Edge Functions

Serverless functions for operations that can't or shouldn't run on the client.

#### 9.4.1 Bulk Import

**Endpoint:** `POST /functions/v1/bulk-import`

**Purpose:** Process CSV/JSON uploads, validate data, insert in batch

**Request body:**

```json
{
  "format": "csv",
  "data": "title,temporal_year,temporal_era\nMoon Landing,1969,CE\n...",
  "timeline_id": "uuid",
  "options": {
    "duplicate_strategy": "skip",
    "strict_mode": false
  }
}
```

**Response:**

```json
{
  "total_rows": 100,
  "imported": 95,
  "rejected": 5,
  "errors": [
    {
      "row": 12,
      "field": "temporal_era",
      "error": "Invalid era value",
      "suggestion": "Use one of: CE, BCE, KYA, MYA, BYA"
    }
  ]
}
```

**Implementation:**

- Uses service role key (admin access)
- Validates each row against Zod schemas
- Batch inserts for performance
- Returns detailed error report

#### 9.4.2 Timeline Export

**Endpoint:** `POST /functions/v1/export-timeline`

**Purpose:** Generate PDF, JSON, HTML, or CSV export of timeline

**Request body:**

```json
{
  "timeline_id": "uuid",
  "format": "pdf",
  "options": {
    "include_characters": true,
    "include_media": true,
    "page_size": "letter"
  }
}
```

**Response:**

```json
{
  "download_url": "https://storage.supabase.co/exports/timeline-uuid.pdf",
  "expires_at": "2026-02-15T12:00:00Z",
  "file_size_bytes": 2457600
}
```

**Implementation:**

- Fetches timeline and related entities
- Generates file in requested format
- Uploads to private storage bucket
- Returns signed URL (expires in 1 hour)

#### 9.4.3 Image Processing

**Endpoint:** Triggered by database webhook on media insert

**Purpose:** Process uploaded images (thumbnails, EXIF extraction)

**Trigger:**

```sql
-- Webhook on media table insert
CREATE TRIGGER on_media_insert
AFTER INSERT ON media
FOR EACH ROW
EXECUTE FUNCTION supabase_functions.http_request(
  'https://{project}.functions.supabase.co/process-media',
  'POST',
  ...
);
```

**Process:**

1. Download image from Supabase Storage
2. Generate thumbnail (300px width)
3. Extract EXIF metadata (camera, date, location)
4. Update media row with dimensions, file size, metadata
5. Upload thumbnail to storage

#### 9.4.4 Publish Workflow

**Endpoint:** `POST /functions/v1/publish`

**Purpose:** Handle publishing with side effects (notifications, indexing)

**Request body:**

```json
{
  "entity_type": "timeline",
  "entity_id": "uuid",
  "action": "publish" // or "unpublish"
}
```

**Implementation:**

- Verifies user owns entity
- Updates published flag and published_at timestamp
- Triggers downstream effects:
  - Send notification to collaborators (future)
  - Update search index (if external search service)
  - Log analytics event
- Returns updated entity

### 9.5 Realtime API

Supabase Realtime provides WebSocket-based live updates.

#### 9.5.1 Channel Subscription

```typescript
const channel = supabase
  .channel(`timeline:${timelineId}`)
  .on(
    "postgres_changes",
    {
      event: "*", // INSERT, UPDATE, DELETE
      schema: "public",
      table: "events",
      filter: `timeline_id=eq.${timelineId}`,
    },
    (payload) => {
      console.log("Event changed:", payload);
      // Invalidate cache, refetch data
      queryClient.invalidateQueries({ queryKey: ["events", timelineId] });
    },
  )
  .subscribe();
```

#### 9.5.2 Presence Tracking

```typescript
const presenceState = {
  user_id: userId,
  username: username,
  avatar_url: avatarUrl,
  online_at: new Date().toISOString(),
};

channel.track(presenceState);

channel.on("presence", { event: "sync" }, () => {
  const users = channel.presenceState();
  console.log("Users online:", Object.values(users));
});
```

#### 9.5.3 Broadcast Messages

```typescript
// Send custom message
channel.send({
  type: "broadcast",
  event: "cursor_move",
  payload: { userId, x: 100, y: 200 },
});

// Receive custom message
channel.on("broadcast", { event: "cursor_move" }, (payload) => {
  updateCursor(payload.userId, payload.x, payload.y);
});
```

#### 9.5.4 Channel Patterns

**Timeline-specific:**

```typescript
supabase.channel(`timeline:${timelineId}`);
```

**User-specific:**

```typescript
supabase.channel(`user:${userId}`);
```

**Global (all published content):**

```typescript
supabase.channel("public:events");
```

### 9.6 Type Safety

#### 9.6.1 Generated Types

Database types are generated from schema:

```bash
supabase gen types typescript --project-id {project} > types/database.ts
```

**Usage:**

```typescript
import { Database } from "@/types/database";

type Event = Database["public"]["Tables"]["events"]["Row"];
type EventInsert = Database["public"]["Tables"]["events"]["Insert"];
type EventUpdate = Database["public"]["Tables"]["events"]["Update"];
```

#### 9.6.2 Typed Queries

```typescript
// Fully typed query
const { data } = await supabase
  .from("events")
  .select("id, title, temporal_data, importance")
  .eq("timeline_id", timelineId)
  .returns<EventWithDetails[]>();
```

#### 9.6.3 Runtime Validation

Zod schemas validate at runtime:

```typescript
import { temporalDataSchema } from "@/lib/schemas/temporal";

// Validate user input
const result = temporalDataSchema.safeParse(formData.temporal_data);
if (!result.success) {
  console.error("Validation errors:", result.error.flatten());
  return;
}

// result.data is typed and validated
const validatedTemporal: TemporalData = result.data;
```

### 9.7 Error Handling

#### 9.7.1 PostgREST Error Responses

```typescript
const { data, error } = await supabase
  .from('events')
  .insert({ ... })

if (error) {
  // PostgreSQL error codes
  if (error.code === '23505') {
    // Unique constraint violation
    console.error('Slug already exists')
  } else if (error.code === '23503') {
    // Foreign key violation
    console.error('Referenced entity does not exist')
  } else {
    console.error('Unknown error:', error.message)
  }
}
```

#### 9.7.2 Client-Side Error Handling

```typescript
const { mutate } = useMutation({
  mutationFn: async (eventData) => {
    const { data, error } = await supabase
      .from("events")
      .insert(eventData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
  onError: (error) => {
    toast.error(`Failed to create event: ${error.message}`);
  },
  onSuccess: (data) => {
    toast.success("Event created successfully");
    queryClient.invalidateQueries({ queryKey: ["events"] });
  },
});
```

#### 9.7.3 Edge Function Errors

```typescript
// Edge Function response
if (error) {
  return new Response(
    JSON.stringify({
      error: "Validation failed",
      details: validationErrors,
    }),
    {
      status: 400,
      headers: { "Content-Type": "application/json" },
    },
  );
}
```

### 9.8 Rate Limiting

#### 9.8.1 Supabase Built-In Limits

**Free tier:**

- 500 requests per second per IP
- Enforced automatically by Supabase

**Pro tier:**

- Configurable limits
- Custom rate limiting rules

#### 9.8.2 Application-Level Rate Limiting

For specific endpoints (e.g., search), implement client-side throttling:

```typescript
import { debounce } from "lodash-es";

const debouncedSearch = debounce(async (query: string) => {
  const { data } = await supabase
    .from("events")
    .select("*")
    .textSearch("search_vector", query);

  setResults(data);
}, 300); // 300ms debounce
```

### 9.9 Caching Strategy

#### 9.9.1 Client-Side (TanStack Query)

```typescript
// Configure per-query cache
const { data } = useQuery({
  queryKey: ["events", timelineId],
  queryFn: async () => {
    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("timeline_id", timelineId);
    return data;
  },
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  refetchOnWindowFocus: true,
  refetchOnMount: false,
});
```

#### 9.9.2 Edge Caching (CDN)

**Public content:**

- Static pages cached at edge (Vercel CDN)
- Cache headers set by Next.js
- Invalidated on revalidation

**Dynamic content:**

- Authenticated requests bypass cache
- Cache-Control headers prevent sensitive data caching

### 9.10 API Versioning

#### 9.10.1 Current Approach

**No explicit versioning:**

- Database schema is the API contract
- Breaking changes avoided where possible
- Additive changes only (new columns, tables)

#### 9.10.2 Future Versioning (if needed)

**Database views for compatibility:**

```sql
-- v1 view maintains old structure
CREATE VIEW events_v1 AS
  SELECT id, title, summary, detail, old_date_field
  FROM events;

-- v2 uses new temporal_data structure
-- Client specifies version via header or path
```

### 9.11 API Documentation

#### 9.11.1 Auto-Generated Docs

Supabase provides OpenAPI spec:

```
https://{project-id}.supabase.co/rest/v1/
```

Viewable via Swagger UI or Postman.

#### 9.11.2 Custom Documentation

For Edge Functions and custom patterns, maintain docs in:

- `/docs/api/` directory
- Markdown files with examples
- Generated from JSDoc comments (future)

### 9.12 Testing

#### 9.12.1 Unit Tests

Test temporal service and utility functions:

```typescript
import { TemporalService } from "@/lib/services/temporal";

describe("TemporalService", () => {
  it("converts CE dates to sort order", () => {
    const temporal = { year: 2024, era: "CE" };
    expect(TemporalService.toSortableYears(temporal)).toBe(2024);
  });

  it("converts MYA dates to negative sort order", () => {
    const temporal = { year: 66, era: "MYA" };
    expect(TemporalService.toSortableYears(temporal)).toBe(-66000000);
  });
});
```

#### 9.12.2 Integration Tests

Test API operations against test database:

```typescript
import { createClient } from "@supabase/supabase-js";

const testClient = createClient(
  process.env.TEST_SUPABASE_URL,
  process.env.TEST_SUPABASE_KEY,
);

describe("Event API", () => {
  it("creates event with temporal data", async () => {
    const { data, error } = await testClient
      .from("events")
      .insert({
        title: "Test Event",
        temporal_data: { year: 1969, era: "CE", precision: "exact" },
        importance: 5,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.sort_order_years).toBe(1969);
  });
});
```

#### 9.12.3 E2E Tests

Test complete user flows with Playwright:

```typescript
test("create timeline and add events", async ({ page }) => {
  await page.goto("/dashboard");
  await page.click("text=Create Timeline");
  await page.fill('input[name="title"]', "Test Timeline");
  await page.click('button:has-text("Save")');

  await page.click("text=Add Event");
  await page.fill('input[name="title"]', "Test Event");
  // ... temporal input interactions
  await page.click('button:has-text("Create Event")');

  await expect(page.locator("text=Test Event")).toBeVisible();
});
```

---

**Note:** For exhaustive endpoint documentation and examples, refer to:

- Supabase auto-generated API docs: `https://{project}.supabase.co/rest/v1/`
- Custom Edge Function docs: `/docs/api/edge-functions.md`
- Database function reference: `/docs/api/database-functions.md`

---

## 10. Domain Glossary

This section provides quick-reference definitions of key entities, concepts, and terminology used throughout Time Traveler. For detailed requirements, see Section 4 (Functional Requirements). For physical implementation, see the Technical Design Document (system-design-v3.md).

### 10.1 Core Entities

#### Timeline

A curated collection of events organized around a theme, period, or subject. Timelines are the top-level organizational structure that gives context to events.

**Key attributes:** Title, temporal scope (start/end dates), type (general, biographical, comparative), visibility (private, public, shared), publication status

**Relationships:** Contains events, spans periods, owned by user, may have collaborators

**Examples:** "History of Computing", "Life of Julius Caesar", "Mesozoic Era"

#### Event

A specific occurrence in time, representing anything from cosmological phenomena to precise modern moments. Events are the atomic units of temporal content.

**Key attributes:** Title, temporal data, location, event type, importance (1-10), description, publication status

**Relationships:** Belongs to timelines, may have parent event (fractal nesting), involves characters, categorized, has media attachments

**Examples:** "Moon Landing (July 20, 1969)", "K-Pg Extinction Event (66 MYA)", "Signing of Declaration of Independence"

#### Period

A span of time with thematic or temporal coherence. Periods organize events into eras, ages, epochs, and other temporal divisions.

**Key attributes:** Title, temporal range (start/end dates), significance level, characteristics (defining attributes)

**Relationships:** May contain child periods (nested hierarchy), associates with timelines, owned by user

**Examples:** "Mesozoic Era (252-66 MYA)", "Renaissance (14th-17th century)", "Industrial Revolution"

#### Character

An entity that participates in events. Seven types: Human, Animal, Mythological, Fictional, Organization, Divine, Artifact.

**Key attributes:** Name, character type, biography, birth/death dates, aliases, significance level

**Relationships:** Participates in events (with roles), has relationships with other characters, may be subject of biographical timeline, has media (profile images)

**Examples:** "Julius Caesar (human)", "Seabiscuit (animal)", "Apple Inc. (organization)", "Zeus (divine)", "Mona Lisa (artifact)"

#### Character Relationship

A connection between two characters, capturing how they relate to each other over time.

**Key attributes:** Relationship type (family, professional, friendship, rivalry, etc.), temporal scope (when it began/ended), description

**Examples:** "Caesar → Brutus: friendship (59-44 BCE)", "Watson ↔ Crick: collaboration (1951-1953)"

#### Story

A narrative structure layered over historical events, enabling multiple perspectives and interpretations.

**Key attributes:** Title, narrative content, narrator type (first-person, third-person, omniscient), perspective character, tags

**Relationships:** References events, spans periods, involves characters (with story roles)

**Examples:** "The Fall of Rome", "Napoleon's Downfall", "Rise and Fall of Dinosaurs"

#### Category

A hierarchical classification for organizing events and other content. Enables filtering, browsing, and thematic grouping.

**Key attributes:** Title, description, color code, icon, parent category (for hierarchy)

**Relationships:** Applied to events, may have child categories

**Examples:** "Science → Physics → Quantum Mechanics", "War → World Wars → World War II"

#### Media

Images, videos, audio, and documents that provide visual and multimedia context.

**Key attributes:** Media type (image, video, audio, document), URL, caption, alt text, file size

**Storage:** Small files (<5MB) in Supabase Storage; larger files via external URLs (YouTube, CDNs, cloud storage)

**Relationships:** Attached to events, characters, timelines

### 10.2 Temporal Concepts

#### Temporal Data

The structured representation of a point in time, supporting dates from the Big Bang to the present and future.

**Structure:** JSONB object containing year, era, precision, optional month/day/time, geological/cosmological metadata, uncertainty range

**Eras:** CE (Common Era), BCE (Before Common Era), KYA (Thousand Years Ago), MYA (Million Years Ago), BYA (Billion Years Ago)

**See:** Section 6 (Hybrid Temporal System) for complete specification

#### Sort Order

A computed numeric value that converts temporal data from any era into a single sortable timeline axis. Enables chronological ordering across cosmological, geological, and modern dates.

**Formula:** Negative values for past (BCE, KYA, MYA, BYA), positive values for CE

**Example:** Big Bang (13.8 BYA) → -13,800,000,000; Moon Landing (1969 CE) → 1969

#### Precision Levels

Indicators of temporal accuracy and certainty:

- **Exact:** Known to the specified unit (e.g., "July 20, 1969 at 2:56 PM UTC")
- **Circa:** Approximate, within a few years (e.g., "c. 1450 CE")
- **Approximate:** Rough estimate, decades/centuries (e.g., "~12,000 years ago")
- **Estimated:** Scientific estimate with uncertainty range (e.g., "66 ± 1 MYA")
- **Geological:** Geological time period, not precise date (e.g., "Late Cretaceous")

#### Fractal Navigation

The ability to zoom in and out of temporal scales, revealing nested sub-events at each zoom level. Events can contain child events, creating a hierarchical structure.

**Depth:** Controlled by timeline's fractal_depth setting (typically 3-5 levels)

**Example:** "World War II" → "Battle of Stalingrad" → "Day 1" → "Morning assault" → "First wave"

### 10.3 User and Permission Concepts

#### Admin

Highest system authority. Full access to all content and system settings, can manage users and curated library.

#### Editor

Standard creator account. Can create, edit, and delete own content. Can publish content and invite collaborators. Cannot access other users' private content.

#### Viewer

Read-only access. Can view published public content and private content when explicitly invited. Cannot create or modify content.

#### Collaborator

A user invited to access another user's timeline with a specified role (viewer, editor, or admin for that timeline).

#### Publication Status

Content exists in two states:

- **Unpublished/Draft:** Visible only to owner and invited collaborators
- **Published:** Visible to all users, included in public search and discovery

#### Visibility

Controls who can access content:

- **Private:** Owner only (can invite specific viewers)
- **Public:** Everyone when published
- **Shared:** Invited collaborators (can be published to become public)

### 10.4 System Concepts

#### Slug

A URL-friendly unique identifier generated from the title. Used for human-readable URLs.

**Format:** Lowercase, spaces replaced with hyphens, alphanumeric only

**Example:** "History of Computing" → "history-of-computing"

**Uniqueness:** Per user (multiple users can have same slug for different content)

#### Curated Content Library

A reference collection of ~100 pre-curated historical events covering major milestones from Big Bang to present. Users can selectively import as a starting point.

**Organization:** 10-15 thematic timelines (computing, aviation, cosmology, etc.)

**Quality:** Accurate temporal data, complete descriptions, proper metadata

**Import:** Creates editable copies owned by importing user

#### Hybrid Temporal System

The core innovation enabling representation of dates across full span of time. Uses structured JSONB storage with generated sort columns for efficient querying.

**See:** Section 6 for complete technical specification

#### Master Timeline

The public homepage showing major historical timelines in horizontal infinite scroll format. Filtered by importance to show most significant content.

**Navigation:** Horizontal scroll, drill-down into timelines, fractal zoom

### 10.5 Visualization Concepts

#### Logarithmic Scale

A timeline visualization mode where each order of magnitude gets equal visual space. Prevents prehistoric events from being crushed to the left edge.

**When used:** Timelines spanning >3 orders of magnitude (e.g., Big Bang to present)

**Alternative:** Linear scale (traditional proportional representation)

#### Event Markers

Visual representations of events on timeline, varying by:

- **Shape:** Based on event type (circle for milestone, diamond for incident, etc.)
- **Size:** Based on importance rating (1-10)
- **Color:** Based on era or category

#### Period Bands

Colored background spans on timeline indicating period duration. Semi-transparent to not obscure events.

**Hierarchy:** Nested periods stacked visually

#### Uncertainty Visualization

Error bars extending left/right from event marker, representing ±uncertainty range.

**Example:** Event at 66 MYA with ±1 MYA uncertainty shows bar from 65-67 MYA

### 10.6 Technical Concepts

#### PostgREST

Auto-generated REST API from PostgreSQL schema. Provides CRUD operations via Supabase client.

**Pattern:** Direct database operations, not stored procedures

#### Row Level Security (RLS)

Database-level authorization enforcing access control. Policies determine who can read/write each row.

**Enforcement:** All data access paths (PostgREST, Edge Functions, direct SQL) respect RLS

#### Edge Functions

Serverless functions (Deno runtime) for operations that can't run on client:

- Bulk import processing
- Timeline export generation
- Image processing
- Geocoding

#### Real-Time

Live updates via Supabase Realtime (WebSocket). Enables:

- Content changes broadcast to subscribed clients
- Presence awareness (who's viewing)
- Collaborative awareness messages

#### TanStack Query

Client-side server state management. Handles caching, background refetch, optimistic updates.

**Pattern:** Surgical cache invalidation on real-time updates

### 10.7 Character Types

#### Human

Standard biographical character. Historical figures, biographical subjects, family members.

**Type-specific:** Birth/death dates, standard biographical fields

#### Animal

Non-human animals. Pets, famous animals, extinct species.

**Type-specific:** Species, breed, birth/death or capture/last sighting

#### Mythological

Beings from mythology and folklore. Gods, heroes, legendary creatures.

**Type-specific:** Domain (area of influence), cultural context (Greek, Norse, etc.)

#### Fictional

Characters from creative works. Literature, film, games.

**Type-specific:** Source work, author, first appearance

#### Organization

Groups, institutions, companies, governments.

**Type-specific:** Domain (industry/sector), founding/dissolution dates

#### Divine

Gods, goddesses, worshipped entities.

**Type-specific:** Domain (divine authority), pantheon, worship regions

#### Artifact

Significant objects, artworks, documents, relics.

**Type-specific:** Material, creator, current location, creation/destruction dates

### 10.8 Relationship Types

Connections between characters:

- **Family:** Parent-child, siblings, spouses
- **Professional:** Colleagues, employer-employee
- **Friendship:** Friends, companions, allies
- **Rivalry:** Opponents, competitors
- **Owner-Pet:** Ownership of animals
- **Trainer-Trainee:** Teaching relationships
- **Creator-Creation:** Artist-artwork, inventor-invention
- **Worship:** Religious devotion
- **Collaboration:** Co-authors, research partners
- **Enemy:** Wartime enemies, blood feuds
- **Mentor-Student:** Academic advisor, career mentor

### 10.9 Event Types

Categories of events:

- **Milestone:** Significant achievement (Moon landing, invention)
- **Period:** Extended duration (World War II, Ice Age)
- **Incident:** Sudden occurrence (earthquake, assassination)
- **Discovery:** Scientific finding (DNA structure, new species)
- **Creation:** Making of artifact (painting, building)
- **Destruction:** End or demolition (extinction, building collapse)
- **Transformation:** Change in state (revolution, metamorphosis)
- **Migration:** Movement (human migration, bird migration)
- **Conflict:** Battle, war, dispute
- **Ceremony:** Ritual or formal event (coronation, treaty signing)

### 10.10 Abbreviations and Acronyms

- **BYA:** Billion Years Ago
- **MYA:** Million Years Ago
- **KYA:** Thousand Years Ago
- **BCE:** Before Common Era (replaces BC)
- **CE:** Common Era (replaces AD)
- **K-Pg:** Cretaceous-Paleogene boundary (66 MYA extinction event)
- **RLS:** Row Level Security
- **CRUD:** Create, Read, Update, Delete
- **MAU:** Monthly Active Users
- **WCAG:** Web Content Accessibility Guidelines
- **PRD:** Product Requirements Document
- **UI/UX:** User Interface / User Experience
- **API:** Application Programming Interface
- **UUID:** Universally Unique Identifier
- **JSONB:** JSON Binary (PostgreSQL data type)

---

**Note:** This glossary provides conceptual definitions. For detailed functional requirements, see Section 4. For physical database implementation, see the Technical Design Document (system-design-v3.md).

---

## 11. Success Criteria & Metrics

This section defines how we measure the success of Time Traveler, both as a product and as a technical implementation.

### 11.1 MVP Completion Criteria

The Minimum Viable Product is considered complete when all of the following are true:

#### 11.1.1 Core Functionality

**Content Creation (Admin):**

- Users can create, edit, and delete timelines
- Users can create, edit, and delete events with full temporal data support
- Users can create, edit, and delete characters (all seven types)
- Users can create, edit, and delete periods
- Users can create, edit, and delete categories
- Users can upload small media (<5MB) and reference external URLs
- All CRUD operations work reliably with proper validation

**Temporal System:**

- TemporalInput component supports all eras (CE, BCE, KYA, MYA, BYA)
- Temporal data validates correctly (era-specific rules, no year 0, etc.)
- Events sort chronologically across all eras
- Temporal display formatting works for all precision levels

**Content Organization:**

- Events can be added to timelines
- Events can be nested (fractal structure) within fractal_depth limit
- Characters can be associated with events with roles
- Categories can be applied to events
- Media can be attached to events and characters

**Publishing and Visibility:**

- Content can be published and unpublished
- Unpublished content is private to creator
- Published content is publicly visible
- Visibility states (private, public, shared) work correctly

#### 11.1.2 Public Interface

**Master Timeline:**

- Displays major timelines in horizontal scroll format
- Filters by importance (default ≥7)
- Users can drill down into individual timelines
- Smooth navigation and zoom controls work

**Timeline Visualization:**

- D3.js/SVG rendering of events on timeline
- Logarithmic and linear scale modes both functional
- Event markers sized by importance, colored by era/category
- Hover shows tooltips with event details
- Click opens event detail view

**Event Detail Pages:**

- Display complete event information
- Show temporal data in formatted display
- List associated characters with roles
- Show applied categories
- Display attached media (embeds render correctly)

**Character Profiles:**

- Display character information and biography
- Show birth/death temporal data
- List events character participated in

**Navigation:**

- Breadcrumb navigation for fractal hierarchy works
- Browser back/forward buttons work correctly
- Search is discoverable (even if not fully implemented)

#### 11.1.3 Technical Requirements

**Performance:**

- Page loads under 2 seconds (95th percentile)
- Timeline rendering smooth (no jank)
- Database queries complete under 500ms for typical operations

**Security:**

- Row Level Security policies enforce all access control
- Users cannot access other users' private content
- Published flag correctly controls public visibility
- No data leakage via API endpoints

**Reliability:**

- No critical bugs (data loss, crashes, security vulnerabilities)
- Error handling prevents white screens
- Users can recover from errors (retry, navigation)

**Data Integrity:**

- Foreign key constraints prevent orphaned data
- Cascade deletes work correctly
- Temporal validation prevents invalid dates
- Unique constraints prevent duplicates

#### 11.1.4 Documentation

- README with setup instructions exists
- Basic user guide for content creation available
- Architecture overview documented
- Database schema documented (system-design-v3.md)

### 11.2 Success Metrics

Metrics for measuring product success over time.

#### 11.2.1 Content Metrics

**Creation:**

- Number of timelines created (target: 50 in first 3 months)
- Number of events created (target: 5,000 in first 3 months)
- Number of characters created (target: 500 in first 3 months)
- Average events per timeline (quality indicator, target: >20)

**Publication:**

- Percentage of content published (engagement indicator, target: >30%)
- Time from creation to publication (quality indicator, shorter is better)

**Quality:**

- Percentage of events with complete temporal metadata (target: >80%)
- Percentage of events with attached media (richness indicator, target: >40%)
- Percentage of characters with complete biographies (target: >60%)

#### 11.2.2 User Metrics

**Acquisition:**

- Monthly active creators (editors with ≥1 creation that month)
- Monthly active readers (users viewing content)
- Creator retention (creators active in month N who return in month N+1)

**Engagement:**

- Average timelines created per creator (target: >2)
- Average events created per creator (target: >50)
- Average session duration for readers (target: >5 minutes)
- Pages per session for readers (target: >4)

**Growth:**

- Month-over-month growth in creators (target: >20%)
- Month-over-month growth in content (events created)
- Month-over-month growth in readers

#### 11.2.3 Technical Metrics

**Performance:**

- Average page load time (target: <1.5s)
- 95th percentile page load time (target: <2s)
- Timeline rendering time for 100 events (target: <500ms)
- Database query P95 latency (target: <500ms)
- Search query P95 latency (target: <500ms)

**Reliability:**

- Uptime percentage (target: >99.9%)
- Error rate (percentage of requests resulting in errors, target: <0.1%)
- Critical bug count (target: 0)
- Time to resolution for critical bugs (target: <24 hours)

**Scalability:**

- Database storage used (monitor against 500MB free tier limit)
- Database egress used (monitor against 2GB/month limit)
- Concurrent users supported without degradation (target: 100 on free tier)

#### 11.2.4 Quality Metrics

**Accessibility:**

- WCAG 2.1 AA compliance (target: 100% of public interface)
- Keyboard navigation completeness (target: 100% of interactive elements)
- Screen reader compatibility (target: no blocking issues)

**User Satisfaction:**

- Net Promoter Score (NPS) if surveyed (target: >50)
- Support ticket volume (lower is better)
- Critical bug reports from users (target: <1 per week)

**Code Quality:**

- Test coverage for business logic (target: >80%)
- TypeScript strict mode compliance (target: 100%)
- ESLint/Prettier compliance (target: 100%)

### 11.3 Acceptance Criteria

Specific testable criteria for major features.

#### 11.3.1 Timeline Creation

**Given** a user is logged in as an Editor  
**When** they create a new timeline with title "History of Computing" and temporal scope "1940 CE - Present"  
**Then** the timeline is saved, assigned a unique slug, and appears in their timeline list

**Acceptance tests:**

- Timeline title is required (form validation prevents empty submission)
- Slug is auto-generated and unique per user
- Temporal scope validation (start before end)
- Timeline appears immediately in creator's list
- Timeline is unpublished by default

#### 11.3.2 Event Creation with Temporal Data

**Given** a user is editing a timeline  
**When** they create an event "Moon Landing" with temporal data "July 20, 1969 CE"  
**Then** the event is saved with correct sort_order_years and appears chronologically in timeline

**Acceptance tests:**

- All eras (CE, BCE, KYA, MYA, BYA) work correctly
- Era-specific validation (no month/day for prehistoric dates)
- Year 0 is rejected for BCE/CE
- Generated sort_order_years enables chronological sorting
- Event appears in correct temporal position on timeline visualization

#### 11.3.3 Character Association

**Given** an event "Moon Landing" exists  
**When** user associates character "Neil Armstrong" with role "protagonist" and significance "primary"  
**Then** the character appears in event's character list with specified role

**Acceptance tests:**

- Multiple characters can be added to one event
- Role and significance are required
- Character avatar appears on event marker in timeline
- Character's profile shows this event in their timeline

#### 11.3.4 Publishing Workflow

**Given** user has an unpublished timeline with events  
**When** they click "Publish" on the timeline  
**Then** timeline and all events become publicly visible

**Acceptance tests:**

- Unpublished content not visible in public browse/search
- Publishing sets published=true and published_at timestamp
- Published content appears in master timeline (if importance ≥7)
- Unpublishing returns content to private state
- Anonymous users can view published content

#### 11.3.5 Timeline Visualization

**Given** a published timeline with 50 events across multiple eras  
**When** a user views the timeline  
**Then** all events are positioned correctly on horizontal timeline with appropriate scaling

**Acceptance tests:**

- Events positioned by sort_order_years
- Logarithmic scale prevents prehistoric events from crushing
- Linear scale available as toggle
- Event markers sized by importance
- Hover shows tooltip with event summary
- Click opens event detail view
- Zoom and pan controls work smoothly

#### 11.3.6 Search Functionality

**Given** multiple published events exist  
**When** user searches for "moon landing"  
**Then** relevant events appear in search results ranked by relevance

**Acceptance tests:**

- Full-text search across title, summary, detail
- Results ranked by relevance and importance
- Snippets show matching text highlighted
- Search respects content visibility (no private content in results)
- Temporal range filter works correctly
- Category filter works correctly

### 11.4 Long-Term Success Vision

Beyond MVP and initial metrics, long-term success is defined by:

#### 11.4.1 Platform Growth

- 10,000+ active creators (editors) by Year 2
- 100,000+ monthly readers by Year 2
- 1 million+ events in the system by Year 3
- Sustainable path to Pro/Team tier (revenue-positive)

#### 11.4.2 Content Quality

- Curated library expanded to 500+ events across 50+ timelines
- High-quality community contributions meeting curation standards
- Timelines referenced in educational contexts
- Academic researchers using platform for temporal analysis

#### 11.4.3 Technical Maturity

- Mobile apps (iOS/Android) launched
- Collaborative real-time editing implemented
- Advanced search with AI-powered recommendations
- Public API for third-party integrations
- 99.99% uptime with professional monitoring

#### 11.4.4 Community & Ecosystem

- Active community of storytellers and historians
- Educational institutions using platform for curriculum
- Integration with external historical databases
- Published timelines cited in research and journalism
- Open-source contributions to temporal visualization tools

### 11.5 Failure Criteria

Conditions that would indicate the project should be reconsidered or pivoted:

#### 11.5.1 Technical Failures

- Unable to achieve <2s page loads after optimization attempts
- Hybrid temporal system proves too complex for users to understand
- Database performance degrades unacceptably at scale
- Critical security vulnerabilities cannot be resolved
- Free tier limits hit within first month (unsustainable costs)

#### 11.5.2 Product-Market Fit Failures

- <10 active creators after 6 months of availability
- > 80% of created content never published (creation too difficult)
- <5% creator retention month-over-month
- No organic growth (all users are from creator's direct promotion)
- User feedback consistently indicates "too complicated" or "don't understand purpose"

#### 11.5.3 Quality Failures

- > 5 critical bugs per week persisting after first 3 months
- Unable to meet WCAG AA accessibility standards
- > 10% error rate in production
- Data loss incidents occurring
- Majority of user-generated content is low quality or spam

### 11.6 Monitoring and Reporting

#### 11.6.1 Dashboards

**Admin Dashboard:**

- Real-time metrics: active users, content created today, errors
- Weekly metrics: new creators, published content, top timelines
- Monthly metrics: growth trends, retention, engagement

**Technical Dashboard:**

- Performance: page load times, query latency, error rates
- Infrastructure: database size, egress usage, function invocations
- Alerts: uptime, error spikes, performance degradation

#### 11.6.2 Regular Reviews

**Weekly:**

- Review error logs and user-reported issues
- Check performance metrics against targets
- Monitor database storage approaching limits

**Monthly:**

- Review user growth and engagement metrics
- Analyze content quality and publication rates
- Review and prioritize feature requests
- Update roadmap based on learnings

**Quarterly:**

- Deep dive on retention and churn
- Evaluate technical debt and refactoring needs
- Assess progress toward long-term vision
- Adjust strategy based on product-market fit signals

---

**Note:** Success is ultimately measured by whether Time Traveler fulfills its core purpose: enabling people to explore, understand, and create compelling narratives across the full span of time. Metrics are tools to guide development, not ends in themselves.

---

## 12. Appendices

### 12.1 Enumerated Values

Complete lists of allowed values for various fields throughout the system.

#### 12.1.1 Temporal Eras

- `CE` - Common Era
- `BCE` - Before Common Era
- `KYA` - Thousand Years Ago
- `MYA` - Million Years Ago
- `BYA` - Billion Years Ago

#### 12.1.2 Precision Levels

- `exact` - Known to the specified unit
- `circa` - Approximate, within a few years
- `approximate` - Rough estimate, decades/centuries
- `estimated` - Scientific estimate with uncertainty
- `geological` - Geological time period, not precise date

#### 12.1.3 Display Formats

- `standard` - Human-readable format (e.g., "March 15, 44 BCE")
- `scientific` - Scientific notation with uncertainty (e.g., "66 ± 1 MYA")
- `geological` - Geological context emphasis (e.g., "Late Cretaceous (66 MYA)")
- `cosmological` - Cosmological context (e.g., "Big Bang (13.8 BYA)")

#### 12.1.4 Confidence Levels

- `high` - Well-established, multiple corroborating sources
- `medium` - Reasonably confident, some uncertainty
- `low` - Speculative, limited evidence

#### 12.1.5 Character Types

- `human` - Historical figures, biographical subjects
- `animal` - Pets, famous animals, species representatives
- `mythological` - Beings from mythology and folklore
- `fictional` - Characters from literature, film, games
- `organization` - Companies, institutions, governments
- `divine` - Gods, goddesses, worshipped entities
- `artifact` - Significant objects, artworks, documents

#### 12.1.6 Event Types

- `milestone` - Significant achievement or marker
- `period` - Extended duration with start and end
- `incident` - Sudden occurrence
- `discovery` - Scientific or exploratory finding
- `creation` - Making of artifact or work
- `destruction` - End or demolition
- `transformation` - Change in state or form
- `migration` - Movement of people, animals, or things
- `conflict` - Battle, war, or dispute
- `ceremony` - Ritual or formal event

#### 12.1.7 Character Roles in Events

- `protagonist` - Main character, central to event
- `antagonist` - Opposing character
- `witness` - Observed but did not participate actively
- `participant` - Involved in the event
- `victim` - Suffered harm or loss
- `beneficiary` - Gained from the event
- `performer` - Executed the action
- `competitor` - Competed in the event
- `owner` - Possessed related property/entity
- `creator` - Made or invented something
- `observer` - Watched without involvement

#### 12.1.8 Participation Significance

- `primary` - Central role, critical to event
- `secondary` - Important but not central
- `minor` - Peripheral involvement
- `mentioned` - Referenced but minimally involved

#### 12.1.9 Relationship Types

- `family` - Family relationships (parent, sibling, spouse)
- `professional` - Work relationships (colleague, employer-employee)
- `friendship` - Social bonds and companionship
- `rivalry` - Competitive relationships
- `owner_pet` - Ownership of animals
- `trainer_trainee` - Teaching and training relationships
- `creator_creation` - Artist-artwork, inventor-invention
- `worship` - Religious devotion
- `collaboration` - Joint work and partnerships
- `enemy` - Hostile relationships
- `mentor_student` - Formal mentorship

#### 12.1.10 Timeline Types

- `general` - Thematic collections, most common type
- `biographical` - Centered on specific character's life
- `comparative` - Designed for side-by-side comparison

#### 12.1.11 Narrator Types

- `first_person` - "I" narration, perspective character tells story
- `third_person` - "He/She/They" narration, external narrator
- `omniscient` - All-knowing narrator with access to all perspectives

#### 12.1.12 Story Character Roles

- `protagonist` - Main character(s) of the story
- `supporting` - Important secondary characters
- `mentioned` - Referenced but not central to narrative
- `narrator` - Character telling the story

#### 12.1.13 Significance Levels

- `low` - Minor importance
- `medium` - Notable significance
- `high` - Major importance
- `critical` - Civilization-defining, highest importance

#### 12.1.14 Visibility States

- `private` - Visible only to content owner
- `public` - Visible to all users when published
- `shared` - Visible to invited collaborators

#### 12.1.15 Collaborator Roles

- `viewer` - Read-only access to timeline and events
- `editor` - Can add/edit/delete events within timeline
- `admin` - Full control including timeline settings and collaborator management

#### 12.1.16 Media Types

- `image` - Static images (photos, paintings, diagrams)
- `video` - Video content (YouTube, Vimeo, etc.)
- `audio` - Audio content (recordings, music, speeches)
- `document` - Text documents (PDFs, historical documents)

### 12.2 Key Constraints and Limits

#### 12.2.1 Size Limits

- Timeline title: 2000 characters maximum
- Event title: 2000 characters maximum
- Character name: 2000 characters maximum
- Slug: 100 characters maximum
- Uploaded media files: 5MB maximum
- Text fields (summary, detail, biography): No hard limit, but performance considerations apply

#### 12.2.2 Numeric Ranges

- Event importance: 1-10 (integer)
- Timeline fractal depth: 1-10 (integer)
- Temporal year: Any numeric value (decimals allowed for BYA/MYA)
- Temporal month: 1-12 (integer, CE/BCE only)
- Temporal day: 1-31 (integer, CE/BCE only, validated against month)
- Temporal hour: 0-23 (integer)
- Temporal minute: 0-59 (integer)
- Temporal second: 0-59 (integer or decimal)

#### 12.2.3 Supabase Free Tier Limits (2026)

- Projects: 2 active
- Database storage: 500 MB
- Database egress: 2 GB per month
- File storage: 1 GB
- Storage egress: 2 GB per month
- Monthly Active Users: 50,000
- Edge Function invocations: 500,000 per month
- Realtime connections: 200 concurrent
- Project auto-pause: After 7 days of inactivity

#### 12.2.4 Performance Targets

- Page load time (initial render): <2 seconds (P95)
- API response time (simple queries): <100ms (P95)
- API response time (complex queries): <500ms (P95)
- Search query time: <500ms (P95)
- Timeline rendering (100 events): <500ms
- Database query time: <200ms for indexed queries (P95)

### 12.3 Reference Links

#### 12.3.1 Technical Documentation

- **Supabase Documentation**: https://supabase.com/docs
- **Next.js Documentation**: https://nextjs.org/docs
- **TanStack Query Documentation**: https://tanstack.com/query
- **shadcn/ui Components**: https://ui.shadcn.com
- **D3.js Documentation**: https://d3js.org
- **WCAG 2.1 Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/

#### 12.3.2 Design Resources

- **Tailwind CSS**: https://tailwindcss.com/docs
- **Radix UI**: https://www.radix-ui.com
- **Inter Font**: https://rsms.me/inter/
- **Merriweather Font**: https://fonts.google.com/specimen/Merriweather

#### 12.3.3 Development Tools

- **TypeScript**: https://www.typescriptlang.org/docs/
- **Zod**: https://zod.dev
- **ESLint**: https://eslint.org
- **Prettier**: https://prettier.io
- **Playwright**: https://playwright.dev

#### 12.3.4 Related Documentation

- **Time Traveler Technical Design**: system-design-v3.md
- **Time Traveler Architecture Overview**: (to be created)
- **Time Traveler API Documentation**: (to be generated from code)

### 12.4 Geological Time Periods (Reference)

Common geological periods for temporal data entry:

#### Eons

- Hadean (4.6 - 4.0 BYA)
- Archean (4.0 - 2.5 BYA)
- Proterozoic (2.5 BYA - 541 MYA)
- Phanerozoic (541 MYA - Present)

#### Eras (Phanerozoic Eon)

- Paleozoic (541 - 252 MYA)
- Mesozoic (252 - 66 MYA)
- Cenozoic (66 MYA - Present)

#### Periods (Selected)

- Cambrian (541 - 485 MYA)
- Ordovician (485 - 444 MYA)
- Silurian (444 - 419 MYA)
- Devonian (419 - 359 MYA)
- Carboniferous (359 - 299 MYA)
- Permian (299 - 252 MYA)
- Triassic (252 - 201 MYA)
- Jurassic (201 - 145 MYA)
- Cretaceous (145 - 66 MYA)
- Paleogene (66 - 23 MYA)
- Neogene (23 - 2.6 MYA)
- Quaternary (2.6 MYA - Present)

### 12.5 Common Temporal Patterns

Examples of typical temporal data for reference:

#### Cosmological Events

```json
{
  "year": 13.8,
  "era": "BYA",
  "precision": "estimated",
  "uncertainty": 0.02,
  "cosmological_epoch": "Big Bang",
  "display_format": "cosmological"
}
```

#### Geological Events

```json
{
  "year": 66,
  "era": "MYA",
  "precision": "estimated",
  "uncertainty": 1,
  "geological_period": "Cretaceous-Paleogene boundary",
  "dating_method": "radiometric",
  "confidence_level": "high"
}
```

#### Ancient History

```json
{
  "year": 44,
  "month": 3,
  "day": 15,
  "era": "BCE",
  "precision": "exact"
}
```

#### Modern History

```json
{
  "year": 1969,
  "month": 7,
  "day": 20,
  "hour": 20,
  "minute": 17,
  "era": "CE",
  "precision": "exact"
}
```

### 12.6 Color Palette Reference

#### Primary Colors (Light Theme)

- Primary: `#4F7CAC` (Warm blue)
- Primary Hover: `#3D5C7D` (Darker blue)
- Primary Muted: `#E8F1F8` (Light blue background)

#### Era Colors (Light Theme)

- CE: `#4F7CAC` (Warm blue)
- BCE: `#D4A574` (Amber gold)
- KYA: `#8B7355` (Earth brown)
- MYA: `#2D5C3F` (Deep forest green)
- BYA: `#6B4C8A` (Cosmic purple)

#### Neutral Grays (Light Theme)

- Background: `#FAFAFA`
- Surface: `#FFFFFF`
- Border: `#E5E5E5`
- Muted Text: `#737373`
- Foreground Text: `#171717`

#### Semantic Colors

- Success: `#10B981` (Green)
- Error: `#EF4444` (Red)
- Warning: `#F59E0B` (Amber)
- Info: `#3B82F6` (Sky blue)

### 12.7 Version History

| Version | Date          | Author | Changes              |
| ------- | ------------- | ------ | -------------------- |
| 1.0     | February 2026 | Oak    | Initial PRD creation |

### 12.8 Outstanding Questions

Items requiring further research or decision:

1. **Section 4 Restructure**: Rewrite Section 4 as logical requirements (separate from physical implementation)
2. **Section 5**: Create high-level Technical Architecture overview (reference system-design-v3.md for details)
3. **Section 9**: Create high-level API Design patterns (not exhaustive endpoint listing)
4. **Search Implementation**: Full-text search marked for post-MVP launch - confirm priority
5. **Mobile Apps**: Long-term roadmap item - confirm priority and timeline
6. **AI Features**: Previously removed from scope - revisit in future?

### 12.9 Document Maintenance

This PRD is a living document that should be updated as the product evolves.

**Update triggers:**

- Major feature additions or changes
- Significant architectural decisions
- User feedback requiring product pivots
- Quarterly reviews revealing new insights

**Version control:**

- PRD stored in version control (Git)
- Changes tracked via commits
- Major versions tagged (v1.0, v2.0, etc.)

**Stakeholder review:**

- PRD reviewed with technical team before implementation begins
- PRD updated based on learnings during development
- PRD consulted during feature prioritization discussions

---

**End of Product Requirements Document**

For implementation details, see:

- Technical Design Document: system-design-v3.md
- API Documentation: (to be generated)
- Architecture Overview: (to be created)
