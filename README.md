# SecureVault

<p align="center">
  <img src="./public/images/password-manager-hero.svg" alt="SecureVault password manager dashboard illustration" width="1200" />
</p>

A modern password manager built with Next.js, MongoDB, JWT auth, and AES-256 encryption to help users securely store, organize, and audit their credentials.

![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black)
![MongoDB](https://img.shields.io/badge/MongoDB-6.x-47A248)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)
![Tailwind](https://img.shields.io/badge/Tailwind-4.x-06B6D4)

## Overview

SecureVault is a personal password vault for managing logins, generating strong passwords, and monitoring password health. It includes authentication, encrypted password storage, search and filtering, breach checks, and export/import support for personal data management.

## Why this project

- Store login credentials in a private vault
- Generate strong, custom passwords instantly
- Audit weak, reused, and outdated passwords
- Protect session data with JWT-based authentication
- Keep data encrypted before it is written to MongoDB
- Manage records with search, copy, reveal, and delete actions

## Key features

- Secure user registration and login
- Password entry creation and management
- Search and filter vault records by username
- Password generator with custom length controls
- Password strength evaluation and vault health dashboard
- Breach and security audit checks
- Import and export of saved credentials
- Theme-aware interface with a modern UI