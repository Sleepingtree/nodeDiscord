"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const index_1 = __importDefault(require("../routes/index"));
const users_1 = __importDefault(require("../routes/users"));
const alexaRouter_1 = __importDefault(require("../routes/alexaRouter"));
const newAlexaRouter_1 = __importDefault(require("../routes/newAlexaRouter"));
const botStatus_1 = __importDefault(require("../routes/botStatus"));
//start up discord bot services
require("../services/discordRoleService");
require("../services/waniKaniService");
require("../services/alexaService");
require("../services/gameService");
require("../services/slashcomandUpdater");
require("../services/draftService");
require("../services/clashPlaningService");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    credentials: true,
    origin: "https://sleepingtree.net",
}));
// view engine setup
app.set('views', path_1.default.join(__dirname, '../../views'));
app.set('view engine', 'pug');
app.use((0, morgan_1.default)('dev'));
//hide info from scripting attacks
app.use((_req, res, next) => {
    res.header('X-Powered-By', 'Electricity');
    next();
});
//Alexa app expects raw text not json
app.use('/alexa', newAlexaRouter_1.default);
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.static(path_1.default.join(__dirname, '../../public')));
app.use('/welcome', index_1.default);
app.use('/users', users_1.default);
app.use('/whosOnline', alexaRouter_1.default);
app.use('/botStatus', botStatus_1.default);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    if (req.path.startsWith('/io/')) {
        next();
    }
    else {
        res.status(418).send('I am not a coffee machine');
    }
});
// error handler
app.use(function (err, req, res, _next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    // render the error page
    res.status(err.status || 500);
    res.render('error');
});
exports.default = app;
//# sourceMappingURL=app.js.map