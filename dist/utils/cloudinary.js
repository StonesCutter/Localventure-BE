"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
const logger_1 = require("./logger");
const initCloudinary = () => {
    logger_1.logger.info('[cloudinary] Initializing Cloudinary configuration');
    // Check for required environment variables
    const requiredVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
    requiredVars.forEach(varName => {
        logger_1.logger.info(`[cloudinary] ${varName} is set: ${Boolean(process.env[varName])}`);
    });
    // Configure Cloudinary
    try {
        logger_1.logger.info('[cloudinary] Configuring Cloudinary with provided credentials');
        cloudinary_1.v2.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            secure: true
        });
        logger_1.logger.info('[cloudinary] Cloudinary configuration successful');
    }
    catch (err) {
        logger_1.logger.error({ err }, '[cloudinary] Failed to configure Cloudinary');
        throw err; // Re-throw to allow handling by the caller
    }
};
exports.initCloudinary = initCloudinary;
exports.default = cloudinary_1.v2;
//# sourceMappingURL=cloudinary.js.map