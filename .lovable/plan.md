

# AI Daily Goal Tracker - Implementation Plan

## Overview
A full-featured goal tracking application with a professional React frontend connected to Google Sheets as the database. Features role-based access for students and teachers, daily/weekly goal management, and AI-powered weekly reports.

---

## 1. Authentication System

### Login & Signup Pages
- Professional, corporate-styled forms with email and password fields
- Role selection dropdown (Student/Teacher) during signup
- Form validation and error handling
- User credentials stored in Google Sheets "Users" sheet

### Session Management
- Browser-based session storage after successful login
- Session stores: username, email, and role
- Logout functionality to clear session
- Route protection based on login status

---

## 2. Google Sheets Database Structure

### Sheet 1: Users
| Username | Email | Password | Role |
|----------|-------|----------|------|
| John Doe | john@example.com | hashed | student |

### Sheet 2: DailyGoals
| Username | Email | DailyGoal | Reflection | WentWell | Challenges | Left | Date | Status |

### Sheet 3: WeeklyGoals
| Username | Email | WeeklyGoal | Reflection | WentWell | Challenges | Left | Week | Status |

### Sheet 4: WeeklyReports
| Username | Email | Week | CompletionPercent | MainChallenges | AIFeedback | CreatedAt |

---

## 3. Student Dashboard

### Daily Goals Tab
- **Add Goal Form** with fields:
  - Daily Goal (text input)
  - Reflection (textarea)
  - Went Well (textarea)
  - Challenges (textarea)
  - Left (textarea)
  - Status (dropdown: Pending/In Progress/Completed)
- Date automatically captured
- List view of personal goals only (filtered by email)
- Edit functionality for existing goals

### Weekly Goals Tab
- Similar form structure with Week auto-generated (YYYY-WW format)
- Personal weekly goals list with edit capability

### Weekly AI Report
- "Generate Weekly Report" button
- Fetches last 7 days of daily goals
- Calculates completion statistics
- AI generates personalized feedback:
  - Analysis of incomplete goals
  - Improvement suggestions
  - Encouragement and insights
- Report saved to WeeklyReports sheet
- View history of past reports

---

## 4. Teacher Dashboard

### All Students View
- Tabbed interface: Daily Goals | Weekly Goals | AI Reports
- Complete visibility of all student data
- Filter by student email
- Search functionality
- Read-only access (no editing)

### Analytics Overview
- Summary cards showing total students, goals this week, completion rates
- Quick insights into class performance

---

## 5. Navigation & Layout

### Professional Corporate Design
- Clean, structured layout with sidebar navigation
- Neutral color palette (grays, blues)
- Clear typography and spacing
- Responsive design for all screen sizes

### Pages Structure
- `/login` - Login page
- `/signup` - Registration page
- `/student` - Student dashboard
- `/student/weekly` - Weekly goals view
- `/teacher` - Teacher dashboard

---

## 6. Backend Integration (Edge Functions)

### API Endpoints via Supabase Edge Functions:
1. **auth-handler** - Login/Signup with Google Sheets
2. **daily-goals** - CRUD operations for daily goals
3. **weekly-goals** - CRUD operations for weekly goals
4. **generate-report** - AI report generation using Lovable AI
5. **fetch-reports** - Retrieve weekly reports

### Google Sheets Connection
- Uses `googleapis` npm package in Edge Functions
- Service account authentication
- Full CRUD operations on all sheets

---

## 7. AI Weekly Report Feature

### Report Generation Flow:
1. Student clicks "Generate Weekly Report"
2. System fetches their last 7 days of DailyGoals
3. Calculates:
   - Total goals count
   - Completed goals count
   - Completion percentage
   - Main challenges identified
4. Sends data to Lovable AI for analysis
5. AI generates personalized feedback
6. Report saved to WeeklyReports sheet
7. Displayed to student immediately

---

## 8. Security Considerations

- Password hashing before storage
- Email-based data filtering for students
- Role verification on all protected routes
- Input validation on all forms

---

## Setup Requirements

You'll need to provide:
1. **Google Cloud Service Account JSON** - For Sheets API access
2. **Google Sheet ID** - The spreadsheet to use as database

The app will use **Lovable AI** for report generation (no additional API key needed).

