import { RequestHandler, HandlerInput, SkillBuilders, getRequestType, getIntentName } from 'ask-sdk-core';
import { Response, SessionEndedRequest } from 'ask-sdk-model';

 const LaunchRequestHandler : RequestHandler = {
    canHandle(handlerInput : HandlerInput) : boolean {
        console.log('In intentandler')
      return getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput : HandlerInput) : Response {
      const speechText = 'Welcome to the Alexa Skills Kit, you can say hello!';
  
      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(speechText)
        .withSimpleCard('Hello World', speechText)
        .getResponse();
    },
  };

  const HelloWorldIntentHandler : RequestHandler = {
    canHandle(handlerInput : HandlerInput) : boolean {
      return getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
        && getIntentName(handlerInput.requestEnvelope) === 'HelloWorldIntent';
    },
    handle(handlerInput : HandlerInput) : Response {
      const speechText = 'Hello World!';
  
      return handlerInput.responseBuilder
        .speak(speechText)
        .withSimpleCard('Hello World', speechText)
        .getResponse();
    },
  };

  const CancelAndStopIntentHandler : RequestHandler = {
    canHandle(handlerInput : HandlerInput) : boolean {
      return getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
        && (getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
          || getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput : HandlerInput) : Response {
      const speechText = 'Goodbye!';
  
      return handlerInput.responseBuilder
        .speak(speechText)
        .withSimpleCard('Hello World', speechText)
        .withShouldEndSession(true)      
        .getResponse();
    },
  };

  const SessionEndedRequestHandler : RequestHandler = {
    canHandle(handlerInput : HandlerInput) : boolean {
      return getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput : HandlerInput) : Response {
      console.log(`Session ended with reason: ${(handlerInput.requestEnvelope.request as SessionEndedRequest).reason}`);
  
      return handlerInput.responseBuilder.getResponse();
    },
  };


const skillBuilder = SkillBuilders.custom()
    .addRequestHandlers(LaunchRequestHandler,
        HelloWorldIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler)
        .withCustomUserAgent('The Forrest');

export default skillBuilder;