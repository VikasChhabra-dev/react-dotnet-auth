# React + ASP.NET Core Auth (Full Project)

This repo contains:

## 1) react-auth-ui (Frontend)
- React (Vite)
- JWT auth
- Refresh token rotation
- Axios interceptors
- Google login (placeholder client id)
- Facebook login (placeholder app id)
- Protected routes
- Role based routes
- Manage Devices UI

## 2) AuthApi (Backend)
- ASP.NET Core Web API
- SQL Server
- JWT access token
- Refresh token rotation
- Refresh token reuse detection
- Device tracking (UserAgent + IP)
- Manage devices endpoints

---

## How to Run

### Step 1: Create database
Open SQL Server Management Studio and run:

`AuthApi/database.sql`

### Step 2: Run backend
```bash
cd AuthApi
dotnet restore
dotnet run
```

### Step 3: Run frontend
```bash
cd react-auth-ui
npm install
npm run dev
```

Frontend:
- http://localhost:5173

Backend swagger:
- https://localhost:7065/swagger

---

## Notes
- Replace Google ClientId in `react-auth-ui/src/main.jsx`
- Replace Facebook AppId in `react-auth-ui/src/pages/Login.jsx`
