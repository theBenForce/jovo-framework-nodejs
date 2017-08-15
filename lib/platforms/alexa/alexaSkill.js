'use strict';

const _ = require('lodash');

const jovo = require('../../jovo');
const AlexaResponse = require('./alexaResponse').AlexaResponse;
const AlexaRequest = require('./alexaRequest').AlexaRequest;
const CardBuilder = AlexaResponse.CardBuilder;

const DIALOGSTATE_ENUM = Object.freeze({
    STARTED: 'STARTED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
});

/**
 * Alexa specific implementations
 */
class AlexaSkill {

    /**
     * Constructor
     * @param {Jovo} jovo
     * @param {object} request
     */
    constructor(jovo, request) {
        this.jovo = jovo;
        this.request = new AlexaRequest(request);
        this.response = new AlexaResponse();

        this.response.setSessionAttributes(this.request.getSessionAttributes());
    }

    /** **
     * Request getter
     */

    /**
     * Returns unique user id sent by the platforms.
     * @public
     * @return {string} UserId
     */
    getUserId() {
        return this.request.getUserId();
    }

    /**
     * Returns supported interfaces from device.
     * @public
     * @return {string} supportedInterfaces
     */
    getSupportedInterfaces() {
        return this.request.getSupportedInterfaces();
    }


    /**
     * Returns intent name from request
     * @public
     * @return {string}
     */
    getIntentName() {
        return this.request.getIntentName();
    }

    /**
     * Returns application ID (Skill ID) of the request
     * @return {String} applicationId
     */
    getApplicationId() {
        return this.request.getApplicationId();
    }

    /**
     * Returns alexa request session object
     * @return {*}
     */
    getSession() {
        return this.request.getSession();
    }

    /** *****************************************************
     *
     * JOVO wrapper functions
     *
     ************************************/

    /**
     * Returns request type
     * LaunchRequest, IntentRequest SessionEndedRequest
     * @return {string}
     */
    getRequestType() {
        if (this.request.getRequestType().substring(0, 11) === 'AudioPlayer') {
            return 'AUDIOPLAYER';
        }

        if (this.request.getRequestType() === 'LaunchRequest') {
            return jovo.REQUEST_TYPE_ENUM.LAUNCH;
        }

        if (this.request.getRequestType() === 'IntentRequest') {
            return jovo.REQUEST_TYPE_ENUM.INTENT;
        }

        if (this.request.getRequestType() === 'SessionEndedRequest') {
            return jovo.REQUEST_TYPE_ENUM.END;
        }
    }

    /**
     * Returns reason code for an end of a session
     *
     * STOP_INTENT = User says 'Stop'
     * MAX_PROMPTS_EXCEEDED = No user input on reprompt
     * ERROR
     *
     * @return {*}
     */
    getEndReason() {
        if (this.getRequestType() === jovo.REQUEST_TYPE_ENUM.END) {
            return this.request.getEndReason();
        }

        if (this.getRequestType() === jovo.REQUEST_TYPE_ENUM.INTENT &&
            this.getIntentName() === 'AMAZON.StopIntent') {
            return 'STOP_INTENT';
        }
    }

    /**
     * Ends session without saying anything
     */
    endSession() {

    }

    /**
     * Returns intent parameters filled by the user.
     * "My name is {John Doe} and I live in {New York}"
     * Returns object with name => value objects
     * {
     *   name : "John Doe",
     *   city : "New York"
     * }
     * @public
     * @return {*}
     */
    getInputs() {
        let inputs = {};

        if (!this.request.getSlots()) {
            return inputs;
        }

        let slotNames = Object.keys(this.request.getSlots());

        for (let i = 0; i < slotNames.length; i++) {
            let key = slotNames[i];
            inputs[key] = this.request.getSlots()[key].value;
        }
        return inputs;
    }

    /**
     * Get input object by name
     * @param {string} name
     * @return {string}
     */
    getInput(name) {
        return this.getInputs()[name];
    }

    /**
     * Returns type of platform
     * @return {string}
     */
    getType() {
        return jovo.PLATFORM_ENUM.ALEXA_SKILL;
    }

    /**
     * Returns platform's locale
     * @return {string}
     */
    getLocale() {
        return this.request.getLocale();
    }

    /**
     * Returns state value stored in the request session
     *
     * @return {*}
     */
    getState() {
        return this.request.getSessionAttribute('STATE') ||
        this.response.getSessionAttribute('STATE');
    }

    /**
     * Returns speech text
     * @return {string}
     */
    getSpeechText() {
        return this.response.getSpeechText();
    }


    /** ***********************************************************
     *
     * RESPONSE BUILDER FUNCTIONS
     *
     */

    /**
     * Returns AlexaResponse object.
     * @return {AlexaResponse|*}
     */
    getResponse() {
        return this.response;
    }

    /**
     * Returns AlexaRequest object
     * @return {AlexaRequest}
     */
    getRequest() {
        return this.request;
    }

    /**
     * Returns session attribute value
     * from the response(!) object
     * @param {string} name
     * @return {*}
     */
    getSessionAttribute(name) {
        return this.response.getSessionAttribute(name);
    }

    /**
     * Returns all session attributes
     * from the response(!) object.
     * @return {*}
     */
    getSessionAttributes() {
        return this.response.getSessionAttributes();
    }

    /**
     * Returns response object
     * @return {object}
     */
    getResponseObject() {
        return this.response.getResponseObject();
    }

    /**
     * Sets "raw" response object
     * @param {object} responseObj
     * @return {AlexaSkill} this;
     */
    setResponseObject(responseObj) {
        this.response.responseObj = responseObj;
        return this;
    }

    /**
     * Stores state in response object session
     * @public
     * @param {string} state
     */
    setState(state) {
        this.response.setSessionAttribute('STATE', state);
    }

    /**
     * Sets session attributes
     * @param {object} attributes
     * @param {*} value
     */
    setSessionAttributes(attributes) {
        this.response.setSessionAttributes(attributes);
    }

    /**
     * Sets session attribute with value
     * @param {string} name
     * @param {*} value
     */
    setSessionAttribute(name, value) {
        this.response.setSessionAttribute(name, value);
    }


    /**
     * Sets speech output with ShouldEndSession = true
     *
     * @param {string} speech
     */
    tell(speech) {
        this.response.tell(speech);
    }


    /**
     * Creates an audio tag within ssml
     *
     * Max 90 seconds
     * @param {string} audioUrl
     */
    play(audioUrl) {
        this.response.play(audioUrl);
    }

    /**
     * Creates object with reprompt.
     * Keeps session open
     * @param {string} speech
     * @param {string} repromptSpeech
     */
    ask(speech, repromptSpeech) {
        this.response.ask(speech, repromptSpeech);
    }

    /**
     * Implementation of generic withSimpleCard
     * Show a simple card to the response object
     * @param {string} title
     * @param {string} content
     * @return {AlexaSkill} this
     */
    showSimpleCard(title, content) {
        this.response.addSimpleCard(title, null, content);
        return this;
    }

    /**
     * Implementation of generic withImageCard
     * Show a standard card with a card to the response object
     * @param {string} title
     * @param {string} content
     * @param {string} imageObject object with secured image url
     * @return {AlexaSkill} this
     */
    showImageCard(title, content, imageObject) {
        const smallImageUrl = _.isString(imageObject) ? imageObject : imageObject.smallImageUrl;
        const largeImageUrl = _.isString(imageObject) ? imageObject : imageObject.largeImageUrl;

        this.response.addStandardCard(title, content, smallImageUrl, largeImageUrl);
        return this;
    }

    /**
     * Input object with name, value and confirmationStatus
     * @return {{}}
     */
    getInputsObj() {
        let inputs = {};

        if (!this.request.getSlots()) {
            return inputs;
        }

        let slotNames = Object.keys(this.request.getSlots());

        for (let i = 0; i < slotNames.length; i++) {
            let key = slotNames[i];
            inputs[key] = {
                name:
                this.request.getSlots()[key].name,
                value:
                this.request.getSlots()[key].value,
                confirmationStatus:
                this.request.getSlots()[key].confirmationStatus,
            };
        }
        return inputs;
    }

    /**
     * Returns AlexaSkill CardBuilder instance
     * @return {CardBuilder}
     */
    getCardBuilder() {
        return new CardBuilder();
    }


    /**
     * Returns Intent Confirmation status
     * @return {String}
     */
    getIntentConfirmationStatus() {
        return this.request.request.intent.confirmationStatus;
    }

    /**
     * Returns state of dialog
     * @return {jovo.DIALOGSTATE_ENUM}
     */
    getDialogState() {
        return this.request.getDialogState();
    }

    dialogDelegate() {
        this.response.dialogDelegate();
        this.jovo.respond();
    }

    dialogElicitSlot(slotToElicit, speechText) {
        this.response.dialogElicitSlot(slotToElicit, speechText);
        this.jovo.respond();
    }
    dialogConfirmSlot(slotToConfirm, speechText) {
        this.response.dialogConfirmSlot(slotToConfirm, speechText);
        this.jovo.respond();
    }
    isSlotConfirmed(slot) {
        return this.request.getSlotConfirmationStatus(slot) === 'CONFIRMED';
    }
}

module.exports.AlexaSkill = AlexaSkill;