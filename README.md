# Time Traveler

Time Traveler is a content management system for telling the stories of history.

## Abstract

This document describes the design and development of Time Traveler, a system allowing for the storage, visualization, and interaction with temporal and semantic information using timelines in 2D environments as layered, filtered graphs. We focus on the application of interactive timelines for temporal content management systems, extending their capabilities with novel concepts for cross referencing temporal events with the spatial dimension. The work is intended to investigate beyond the current state of the art interaction with temporal data using a variety of techniques for cross-referencing, analyzing, and representing historical events.

## Introduction

Timelines are a widespread concept for temporal information representation (i.e., events that took place during a time period) and are employed in various environments and contexts, ranging from exhibition spaces and museums to educational textbooks. In general, timelines aim to present information regarding specific temporal periods along with an overview of related occurring events in condensed, yet rich, form. The contents of a timeline can vary from historical events to numerical data representation, while the only limitation is that the various items should be temporally related.

In this context, this document provides the design and development of Time Traveler, a system allowing for the modeling, storing, visualization and interaction with temporal data as timelines. Time Traveler extends the typical visualization techniques offered by the majority of the available interactive timelines, which order events in simple, linear 2D space to denote temporal relations, by providing an innovative alternate view that aims to highlight the fractal dimension of time and facilitate a more immersive exploration of the available information. This view employs a “fractal” metaphor, i.e., the ability to zoom in and out of time to reveal the timelines associated with each event. Along the timeline, next to each event, exists an extendable ‘showcase’ comprising various multimedia objects (e.g., texts, documents, images, videos and 3D models).

## Background

### Timeline-Related Concepts

**Events** are a common concept of timelines and represent any type of incident that took place at some point in time. Information concerning events is represented in chronological order and usually includes at least a title/short description, as well as when it happened. Event occurrences may be (or considered) instant, e.g., the birth of a person, or have a duration, e.g., the construction of a monument.

**Periods** are time frames during which incidents share some common characteristics or hold a distinct meaning.

**Categories** define groups of semantically relevant events whose common denominator can be their type, their context or a specific attribute (e.g., the director in the case of a movie). Categories are mainly used to facilitate interaction by minimizing the amount of the displayed information through filtering out certain objects.

### Interactive Timelines

Interactive timelines may be broadly classified into three distinct categories according to the type of information they present, as well as the aspect of information they focus on:

a) Historical Events Representation
b) Temporal Data Representation
c) Semantic Timelines

The first category includes timelines that represent historical events, aiming to provide an overview around a specific topic. Timelines representing temporal data consist of numerous values of one or more variables that change over time; therefore, the second category can be considered as enriched graph visualization techniques, which primarily focus on the analysis of data distribution over time. Finally, the third category, semantic timelines, represents events with metadata that can be interrelated with others, primarily focusing on displaying the relationships between events rather than providing detailed information about the events.

Faceted navigation is a common practice used for temporal data visualization in timelines, implemented through the adoption of taxonomies to classify data in multiple ways and allows the application of filters to information. Faceted display is implemented through hierarchical trees, separate quantitative controls, and separate toggle / filtering controls.

## Motivation and Design Requirements

The overall goal of this work is to design, develop and assess an integrated approach for modeling, storing, retrieving, and visualizing temporal information in a way generally application for the purpose of storytelling. In brief, according to the envisioned design requirements the system should:

1. allow expressing, storing and retrieving event-related data augmented with semantic information, and thus be able to retrieve knowledge from a formal data model;
2. support the arbitrary grouping (categorization) of events in a non-restrictive way; thus, apart from temporal categorization, the system should offer a content-independent semantic categorization mechanism;
3. provide alternative, appropriate and complementary, ways (views) to represent information among which the user should be able to dynamically switch ‘on-the-fly’;
4. provide suitable display modes for the presentation of event information, both for fundamental data such as titles and for extended details such as descriptive text, images, videos and 3D models.
