"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const pino_1 = __importDefault(require("pino"));
// Simple logger configuration that works in all environments
exports.logger = (0, pino_1.default)({
    base: { pid: false },
    timestamp: () => `"time":"${new Date().toISOString()}"`
});
//# sourceMappingURL=logger.js.map