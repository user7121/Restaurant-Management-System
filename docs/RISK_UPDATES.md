# 📋 Risk Register – Restaurant Management System

> Last Updated: 2026-03-26 | Sprint 3

## Risk Assessment Matrix

| Probability ↓ / Impact → | Low | Medium | High |
|---------------------------|-----|--------|------|
| **High**                  | 🟡  | 🟠     | 🔴   |
| **Medium**                | 🟢  | 🟡     | 🟠   |
| **Low**                   | 🟢  | 🟢     | 🟡   |

---

## Active Risks

### R-001: Schedule Delays Due to Academic Workload
| Field | Detail |
|-------|--------|
| **Probability** | High |
| **Impact** | High |
| **Rating** | 🔴 Critical |
| **Status** | ⚠️ Open |
| **Description** | Team members have concurrent academic obligations (exams, assignments) that may delay sprint deliverables. |
| **Mitigation** | Buffer time added to each sprint. Tasks reprioritized based on academic calendar. Daily async standups via team chat. |
| **Contingency** | Scope reduction to core MVP features if delays exceed 1 week. |
| **Owner** | All Team Members |

---

### R-002: Database Schema Changes Mid-Sprint
| Field | Detail |
|-------|--------|
| **Probability** | Medium |
| **Impact** | High |
| **Rating** | 🟠 Major |
| **Status** | ✅ Mitigated |
| **Description** | Evolving requirements may force database schema modifications that break existing API endpoints. |
| **Mitigation** | Schema versioning with incremental SQL files. Backend uses parameterized queries. Schema finalized before Sprint 2 start. |
| **Contingency** | Emergency migration scripts prepared. |
| **Owner** | İzzet Ali ARSLAN |

---

### R-003: JWT Security Vulnerabilities
| Field | Detail |
|-------|--------|
| **Probability** | Low |
| **Impact** | High |
| **Rating** | 🟡 Moderate |
| **Status** | ✅ Mitigated |
| **Description** | Improperly configured JWT tokens could lead to unauthorized access or session hijacking. |
| **Mitigation** | JWT secret stored in `.env` (never committed). Token expiration set to 24h. Password hashing with bcrypt (12 salt rounds). Account lockout after failed attempts. |
| **Contingency** | Token blacklist mechanism can be added if breach detected. |
| **Owner** | Batuhan İNAN |

---

### R-004: Scope Creep Beyond MVP
| Field | Detail |
|-------|--------|
| **Probability** | High |
| **Impact** | Medium |
| **Rating** | 🟠 Major |
| **Status** | ⚠️ Open |
| **Description** | Adding features beyond the defined MVP scope may jeopardize sprint delivery timelines. |
| **Mitigation** | Strict backlog prioritization in Jira. Features beyond MVP tagged as "Future Enhancement." Sprint scope locked after planning. |
| **Contingency** | De-scope non-critical features to next semester or phase. |
| **Owner** | All Team Members |

---

### R-005: Team Member Unavailability
| Field | Detail |
|-------|--------|
| **Probability** | Medium |
| **Impact** | Medium |
| **Rating** | 🟡 Moderate |
| **Status** | ⚠️ Open |
| **Description** | A team member may become unavailable due to illness, personal reasons, or other academic commitments. |
| **Mitigation** | Cross-training on modules. Documentation of all code. Shared GitHub repository with clear commit history. |
| **Contingency** | Remaining members absorb tasks; instructor notified if extended absence. |
| **Owner** | All Team Members |

---

### R-006: Integration Issues Between Frontend and Backend
| Field | Detail |
|-------|--------|
| **Probability** | Medium |
| **Impact** | Medium |
| **Rating** | 🟡 Moderate |
| **Status** | ✅ Mitigated |
| **Description** | API contract mismatches between React frontend and Express backend may cause runtime errors. |
| **Mitigation** | RESTful API conventions followed. Health check endpoint (`/api/health`) for quick verification. CORS configured for local dev origins. Postman used for API testing before frontend integration. |
| **Contingency** | Fallback to Postman-only demo if frontend integration incomplete. |
| **Owner** | Batuhan İNAN & Emir İnanç ŞEKER |

---

### R-007: CI/CD Pipeline Failure
| Field | Detail |
|-------|--------|
| **Probability** | Low |
| **Impact** | Low |
| **Rating** | 🟢 Low |
| **Status** | ✅ Mitigated |
| **Description** | GitHub Actions workflow may fail due to configuration or dependency issues. |
| **Mitigation** | CI runs on a Node.js version matrix (18.x, 20.x). `npm ci` used for deterministic installs. YAML validated before push. |
| **Contingency** | Manual verification of builds locally. |
| **Owner** | Batuhan İNAN |

---

## Risk Summary

| ID | Risk | Rating | Status |
|----|------|--------|--------|
| R-001 | Schedule Delays | 🔴 Critical | ⚠️ Open |
| R-002 | DB Schema Changes | 🟠 Major | ✅ Mitigated |
| R-003 | JWT Security | 🟡 Moderate | ✅ Mitigated |
| R-004 | Scope Creep | 🟠 Major | ⚠️ Open |
| R-005 | Team Unavailability | 🟡 Moderate | ⚠️ Open |
| R-006 | Frontend-Backend Integration | 🟡 Moderate | ✅ Mitigated |
| R-007 | CI/CD Pipeline Failure | 🟢 Low | ✅ Mitigated |
