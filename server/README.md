# Realtime-chess-backend

This repository contains the backend server for RealtimeChess, a web application for playing chess online with friends or random opponents. The backend provides API endpoints, game management, real-time communication using Socket.IO, and follows an MVC architecture.

## Table of Contents

- [Introduction](#introduction)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)

## Introduction

RealtimeChess Backend serves as the server-side implementation for handling user authentication, game logic, and API interactions using Node.js and Express.js. It integrates Socket.IO for real-time communication and MongoDB for data storage, following an MVC (Model-View-Controller) architecture pattern.

## Technologies Used

- Node.js
- Express.js
- Socket.IO
- MongoDB
- JWT (JSON Web Tokens) for authentication

## Installation

To set up the RealtimeChess Backend locally, follow these steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/PrathamSingh2002/Realtime-chess-backend.git
2. Navigate into the project directory:
   ```bash
   cd Realtime-chess-backend
3. Install dependencies:
   ```bash
   npm install
4. Set up environment variables::
   ```bash
   Create a .env file in the root directory.
   Define environment-specific variables like PORT, DATABASE_URL, and JWT_SECRET.
5. Start the server:
   ```bash
   npm run dev
7. The backend server should now be running on http://localhost:your-port.
## Usage
The RealtimeChess Backend provides the following functionality:

- Authentication: Secure user authentication using JWT tokens.
- API Endpoints: Explore the API endpoints for user management, game handling, and more.
- Real-time Communication: Utilize Socket.IO for real-time updates and game synchronization.
