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
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataRoutes = void 0;
const express_1 = require("express");
const prisma_1 = require("../prisma");
const router = (0, express_1.Router)();
// GET all users
router.get('/users', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield prisma_1.prisma.user.findMany();
        res.json(users);
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
}));
// GET all cities
router.get('/cities', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cities = yield prisma_1.prisma.city.findMany();
        res.json(cities);
    }
    catch (error) {
        console.error('Error fetching cities:', error);
        res.status(500).json({ error: 'Failed to fetch cities' });
    }
}));
// GET all spots
router.get('/spots', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const spots = yield prisma_1.prisma.spot.findMany({
            include: {
                city: true // Include city information for each spot
            }
        });
        res.json(spots);
    }
    catch (error) {
        console.error('Error fetching spots:', error);
        res.status(500).json({ error: 'Failed to fetch spots' });
    }
}));
exports.dataRoutes = router;
