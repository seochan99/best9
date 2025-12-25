"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processQueue = exports.getStats = exports.getStatus = exports.createCollage = void 0;
const app_1 = require("firebase-admin/app");
// Firebase Admin 초기화
(0, app_1.initializeApp)();
// API 함수
var createCollage_1 = require("./api/createCollage");
Object.defineProperty(exports, "createCollage", { enumerable: true, get: function () { return createCollage_1.createCollage; } });
var getStatus_1 = require("./api/getStatus");
Object.defineProperty(exports, "getStatus", { enumerable: true, get: function () { return getStatus_1.getStatus; } });
var getStats_1 = require("./api/getStats");
Object.defineProperty(exports, "getStats", { enumerable: true, get: function () { return getStats_1.getStats; } });
// Firestore 트리거
var processQueue_1 = require("./triggers/processQueue");
Object.defineProperty(exports, "processQueue", { enumerable: true, get: function () { return processQueue_1.processQueue; } });
//# sourceMappingURL=index.js.map