import * as express from 'express';
import { whosOnline } from '../services/discordLogIn';
const router = express.Router();

/* GET users listing. */
router.get('/', async function (_req, res) {
  res.json(await whosOnline());
});

export default router;
