# Navigatio - Travel Platform

Navigatio is a comprehensive full-stack travel platform built with React, Express.js, Node.js, and MongoDB. The platform supports role-based access for Admin, Agents, and various Support Teams with features including itinerary creation, quote management, package booking, LMS, wallet management, and AI-powered itinerary generation.

## Features

- **Role-Based Access Control**: Admin, Agent, Accounts, Operations, and Sales roles with specific permissions
- **User Authentication**: JWT-based authentication with email/password login
- **Agent Management**: Agent registration, approval workflow, and document verification
- **Wallet System**: Credit management for agents with transaction history
- **Package Management**: Create and manage travel packages with detailed itineraries
- **Quote System**: Generate and respond to travel quotes with pricing
- **Booking Management**: Complete booking flow with payment tracking
- **Lead Management**: Track and manage customer leads with notes and status updates
- **Learning Management System (LMS)**: Educational content for agents and sales staff
- **AI-Powered Itinerary Generator**: Create custom travel itineraries based on preferences
- **Document Management**: Upload and manage various documents (GST, Udyam certificates, etc.)

## Project Structure

```
navigatio/
├── backend/
│   ├── config/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── bookingController.js
│   │   ├── itineraryController.js
│   │   ├── leadController.js
│   │   ├── lmsController.js
│   │   ├── packageController.js
│   │   ├── quoteController.js
│   │   ├── userController.js
│   │   └── walletController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── upload.js
│   ├── models/
│   │   ├── Booking.js
│   │   ├── Itinerary.js
│   │   ├── Lead.js
│   │   ├── LmsContent.js
│   │   ├── LmsProgress.js
│   │   ├── Package.js
│   │   ├── Quote.js
│   │   ├── User.js
│   │   └── Wallet.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── booking.js
│   │   ├── itinerary.js
│   │   ├── lead.js
│   │   ├── lms.js
│   │   ├── package.js
│   │   ├── quote.js
│   │   ├── user.js
│   │   └── wallet.js
│   ├── uploads/
│   ├── utils/
│   ├── .env
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── README.md
└── README.md
```

## Backend API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get token
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/updateprofile` - Update user profile
- `PUT /api/auth/updatepassword` - Update password

### Users
- `GET /api/users` - Get all users (Admin)
- `GET /api/users/:id` - Get single user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/pending-approvals` - Get agents pending approval
- `PUT /api/users/:id/approve` - Approve agent

### Wallets
- `GET /api/wallets` - Get all wallets (Admin/Accounts)
- `GET /api/wallets/my-wallet` - Get agent's wallet
- `PUT /api/wallets/:id/credit-limit` - Update credit limit
- `POST /api/wallets/:id/transactions` - Add transaction
- `GET /api/wallets/:id/transactions` - Get wallet transactions

### Packages
- `GET /api/packages` - Get all packages
- `GET /api/packages/:id` - Get single package
- `POST /api/packages` - Create package
- `PUT /api/packages/:id` - Update package
- `DELETE /api/packages/:id` - Delete package
- `PUT /api/packages/:id/toggle-status` - Toggle package status
- `POST /api/packages/:id/images` - Upload package images

### Quotes
- `GET /api/quotes` - Get all quotes (Admin/Operations)
- `GET /api/quotes/my-quotes` - Get agent's quotes
- `GET /api/quotes/:id` - Get single quote
- `POST /api/quotes` - Create quote
- `PUT /api/quotes/:id` - Update quote (Operations)
- `PUT /api/quotes/:id/response` - Respond to quote (Agent)
- `DELETE /api/quotes/:id` - Delete quote

### Bookings
- `GET /api/bookings` - Get all bookings (Admin/Operations)
- `GET /api/bookings/my-bookings` - Get agent's bookings
- `GET /api/bookings/:id` - Get single booking
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id/status` - Update booking status
- `PUT /api/bookings/:id/invoice` - Generate invoice
- `PUT /api/bookings/:id/cancel` - Cancel booking

### Leads
- `GET /api/leads` - Get all leads (Admin/Sales)
- `GET /api/leads/my-leads` - Get agent's leads
- `GET /api/leads/:id` - Get single lead
- `POST /api/leads` - Create lead
- `PUT /api/leads/:id` - Update lead
- `POST /api/leads/:id/notes` - Add note to lead
- `PUT /api/leads/:id/assign` - Assign lead to sales staff
- `DELETE /api/leads/:id` - Delete lead

### LMS
- `GET /api/lms/content` - Get all LMS content
- `GET /api/lms/content/:id` - Get single content
- `POST /api/lms/content` - Create content
- `PUT /api/lms/content/:id` - Update content
- `DELETE /api/lms/content/:id` - Delete content
- `PUT /api/lms/progress/:contentId` - Update user progress
- `GET /api/lms/progress` - Get user progress summary

### Itineraries
- `GET /api/itineraries` - Get all itineraries (Admin)
- `GET /api/itineraries/my-itineraries` - Get agent's itineraries
- `GET /api/itineraries/:id` - Get single itinerary
- `POST /api/itineraries/generate` - Generate AI itinerary
- `PUT /api/itineraries/:id` - Update itinerary
- `POST /api/itineraries/:id/quote` - Create quote from itinerary
- `DELETE /api/itineraries/:id` - Delete itinerary

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Backend Setup
1. Navigate to the backend directory:
   ```
   cd navigatio/backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/navigatio
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=30d
   NODE_ENV=development
   ```

4. Create upload directories:
   ```
   mkdir -p uploads/documents uploads/packages uploads/lms
   ```

5. Start the server:
   ```
   npm run dev
   ```

### Frontend Setup (Coming Soon)
1. Navigate to the frontend directory:
   ```
   cd navigatio/frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

## Next Steps
- Implement React frontend with Redux and TailwindCSS
- Add PDF invoice generation using PDFKit or Puppeteer
- Add Docker support for easier deployment
- Implement comprehensive testing
- Add email notifications for various events
- Enhance error handling and validation
