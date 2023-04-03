/**
*
*
*        CHATBOT DB REST API MODULE
*        This is a separate db for handling of tied up accounts for messenger, facebook and 12u12 users
*
*
*
* @author   Jan Windelle Manalaysay
* @date     2018/06/20
* @email    jan.manalaysay@12u12.com
**/

/*jslint devel: true */
/*global
alert, confirm, console, prompt, process, require, arguments, log
*/
/*jslint indent: false */
/*jslint white: true */
/*jslint node: true */

'use strict';

const DB_NAME                                = process.env.MONGO_DB_NAME;

const DB_URI                                 = process.env.MONGO_DB_36_URI;
const messengerLanguageCodes                 = require('../messenger/constants/MessengerLocales');

// DATABASE NAMES
const DB_COLL_RESP                           = "collection_responses";
const DB_COLL_MSGS                           = "collection_messages";
const DB_COLL_USERS                          = "collection_users";
const DB_COLL_TASKS                          = "collection_tasks";

var mongoClient                              = require('mongodb').MongoClient;
var m_client;// this is needed just in case you want to change collection
var m_db;

mongoClient.connect
(
   DB_URI
   , { useNewUrlParser: true }
   , function(p_err, p_client)
   {
      if(!p_err)
      {
         m_db = p_client.db(DB_NAME);
         console.log("chatbot-db-api::mongoclient.connect SUCCESS");
         //console.log("chatbot-db-api::mongoclient.connect db:"+m_db);
         //var m_coll = m_db.collection(DB_COLL_USERS);
         //console.log("chatbot-db-api::mongoclient.connect collection:"+m_coll);
      }
      else
      {
         console.log("chatbot-db-api::mongoclient.connect ERROR:" + p_err);
      }
   } 
);

//==========================================================
//    STRUCTURES
const StructMessageObject=
{
   sender_id   :  ""
   ,timestamp  :  ""
   , msg       :  ""
};

const StructBotResponseObject=
{
   text        :  ""
   ,imageUrl   :  ""
};

// when using this Struct
// use the 'Object.create( StructUser )' method
// to return a new instance of this object
// thus to prevent errors of one copy of this Struct
const StructUser=
{
   user_id           :  ""// 12u12 ID
   ,email            :  ""
   ,facebook_id      :  ""
   ,messenger_id     :  ""
   ,first_name       :  ""
   ,last_name        :  ""
   ,offset_timestamp :  0
   ,notification     :  1// 1:ON, 0:OFF
   ,locale           :  messengerLanguageCodes.DEF
   ,timezone         :  0 // -24 to 24
};
const StructMessengerUser={
   messenger_id:""//key name is based on StructUser
};
const StructMessengerFindFilter={
   _id:0//to not include the _id field to the returned result
   ,messenger_id:1
};

// For Amazon Transcribe
const StructTask=
{
   task_id              :  ""
   , messenger_id      :  ""
};
const StructTaskFindFilter={
   _id:0
   ,task_id:1
   ,messenger_id:1
};

//==========================================================
//    PRIVATE METHODS
function log(p_string)
{
   console.log("chatbot-api module::" + p_string);
}

//==========================================================
//    PUBLIC METHODS
/**
 * @param {Function} p_callback  CallbackFunction( StructBotResponseObject )
 */
var m_funcGetBotResponses = function(p_callback)
{
   m_db.collection(DB_COLL_RESP).find().toArray
   (
      function(p_err, p_arrDocs)
      {
         if(p_err){
            log("Failed retrieving documents from " + DB_COLL_RESP);
         }else{
            log("Success retrieving documents from " + DB_COLL_RESP);
            p_callback(p_arrDocs);
         }
      }
   );
};

/**
 * @param {StructMessageObject} p_object 
 */
var m_funcInsertMessageObject = function(p_object)
{
   m_db.collection(DB_COLL_MSGS).insertOne
   (
      p_object
      , function(p_err, p_res)
      {
         if(p_err){
            log("Error inserting a record");
         }else{
            log("Success inserting new record");
         }
      }
   );
};

/**
 * Check to see if a the user id is already existing in the db or not
 * 
 * @param {String}   p_messengerId
 * @param {Function} p_callback CallbackFunction( StructUser means existing or null for error or non-existing )
 */
var m_funcGetUserByMessengerId = function(p_messengerId, p_callback)
{
   log( "m_funcGetUserByMessengerId(), p_messengerId:" + p_messengerId);
   var _query = StructMessengerUser;
      _query.messenger_id = p_messengerId;

   m_db.collection(DB_COLL_USERS).findOne
   (
      _query
      , function( p_err, p_res ){
         if(!p_err){
            log( "m_funcGetUserByMessengerId(), Returned Value:" + JSON.stringify(p_res) );
            p_callback( p_res );
         }else{
            log( "m_funcGetUserByMessengerId(), Error:" + p_err );
            p_callback( null );
         }
      }
   );
};
/**
 * @param {String} p_messengerId
 * @returns {Object} StructUser
 */
var m_funcPromiseUserInfoByMessengerId = function(p_messengerId)
{
   return new Promise
   (
      function(funcResolve, funcReject)
      {
         var _query = StructMessengerUser;
            _query.messenger_id = p_messengerId;

         m_db.collection(DB_COLL_USERS).findOne
         (
            _query
            , function( r_err, r_dat ){
               if(!r_err){
                  funcResolve( r_dat );
               }else{
                  funcReject( r_err );
               }
            }
         );
      }
   );
};


/**
 * @param {StructUser} p_userObject
 * @param {Function} p_callback        CallbackFunction( 1 for success or 0 for error )
 */
var m_funcAddNewUser = function(p_userObject, p_callback)
{
   m_funcGetUserByMessengerId
   (
      p_userObject.messenger_id
      , function(r_retVal){
         if(r_retVal===null)
         {
            m_db.collection(DB_COLL_USERS).insertOne
            (
               p_userObject
               , function( p_err, p_res ){
                  if(!p_err){
                     log( "m_funcAddNewUser(), Returned Value:" + JSON.stringify( p_res ) );
                     p_callback( 1 );
                  }else{
                     log( "m_funcAddNewUser(), Error:" + p_err );
                     p_callback( 0 );
                  }
               }
            );
         }else{
            log( "m_funcAddNewUser(), Messenger ID already exists in system or process error" );
         }
      }
   );
};

/** 
 * @param {String} p_messengerId 
 * @param {Number} p_offsetTimestamp
 * @param {Function} p_callback  CallbackFunction( 1 for success or 0 for error )
 */
var m_funcUpdateOffsetTimestampByMessengerId = function(p_messengerId, p_offsetTimestamp, p_callback)
{
   var _query  = { messenger_id : p_messengerId };
   var _newVal = { $set:{ offset_timestamp:p_offsetTimestamp } };
   try
   {
      m_db.collection(DB_COLL_USERS).updateOne
      (
         _query
         , _newVal
         , function( p_err, p_res ){
            if( !p_err ){
               log( "m_funcUpdateOffsetTimestampByMessengerId(), Returned Value:" + JSON.stringify(p_res) );
               p_callback( 1 );
            }else{
               log( "m_funcUpdateOffsetTimestampByMessengerId(), Error:" + p_err );
               p_callback( 0 );
            }
         }
      );
   }catch(err){
      // might be m_db is not yet ready
   }
};

// Reference:
// https://www.w3schools.com/nodejs/nodejs_mongodb_find.asp
// https://docs.mongodb.com/manual/tutorial/project-fields-from-query-results/   //for project
/**
 * @param {Function} p_callback CallbackFunction( JSON Array or null )
 */
var m_funcGetAllMessengerIds = function(p_callback)
{
   try
   {
      m_db.collection(DB_COLL_USERS).find({}).project(StructMessengerFindFilter).toArray
      (
         function(p_err, p_res)
         {
            if(!p_err){
               log( "m_funcGetAllMessengerIds(), Returned Value:" + JSON.stringify(p_res) );
               p_callback( p_res );
            }else{
               log( "m_funcGetAllMessengerIds(), Error:" + p_err );
               p_callback( null );
            }
         }
      );
   }
   catch(err)
   {
      // db is not yet ready
      p_callback( null );
   }
};

/**
 * @param {String} p_messengerId 
 * @param {Function} p_callback CallbackFunction( 1 for success or 0 for failed )
 */
var m_funcDeleteUserByMessengerId = function(p_messengerId, p_callback)
{
   var _query  = { messenger_id : p_messengerId };

   m_db.collection(DB_COLL_USERS).deleteOne
   (
      _query
      , function( p_err, p_res )
      {
         if( !p_err ){
            log( "m_funcDeleteUserByMessengerId(), Returned Value:" + JSON.stringify(p_res) );
            p_callback( 1 );
         }else{
            log( "m_funcDeleteUserByMessengerId(), Error:" + p_err );
            p_callback( 0 );
         }
      }
   );
};

/**
 * @param {String} p_messengerId 
 * @param {Int8Array} p_iToggleValue 1 means on and 0 means off
 * @param {Function} p_callback CallbackFunction( 1 for success or 0 for failed )
 */
var m_funcSetNotification = function(p_messengerId, p_iToggleValue, p_callback)
{
   var _query  = { messenger_id : p_messengerId };
   var _newVal = { $set:{ notification:p_iToggleValue } };

   m_db.collection(DB_COLL_USERS).updateOne
   (
      _query
      , _newVal
      , function( p_err, p_res ){
         if( !p_err ){
            log( "m_funcSetNotification(), Returned Value:" + JSON.stringify(p_res) );
            if( JSON.parse(p_res).n===1 ){
               p_callback( 1 );
            }else{
               p_callback( 0 );
            }
         }else{
            log( "m_funcSetNotification(), Error:" + p_err );
            p_callback( 0 );
         }
      }
   );
};

/**
 * @param {Function} p_callback        CallbackFunction( 1 for success or 0 for error )
 */
var m_funcAddTask = function(p_taskId, p_messengerId, p_callback)
{
   var _params = Object.create( StructTask );
      _params.task_id = p_taskId;
      _params.messenger_id = p_messengerId;

   m_db.collection(DB_COLL_TASKS).insertOne
   (
      _params
      , function( p_err, p_res ){
         if(!p_err){
            log( "m_funcAddTask(), Returned Value:" + JSON.stringify( p_res ) );
            p_callback( 1 );
         }else{
            log( "m_funcAddTask(), Error:" + p_err );
            p_callback( 0 );
         }
      }
   );
};

/**
 * This functions purpose if for checking background tasks
 * e.g. using AWS's Lex Service w/c has transcribing tasks that needs to be check from time to time
 * 
 * @param {Function} p_callback CallbackFunction( JSON Array or null )
 */
var m_funcGetAllTasks = function(p_callback)
{
   m_db.collection(DB_COLL_TASKS).find({}).project(StructTaskFindFilter).toArray
   (
      function(p_err, p_res)
      {
         if(!p_err){
            //log( "m_funcGetAllTasks(), Returned Value:" + JSON.stringify(p_res) );
            p_callback( p_res );
         }else{
            log( "m_funcGetAllTasks(), Error:" + p_err );
            p_callback( null );
         }
      }
   );
};

/**
 * 
 * @param {String} p_transactionId 
 * @param {Function} p_callback ( 1 for success or 0 for error )
 */
var m_funcDeleteTask = function(p_transactionId)
{
   var _query  = { task_id : p_transactionId };

   m_db.collection(DB_COLL_TASKS).deleteOne
   (
      _query
      , function( p_err, p_res )
      {
         if( p_err ){
            log( "m_funcDeleteTask(), Error:" + p_err );
         }
      }
   );
};


module.exports =
{
   StructUser                             :  StructUser
   , getBotResponses                      :  m_funcGetBotResponses
   , insertMessageObject                  :  m_funcInsertMessageObject
   , getUserByMessengerId                 :  m_funcGetUserByMessengerId
   , promiseUserInfoByMessengerId         :  m_funcPromiseUserInfoByMessengerId
   , addNewUser                           :  m_funcAddNewUser
   , updateOffsetTimestampByMessengerId   :  m_funcUpdateOffsetTimestampByMessengerId
   , getAllMessengerIds                   :  m_funcGetAllMessengerIds
   , deleteUserByMessengerId              :  m_funcDeleteUserByMessengerId
   , setNotification                      :  m_funcSetNotification
   // For AWS Transcribe
   , addTask                              :  m_funcAddTask
   , getAllTasks                          :  m_funcGetAllTasks
   , deleteTask                           :  m_funcDeleteTask
};