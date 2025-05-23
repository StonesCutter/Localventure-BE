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
exports.safeQuery = safeQuery;
const db_1 = require("../db");
function safeQuery(query_1) {
    return __awaiter(this, arguments, void 0, function* (query, values = [], retries = 3) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const result = yield db_1.pool.query(query, values);
                return result.rows;
            }
            catch (err) {
                if (attempt === retries)
                    throw err;
                console.warn(`[db] attempt ${attempt} failed, retrying…`);
                yield new Promise(r => setTimeout(r, attempt * 2000)); // 2s, 4s
            }
        }
    });
}
//# sourceMappingURL=safeQuery.js.map