# Deploying Localventure-BE to Render

This guide provides instructions for deploying the Localventure-BE application to Render.

## Pre-deployment Checklist

1. Ensure your database is accessible from Render (if using an external database)
2. Gather all environment variables needed for production

## Deployment Steps

### Option 1: Deploy via Render Dashboard

1. Create a new account or log in to [Render](https://render.com)
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - Name: `localventure-be` (or your preferred name)
   - Environment: `Node`
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Start Command: `npm run start`
   - Set the appropriate environment variables in the "Environment" section:
     - `NODE_ENV`: `production`
     - `DATABASE_URL`: Your database connection string
     - `JWT_SECRET`: Your JWT secret
     - `CLOUDINARY_CLOUD_NAME`: (if using Cloudinary)
     - `CLOUDINARY_API_KEY`: (if using Cloudinary)
     - `CLOUDINARY_API_SECRET`: (if using Cloudinary)

### Option 2: Deploy using render.yaml (Blueprint)

1. Push your code with the `render.yaml` file to GitHub
2. Go to the Render Dashboard and click "Blueprint"
3. Connect to your GitHub repository
4. Render will detect the `render.yaml` file and configure services automatically
5. You'll still need to set up the environment variables that are marked as `sync: false` in the YAML file

## Post-deployment

1. Once deployed, Render will provide a URL for your service (e.g., `https://localventure-be.onrender.com`)
2. Test your API endpoints to ensure everything is working correctly
3. If using a free tier, note that your service may spin down after periods of inactivity

## Troubleshooting

- Check Render logs for any deployment or runtime errors
- Verify that all required environment variables are set correctly
- Ensure your database is accessible from Render's IP addresses
- Check that the health check endpoint (`/healthz`) is responding correctly

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Render Node.js Guide](https://render.com/docs/deploy-node-express-app)
