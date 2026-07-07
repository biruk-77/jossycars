# CLAUDE.md

Project-specific instructions, coding guidelines, and commands to ensure consistent development and reduce mistakes.

## 1. Project Commands

### Running the Application
- **Start Development Server**: `npm run dev` (Runs `node server.js` locally)
- **Start Production Server**: `npm start` (Runs `node server.js` in production)

### Testing and Database Utilities
- **Run Endpoint Integrity Tests**: `node scratch/test_endpoints.js` (Performs full integration testing on API endpoints)
- **Verify Database Connection**: `node scratch/test_db.js` (Verifies connection to MongoDB Atlas)

---

## 2. Technology Stack & Directory Structure
- **Frontend**: Single-page structure centered around `/public` (contains `index.html`, `car.html`, `login.html`, `dashboard.html`). Uses HTML5, Vanilla CSS (`style.css`), Vanilla JavaScript, GSAP for animations, and Google `<model-viewer>` for 3D interactions.
- **Backend**: Node.js with Express, Mongoose (MongoDB Atlas database client), bcryptjs for password hashing, jsonwebtoken for JWT authentication, and nodemailer for sending notifications.
- **Data Fetching/Scraping**: cheerio and axios for syncing listings dynamically from public Telegram feeds.
- **Localization**: Amharic / English toggle with local storage persistence.

---

## 3. Project-Specific Coding Style & Conventions

### Frontend Development
- **JS Event Binding**: Always initialize scripts within `DOMContentLoaded` listeners.
- **Element Selection**: Select elements using `document.getElementById('...')` or `document.querySelector('...')` with optional chaining (e.g. `document.getElementById('...')?.addEventListener('click', ...)`).
- **Aesthetic Guidelines & Styling**:
  - Stick to the defined **Light Luxury** design token palette in `style.css` (e.g., `--bg: #FCF9EC` (warm ivory), `--gold: #FFD200`, `--accent: #E6B800`, `--text: #0c0c0c`, `--transition-smooth`).
  - Use class manipulation (`element.classList.add('open')` / `.remove()`) for toggling UI elements and handling transitions rather than directly modifying inline style attributes (unless setting dynamic images or percentages).
  - Use Outfit typography: `font-family: 'Outfit', sans-serif;` for all text elements.
- **Cookie & Local Storage Strategy**:
  - Read authorization tokens using `getCookie('rceth_token')`.
  - Backup user information like username, full name, and phone number in `localStorage` keys prefixed with `rceth_` (e.g., `rceth_username`, `rceth_phone`).

### Backend Development
- **Database Resilience**:
  - Always check if the database is connected (`mongoose.connection.readyState === 1`) before resolving requests that depend on MongoDB. Return an HTTP 503 response if the database is offline.
  - Implement fallback routines: if scraping or updating remote feeds fails, seamlessly fall back to local MongoDB records.
- **Authentication**:
  - Use the shared `authenticateToken` middleware for protected endpoints.
  - Read authorization tokens from the `Authorization` header (`Bearer <token>`) or fallback to the `rceth_token` cookie.
- **API Responses**:
  - Respond with clean JSON payloads. Standardize on `{ error: 'Message' }` for errors and `{ message: 'Success info', ... }` for successful mutations.

---

## 4. Behavioral Guidelines

### 1. Think Before Coding
**Don't assume. Don't hide confusion. Surface tradeoffs.**
Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First
**Minimum code that solves the problem. Nothing speculative.**
- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.
- Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes
**Touch only what you must. Clean up only your own mess.**
When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.
- When your changes create orphans, remove imports/variables/functions that YOUR changes made unused. Don't remove pre-existing dead code unless asked.

### 4. Goal-Driven Execution
**Define success criteria. Loop until verified.**
Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```
Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.
