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

## Deployment

### Render Deploy
1. Add **DATABASE_URL** in *Environment > Secret Files* or *Environment > Variables*  
   (copy it from the Neon dashboard – includes `sslmode=require`).
2. Redeploy. Health and all `/api/*` routes should return 200.

### Database Setup
The application uses Neon PostgreSQL in production. For local development:
1. Set up a Neon project at https://neon.tech
2. Copy the connection string from Neon dashboard
3. Add it to your `.env` file as `DATABASE_URL`
4. If no `DATABASE_URL` is provided, the app will fall back to local PostgreSQL using individual `PG*` variables

## API Endpoints

### Health Check
- `GET /healthz` - Simple health check endpoint that returns 200 OK
- `GET /` - Root endpoint that returns "Localventure API is running"

### Authentication
- `POST /auth/register` - Register a new user
  - Required fields: email, password, username
  - Optional: role_id (defaults to 2)
- `POST /auth/login` - Login with existing credentials
  - Required fields: email (or username), password

### Data API

#### Cities
- `GET /api/cities` - Get all cities
  - Returns all cities with their details
  - Example: https://localventure-be.onrender.com/api/cities
  - Response includes: id, name, country, latitude, longitude, created_at, updated_at

#### Spots (with city information)
- `GET /api/spots` - Get all spots with city details
  - Returns all spots with their associated city information
  - Example: https://localventure-be.onrender.com/api/spots
  - Response includes: spot details and nested city object

#### Articles (with city filter)
- `GET /api/articles` - Get all articles
  - Returns all published articles
  - Example: https://localventure-be.onrender.com/api/articles
  - Response includes articles with city information

- `GET /api/articles?cityId=123` - Get articles for a specific city
  - Filter articles by city ID
  - Example: https://localventure-be.onrender.com/api/articles?cityId=123
  - Returns only articles published in the specified city

#### Users
- `GET /api/users` - Get all users
  - Returns all user accounts
  - Example: https://localventure-be.onrender.com/api/users
  - Response includes user details (excluding sensitive information)

### Authentication Examples

#### PowerShell
```powershell
# Register a new user
$body = @{
    email = "user@example.com"
    password = "password123"
    username = "username"
    role_id = 2  # Optional, defaults to 2
} | ConvertTo-Json
Invoke-RestMethod -Uri "https://localventure-be.onrender.com/auth/register" -Method Post -Body $body -ContentType "application/json"

# Login
$loginBody = @{
    email = "user@example.com"
    password = "password123"
} | ConvertTo-Json
$response = Invoke-RestMethod -Uri "https://localventure-be.onrender.com/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $response.token

# Get all cities
Invoke-RestMethod -Uri "https://localventure-be.onrender.com/api/cities" -Method Get

# Get articles for a specific city
$cityId = 123
Invoke-RestMethod -Uri "https://localventure-be.onrender.com/api/articles?cityId=$cityId" -Method Get
```

#### cURL
```bash
# Register a new user
curl -X POST https://localventure-be.onrender.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","username":"username","role_id":2}'

# Login
curl -X POST https://localventure-be.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get all cities
curl -X GET https://localventure-be.onrender.com/api/cities

# Get articles for a specific city
curl -X GET https://localventure-be.onrender.com/api/articles?cityId=123
```
```