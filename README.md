# React + TypeScript + Vite

# To start the project:
npm run dev

# To stop the server:
taskkill /F /IM node.exe

# Register
$body = @{
    email = "newuser@example.com"
    password = "password123"
    name = "New User"
} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/auth/register" -Method Post -Body $body -ContentType "application/json"

# Login
$loginBody = @{
    email = "newuser@example.com"
    password = "password123"
} | ConvertTo-Json
$response = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $response.token

# Access protected routes
$headers = @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Uri "http://localhost:3000/auth/profile" -Headers $headers -Method Get

# Start server
node server.js