# Lead Filtration Engine - Frontend

This is the React-based frontend for the Lead Filtration Engine. It provides a simulation interface to create leads, trigger mock outcomes from external systems, and view the **30-second executive summary** with human-readable reasoning.

## 🛠 Features

- **Lead Creation**: Simple form to initialize a lead with name and phone
- **Outcome Simulators**: 
  - WhatsApp reply simulator (YES / NO / NO_RESPONSE)
  - AI Call result simulator (Interest, Budget, Timeline)
  - Link activity simulator (Opened, Time Spent, Form Submitted)
- **Executive Summary**: 
  - Real-time status badge (HOT / WARM / COLD)
  - Score display with visual indicator
  - **System Reasoning** box explaining WHY the lead got its status
- **Dark Theme UI**: Premium dark mode with consistent styling

---

## 🚀 Getting Started

### Prerequisites
- Node.js installed
- Backend server running on `http://localhost:5002`

### Installation

```bash
cd client
npm install
```

### Running the Development Server

```bash
npm run dev
```

The frontend will run on `http://localhost:5173` (Vite default).

---

## 📂 Project Structure

```
client/
├── src/
│   ├── App.jsx         # Main application with all components
│   ├── api.js          # Axios configuration and API calls
│   ├── index.css       # Premium dark-mode styling
│   └── main.jsx        # React entry point
├── index.html          # HTML template
├── vite.config.js      # Vite configuration
└── package.json        # Dependencies and scripts
```

---

## UI Components

### 1. Create Lead Form
- Simple form with Name and Phone inputs
- Creates a new lead in the backend

### 2. Simulator Cards
Three cards to simulate external system responses:
- **Mock WhatsApp**: Dropdown to select reply type
- **Mock AI Call**: Dropdowns for Interest, Budget, Timeline
- **Mock Link Click**: Checkboxes and number input for activity

### 3. Executive Summary
The key feature showing:
- **Lead Name & Phone**: Displayed prominently at the top
- **Status Badge**: Color-coded (HOT=red, WARM=orange, COLD=green)
- **Natural Language Summary**: Human-readable sentence explaining WHY with point breakdown
  - Example: *"This lead is HOT due to WhatsApp engagement(+20), high call interest(+40) and form submission(+30)."*
- **Confidence Score**: Displayed as X/100 (capped at 100)

---

## 🔗 API Integration

All API calls are centralized in `src/api.js`:

| Function | Endpoint | Description |
|----------|----------|-------------|
| `createLead()` | POST `/api/leads` | Create new lead |
| `updateWhatsapp()` | POST `/api/leads/:id/whatsapp-result` | Update WhatsApp result |
| `updateAiCall()` | POST `/api/leads/:id/ai-call-result` | Update AI call result |
| `updateLinkActivity()` | POST `/api/leads/:id/link-activity` | Update link activity |
| `getSummary()` | GET `/api/leads/:id/summary` | Get lead summary |

---

## 🎯 Key Design Decisions

1. **30-Second Summary**: Designed for sales reps to make instant decisions
2. **Dark Theme**: Consistent with modern web aesthetics
3. **No Raw JSON**: Technical data hidden from end users
4. **Real-time Updates**: Summary refreshes after each interaction

---

## 📦 Dependencies

- **React**: UI library
- **Vite**: Build tool and dev server
- **Axios**: HTTP client for API calls
