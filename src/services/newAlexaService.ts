import { RequestHandler, HandlerInput, SkillBuilders, getRequestType, getIntentName, getDialogState } from 'ask-sdk-core';
import { IntentRequest, Response, SessionEndedRequest, SimpleSlotValue } from 'ask-sdk-model';

import { postMessageInChannel, whosOnline } from './discordLogIn';
import * as  alexaModel from '../model/alexaModel';

const LaunchRequestHandler: RequestHandler = {
  canHandle(handlerInput: HandlerInput): boolean {
    return getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  handle(handlerInput: HandlerInput): Response {
    const speechText = 'Started the forrest';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('The Forrest', speechText)
      .getResponse();
  },
};

const HelloWorldIntentHandler: RequestHandler = {
  canHandle(handlerInput: HandlerInput): boolean {
    return getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && getIntentName(handlerInput.requestEnvelope) === 'HelloWorldIntent';
  },
  handle(handlerInput: HandlerInput): Response {
    const speechText = 'Hello World!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
  },
};

const WhosOnlineIntentHandler: RequestHandler = {
  canHandle(handlerInput: HandlerInput): boolean {
    return getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && getIntentName(handlerInput.requestEnvelope) === 'whosOnline';
  },
  async handle(handlerInput: HandlerInput) {
    const users = await whosOnline();
    const speechText = users.length > 0 ? `users online are ${users}` : 'no one is online';
    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Who\'s online', speechText)
      .getResponse();
  },
};

const PostMessageStartedIntentHandler: RequestHandler = {
  canHandle(handlerInput: HandlerInput): boolean {
    return getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && getIntentName(handlerInput.requestEnvelope) === 'postMessage'
      && getDialogState(handlerInput.requestEnvelope) === 'STARTED';
  },
  async handle(handlerInput: HandlerInput) {
    const { intent } = handlerInput.requestEnvelope.request as IntentRequest;
    const speechText = 'what channel would you like to post to?';
    return handlerInput.responseBuilder
      .withSimpleCard('Post a message', speechText)
      .addDelegateDirective(intent)
      .getResponse();
  },
};


const PostMessageIntentHandler: RequestHandler = {
  canHandle(handlerInput: HandlerInput): boolean {
    return getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && getIntentName(handlerInput.requestEnvelope) === 'postMessage'
      && getDialogState(handlerInput.requestEnvelope) === 'IN_PROGRESS';
  },
  async handle(handlerInput: HandlerInput) {
    const { intent } = handlerInput.requestEnvelope.request as IntentRequest;
    const channelName = intent.slots?.[alexaModel.channelName].value;
    const speechText = channelName ?? 'what channel would you like to post to?';
    const responseBuilder = handlerInput.responseBuilder
      .withSimpleCard('Post a message', speechText);
    if (!channelName) {
      responseBuilder.addElicitSlotDirective(alexaModel.channelName);
    }
    return responseBuilder
      .addDelegateDirective(intent)
      .getResponse();
  },
};

const PostMessageCompleteIntentHandler: RequestHandler = {
  canHandle(handlerInput: HandlerInput): boolean {
    return getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && getIntentName(handlerInput.requestEnvelope) === 'postMessage'
      && getDialogState(handlerInput.requestEnvelope) === 'COMPLETED';
  },
  async handle(handlerInput: HandlerInput) {
    const { intent } = handlerInput.requestEnvelope.request as IntentRequest;
    const channelName = intent.slots?.[alexaModel.channelName].value;
    const messageToPost = intent.slots?.[alexaModel.messageToPost].value;
    let speechText = `counld not post ${messageToPost} to channel ${channelName}`
    if(messageToPost && channelName){
      postMessageInChannel(messageToPost, channelName);
      speechText = `posting ${messageToPost} to ${channelName}`;
    }
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Post a message', speechText)
      .getResponse();
  },
};

const CancelAndStopIntentHandler: RequestHandler = {
  canHandle(handlerInput: HandlerInput): boolean {
    return getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && (getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
        || getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
  },
  handle(handlerInput: HandlerInput): Response {
    const speechText = 'Goodbye!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Hello World', speechText)
      .withShouldEndSession(true)
      .getResponse();
  },
};

const SessionEndedRequestHandler: RequestHandler = {
  canHandle(handlerInput: HandlerInput): boolean {
    return getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
  },
  handle(handlerInput: HandlerInput): Response {
    console.log(`Session ended with reason: ${(handlerInput.requestEnvelope.request as SessionEndedRequest).reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const skillBuilder = SkillBuilders.custom()
  .addRequestHandlers(LaunchRequestHandler,
    HelloWorldIntentHandler,
    WhosOnlineIntentHandler,
    PostMessageStartedIntentHandler,
    PostMessageIntentHandler,
    PostMessageCompleteIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler)
  .withCustomUserAgent('The Forrest');

export default skillBuilder;