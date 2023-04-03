/**
*
*
*        GOOGLE DIALOGFLOW ENTITY TYPES SUB MODULE
*
*  This module will handle all dialogflow's Entity Type related functionalities
*
*  @author  Jan Windelle Manalaysay
*  @date    2018/05/22
*  @email   jan.manalaysay@12u12.com
*
*  https://github.com/dialogflow/dialogflow-nodejs-client-v2/blob/master/samples/resource.js
*
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

const configs              = require('../../configs');

const MAP_KIND             = "KIND_MAP";
const EXP_MODE_UNSPECIFIED = "AUTO_EXPANSION_MODE_UNSPECIFIED";

var CDialogFlow            = require('dialogflow');

var m_dialogFlowConstants  = require('../constants/DialogflowConstants');
var m_msgrInst             = null;

//====================================================================
// PRIVATE METHODS
//====================================================================
function log(p_string)
{
   console.log("dialogflow entity types sub module::" + p_string);
}

function logEntityType(p_entityType, p_obj)
{
   var _entityTypesClient = new CDialogFlow.EntityTypesClient();

   log( "logEntityType(), Entity Type ID:" 
      + _entityTypesClient.matchEntityTypeFromEntityTypeName(p_entityType.name) );
   m_msgrInst.sendText( p_obj.sender_id, "Entity Type ID:" 
      + _entityTypesClient.matchEntityTypeFromEntityTypeName(p_entityType.name) );

   log( "logEntityType(), Entity Type Display Name:" + p_entityType.displayName );
   m_msgrInst.sendText( p_obj.sender_id, "Entity Type Display Name:" + p_entityType.displayName );

   log( "logEntityType(), Entity Type Auto Expansion:" 
      + p_entityType.autoExpansionMode === 'AUTO_EXPANSION_MODE_DEFAULT' );
   m_msgrInst.sendText( p_obj.sender_id, "Entity Type Auto Expansion:"
      + p_entityType.autoExpansionMode === 'AUTO_EXPANSION_MODE_DEFAULT' );
   
   if( !p_entityType.entities ){
      log( "logEntityType(), No Entity Defined" );
      m_msgrInst.sendText( p_obj.sender_id, "No Entity Defined" );
   }else{
      log( "logEntityType(), Entities:" );
      m_msgrInst.sendText( p_obj.sender_id, "No Entity Defined" );
      for(var i=0; p_entityType.entities.length; i++){
         var _entity = p_entityType.entities[i];
         if(p_entityType.kind === 'KIND_MAP'){
            log( "logEntityType(), Entity Value:" 
               + _entity.value + ":"
               + _entity.synonyms.join(',') );
            m_msgrInst.sendText( p_obj.sender_id, "Entity Value:"
               + _entity.value + ":"
               + _entity.synonyms.join(',') );
         }else{
            log( "logEntityType(), Entity Value:" + _entity.value );
            m_msgrInst.sendText( p_obj.sender_id, "Entity Value:" + _entity.value );
         }
      }
   }
}

function getEntityType(p_entityType, p_obj)
{
   log( "getEntityType(), Entity Type Name:" + p_entityType );
   var _entityTypesClient = new CDialogFlow.EntityTypesClient();
   var _req = { name : p_entityType.name };

   _entityTypesClient.getEntityType(_req)
   .then
   (
      function(p_responses){
         m_msgrInst.sendText( p_obj.sender_id, "Found Entity Type" );
         logEntityType(p_responses[0], p_obj);
      }
   )
   .catch()
   (
      function(p_err){
         log( "Getting Entity Type Error:" + p_err );
         m_msgrInst.sendText( p_obj.sender_id, "Getting Entity Type Error:" + p_err );
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

// TODO:
// customize this more in the future
var m_funcCreateEntityType = function(p_obj)
{
   var _entityTypesClient = new CDialogFlow.EntityTypesClient();
   var _intentsClient = new CDialogFlow.IntentsClient();
   var _agentPath = _intentsClient.projectAgentPath(configs.GOOGLE_CLOUD_PROJECT_ID);

   var _sizeRequest={
      parent: _agentPath
      , entityType:
      {
         displayName       : 'size'
         ,kind             : MAP_KIND
         ,autoExpansionMode: EXP_MODE_UNSPECIFIED
         ,entities:
         [
            {value: 'small', synonyms:['small','petit']}
            ,{value: 'medium', synonyms:['medium']}
            ,{value: 'large', synonyms:['large','big']}
         ]
      }
   };

   _entityTypesClient.createEntityType(_sizeRequest)
   .then
   (
      function(p_responses){
         log("m_funcCreateEntityType(), Creation of Entity Type:" 
            + JSON.stringify(p_responses) );
         m_msgrInst.sendText( p_obj.sender_id, "Creation of Entity Type:"
            + JSON.stringify(p_responses) );
      }
   )
   .catch
   (
      function(p_err){
         log("m_funcCreateEntityType(), Creation of Entity Type Error:" + p_err );
         m_msgrInst.sendText( p_obj.sender_id, "Creation of Entity Type Error:" + p_err );
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
var m_funcListAllEntityTypes = function(p_obj)
{
   var _entityTypesClient = new CDialogFlow.EntityTypesClient();
   var _intentsClient = new CDialogFlow.IntentsClient();

   var _agentPath = _intentsClient.projectAgentPath( configs.GOOGLE_CLOUD_PROJECT_ID );

   var _req={
      parent : _agentPath
   };

   _entityTypesClient.listEntityTypes(_req)
   .then(
      function(p_responses){
         m_msgrInst.sendText( p_obj.sender_id, "Listing Entity Types JSON:" 
            + JSON.stringify(p_responses[0]) );
         log( "m_funcListAllEntityTypes(), Listing Entity Types:" 
            + JSON.stringify(p_responses[0]) );
      }
   )
   .catch(
      function(p_err){
         m_msgrInst.sendText( p_obj.sender_id, "Listing Entity Types Error:" + p_err );
         log( "m_funcListAllEntityTypes(), Listing Entity Types Error:" + p_err );
      }
   );
};

/**
 * @param {String} p_entityTypeName    the Entity Type Name not the Display Name
 * @param {*} p_obj 
 */
var m_funcGetEntityTypeByName = function(p_entityTypeName, p_obj)
{
   var _entityTypesClient = new CDialogFlow.EntityTypesClient();

   var _req={
      name:p_entityTypeName
   };

   _entityTypesClient.getEntityType(_req)
   .then
   (
      function(p_responses){
         log("m_funcGetEntityTypeByName(), Getting Entity Type:"
            + JSON.stringify(p_responses[0]) );
         m_msgrInst.sendText( p_obj.sender_id, "Getting Entity Type:"
            + JSON.stringify(p_responses[0]) );
         logEntityType(p_responses[0], p_obj);
      }
   )
   .catch
   (
      function(p_err){
         log( "m_funcGetEntityTypeByName(), Getting Entity Type Error:" + p_err );
         m_msgrInst.sendTextI( p_obj.sender_id, "Getting Entity Type Error" );
      }
   )
};

/**
 * @param {String} p_entityTypeId   can be retrieved when using the logEntity method
 * or from the Entity Type name, e.g. projects/u12-dbedb/agent/entityTypes/4209585a-e457-44af-80f2-fa0cefb3c18b
 * '4209585a-e457-44af-80f2-fa0cefb3c18b' is the ID
 */
var m_funcUpdateEntityType = function(p_entityTypeId, p_entityValue, p_obj)
{
   m_msgrInst.sendText( p_obj, "Updating Entity[" + p_entityTypeId + "] with value:" + p_entityValue );
   var _val='';
   var _arrSynonyms=[''];

   if( p_entityValue.indexOf( "=" )!==-1 ){
      var _arrVal = p_entityValue.split('=');
      _val =_arrVal[0];
      if( _arrVal[1].indexOf( "|" )!==-1 ){
         _arrSynonyms = _arrVal[1].split('|');
      }else{
         _arrSynonyms[0]=_arrVal[1];
      }
   }else{
      _val=p_entityValue;
      _arrSynonyms[0]=p_entityValue;
   }

   var _valObj={
      value:_val
      ,synonyms:_arrSynonyms
   };

   var _entityTypesClient = new CDialogFlow.EntityTypesClient();

   var _entityTypePath = _entityTypesClient.entityTypePath
   (
      configs.GOOGLE_CLOUD_PROJECT_ID
      , p_entityTypeId
   );

   var _entityTypeRequest={
      name: _entityTypePath
   };
   
   _entityTypesClient.getEntityType(_entityTypeRequest)
   .then
   (
      function(p_responses){
         var _entityType = p_responses[0];

         _entityType.entities.push( _valObj );

         var _req={
            entityType: _entityType
         };

         return _entityTypesClient.updateEntityType(_req);
      }
   )
   .then
   (
      function(p_responses){
         log("m_funcUpdateEntityType(), Updating Entity Type:"
            + JSON.stringify(p_responses[0]) );
         m_msgrInst.sendText( p_obj.sender_id
            , "Updating Entity Type:"
            + JSON.stringify(p_responses[0]) );
      }
   )
   .catch
   (
      function(p_responses){
         log("m_funcUpdateEntityType(), Updating Entity Type Error:" + p_err );
         m_msgrInst.sendText( p_obj.sender_id, "Updating Entity Type Error" );
      }
   );
};

module.exports=
{
   setMessenger                  : m_funcSetMessenger
   , createEntityType            : m_funcCreateEntityType
   , listAllEntityTypes          : m_funcListAllEntityTypes
   , getEntityTypeByName         : m_funcGetEntityTypeByName
   , updateEntityType            : m_funcUpdateEntityType
};