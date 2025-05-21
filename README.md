# Localventure Backend API

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## API Endpoints

### Health Check
```bash
curl https://<project>.railway.app/healthz
```

### Data API
```bash
# Get all users
curl https://<project>.railway.app/api/users

# Get all cities
curl https://<project>.railway.app/api/cities

# Get all spots
curl https://<project>.railway.app/api/spots
```

### Authentication Examples (PowerShell)

```powershell
# Register
$body = @{
    email = "newuser@example.com"
    password = "password123"
    username = "New User"
} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8080/auth/register" -Method Post -Body $body -ContentType "application/json"

# Login
$loginBody = @{
    email = "newuser@example.com"
    password = "password123"
} | ConvertTo-Json
$response = Invoke-RestMethod -Uri "http://localhost:8080/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $response.token

# Access protected routes
$headers = @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Uri "http://localhost:8080/auth/profile" -Headers $headers -Method Get
```

### Authentication Examples (cURL)

```bash
# Register a new user
curl -X POST https://<project>.railway.app/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","username":"username"}'  

# Login
curl -X POST https://<project>.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```