/**
*
*
*        GOOGLE DIALOGFLOW ENTITY TYPES SUB MODULE
*
*  This module will handle all dialogflow's Intents related functionalities
*
*  @author  Jan Windelle Manalaysay
*  @date    2018/05/22
*  @email   jan.manalaysay@12u12.com
*
*  Sample source : https://github.com/dialogflow/dialogflow-nodejs-client-v2/blob/master/samples/resource.js
*  Intent Object Format : https://cloud.google.com/dialogflow-enterprise/docs/reference/rest/Shared.Types/Intent
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

const configs                    =  require('../../configs');
const MSG_WARNING_INTENTS_NULL   = "Intents Array is null. Please get All Intents First";

var CDialogFlow                  = require('dialogflow');

var m_dialogFlowConstants        = require('../constants/DialogflowConstants');
var m_msgrInst                   = null;

var m_arrIntents                 = null;// must be prepoluted before using any use of custom query searching
var m_fallbackIntent             = null;

//====================================================================
// PRIVATE METHODS
//====================================================================
function log(p_string)
{
   console.log("dialogflow Intents sub module::" + p_string);
}

// https://cloud.google.com/dialogflow-enterprise/docs/reference/rest/v2/projects.agent.intents/list
function initializeIntentsArray(p_obj)
{
   var _intentsClient = new CDialogFlow.IntentsClient();
   var _projectPath = _intentsClient.projectAgentPath( configs.GOOGLE_CLOUD_PROJECT_ID );
   var _req={
      parent         :  _projectPath
      , intentView   :  m_dialogFlowConstants.INTENT_VIEW_FULL 
   };
   _intentsClient.listIntents(_req)
   .then(
      function(p_responses){
         m_arrIntents = p_responses[0];
         log( "m_funcGetAllIntents(), Getting Intents:"
            + JSON.stringify(p_responses[0]) );
         if( m_msgrInst!=null && p_obj!=null ){
            m_msgrInst.sendText( p_obj.sender_id, "Total of Intents:" + p_responses[0].length );
         }
      }
   )
   .catch(
      function(p_err){
         log( "m_funcGetAllIntents(), Getting Intents Error:" + p_err );
         if( m_msgrInst!=null && p_obj!=null ){
            m_msgrInst.sendText( p_obj.sender_id, "Getting Intents Error:" + p_err );
         }
      }
   );
}

//====================================================================
// PUBLIC METHODS
//====================================================================
var m_funcSetMessenger = function(p_msgrInst)
{
   m_msgrInst = p_msgrInst;
};

var m_funcLogQuery = function(p_result, p_msgrSenderId)
{
   var _contextClient = new CDialogFlow.ContextsClient();

   log("m_funcLogQuery(), Query:" + p_result.queryText );
   m_msgrInst.sendText(p_msgrSenderId, "Query:" + p_result.queryText );

   log("m_funcLogQuery(), Response:" + p_result.fulfillmentText );
   m_msgrInst.sendText(p_msgrSenderId, "Response:" + p_result.fulfillmentText );

   if(p_result.intent){
      log("m_funcLogQuery(), Intent Display Name:" + p_result.intent.displayName );
      m_msgrInst.sendText(p_msgrSenderId, "Intent Display Name:" + p_result.intent.displayName );
   }else{
      log("m_funcLogQuery(), No Intent Matched" );
      m_msgrInst.sendText(p_msgrSenderId, "No Intent Matched" );
   }

   var _params = JSON.stringify( structjson.structProtoToJson(p_result.parameters) );
   log("m_funcLogQuery(), Parameters:" + _params );
   m_msgrInst.sendText(p_msgrSenderId, "Parameters:" + _params );

   if( p_result.outputContexts ){
      if( p_result.outputContexts.length ){
         log("m_funcLogQuery(), Output Contexts:" + _params );
         m_msgrInst.sendText(p_msgrSenderId, "Output Contexts:" + _params );

         p_result.outputContexts.forEach
         (
            function(p_context){
               var _contextId = _contextClient.matchContextFromContextName(p_context.name);
               var _contextParams = JSON.stringify( structjson.structProtoToJson( p_context.parameters ) );

               log("m_funcLogQuery(), Output Context Context ID:" + _contextId );
               log("m_funcLogQuery(), Output Context Lifespan:" + p_context.lifespanCount );
               log("m_funcLogQuery(), Output Context Parameters:" + _contextParams );

               m_msgrInst.sendText(p_msgrSenderId, "Output Context Context ID:" + _contextId );
               m_msgrInst.sendText(p_msgrSenderId, "Output Context Lifespan:" + p_context.lifespanCount );
               m_msgrInst.sendText(p_msgrSenderId, "Output Context Parameters:" + _contextParams );
            }
         );
      }
   }
};

var m_funcRespondRandomToUserFromIntent = function(p_msgrSenderId, p_intentObj)
{
   var _res = p_intentObj.messages[0].text.text[Math.floor(Math.random() * p_intentObj.messages[0].text.text.length)];
   m_msgrInst.sendText(p_msgrSenderId,_res);
};

var m_funcRespondToUserFromQueryResult = function(p_msgrSenderId, p_queryResult)
{
   var _res = p_queryResult.fulfillmentMessages[0].text.text[Math.floor(Math.random() * p_queryResult.fulfillmentMessages[0].text.text.length)];
   m_msgrInst.sendText(p_msgrSenderId,_res);
};

var m_funcDoesQueryHaveMatchFromTrainingPhrases = function( p_query, p_arrTrainingPhrases )
{
   log( "doesQueryHaveMatchFromTrainingPhrases()" );
   for(var tp=0;tp<p_arrTrainingPhrases.length;tp++)
   {
      //m_msgrInst.sendText( p_obj.sender_id, JSON.stringify(p_arrTrainingPhrases[tp]) );
      for(var p=0;p<p_arrTrainingPhrases[tp].parts.length;p++)
      {
         log( "doesQueryHaveMatchFromTrainingPhrases(), Training Phrase["+tp+"].text:" + p_arrTrainingPhrases[tp].parts[p].text );
         //m_msgrInst.sendText( p_obj.sender_id, p_arrTrainingPhrases[tp].parts[p].text );
         if( p_query===p_arrTrainingPhrases[tp].parts[p].text )
         {
            return true;
         }
      }
   }


   return false;
};

var m_funcGetIntentByName = function(p_intentName, p_obj)
{
   log("m_funcGetIntentByName(), Intent Name:" + p_intentName);
   m_msgrInst.sendText( p_obj.sender_id, "Intent Name:" + p_intentName );

   var _intentsClient = new CDialogFlow.IntentsClient();
   var _req={
      intentView  :  INTENT_VIEW_FULL
      , name      :  p_intentName
   };

   _intentsClient.getIntent(_req)
   .then
   (
      function(p_responses){
         log("m_funcGetIntentByName(), Intent:" + JSON.stringify(p_responses[0]));
         m_msgrInst.sendText( p_obj.sender_id, "Intent:" + JSON.stringify(p_responses[0]) );
      }
   )
   .catch
   (
      function(p_err){
         log("m_funcGetIntentByName(), error:" + p_err);
      }
   );
};

/**
 * This will put all the fetched Intents to a cache
 * 
 * @param {Object} p_obj
 * _obj =
      {
         sender_id: <MESSENGER_APP_SENDER_ID>
         , timestamp: <MESSENGER_APP_TIMESTAMP>
         , msg: <MESSENGER_APP_MESSAGE_TEXT>
      }; 
 */
var m_funcGetAllIntents = function(p_obj)
{
   initializeIntentsArray( p_obj );
};

/**
 * This will print all retrieved Intents Info from the cached Intents List
 * 
 * @param {Object} p_obj
 * _obj =
      {
         sender_id: <MESSENGER_APP_SENDER_ID>
         , timestamp: <MESSENGER_APP_TIMESTAMP>
         , msg: <MESSENGER_APP_MESSAGE_TEXT>
      }; 
 */
var m_funcListAllIntents = function(p_obj)
{
   if(m_arrIntents!=null)
   {
      for(var i=0; i<m_arrIntents.length; i++)
      {
         m_msgrInst.sendText( p_obj.sender_id, "Intent["+i+"]" + JSON.stringify(m_arrIntents[i]) );
      }
   }
   else
   {
      m_msgrInst.sendText( p_obj.sender_id, MSG_WARNING_INTENTS_NULL );
   }
};

/**
 * This will get the Fallback Intent from the Cached Intents List
 * Usually, the Fallback Intent is the Intent that has no Input and Output Contexts
 * 
 * @param {Obj} p_obj 
 */
var m_funcGetFallbackIntent = function(p_obj)
{
   if(m_fallbackIntent==null)
   {
      if( m_arrIntents!=null ){
         var _fi = -1;
         for(var i=0; i<m_arrIntents.length; i++ ){
            if(m_arrIntents[i].inputContextNames.length==0 && m_arrIntents[i].outputContexts.length==0 ){
               m_fallbackIntent = m_arrIntents[i];
               _fi = i;
               m_msgrInst.sendText( p_obj.sender_id, "Found a Fallback Intent" );
            }
         }

         if(_fi>=0){
            m_arrIntents.splice( _fi, 1 );
            m_msgrInst.sendText( p_obj.sender_id, "Removed the fallback Intent from the Intents Array" );
            m_msgrInst.sendText( p_obj.sender_id, "Intents Array Length:" + m_arrIntents.length );
         }else{
            m_msgrInst.sendText( p_obj.sender_id, "Can't find a fallback Intent" );
         }
      }else{
         m_msgrInst.sendText( p_obj.sender_id, MSG_WARNING_INTENTS_NULL );
      }
   }
   else
   {
      m_msgrInst.sendText( p_obj.sender_id, "Fallback Intent already exist" );
   }
};

var m_funcResetAll = function(p_obj)
{
   m_arrIntents = null;
   m_fallbackIntent = null;
   m_msgrInst.sendText( p_obj.sender_id, "Intents Array and Fallback Intent was reset" );
};

module.exports=
{
   setMessenger                              : m_funcSetMessenger
   , logQuery                                : m_funcLogQuery
   , respondRandomToUserFromIntent           : m_funcRespondRandomToUserFromIntent
   , respondToUserFromQueryResult            : m_funcRespondToUserFromQueryResult
   , doesQueryHaveMatchFromTrainingPhrases   : m_funcDoesQueryHaveMatchFromTrainingPhrases
   , getIntentByName                         : m_funcGetIntentByName
   , getAllIntents                           : m_funcGetAllIntents
   , listAllIntents                          : m_funcListAllIntents
   , getFallbackIntent                       : m_funcGetFallbackIntent
   , resetAll                                : m_funcResetAll
};