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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.articleRoutes = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const client_1 = require("@prisma/client");
const passport_1 = __importDefault(require("passport"));
const router = (0, express_1.Router)();
exports.articleRoutes = router;
const prisma = new client_1.PrismaClient();
// Validation middleware for creating/updating articles
const validateArticle = [
    (0, express_validator_1.body)('title')
        .trim()
        .isLength({ min: 5, max: 120 })
        .withMessage('Title must be between 5 and 120 characters'),
    (0, express_validator_1.body)('content')
        .trim()
        .notEmpty()
        .withMessage('Content cannot be empty'),
    (0, express_validator_1.body)('cityId')
        .isInt()
        .withMessage('City ID must be a valid integer'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        next();
    }
];
// Create article (protected route with validation)
router.post('/', passport_1.default.authenticate('jwt', { session: false }), validateArticle, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, content, cityId } = req.body;
        const article = yield prisma.article.create({
            data: {
                title,
                content,
                cityId,
                authorId: req.user.id,
            },
            include: {
                city: true,
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true
                    }
                }
            }
        });
        res.status(201).json(article);
    }
    catch (error) {
        console.error('Error creating article:', error);
        res.status(500).json({ message: 'Error creating article' });
    }
}));
// Get all articles
router.get('/', (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const articles = yield prisma.article.findMany({
            include: {
                city: true,
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true
                    }
                }
            }
        });
        res.json(articles);
    }
    catch (error) {
        console.error('Error fetching articles:', error);
        res.status(500).json({ message: 'Error fetching articles' });
    }
}));
