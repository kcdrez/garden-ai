# Garden AI Project Plan

## Overview

Garden AI is a full-stack AI-assisted gardening application where users can:

- Create and manage gardens
- Design garden beds
- Track plants and growing conditions
- Receive AI-powered gardening recommendations
- Upload plant images for analysis
- Receive weather and seasonal gardening insights

Primary goals:
- Learn full-stack application architecture
- Learn Django backend development
- Learn React frontend architecture
- Learn AI integrations and context engineering
- Learn Docker, CI/CD, and AWS infrastructure
- Build a polished portfolio/resume project

---

# Technical Goals

## Frontend
- React
- TypeScript
- Vite
- TailwindCSS
- TanStack Query

## Backend
- Django
- Django REST Framework
- PostgreSQL
- Celery
- Redis

## AI
- OpenAI APIs
- Prompt/context engineering
- AI-assisted recommendations
- AI chat support

## Infrastructure
- Docker
- Docker Compose
- GitHub Actions
- AWS
- S3
- EC2
- CI/CD pipelines

---

# Core Features

## User Features
- User registration/login
- Garden creation
- Garden bed management
- Plant tracking
- AI gardening assistant
- Weather insights
- Plant image uploads
- Seasonal recommendations

---

# Development Phases

# Phase 0 — Foundation
- Initialize repositories
- Setup React frontend
- Setup Django backend
- Configure PostgreSQL
- Configure Docker
- Configure local development environment

---

# Phase 1 — Authentication + CRUD
- User authentication
- JWT auth
- Protected routes
- Garden CRUD
- Bed CRUD
- Plant CRUD

---

# Phase 2 — AI Integration
- OpenAI integration
- AI chat endpoint
- Prompt builder system
- Context retrieval system
- Conversation history

---

# Phase 3 — Weather + Scheduling
- Weather API integration
- Frost alerts
- Watering reminders
- Scheduled jobs with Celery

---

# Phase 4 — Image Uploads
- S3 integration
- Plant photo uploads
- AI image analysis

---

# Phase 5 — Deployment
- EC2 deployment
- CI/CD pipelines
- HTTPS setup
- Nginx configuration
- Production environment setup

---

# Phase 6 — Advanced Infrastructure
- RDS migration
- ElastiCache
- ECS/Fargate
- Monitoring/logging improvements

---

# Initial Architecture

## Frontend
React SPA communicating with Django REST APIs.

## Backend
Django monolith with modular apps:
- auth
- gardens
- plants
- ai

## Database
PostgreSQL relational database.

## Background Jobs
Celery + Redis.

## AI Layer
Backend-controlled OpenAI API integration with dynamic context assembly.

---

# Initial Database Models

## User
- email
- username
- timezone
- locale

## Garden
- user_id
- name
- location
- hardiness_zone

## GardenBed
- garden_id
- sunlight_type
- soil_type
- dimensions

## Plant
- common_name
- scientific_name
- requirements

## UserPlant
- bed_id
- plant_id
- planted_date
- status

## AIConversation
- user_id
- prompt
- response

---

# Learning Objectives

## Software Engineering
- API design
- authentication
- authorization
- testing
- frontend architecture
- backend architecture

## DevOps
- containerization
- CI/CD
- AWS deployment
- monitoring
- logging

## AI Engineering
- context engineering
- prompt design
- retrieval systems
- token optimization
- AI orchestration

---

# MVP Definition

The MVP is considered complete when:
- users can create accounts
- users can manage gardens/beds/plants
- AI recommendations work
- app is deployed publicly
- CI/CD pipeline is functional
- Dockerized local development works

---

# Stretch Goals
- React Native mobile app
- drag/drop garden planner
- companion planting engine
- vector search/RAG
- social features
- push notifications
- advanced AI memory systems

---

# Non-Goals (Initially)
- Multi-tenant enterprise support
- Kubernetes
- Microservices
- Complex AI agents
- Real-time multiplayer collaboration
- Marketplace/ecommerce

---

# Success Criteria

The project succeeds if it:
- teaches modern infrastructure concepts
- demonstrates full-stack engineering ability
- demonstrates AI integration ability
- is deployed and usable publicly
- becomes strong portfolio material
