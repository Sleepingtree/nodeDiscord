"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
/**
 * this file is for let's encrile
 */
require("greenlock-express")
    .init({
    packageRoot: __dirname,
    configDir: "./greenlock.d",
    // contact for security and critical bug notices
    maintainerEmail: "ajgrabow@gmail.com",
    // whether or not to run at cloudscale
    cluster: false
})
    // Serves on 80 and 443
    // Get's SSL certificates magically!
    .serve(app_1.default);
//# sourceMappingURL=greenlock.js.map