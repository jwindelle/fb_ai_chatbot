/**
*
*
*        GOOGLE DIALOGFLOW MODULE
*
*  This module will handle all dialogflow related functionalities
*
*  https://dialogflow.com/docs/sdks
*  DOCS:https://dialogflow.com/docs/reference/api-v2/rest/
*  SRC:https://github.com/dialogflow/dialogflow-nodejs-client-v2
*
*  @author  Jan Windelle Manalaysay
*  @date    2018/04/25
*  @email   jan.manalaysay@12u12.com
*
*  NOTE:
*  if just in case in the future
*  you will face a problem in regards to the grpc module
*  w/c cannot find the extension library
*  here is a website in w/c you can download the other
*  libraries
*  https://npm.taobao.org/mirrors/grpc/v1.7.2/
*
*/

/*jslint devel: true */
/*global
alert, confirm, console, prompt, process, require, arguments, log
*/
/*jslint indent: false */
/*jslint white: true */
/*jslint node: true */

'use strict';

const configs              = require('../configs');

// TODO:
// make the session ID unique for each of the messenger app ID
const SESSION_ID           = "12u12";//your own session id

/** 
 * This is set on DialogFlow Console on the Fulfillment sidebar menu 
 * This is technically, YOUR_BASE_URL + YOUR_FULFILLMENT_ENDPOINT
*/
const FULFILLMENT_ENDPOINT = "/dialogflow";

const DIRECTORIES_SEPARATOR= "/";

var langCodes              = require('./constants/googleLanguageCodes');
var CDialogFlow            = require('dialogflow');
var m_sessionClient        = new CDialogFlow.SessionsClient();
var structjson             = require('./structjson.js');

var CStorage               = require('@google-cloud/storage');
var generalMessages        = require('../constants/general-messages');

var m_dialogFlowConstants  = require('./constants/DialogflowConstants');
var m_intentsHandler       = require('./submodules/DialogflowIntents');
var m_entityTypesHandler   = require('./submodules/DialogflowEntityTypes');

// for Audio Reading
var common                 = require('@google-cloud/common');
var fs                     = require('fs');

var m_currContext          = null;
var m_arrContexts          = [];
var m_arrMsgrIds           = [];

var m_iMode                = 2;// 0:simple, 1:advanced, 2:custom

// define a session path
var m_sessionPath          = m_sessionClient.sessionPath(configs.GOOGLE_CLOUD_PROJECT_ID, SESSION_ID);
var m_msgrInst             = null;

//====================================================================
// CALLBACKS
//====================================================================
var m_cbOnWebhookFulfillment;

//====================================================================
// STRUCTS
//====================================================================
const StructQueryInputEvent=
{
   name:"EVT_NAME"
   ,parameters:{sampleParam:"SAMPLE_PARAM_VALUE",nParam:"NPARAM_VALUE"}
   ,languageCode:langCodes.LANG_EN
};

// https://dialogflow.com/docs/fulfillment#request
// This is what is passed from the Google Console
// to your fulfillment Webhook
const StructFulfillmentSampleRequest=
{
   "responseId": "13b0016f-88cd-4752-8c2b-09d7e911169c",
   "queryResult": {
      "queryText": "I ate lasagna",
      "parameters": {
         "FoodPhrases": "I ate", // Entity
         "any": "lasagna"        // 
      },
      "allRequiredParamsPresent": true,
      "fulfillmentText": "You ate lasagna",
      "fulfillmentMessages": [{
         "text": {
            "text": ["You ate lasagna"]
         }
      }],
      "outputContexts": [{
         "name": "projects/${PROJECT_ID}/agent/sessions/3fe3b8b6-d71e-187c-a569-f20dd0a96c7c/contexts/context_food_input",
         "lifespanCount": 5,
         "parameters": {
            "FoodPhrases.original": "I ate",
            "any.original": "lasagna",
            "any": "lasagna",
            "FoodPhrases": "I ate"
         }
      }],
      "intent": {
         "name": "projects/${PROJECT_ID}/agent/intents/4b1c0722-b107-47e4-ab5e-06e45a763831",
         "displayName": "Sample Start Food Input Capture Intent"
      },
      "intentDetectionConfidence": 1,
      "languageCode": "en"
   },
   "originalDetectIntentRequest": {
      "payload": {}
   },
   "session": "projects/${PROJECT_ID}/agent/sessions/3fe3b8b6-d71e-187c-a569-f20dd0a96c7c"
};

// https://dialogflow.com/docs/fulfillment#response
const StructFulfillmentSampleResponse=
{
   "fulfillmentText": "This is a text response",
   "fulfillmentMessages": [
     {
       "card": {
         "title": "card title",
         "subtitle": "card text",
         "imageUri": "https://assistant.google.com/static/images/molecule/Molecule-Formation-stop.png",
         "buttons": [
           {
             "text": "button text",
             "postback": "https://assistant.google.com/"
           }
         ]
       }
     }
   ],
   "source": "example.com",
   "payload": {
     "google": {
       "expectUserResponse": true,
       "richResponse": {
         "items": [
           {
             "simpleResponse": {
               "textToSpeech": "this is a simple response"
             }
           }
         ]
       }
     },
     "facebook": {
       "text": "Hello, Facebook!"
     },
     "slack": {
       "text": "This is a text response for Slack."
     }
   },
   "outputContexts": [
     {
       "name": "projects/${PROJECT_ID}/agent/sessions/${SESSION_ID}/contexts/context name",
       "lifespanCount": 5,
       "parameters": {
         "param": "param value"
       }
     }
   ],
   "followupEventInput": {
     "name": "event name",
     "languageCode": "en-US",
     "parameters": {
       "param": "param value"
     }
   }
};

//====================================================================
// PRIVATE METHODS
//====================================================================
function log(p_string)
{
   console.log("google dialogflow module::" + p_string);
}

function getRandomResponseFromResult(p_queryResult)
{
   var _resp;
   for( var i=0; i<p_queryResult[0].queryResult.fulfillmentMessages.length; i++ ){
      var _currFulfillmentMsg=p_queryResult[0].queryResult.fulfillmentMessages[i];
      if( _currFulfillmentMsg.text.text!==undefined ){
         var _ranIdx = Math.floor(Math.random() * _currFulfillmentMsg.text.text.length);
         _resp = _currFulfillmentMsg.text.text[_ranIdx];
      }
   }
   return _resp;
}
function getPromisedRandomResponseFromResult(p_queryResult)
{
   var _ranIdx;
   return new Promise
   (
      function(funcResolve, funcReject){
         try{
            var _resp;
            for( var i=0; i<p_queryResult[0].queryResult.fulfillmentMessages.length; i++ )
            {
               var _currFulfillmentMsg=p_queryResult[0].queryResult.fulfillmentMessages[i];
               if( _currFulfillmentMsg.text!==undefined ){
                  var _ranIdx = Math.floor(Math.random() * _currFulfillmentMsg.text.text.length);
                  _resp = _currFulfillmentMsg.text.text[_ranIdx];
               }
            }
            funcResolve( _resp );
         }catch(err){
            funcReject(null);
         }
      }
   );
}

/**
 * For now this is the way of getting the messenger ID of the query sender
 * because we are using the messenger user's ID as part of the session path
 * TODO:
 * find a way to be able to pass the ID thru the queryParams
 * and be fetched back from the queryResult parameters
 */
function getMessengerIdFromResult(p_queryResult)
{
   //log( "getMessengerIdFromResult(), Query Result:" + JSON.stringify(p_queryResult) );
   // example of an output context name value:
   log( "getMessengerIdFromResult(), Output Context Name:" + p_queryResult[0].queryResult.outputContexts[0].name );
   var _arrContextDirectories = p_queryResult[0].queryResult.outputContexts[0].name.split(DIRECTORIES_SEPARATOR);
   // "projects/PROJECT_NAME/agent/sessions/MESSENGER_ID/contexts/botaskfood-followup"
   return _arrContextDirectories[4];
}
function getPromisedMessengerIdFromResult(p_queryResult)
{
   log("getPromisedMessengerIdFromResult Query:" + JSON.stringify(p_queryResult) );
   var _arrContextDirectories;
   return new Promise
   (
      function(funcResolve, funcReject){
         try{
            _arrContextDirectories = p_queryResult[0].queryResult.outputContexts[0].name.split(DIRECTORIES_SEPARATOR);
            log("getPromisedMessengerIdFromResult _arrContextDirectories:" + _arrContextDirectories.join(",") );
            funcResolve(_arrContextDirectories[4]);
         }catch(err){
            log("getPromisedMessengerIdFromResult Error:" + err );
            funcReject(null);
         }
      }
   );
}

/**
 * Can be a alternative method
 * for loading the google application credential file
 * without using the system environment variable
 * GOOGLE_APPLICATION_CREDENTIALS
 */
function getKeyCredentialByCode()
{
   var _storage = new CStorage({keyFilename:GOOGLE_APPLICATION_CREDENTIALS});
   _storage.getBuckets()
   .then
   (
      function(p_result)
      {
         var _buckets = p_result[0];
         log("m_funcSendRequest(), Buckets:" );
         _buckets.forEach((_bucket)=>{log(_bucket);});
      }
   ).catch(
      function(p_err)
      {
         log("m_funcSendRequest(), ERROR:" + p_err );
      }
   );
}

//====================================================================
// Section for handling the custom matching of a query to an Intent
// NOTE:
// prior to this method call, the local array of Intents should had been prepopulated
// TODO:
// replace all intents array from the Intents Handler Sub Module Instance
function handleCustomGetIntent(p_obj)
{
   /*if(m_arrIntents!=null)
   {
      var _matchedIntent=null;

      for(var i=0; i<m_arrIntents.length; i++)
      {
         if(m_currContext==null)
         {
            if(m_arrIntents[i].inputContextNames.length==0){
               // find matching Intent for the first query
               if( m_intentsHandler.doesQueryHaveMatchFromTrainingPhrases( p_obj.msg, m_arrIntents[i].trainingPhrases )){
                  _matchedIntent = m_arrIntents[i];
                  break;
               }
            }
         }
         // current context already has content
         else
         {
            for(var j=0; j<m_currContext.length; j++){
               for(var k=0; k<m_arrIntents[i].inputContextNames.length; k++){
                  // first check if there is any match for the current context names
                  // and from the Intent's input context names
                  if(m_currContext[j].name==m_arrIntents[i].inputContextNames[k]){
                     if( m_intentsHandler.doesQueryHaveMatchFromTrainingPhrases( p_obj.msg, m_arrIntents[i].trainingPhrases )){
                        _matchedIntent = m_arrIntents[i];
                        break;
                     }
                  }
               }
            }
         }
         
      }

      // if found a matched Intent from the query
      if(_matchedIntent!=null)
      {
         m_msgrInst.sendText( p_obj.sender_id, "Found a Matching Intent" );
         m_currContext = _matchedIntent.outputContexts;
         m_intentsHandler.respondRandomToUserFromIntent(p_obj.sender_id, _matchedIntent );
      }
      else
      {
         m_intentsHandler.respondRandomToUserFromIntent(p_obj.sender_id, m_fallbackIntent);
      }


   }
   else
   {
      m_msgrInst.sendText( p_obj.sender_id, "The Intents List is null" );
      printHelp(p_obj);
   }*/
}

//====================================================================
// for debugging/testing purposes
function handleSimpleGetIntent(p_obj)
{
   var _req={
      session: m_sessionPath
      , queryInput:{
         text:{
            text: p_obj.msg
            ,languageCode: langCodes.LANG_EN
         }
      }
   };

   //m_sessionClient = new CDialogFlow.SessionsClient();
   m_sessionClient
      .detectIntent(_req)
      .then(
         function(p_responses){
            var _result = p_responses[0].queryResult;
            if(_result.intent){
               log("handleSimpleGetIntent(), Intent:" + JSON.stringify(_result) );
               //m_msgrInst.sendText(p_obj.sender_id, JSON.stringify(_result) );
               m_intentsHandler.respondToUserFromQueryResult(p_obj.sender_id, _result);
            }else{
               log("handleSimpleGetIntent(), No Intent Matched" );
               m_msgrInst.sendText(p_obj.sender_id, "No Intent Matched");
            }
         }
      ).catch(
         function(p_err){
            log("handleSimpleGetIntent(), Error:" + p_err);
            m_msgrInst.sendText(p_obj.sender_id, p_err);
         }
      );
}

/*function handleAdvancedGetIntent(p_obj)
{
   var _req={
      session: m_sessionPath
      , queryInput:{
         text:{
            text: p_obj.msg
            ,languageCode: langCodes.LANG_EN
         }
      }
   };

   //m_sessionClient = new CDialogFlow.SessionsClient();
   if(m_currContext===null)
   {
      m_currContext = m_sessionClient.detectIntent(_req);
   }
   else
   {
      m_currContext=m_currContext
         .then(
            function(p_responses){
               var _response = p_responses[0];
               //m_intentsHandler.logQuery( _response.queryResult, p_obj.sender_id );

               // https://github.com/dialogflow/dialogflow-nodejs-client-v2/blob/master/samples/detect.js
               // TODO:
               // Use output contexts as input contexts for the next query
               _response.queryResult.outputContexts.forEach
               (
                  function(p_context){
                     p_context.parameters = structjson.jsonToStructProto
                        (
                           structjson.structProtoToJson(p_context.parameters)
                        );
                  }
               );
               _req.queryParams={
                  contexts: _response.queryResult.outputContexts
               };


               return m_sessionClient.detectIntent(_req);
            }
         );
   }

   m_currContext
      .then
      (
         function(p_responses){
            log("handleAdvancedGetIntent(), Detected Intent:" + JSON.stringify(p_responses[0].queryResult));
            //m_msgrInst.sendText( p_obj.sender_id, "Detected Intent:" + JSON.stringify(p_responses[0].queryResult) );
            //m_intentsHandler.logQuery( p_responses[0].queryResult, p_obj.sender_id );
            m_intentsHandler.respondToUserFromQueryResult(p_obj.sender_id, p_responses[0].queryResult);
            // TODO:
            // handle here the sending of the final input of user
         }
      )
      .catch
      (
         function(p_err){
            log("handleAdvancedGetIntent(), Detect Intent Error:" + p_err );
            m_msgrInst.sendText( p_obj.sender_id, "Detect Intent Error:" + p_err );
         }
      );
}*/

function handleAdvancedGetIntent(p_obj)
{
   var _context=null;

   var _idx = m_arrMsgrIds.indexOf(p_obj.sender_id);
   if( _idx===-1 ){
      m_arrMsgrIds.push( p_obj.sender_id );
      m_arrContexts.push( _context );
      _idx = m_arrMsgrIds.length-1;
   }else{
      _context = m_arrContexts[_idx];
   }

   log( "handleAdvancedGetIntent(), m_arrMsgrIds Length:" + m_arrMsgrIds.length );
   log( "handleAdvancedGetIntent(), m_arrContexts Length:" + m_arrContexts.length );

   var _sessionPath = m_sessionClient.sessionPath(configs.GOOGLE_CLOUD_PROJECT_ID, p_obj.sender_id);
   var _req={
      session: _sessionPath
      , queryInput:{
         text:{
            text: p_obj.msg
            ,languageCode: langCodes.LANG_EN
         }
      }
   };

   if(_context===null)
   {
      _context = m_sessionClient.detectIntent(_req);
   }
   else
   {
      _context=_context
         .then(
            function(p_responses){
               var _response = p_responses[0];
               //m_intentsHandler.logQuery( _response.queryResult, p_obj.sender_id );

               // https://github.com/dialogflow/dialogflow-nodejs-client-v2/blob/master/samples/detect.js
               // TODO:
               // Use output contexts as input contexts for the next query
               _response.queryResult.outputContexts.forEach
               (
                  function(p_context){
                     p_context.parameters = structjson.jsonToStructProto
                     (
                        structjson.structProtoToJson(p_context.parameters)
                     );
                  }
               );
               _req.queryParams={
                  contexts: _response.queryResult.outputContexts
               };


               return m_sessionClient.detectIntent(_req);
            }
         );
   }

   _context
   .then
   (
      function(p_responses){
         //log("handleAdvancedGetIntent(), Detected Intent:" + JSON.stringify(p_responses[0].queryResult));
         m_intentsHandler.respondToUserFromQueryResult(p_obj.sender_id, p_responses[0].queryResult);
         // TODO:
         // handle here the sending of the final input of user
      }
   )
   .catch
   (
      function(p_err){
         log("handleAdvancedGetIntent(), Detect Intent Error:" + p_err );
         m_msgrInst.sendText( p_obj.sender_id, "Detect Intent Error:" + p_err );
      }
   );

   m_arrContexts[_idx] = _context;
}

function printHelp(p_obj)
{
   m_msgrInst.sendText( p_obj.sender_id, "COMMANDS LIST:" );
   
   m_msgrInst.sendText( p_obj.sender_id, "'gai' = get all intents" );
   m_msgrInst.sendText( p_obj.sender_id, "'lai' = list all intents" );
   m_msgrInst.sendText( p_obj.sender_id, "'gfi' = get fallback intent" );
   m_msgrInst.sendText( p_obj.sender_id, "'rai' = reset all intents" );
   m_msgrInst.sendText( p_obj.sender_id, "'gin,[INTENT_NAME]' = get intent by display name" );

   m_msgrInst.sendText( p_obj.sender_id, "'let' = list entity types" );
   m_msgrInst.sendText( p_obj.sender_id, "'cet' = create entity type" );
   m_msgrInst.sendText( p_obj.sender_id, "'get,[ENTITY_TYPE_NAME]' = get entity type" );
   m_msgrInst.sendText( p_obj.sender_id, "'uet,[ENTITY_TYPE_ID],[ENTITY_TYPE_VALUE]' = update entity type. get [ENTITY_TYPE_ID] by using 'get' call."
      + "[ENTITY_TYPE_VALUE] can be single value or use '=' after initial value for synonyms separated by a '|'. e.g: mango=mango|mangoes" );

   m_msgrInst.sendText( p_obj.sender_id, "'pc' = print context" );
   m_msgrInst.sendText( p_obj.sender_id, "'cls' = reset context" );

   m_msgrInst.sendText( p_obj.sender_id, "'mode=[MODE]' = MODES( 1:simple | 2:advanced | 3:custom )" );
}

function printContext(p_obj)
{
   m_msgrInst.sendText( p_obj.sender_id, "Current Context:" + JSON.stringify( m_currContext ) );
   log("printContext(), m_currContext:" + JSON.stringify(m_currContext) );
}

// https://dialogflow.com/docs/fulfillment
function handleFulfillment(p_request, p_response)
{
   //log("handleFulfillment(), Request Body:" + JSON.stringify(p_request.body));
   // https://dialogflow.com/docs/fulfillment#errors
   if(m_cbOnWebhookFulfillment!==undefined){
      m_cbOnWebhookFulfillment( p_request.body, p_response );
   }
}
//====================================================================
// PUBLIC METHODS
//====================================================================
// https://dialogflow.com/docs/getting-started/basic-fulfillment-conversation
// https://dialogflow.com/docs/fulfillment
var m_funcInitialize = function(p_app, p_request)
{
   p_app.post(FULFILLMENT_ENDPOINT, handleFulfillment);
};

var m_funcSetMessenger = function(p_msgrInst)
{
   m_msgrInst = p_msgrInst;
   m_intentsHandler.setMessenger(p_msgrInst);
   m_entityTypesHandler.setMessenger(p_msgrInst);
};

// this methods's functionality is based on 'handleAdvancedGetIntent' method
// https://dialogflow.com/docs/reference/api-v2/rest/v2/projects.agent.sessions/detectIntent#QueryInput
/**
 * Returns a text response based from a matched Intent
 * NOTE:
 * will not return if the Intent's Webhook Call had caused an error or was never returned
 * 
 * @param {JSON Object} p_obj { sender_id, msg, TODO:language code }
 * @param {Function} p_callbackFunction Function(BotTextResponse, messengerSenderId or null). if null, you might had got the fallback Intent
 */
var m_funcGetResponseFromQueryCallback = function(p_obj, p_callbackFunction)
{
   log( "m_funcGetResponseFromQueryCallback(), p_obj:" + JSON.stringify(p_obj) );
   var _context=null;

   var _idx = m_arrMsgrIds.indexOf(p_obj.sender_id);
   if( _idx===-1 ){
      m_arrMsgrIds.push( p_obj.sender_id );
      m_arrContexts.push( _context );
      _idx = m_arrMsgrIds.length-1;
   }else{
      _context = m_arrContexts[_idx];
   }

   var _sessionPath = m_sessionClient.sessionPath(configs.GOOGLE_CLOUD_PROJECT_ID, p_obj.sender_id);

   // https://dialogflow.com/docs/reference/api-v2/rest/v2/projects.agent.sessions/detectIntent
   var _req=
   {
      session: _sessionPath
      //, queryParams:
      //{
      //   payload:structjson.jsonToStructProto([{"param1":"SOME_VALUE"}])
      //}
      , queryInput:
      {
         text:
         {
            text: p_obj.msg
            ,languageCode: langCodes.LANG_EN
         }
         // https://stackoverflow.com/questions/47583996/send-parameters-to-webhook-on-dialogflow-sdk-v2
         //, event:
         //{
         //   name:"EVT_PASS_VALUES"
         //   , languageCode: langCodes.LANG_EN
         //   , parameters:structjson.jsonToStructProto({param1:"SOME_VALUE"})
         //}
      }
      //, queryParams:
      //{
      //   "context":
      //   [{
      //      "name":"projects/"+ configs.GOOGLE_CLOUD_PROJECT_ID +"/agent/sessions/" + p_obj.sender_id + "/contexts/context_sample"
      //      ,"lifespanCount":0
      //   }]
      //}
   };

   if(_context===null)
   {
      _context = m_sessionClient.detectIntent(_req);
   }
   else
   {
      _context=_context
      .then(
         function(p_responses){
            var _response = p_responses[0];
            _response.queryResult.outputContexts.forEach
            (
               function(p_context){
                  p_context.parameters = structjson.jsonToStructProto
                     (
                        structjson.structProtoToJson(p_context.parameters)
                     );
               }
            );
            _req.queryParams={
               contexts: _response.queryResult.outputContexts
            };


            return m_sessionClient.detectIntent(_req);
         }
      );
   }

   _context
   .then
   (
      function(p_responses)
      {
         log("m_funcGetResponseFromQueryCallback(), Response:" + JSON.stringify(p_responses) );
         var _isCallbackAllowed=false;
         if( p_responses[0].webhookStatus===null || p_responses[0].webhookStatus===undefined ){
            //log("m_funcGetResponseFromQueryCallback(), Query Result:" + JSON.stringify(p_responses[0].queryResult) );
            //var _resp=getRandomResponseFromResult(p_responses);
            //log("m_funcGetResponseFromQueryCallback(), Response:" + _resp );
            //var _msgrId=getMessengerIdFromResult(p_responses);
            //log("m_funcGetResponseFromQueryCallback(), Messenger ID:" + _msgrId );
            _isCallbackAllowed=true;
         }else{
            log("m_funcGetResponseFromQueryCallback(), Response Webhook:" + JSON.stringify(p_responses[0].webhookStatus) );
            if( p_responses[0].webhookStatus.code===0 ){
               //p_callbackFunction(getRandomResponseFromResult(p_responses),getMessengerIdFromResult(p_responses));
               _isCallbackAllowed=true;
            }
         }

         if( _isCallbackAllowed )
         {
            var _randResp;
            getPromisedRandomResponseFromResult(p_responses)
            .then(function(r_randResp){
               log("m_funcGetResponseFromQueryCallback(), Random Response:" + r_randResp );
               _randResp = r_randResp;
               return getPromisedMessengerIdFromResult(p_responses);
            })
            .then(function(r_msgrId){
               log("m_funcGetResponseFromQueryCallback(), Messenger ID:" + r_msgrId );
               p_callbackFunction(_randResp,r_msgrId);
            })
            .catch(function(r_retVal){
               p_callbackFunction(_randResp,null);
            });
         }
      }
   )
   .catch
   (
      function(p_err){
         log("m_funcGetResponseFromQueryCallback(), Detect Intent Error:" + p_err );
         _context=null;
      }
   );

   log("m_funcGetResponseFromQueryCallback(), Current User Context:" + JSON.stringify(_context) );
   m_arrContexts[_idx] = _context;
};

/**
 * @param {StructQueryInputEvent}
 * @param {Object} '../12u12/structures/12u12MessageObjectStructure.js' 
 * @param {Function} p_callbackFunction Function(BotTextResponse, messengerSenderId)
 */
var m_funcGetResponseFromEventCallback = function(p_structQueryInputEventObj, p_obj, p_callbackFunction)
{
   //log( "m_funcGetResponseFromEventCallback(), p_obj:" + JSON.stringify(p_obj) );
   var _context=null;

   var _idx = m_arrMsgrIds.indexOf(p_obj.sender_id);
   if( _idx===-1 ){
      m_arrMsgrIds.push( p_obj.sender_id );
      m_arrContexts.push( _context );
      _idx = m_arrMsgrIds.length-1;
   }else{
      _context = m_arrContexts[_idx];
   }

   var _sessionPath = m_sessionClient.sessionPath(configs.GOOGLE_CLOUD_PROJECT_ID, p_obj.sender_id);

   // https://dialogflow.com/docs/reference/api-v2/rest/v2/projects.agent.sessions/detectIntent
   var _req=
   {
      session: _sessionPath
      , queryInput:{
         event:
         {
            name : p_structQueryInputEventObj.name
            , languageCode: p_structQueryInputEventObj.languageCode
            , parameters:structjson.jsonToStructProto( p_structQueryInputEventObj.parameters )
         }
      }
   };

   if(_context===null)
   {
      _context = m_sessionClient.detectIntent(_req);
   }
   else
   {
      _context=_context
      .then(
         function(p_responses){
            var _response = p_responses[0];
            _response.queryResult.outputContexts.forEach
            (
               function(p_context){
                  p_context.parameters = structjson.jsonToStructProto
                     (
                        structjson.structProtoToJson(p_context.parameters)
                     );
               }
            );
            _req.queryParams={
               contexts: _response.queryResult.outputContexts
            };


            return m_sessionClient.detectIntent(_req);
         }
      );
   }

   _context
   .then
   (
      function(p_responses){
         log("m_funcGetResponseFromEventCallback(), Response:" + JSON.stringify(p_responses) );
         //p_callbackFunction(getRandomResponseFromResult(p_responses),getMessengerIdFromResult(p_responses));
      }
   )
   .catch
   (
      function(p_err){
         log("m_funcGetResponseFromEventCallback(), Detect Intent Error:" + p_err );
         _context=null;
      }
   );

   log("m_funcGetResponseFromEventCallback(), Current User Context:" + JSON.stringify(_context) );
   m_arrContexts[_idx] = _context;
};

var m_funcGetResponseFromAudioCallback = function(p_fileName, p_callbackFunction)
{
   log( "m_funcGetResponseFromAudioCallback(), p_fileName:" + p_fileName );
   const readFile = common.util.promisify( fs.readFile, { singular:true } );
   readFile(p_fileName)
      .then
      (
         function(p_inputAudio){
            const _req=
            {
               session: m_sessionPath
               , queryInput:
               {
                  audioConfig:
                  {
                     audioEncoding : "AUDIO_ENCODING_UNSPECIFIED" // https://cloud.google.com/dialogflow-enterprise/docs/reference/rest/v2/projects.agent.sessions/detectIntent#AudioEncoding
                     , sampleRateHertz : 16000 // https://cloud.google.com/speech-to-text/docs/basics
                     , languageCode : langCodes.LANG_EN
                  }
               }
               , inputAudio : p_inputAudio
            };


            return m_sessionClient.detectIntent( _req );
         }
      )
      .then
      (
         function(r_responses){
            log( "m_funcGetResponseFromAudioCallback(), Result:" + JSON.stringify(r_responses[0].queryResult) );
            p_callbackFunction( JSON.stringify(r_responses[0].queryResult) );
         }
      )
      .catch
      (
         function(r_err){
            log( "m_funcGetResponseFromAudioCallback(), Error:" + r_err );
            p_callbackFunction( r_err );
         }
      );
};

/**
 * @param {Object} p_obj
 * _obj =
      {
         sender_id: <MESSENGER_APP_SENDER_ID>
         , timestamp: <MESSENGER_APP_TIMESTAMP>
         , msg: <MESSENGER_APP_MESSAGE_TEXT>
      }; 
 */
var m_funcOnMsgrMsgReceived = function(p_obj)
{
   var _arr=null;

   if( p_obj.msg.indexOf( "cls" )!==-1 )
   {
      m_currContext = null;
      m_msgrInst.sendText(p_obj.sender_id, "context reset");
   }

   //========================================================
   // Intents
   else if( p_obj.msg.indexOf( "gai" )!==-1 )
   {
      //initializeIntentsArray(p_obj);
      m_intentsHandler.getAllIntents(p_obj);
   }
   else if( p_obj.msg.indexOf( "lai" )!==-1 )
   {
      //listIntentsArray(p_obj);
      m_intentsHandler.listAllIntents(p_obj);
   }
   else if( p_obj.msg.indexOf( "gfi" )!==-1 )
   {
      m_intentsHandler.getFallbackIntent(p_obj);
   }
   else if( p_obj.msg.indexOf( "rai" )!==-1 )
   {
      m_intentsHandler.resetAll(p_obj);
   }
   else if( p_obj.msg.indexOf( "gin" )!==-1 )
   {
      _arr = p_obj.msg.split(',');
      m_intentsHandler.getIntentByName( _arr[1], p_obj );
   }

   //========================================================
   // Context
   else if( p_obj.msg.indexOf( "pc" )!==-1 )
   {
      printContext(p_obj);
   }

   //========================================================
   // Entities
   else if( p_obj.msg.indexOf( "let" )!==-1 )
   {
      //listEntityTypes(p_obj);
      m_entityTypesHandler.listAllEntityTypes(p_obj);
   }
   else if( p_obj.msg.indexOf( "cet" )!==-1 )
   {
      m_entityTypesHandler.createEntityType(p_obj);
   }
   else if( p_obj.msg.indexOf( "get" )!==-1 )
   {
      _arr = p_obj.msg.split(',');
      m_entityTypesHandler.getEntityTypeByName(_arr[1], p_obj);
   }
   else if( p_obj.msg.indexOf( "uet" )!==-1 )
   {
      _arr = p_obj.msg.split(',');
      m_entityTypesHandler.updateEntityType(_arr[1], _arr[2], p_obj);
   }

   //========================================================
   // Others
   else if( p_obj.msg.indexOf( "mode" )!==-1 )
   {
      _arr = p_obj.msg.split('=');
      m_iMode = parseInt(_arr[1]);
      m_msgrInst.sendText( p_obj.sender_id, "mode is now " + _arr[1] );
   }
   else if( p_obj.msg.indexOf( "commands" )!==-1
   || p_obj.msg.indexOf( "help" )!==-1)
   {
      printHelp(p_obj);
   }
   
   else
   {
      switch(m_iMode)
      {
         case 1:
         {
            handleSimpleGetIntent(p_obj);
            break;
         }
         case 2:
         {
            handleAdvancedGetIntent(p_obj);
            break;
         }
         case 3:
         {
            handleCustomGetIntent(p_obj);
            break;
         }
      }
   }
};

/**
 * For replying to the Request
 * look on StructFulfillmentSampleResponse for Reference
 * then, user the formats:
 * 
 * example for replying with just a fulfillment message:
 * StructFulfillmentSampleRequest.json( StructFulfillmentSampleResponse.fulfillmentText )
 * 
 * example for replying with a target Intent Custom Event
 * var obj={
      followupEventInput:
      {
         name           :  INTENT_CUSTOM_EVENT_NAME
         , languageCode :  StructFulfillmentSampleRequest.queryResult.languageCode
         , parameters   :  { CUSTOM_PARAM_NAME : CUSTOM_VALUE }
      }
 * }
 * 
 * NOTE:
 * to access the CUSTOM_VALUE in DialogFlow Console:
 * inside the target Intent that contains the INTENT_CUSTOM_EVENT_NAME
 * go to the 'Action and paramaters' Section,
 * enter a PARAM_NAME under the 'PARAMETER NAME' field,
 * then in the 'VALUE' field put #INTENT_CUSTOM_EVENT_NAME.CUSTOM_PARAM_NAME,
 * to output the value,
 * put $PARAM_NAME w/c was stated on the 'Action and paramaters' section
 * 
 * @param {Function} p_callbackFunction 
 * @returns {Function} CallbackFunction( StructFulfillmentSampleRequest, StructFulfillmentSampleResponse )
 */
var m_funcRegisterWebhookFulfillmentCallback = function(p_callbackFunction)
{
   m_cbOnWebhookFulfillment = p_callbackFunction;
};

/**
 * @param {structFulfillmentSampleRequest} p_structFulfillmentSampleRequestObj
 * @param {Function} p_callbackFunction Function(messengerId)
 */
var m_funcGetMessengerIdFromFulfillmentRequest = function(p_structFulfillmentSampleRequestObj, p_callbackFunction)
{
   var _arrSessionDirs = p_structFulfillmentSampleRequestObj.session.split(DIRECTORIES_SEPARATOR);
   // "projects/PROJECT_ID/agent/sessions/MESSENGER_ID"
   p_callbackFunction( _arrSessionDirs[4] );
};




module.exports=
{
   initialize                             :  m_funcInitialize
   , setMessenger                         :  m_funcSetMessenger
   , onMsgrMsgReceived                    :  m_funcOnMsgrMsgReceived
   , getResponseFromQuery                 :  m_funcGetResponseFromQueryCallback
   , getResponseFromEvent                 :  m_funcGetResponseFromEventCallback
   , getResponseFromAudio                 :  m_funcGetResponseFromAudioCallback
   , registerWebhookFulfillmentCallback   :  m_funcRegisterWebhookFulfillmentCallback
   , getMessengerIdFromFulfillmentRequest :  m_funcGetMessengerIdFromFulfillmentRequest
};

/*
exports.helloHttp = function helloHttp (request, response)
{
   log( "helloHttp(), Request:" + JSON.stringify(request) );
   log( "helloHttp(), Response:" + JSON.stringify(response) );
   response.json({ fulfillmentText: 'This is a sample response from your webhook!' });
};
*/