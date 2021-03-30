import * as express from 'express';
import { getBotStatus } from '../services/discordLogIn' 
const router = express.Router();

/* GET home page. */
router.get('/', function(_req, res) {
  res.json(getBotStatus()).send();
});

export default router;