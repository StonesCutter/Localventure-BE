"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataRoutes = void 0;
const express_1 = require("express");
const db_1 = require("../db");
console.log(`[${new Date().toISOString()}] [data.ts] Initializing data routes module...`);
const router = (0, express_1.Router)();
// GET all users
router.get('/users', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Fetching all users`);
    try {
        console.log(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Executing SQL query for users`);
        const users = yield (0, db_1.query)('SELECT * FROM user');
        console.log(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Successfully fetched ${users.length} users`);
        console.log(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Sending 200 response with users data`);
        res.json(users);
    }
    catch (error) {
        console.error(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - ERROR fetching users: ${error}`);
        if (error instanceof Error) {
            console.error(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Error message: ${error.message}`);
            console.error(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Error stack: ${error.stack}`);
        }
        if (typeof error === 'object' && error !== null && 'code' in error) {
            console.error(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Error code: ${error.code}`);
        }
        console.log(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Sending 500 error response`);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
}));
// GET all cities
router.get('/cities', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Fetching all cities`);
    try {
        console.log(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Executing SQL query for cities`);
        const cities = yield (0, db_1.query)('SELECT * FROM "city"');
        console.log(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Successfully fetched ${cities.length} cities`);
        console.log(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Sending 200 response with cities data`);
        res.json(cities);
    }
    catch (error) {
        console.error(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - ERROR fetching cities: ${error}`);
        if (error instanceof Error) {
            console.error(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Error message: ${error.message}`);
            console.error(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Error stack: ${error.stack}`);
        }
        if (typeof error === 'object' && error !== null && 'code' in error) {
            console.error(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Error code: ${error.code}`);
        }
        console.log(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Sending 500 error response`);
        res.status(500).json({ error: 'Failed to fetch cities' });
    }
}));
// GET all spots
router.get('/spots', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Fetching all spots with city info`);
    try {
        console.log(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Executing SQL query for spots with city join`);
        const spots = yield (0, db_1.query)(`
      SELECT s.*, c.*
      FROM "Spot" s
      LEFT JOIN "city" c ON s.city_id = c.city_id
    `);
        // Transform the result to mimic Prisma's include format
        const formattedSpots = spots.map(spot => {
            const { city_id, city_name, country } = spot, cityRest = __rest(spot, ["city_id", "city_name", "country"]);
            return Object.assign(Object.assign({}, spot), { city: Object.assign({ city_id, name: city_name, country }, cityRest) });
        });
        console.log(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Successfully fetched ${spots.length} spots`);
        console.log(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Sending 200 response with spots data`);
        res.json(spots);
    }
    catch (error) {
        console.error(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - ERROR fetching spots: ${error}`);
        if (error instanceof Error) {
            console.error(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Error message: ${error.message}`);
            console.error(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Error stack: ${error.stack}`);
        }
        if (typeof error === 'object' && error !== null && 'code' in error) {
            console.error(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Error code: ${error.code}`);
        }
        console.log(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Sending 500 error response`);
        res.status(500).json({ error: 'Failed to fetch spots' });
    }
}));
console.log(`[${new Date().toISOString()}] [data.ts] Data routes configuration complete`);
exports.dataRoutes = router;
//# sourceMappingURL=data.js.map