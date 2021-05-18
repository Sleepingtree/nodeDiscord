"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ask_sdk_express_adapter_1 = require("ask-sdk-express-adapter");
const express_1 = __importDefault(require("express"));
const newAlexaService_1 = __importDefault(require("../services/newAlexaService"));
const router = express_1.default.Router();
const skill = newAlexaService_1.default.create();
const adapter = new ask_sdk_express_adapter_1.ExpressAdapter(skill, true, true);
const requestHandelers = adapter.getRequestHandlers();
router.all('/', (req, _res, next) => {
    console.log(`In rounter for alexa req: $`);
    next();
});
router.all('/', requestHandelers);
router.all('/', (req, _res, next) => {
    console.log(`In rounter for alexa after`);
    next();
});
exports.default = router;
//# sourceMappingURL=newAlexaRouter.js.map