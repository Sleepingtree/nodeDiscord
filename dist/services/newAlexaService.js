"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const ask_sdk_core_1 = require("ask-sdk-core");
const discordLogIn_1 = require("./discordLogIn");
const alexaModel = __importStar(require("../model/alexaModel"));
const LaunchRequestHandler = {
    canHandle(handlerInput) {
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
const PostMessageStartedIntentHandler = {
    canHandle(handlerInput) {
        return ask_sdk_core_1.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && ask_sdk_core_1.getIntentName(handlerInput.requestEnvelope) === 'postMessage'
            && ask_sdk_core_1.getDialogState(handlerInput.requestEnvelope) === 'STARTED';
    },
    async handle(handlerInput) {
        const { intent } = handlerInput.requestEnvelope.request;
        const speechText = 'what channel would you like to post to?';
        return handlerInput.responseBuilder
            .withSimpleCard('Post a message', speechText)
            .addDelegateDirective(intent)
            .getResponse();
    },
};
const PostMessageIntentHandler = {
    canHandle(handlerInput) {
        return ask_sdk_core_1.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && ask_sdk_core_1.getIntentName(handlerInput.requestEnvelope) === 'postMessage'
            && ask_sdk_core_1.getDialogState(handlerInput.requestEnvelope) === 'IN_PROGRESS';
    },
    async handle(handlerInput) {
        var _a;
        const { intent } = handlerInput.requestEnvelope.request;
        const channelName = (_a = intent.slots) === null || _a === void 0 ? void 0 : _a[alexaModel.channelName].value;
        const speechText = channelName !== null && channelName !== void 0 ? channelName : 'what channel would you like to post to?';
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
const PostMessageCompleteIntentHandler = {
    canHandle(handlerInput) {
        return ask_sdk_core_1.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && ask_sdk_core_1.getIntentName(handlerInput.requestEnvelope) === 'postMessage'
            && ask_sdk_core_1.getDialogState(handlerInput.requestEnvelope) === 'COMPLETED';
    },
    async handle(handlerInput) {
        var _a, _b;
        const { intent } = handlerInput.requestEnvelope.request;
        const channelName = (_a = intent.slots) === null || _a === void 0 ? void 0 : _a[alexaModel.channelName].value;
        const messageToPost = (_b = intent.slots) === null || _b === void 0 ? void 0 : _b.messageToPost.value;
        const speechText = `posting ${messageToPost} to ${channelName}`;
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .withSimpleCard('Post a message', speechText)
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
    .addRequestHandlers(LaunchRequestHandler, HelloWorldIntentHandler, WhosOnlineIntentHandler, PostMessageStartedIntentHandler, PostMessageIntentHandler, PostMessageCompleteIntentHandler, CancelAndStopIntentHandler, SessionEndedRequestHandler)
    .withCustomUserAgent('The Forrest');
exports.default = skillBuilder;
//# sourceMappingURL=newAlexaService.js.map