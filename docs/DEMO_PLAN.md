# 🎬 Live Demo Plan – Restaurant Management System

> **Course**: Software Project Management  
> **Date**: Sprint 3 Demo  
> **Duration**: ~15–20 minutes  
> **Presenters**: Batuhan İNAN, Emir İnanç ŞEKER, İzzet Ali ARSLAN

---

## Demo Objectives

Demonstrate the following to the instructor and stakeholders:

1. ✅ Working system (MVP functionality)
2. ✅ GitHub repository structure and version control
3. ✅ CI/CD pipeline (GitHub Actions)
4. ✅ Jira project board (sprint planning & tracking)

---

## Demo Script

### Part 1: System Overview (3 min)

| Step | Action | Speaker |
|------|--------|---------|
| 1.1 | Open the application in a browser | Emir İnanç |
| 1.2 | Briefly introduce the project purpose and architecture | Batuhan |
| 1.3 | Show the architecture diagram: React → Node.js → MySQL | Batuhan |

**Talking Points:**
- Three-tier web architecture (Presentation, Application, Data)
- Tech stack: React.js, Node.js/Express, MySQL
- Agile Scrum methodology with Jira

---

### Part 2: Working System Demo (7 min)

#### 2.1 – Authentication System (2 min)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 2.1.1 | Navigate to login page | Login form is displayed |
| 2.1.2 | Login with Admin credentials | JWT token generated, dashboard loads |
| 2.1.3 | Show invalid login attempt | Error message displayed, failed attempt counter incremented |

#### 2.2 – Menu & Category Management (2 min)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 2.2.1 | Navigate to Category Management | Category list displayed |
| 2.2.2 | Create a new category (e.g., "Desserts") | Category added to list |
| 2.2.3 | Add a product under "Desserts" | Product created with price and stock |
| 2.2.4 | Edit a product's price | Price updated successfully |

#### 2.3 – Order Management (1.5 min)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 2.3.1 | Create a new order for Table 3 | Order created with items |
| 2.3.2 | Change order status | Status updated (pending → preparing → completed) |

#### 2.4 – Stock Dashboard (1.5 min)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 2.4.1 | Navigate to Stock Status Dashboard | Stock levels displayed for all products |
| 2.4.2 | Show stock deduction after an order | Stock quantity decreased accordingly |

**Fallback Plan:** If the frontend has integration issues, demonstrate all API endpoints using **Postman** with pre-configured requests.

---

### Part 3: GitHub Repository Tour (3 min)

| Step | Action |
|------|--------|
| 3.1 | Open GitHub repository in browser |
| 3.2 | Show repository structure: `backend/`, `frontend/`, `database/`, `docs/` |
| 3.3 | Show `README.md` rendering with project description, architecture, and setup instructions |
| 3.4 | Show commit history and meaningful commit messages |
| 3.5 | Show `.github/workflows/ci.yml` – CI/CD configuration file |
| 3.6 | Show `docs/` folder: risk analysis, demo plan, sprint board link, UML diagram |

**Talking Points:**
- Version control best practices (meaningful commits, .gitignore)
- Documentation as code (Markdown)
- Environment variable management (.env.example)

---

### Part 4: CI/CD Pipeline Demo (3 min)

| Step | Action |
|------|--------|
| 4.1 | Navigate to GitHub Actions tab |
| 4.2 | Show CI workflow runs (triggered on push to `main`) |
| 4.3 | Open a completed workflow run and show the jobs: Backend CI, Database Schema Validation, Documentation Check |
| 4.4 | Show the Node.js version matrix (18.x and 20.x) |
| 4.5 | Show the CI status badge in README.md |

**Talking Points:**
- Automated quality checks on every push
- Multi-version Node.js testing
- Project structure and documentation verification

---

### Part 5: Jira Project Board (2 min)

| Step | Action |
|------|--------|
| 5.1 | Open Jira sprint board |
| 5.2 | Show backlog items and their status (To Do, In Progress, Done) |
| 5.3 | Show sprint velocity and burndown chart (if available) |
| 5.4 | Show user story assignments per team member |

**Talking Points:**
- Agile Scrum methodology in practice
- Sprint planning and backlog management
- Task distribution across team

---

### Part 6: Q&A (2 min)

Open the floor for questions from the instructor and classmates.

---

## Pre-Demo Checklist

- [ ] All team members present
- [ ] Backend server running locally (`npm run dev`)
- [ ] MySQL database seeded with sample data
- [ ] Frontend running locally (if applicable)
- [ ] GitHub repository is public / accessible to instructor
- [ ] Jira board is accessible to instructor
- [ ] Browser tabs pre-opened: App, GitHub, GitHub Actions, Jira
- [ ] Postman collection ready as fallback
- [ ] Stable internet connection verified

---

## Team Responsibilities During Demo

| Team Member | Role |
|-------------|------|
| **Batuhan İNAN** | System architecture, backend API demo, CI/CD pipeline |
| **Emir İnanç ŞEKER** | Frontend demo, UI walkthrough |
| **İzzet Ali ARSLAN** | Database schema, stock management, reports |
