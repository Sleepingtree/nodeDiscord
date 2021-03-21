"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const alexaService_1 = require("../services/alexaService");
const router = express_1.default.Router();
/* GET users listing. */
router.all('/', function (req, res, next) {
    console.log('In Alexa router');
    alexaService_1.getAndRespondWhosOnline()
        .then(data => res.send())
        .catch(err => console.log(err));
});
exports.default = router;
//# sourceMappingURL=alexaRouter.js.map