"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRoutes = void 0;
const express_1 = __importDefault(require("express"));
console.log(`[${new Date().toISOString()}] [health.ts] Initializing health check routes...`);
const router = express_1.default.Router();
// Super simple health check endpoint that always returns 200 OK
router.get('/healthz', (req, res) => {
    console.log(`[${new Date().toISOString()}] [health.ts] ${req.method} ${req.originalUrl} - Health check request received`);
    res.status(200).send('OK');
    console.log(`[${new Date().toISOString()}] [health.ts] ${req.method} ${req.originalUrl} - Health check response sent: 200 OK`);
});
router.get('/', (req, res) => {
    console.log(`[${new Date().toISOString()}] [health.ts] ${req.method} ${req.originalUrl} - Root endpoint request received`);
    res.status(200).send('Localventure API is running');
    console.log(`[${new Date().toISOString()}] [health.ts] ${req.method} ${req.originalUrl} - Root endpoint response sent: 200 OK`);
});
console.log(`[${new Date().toISOString()}] [health.ts] Health check routes configured`);
exports.healthRoutes = router;
//# sourceMappingURL=health.js.map