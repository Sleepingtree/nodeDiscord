var express = require('express');
const alexaService = require('../services/alexaService');
var router = express.Router();

/* GET users listing. */
router.all('/', function(req, res, next) {
    console.log('In Alexa router');
    alexaService.getAndRespondWhosOnline()
      .then(data => res.send())
      .catch(err => console.log(err));
});

module.exports = router;