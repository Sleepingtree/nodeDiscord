"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
dotenv_1.config();
const http_errors_1 = __importDefault(require("http-errors"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const index_1 = __importDefault(require("../routes/index"));
const users_1 = __importDefault(require("../routes/users"));
const alexaRouter_1 = __importDefault(require("../routes/alexaRouter"));
const botStatus_1 = __importDefault(require("../routes/botStatus"));
//start up discord bot services
require("../services/discordRoleService");
require("../services/waniKaniService");
require("../services/alexaService");
require("../services/gameService");
require("../services/youtubeService");
require("../services/draftService");
require("../services/clashPlaningService");
const app = express_1.default();
// view engine setup
app.set('views', path_1.default.join(__dirname, '../../views'));
app.set('view engine', 'pug');
app.use(morgan_1.default('dev'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use(cookie_parser_1.default());
app.use(express_1.default.static(path_1.default.join(__dirname, '../../public')));
app.use('/welcome', index_1.default);
app.use('/users', users_1.default);
app.use('/whosOnline', alexaRouter_1.default);
app.use('/botStatus', botStatus_1.default);
// catch 404 and forward to error handler
app.use(function (_req, _res, next) {
    next(http_errors_1.default(404));
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