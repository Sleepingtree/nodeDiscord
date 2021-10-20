import { config } from 'dotenv';
config();
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';

import indexRouter from '../routes/index';
import usersRouter from '../routes/users';
import alexaRouter from '../routes/alexaRouter';
import newAlexaRouter from '../routes/newAlexaRouter';
import botStatusRouter from '../routes/botStatus';

//start up discord bot services
import '../services/discordRoleService';
import '../services/waniKaniService';
import '../services/alexaService';
import '../services/gameService'
import '../services/slashcomandUpdater'
import '../services/draftService'
import '../services/clashPlaningService'

const app = express();

app.use(cors({
  credentials: true,
  origin: "https://sleepingtree.net",
}));

// view engine setup
app.set('views', path.join(__dirname, '../../views'));
app.set('view engine', 'pug');

app.use(logger('dev'));

//hide info from scripting attacks
app.use((_req, res, next) => {
  res.header('X-Powered-By', 'Electricity');
  next();
});

//Alexa app expects raw text not json
app.use('/alexa', newAlexaRouter);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../../public')));

app.use('/welcome', indexRouter);

app.use('/users', usersRouter);
app.use('/whosOnline', alexaRouter);
app.use('/botStatus', botStatusRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  if (req.path.startsWith('/io')) {
    res.status(418).send('I am not a coffee machine');
  } else {
    next();
  }

});

// error handler
app.use(function (err: any, req: any, res: any, _next: any) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

export default app;