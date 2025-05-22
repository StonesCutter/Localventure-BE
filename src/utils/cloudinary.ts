import { v2 as cloudinary } from 'cloudinary';
import { logger } from './logger';

export const initCloudinary = (): void => {
  logger.info('[cloudinary] Initializing Cloudinary configuration');
  
  // Check for required environment variables
  const requiredVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  
  requiredVars.forEach(varName => {
    logger.info(`[cloudinary] ${varName} is set: ${Boolean(process.env[varName])}`);
  });
  
  // Configure Cloudinary
  try {
    logger.info('[cloudinary] Configuring Cloudinary with provided credentials');
    
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });
    
    logger.info('[cloudinary] Cloudinary configuration successful');
  } catch (err) {
    logger.error({ err }, '[cloudinary] Failed to configure Cloudinary');
    throw err; // Re-throw to allow handling by the caller
  }
};

export default cloudinary;
