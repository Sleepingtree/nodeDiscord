import express from 'express';
import {getAndRespondWhosOnline} from'../services/alexaService';
const router = express.Router();

/* GET users listing. */
router.all('/', function(_req, res) {
    console.log('In Alexa router');
    getAndRespondWhosOnline()
      .then(() => res.send())
      .catch(err => console.log(err));
});

export default router;