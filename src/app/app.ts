require('dotenv').config();
var createError = require('http-errors');
import express from'express';
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

import indexRouter from '../routes/index';
import usersRouter from'../routes/users';
import alexaRouter from'../routes/alexaRouter';

//start up discord bot services
import '../services/discordRoleService';
import '../services/waniKaniService';
import '../services/alexaService';
import '../services/gameService'
import '../services/youtubeService'
import '../services/draftService'
import '../services/clashPlaningService'

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/whosOnline', alexaRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err: any, req: any, res: any, next: any) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

export default app;