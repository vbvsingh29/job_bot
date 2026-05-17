# LaunchPad (Job Bot) 🚀

LaunchPad is a powerful, full-stack MERN application designed to automate the job application process across multiple platforms (like LinkedIn and Naukri) using headless browser automation (Puppeteer). It features a robust backend scheduler, email notifications, and a comprehensive React dashboard for tracking applications, managing automation rules, and reviewing logs.

## Features ✨

*   **Automated Job Applications**: Headless bot integration (Puppeteer) to apply for jobs on LinkedIn (Easy Apply) and Naukri.
*   **Centralized Dashboard**: React-based dashboard to track application status, view success rates, and manage user profiles.
*   **Admin Panel**: Comprehensive 5-tab admin interface to manage users, monitor global system stats, manage automation templates, and publish blog/resource content.
*   **Smart Scheduling**: Built-in `node-cron` scheduler to run background application bots automatically every day.
*   **OAuth & Security**: Secure LinkedIn OAuth integration and encrypted Naukri credential storage (bcrypt). No plaintext passwords are saved.
*   **Email Reporting**: Automated daily email digests summarizing the jobs applied to, successes, and failures using Nodemailer.

## Tech Stack 🛠️

*   **Frontend**: React, Vite, TailwindCSS, Zustand (State Management), Lucide React (Icons).
*   **Backend**: Node.js, Express.js, MongoDB (Mongoose), Passport.js (OAuth).
*   **Automation**: Puppeteer (Headless Browser Automation), `node-cron`.
*   **Security**: JWT Authentication, bcrypt password hashing.

## Getting Started 🚀

### Prerequisites
*   [Node.js](https://nodejs.org/en/) (v16+ recommended)
*   [MongoDB](https://www.mongodb.com/) (Local instance or Atlas cluster)
*   A LinkedIn Developer Account (for OAuth Client ID & Secret)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/vbvsingh29/job_bot.git
    cd job_bot
    ```

2.  **Install Backend Dependencies**
    ```bash
    cd server
    npm install
    ```

3.  **Install Frontend Dependencies**
    ```bash
    cd ../client
    npm install
    ```

### Environment Configuration

Create a `.env` file in the `server/` directory and add the following keys:

```env
# Server Config
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/jobbot

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key

# Email Configuration (For sending daily reports)
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASS=your_app_password

# LinkedIn OAuth (Required for LinkedIn Connection)
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
```

*(Note: Never commit your `.env` file to version control. A `.gitignore` file is included to prevent this.)*

### Running the Application

You will need two separate terminal windows/tabs to run the frontend and backend simultaneously.

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```

The application will be available at `http://localhost:5173`.

## Architecture & Modules 🏗️

*   **`/client/src/pages`**: Contains the main UI views including `Dashboard.jsx`, `ControlPanel.jsx`, `AdminPanel.jsx`, and `Profile.jsx`.
*   **`/server/bots`**: Contains the Puppeteer automation logic for specific platforms (`linkedin.js`, `naukri.js`).
*   **`/server/services`**: Contains the `scheduler.js` for daily execution and `emailService.js` for automated reporting.
*   **`/server/routes`**: Express API routes handling authentication, user profiles, application tracking, and admin controls.

## Security Notice 🔒
LaunchPad is designed with privacy in mind. We do not support storing plaintext passwords. External scraper credentials (like Naukri) are natively encrypted using military-grade `bcrypt` before being saved to the database, and LinkedIn uses secure OAuth 2.0 tokens.

## License 📄
This project is open-source and available under the MIT License.
