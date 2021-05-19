"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ask_sdk_core_1 = require("ask-sdk-core");
const discordLogIn_1 = require("./discordLogIn");
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        console.log('In intentandler');
        return ask_sdk_core_1.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speechText = 'Started the forrest';
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .withSimpleCard('The Forrest', speechText)
            .getResponse();
    },
};
const HelloWorldIntentHandler = {
    canHandle(handlerInput) {
        return ask_sdk_core_1.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && ask_sdk_core_1.getIntentName(handlerInput.requestEnvelope) === 'HelloWorldIntent';
    },
    handle(handlerInput) {
        const speechText = 'Hello World!';
        return handlerInput.responseBuilder
            .speak(speechText)
            .withSimpleCard('Hello World', speechText)
            .getResponse();
    },
};
const WhosOnlineIntentHandler = {
    canHandle(handlerInput) {
        return ask_sdk_core_1.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && ask_sdk_core_1.getIntentName(handlerInput.requestEnvelope) === 'whosOnline';
    },
    async handle(handlerInput) {
        const users = await discordLogIn_1.whosOnline();
        const speechText = users.length > 0 ? `users online are ${users}` : 'no one is online';
        return handlerInput.responseBuilder
            .speak(speechText)
            .withSimpleCard('Who\'s online', speechText)
            .getResponse();
    },
};
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return ask_sdk_core_1.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (ask_sdk_core_1.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || ask_sdk_core_1.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speechText = 'Goodbye!';
        return handlerInput.responseBuilder
            .speak(speechText)
            .withSimpleCard('Hello World', speechText)
            .withShouldEndSession(true)
            .getResponse();
    },
};
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return ask_sdk_core_1.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
        return handlerInput.responseBuilder.getResponse();
    },
};
const skillBuilder = ask_sdk_core_1.SkillBuilders.custom()
    .addRequestHandlers(LaunchRequestHandler, HelloWorldIntentHandler, WhosOnlineIntentHandler, CancelAndStopIntentHandler, SessionEndedRequestHandler)
    .withCustomUserAgent('The Forrest');
exports.default = skillBuilder;
//# sourceMappingURL=newAlexaService.js.map