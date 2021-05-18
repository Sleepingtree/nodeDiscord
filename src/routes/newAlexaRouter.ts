import { ExpressAdapter } from 'ask-sdk-express-adapter';
import express from 'express';
import skillBuilder from '../services/newAlexaService';

const router = express.Router();

const skill = skillBuilder.create();
const adapter = new ExpressAdapter(skill, true, true);
const requestHandelers = adapter.getRequestHandlers()

router.all('/', requestHandelers);


export default router;