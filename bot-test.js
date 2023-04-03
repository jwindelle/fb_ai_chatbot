/**
*
*
*        BOT TEST
*
*
* This module is for testing functions ( like staging )
* if functions here works
* then
* they can be copied from here and transferred elsewhere
* for production purposes
*
* interconnecting functionalities for:
* 12u12 REST API
* 12u12 UTILITIES API
* Facebook
* Messenger
* Google Dialogflow ( TODO )
*
*
* @author   Jan Windelle Manalaysay
* @date     2018/04/19
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


var botCmdConstants           = require("./constants/keyword-commands");
var pageStatusCodes           = require("./constants/page-status-codes");
var genMessages               = require("./constants/general-messages");
var userConstants             = require("./constants/users");
var utils                     = require("./utils");

var m_tempUserData            = null;
var m_currSchedulerMessengerId= null;
var m_currAccessToken         = null;

var m_restApiInst             = null;
var m_msgrInst                = null;
var m_fbInst                  = null;
var m_dialogFlowInst          = null;
var m_schedulerInst           = null;
var m_chatbotDbApiInst        = null;

//==========================================================
//    PRIVATE METHODS
function log(p_msg)
{
   console.log("bot-test module::" + p_msg);
}

/*function getUserDataById(p_12u12Id, p_callback)
{
   m_restApiInst.getUserDataById
   (
      p_12u12Id
      , function(p_userData)
      {
         // TODO:
         // handle page errors 
         p_callback(p_userData); 
      }
   );
}*/

function getRandomizedEmail(p_obj)
{
   return p_obj.sender_id.toString()+"@"+p_obj.sender_id.toString()+Date.now().toString()+".com";
}

function resetTempUserData()
{
   m_tempUserData = Object.create(m_restApiInst.StructNewUser);
}

function generateDummyUserData(p_obj)
{
   resetTempUserData();

   //var _val                      = Date.now().toString();

   var _date = new Date( "09/01/2000 00:00:00" );
   var _ms = _date.getTime();

   var _val                      = p_obj.sender_id.toString();
   m_tempUserData.email          = getRandomizedEmail(p_obj);
   m_tempUserData.password       = _val;
   m_tempUserData.first_name     = _val;
   m_tempUserData.last_name      = _val;
   m_tempUserData.birthday       = Date.now();//Date.parse( "March 21, 2012" ).toString();

   m_msgrInst.getPromiseUserInfoByMessengerId(p_obj.sender_id)
   .then
   (
      function(p_messengerUser)
      {
         if(p_messengerUser!==null)
         {
            m_tempUserData.first_name  = p_messengerUser.first_name;
            m_tempUserData.last_name   = p_messengerUser.last_name;
         }

         m_msgrInst.sendText( p_obj.sender_id, JSON.stringify(m_tempUserData) );
      }
   );
}

function register12u12User(p_obj)
{
   m_msgrInst.sendText( p_obj.sender_id, "Registering New User:" + JSON.stringify(m_tempUserData) );
   m_restApiInst.registerUser
   (
      m_tempUserData
      , function(p_statusCode, p_data)
      {
         if(p_statusCode===pageStatusCodes.STATUS_CREATED)
         {
            m_msgrInst.sendText( p_obj.sender_id, "Success Registering User:" + JSON.stringify(p_data) );
         }
         else
         {
            m_msgrInst.sendText( p_obj.sender_id, "Registering User Error:" + JSON.stringify(p_data) );
            log("add12u12User(), error:" + p_data);
         }
      }
   );
}

function authenticate12u12User(p_obj)
{
   m_msgrInst.sendText( p_obj.sender_id, "Authenticating User");

   var _arrUserData = p_obj.msg.split('|');
   m_restApiInst.authenticateUser
   (
      _arrUserData[1]   // 12u12 user email
      ,_arrUserData[2]  // 12u12 user password
      ,function(p_resCode, p_data)
      {
         if(p_resCode===pageStatusCodes.STATUS_OK)
         {
            m_msgrInst.sendText( p_obj.sender_id, "Success Authenticating User:" + JSON.stringify(p_data) );
            log("authenticate12u12User(), p_data:" + JSON.stringify(p_data) );
            m_currAccessToken = p_data.access_token;
         }
         else
         {
            m_msgrInst.sendText( p_obj.sender_id, "Authenticating User Error:" + JSON.stringify(p_data) );
            log("authenticate12u12User(), error:" + JSON.stringify(p_data) );
         }
      }
   );
}

function update12u12User(p_obj)
{
   var _arrUserData = p_obj.msg.split('|');

   var _userId    = _arrUserData[1];
   var _authToken = _arrUserData[2];
   var _data      = _arrUserData[3];

   m_msgrInst.sendText( p_obj.sender_id, "Updating User with Access Token:" + _authToken );
   m_msgrInst.sendText( p_obj.sender_id, "Updating User Data:" + _data );

   m_restApiInst.updateUser
   (
      _userId
      , _authToken
      , JSON.parse(_data)
      , function(p_statusCode, p_data)
      {
         if(p_statusCode===pageStatusCodes.STATUS_OK)
         {
            m_msgrInst.sendText( p_obj.sender_id, "Success Updating User:" + JSON.stringify(p_data) );
         }
         else
         {
            m_msgrInst.sendText( p_obj.sender_id, "Updating User Error:" + JSON.stringify(p_data) );
            log("add12u12User(), error:" + JSON.stringify(p_data) );
         }
      }
   );
}

function delete12u12User(p_obj)
{
   var _arrUserData = p_obj.msg.split(',');
   if( _arrUserData.length<3 )
   {
      m_msgrInst.sendText( p_obj.sender_id, "you have a missing parameter" );
   }
   else
   {
      var _12u12UserId  = _arrUserData[1];
      var _authToken    = _arrUserData[2];

      m_msgrInst.sendText( p_obj.sender_id, "deleting user");
      m_restApiInst.updateUser
      (
         _12u12UserId
         ,_authToken
         ,function(p_resCode, p_data)
         {
            if(p_resCode===pageStatusCodes.STATUS_OK)
            {
               m_msgrInst.sendText( p_obj.sender_id, "success deleting user" );
            }
            else
            {
               m_msgrInst.sendText( p_obj.sender_id, "error authenticating user!" );
               log("delete12u12User(), error:" + JSON.stringify(p_data) );
            }
         }
      );
   }
}

function onSchedulerUpdate(p_timeSinceStarted)
{
   m_msgrInst.sendText( m_currSchedulerMessengerId, "Minutes Since Started:" + p_timeSinceStarted );
}

function printHelp(p_obj)
{
   m_msgrInst.sendText( p_obj.sender_id, botCmdConstants.KEY_GENERATE_DUMMY_USER + ":to generate a dummy data for user registration" );
   m_msgrInst.sendText( p_obj.sender_id, botCmdConstants.KEY_REGISTER_USER + ":to register a new user from the generated dummy data" );
   m_msgrInst.sendText( p_obj.sender_id, botCmdConstants.KEY_AUTHENTICATE_USER + "|EMAIL|PASSWORD" + ":to get a token" );
   m_msgrInst.sendText( p_obj.sender_id, botCmdConstants.KEY_UPDATE_USER + "|USER_REG_ID|ACCESS_TOKEN|JSON_OBJECT" + ":to update a user record" );
   m_msgrInst.sendText( p_obj.sender_id, botCmdConstants.KEY_CRON_START + ":to start cron timer" );
   m_msgrInst.sendText( p_obj.sender_id, botCmdConstants.KEY_CRON_STOP + ":to stop cron timer" );
   m_msgrInst.sendText( p_obj.sender_id, botCmdConstants.KEY_BOT_USER_EXISTING + ":to check if your messenger account is already registered to 12u12" );
   m_msgrInst.sendText( p_obj.sender_id, botCmdConstants.KEY_BOT_USER_REGISTER + ":to save a new tied account in the db using current messenger account" );
   m_msgrInst.sendText( p_obj.sender_id, botCmdConstants.KEY_BOT_USER_UPDATE_TIMESTAMP + ":to update timestamp using current messenger account" );
   m_msgrInst.sendText( p_obj.sender_id, botCmdConstants.KEY_BOT_MESSENGER_IDS + ":to get all tied up messenger account IDs" );
   m_msgrInst.sendText( p_obj.sender_id, botCmdConstants.KEY_BOT_USER_DELETE + ":to delete a user by messenger ID" );
}

// BOT
function botRandomResponse(p_obj)
{
   m_msgrInst.sendText( p_obj.sender_id, "fetching randomized bot response..." );
   m_chatbotDbApiInst.getBotResponses
   (
      function(p_arr)
      {
         log( "botRandomResponse(), p_arr:" + JSON.stringify(p_arr) );
         var _botResp = p_arr[Math.floor(Math.random() * p_arr.length)];
         m_msgrInst.reply( p_obj.sender_id, _botResp );
      }
   );
}

function botCheckIfUserExists(p_obj)
{
   m_msgrInst.sendText( p_obj.sender_id, "checking if user " + p_obj.sender_id + " already have already tied an account..." );
   m_chatbotDbApiInst.getUserByMessengerId
   (
      p_obj.sender_id
      , function(p_retVal)
      {
         log( "botCheckIfUserExists(), p_retVal:" + JSON.stringify(p_retVal) );
         if(p_retVal!=null){
            m_msgrInst.sendText( p_obj.sender_id, genMessages.MSG_MESSENGER_ACCOUNT_LINKED );
         }else{
            m_msgrInst.sendText( p_obj.sender_id, genMessages.MSG_MESSENGER_ACCOUNT_UNLINKED );
         }
      }
   );
}

function botRegisterNewUser(p_obj)
{
   m_msgrInst.sendText( p_obj.sender_id, "linking messenger user " + p_obj.sender_id +" ..." );

   var _newUser = Object.create( m_chatbotDbApiInst.StructUser );
      _newUser.messenger_id = p_obj.sender_id.toString();

   m_chatbotDbApiInst.addNewUser
   (
      _newUser
      , function(p_iRetVal)
      {
         log("botRegisterNewUser(), p_iRetVal:" + p_iRetVal);
         if(p_iRetVal==1){
            m_msgrInst.sendText( p_obj.sender_id, "linking account success" );
         }else{
            m_msgrInst.sendText( p_obj.sender_id, genMessages.MSG_FACEBOOK_LOGIN_ALREADY );
         }
      }
   );
}

function botUpdateUserTimestamp(p_obj)
{
   m_msgrInst.sendText( p_obj.sender_id, "updating user timestamp..." );
   m_chatbotDbApiInst.updateOffsetTimestampByMessengerId
   (
      p_obj.sender_id
      , utils.getCurrentTimestampWithOffset( userConstants.TIMESTAMP_OFFSET )
      , function(p_iRetVal)
      {
         log("botUpdateUserTimestamp(), p_iRetVal:" + p_iRetVal);
         if(p_iRetVal==1){
            m_msgrInst.sendText( p_obj.sender_id, "updating offset timestamp success" );
         }else{
            m_msgrInst.sendText( p_obj.sender_id, "updating offset timestamp failed" );
         }
      }
   );
}

function botGetAllMessengerUserIds(p_obj)
{
   m_msgrInst.sendText( p_obj.sender_id, "getting all messenger user ids..." );
   m_chatbotDbApiInst.getAllMessengerIds
   (
      function(p_arrRetVal){
         log("botGetAllMessengerUserIds(), p_arrRetVal:" + JSON.stringify(p_arrRetVal) );
         if(p_arrRetVal!==null){
            m_msgrInst.sendText( p_obj.sender_id, "messenger IDs array length:" + p_arrRetVal.length );
            for(var i=0; i<p_arrRetVal.length; i++){
               m_msgrInst.sendText( p_obj.sender_id, "messenger User:" + JSON.stringify(p_arrRetVal[i]) );
            }
         }else{
            m_msgrInst.sendText( p_obj.sender_id, "getting of all messenger user ids failed" );
         }
      }
   );
}

function botDeleteUser(p_obj)
{
   m_msgrInst.sendText( p_obj.sender_id, "unlinking messenger user " + p_obj.sender_id +" ..." );
   m_chatbotDbApiInst.deleteUserByMessengerId
   (
      p_obj.sender_id
      , function(p_iRetVal){
         log("botDeleteUser(), p_iRetVal:" + p_iRetVal);
         if(p_iRetVal==1){
            m_msgrInst.sendText( p_obj.sender_id, genMessages.MSG_MESSENGER_ACCOUNT_UNLINKED );
         }else{
            m_msgrInst.sendText( p_obj.sender_id, "unlinking account failed" );
         }
      }
   );
}

//==========================================================
//    PUBLIC METHODS
var m_funcSet12u12RestApi = function(m_12u12RestApiInstance)
{
   log("m_funcSet12u12RestApi()");
   m_restApiInst = m_12u12RestApiInstance;
};

var m_funcSetMessenger = function(p_msgrInstance)
{
   log("setMessenger()");
   m_msgrInst = p_msgrInstance;
};

var m_funcSetFacebook = function(p_facebookInstance)
{
   m_fbInst = p_facebookInstance;
};

var m_funcSetDialogFlow = function(p_dialogFlowInst)
{
   m_dialogFlowInst = p_dialogFlowInst;
};

var m_funcSetScheduler = function(p_schedulerInst)
{
   m_schedulerInst = p_schedulerInst;
   m_schedulerInst.registerOnUpdateCallbackFunction( onSchedulerUpdate );
};

var m_funcSetChatbotDbApi = function(p_chatbotDbApiInst)
{
   m_chatbotDbApiInst = p_chatbotDbApiInst;
};



var m_funcMessengerMessageReceived = function(p_obj)
{
   log("onMsgrMsgReceived(), " + JSON.stringify(p_obj) );

   //=========================================================================
   // 12u12 API
   if( p_obj.msg.indexOf( botCmdConstants.KEY_GENERATE_DUMMY_USER )!==-1 )
   {
      generateDummyUserData(p_obj);
   }
   else if( p_obj.msg.indexOf( botCmdConstants.KEY_REGISTER_USER )!==-1 )
   {
      register12u12User(p_obj);
   }
   else if( p_obj.msg.indexOf( botCmdConstants.KEY_AUTHENTICATE_USER )!==-1 )
   {
      authenticate12u12User(p_obj);
   }
   else if( p_obj.msg.indexOf( botCmdConstants.KEY_UPDATE_USER )!==-1 )
   {
      update12u12User(p_obj);
   }
   else if( p_obj.msg.indexOf( botCmdConstants.KEY_DELETE_USER )!==-1 )
   {
      delete12u12User(p_obj);
   }
   //=========================================================================
   // MESSENGER
   else if( p_obj.msg.indexOf( botCmdConstants.KEY_MESSENGER_UNLINK_BUTTON )!==-1 )
   {
      m_msgrInst.showAccountUnlinkButton(p_obj.sender_id, genMessages.MSG_MESSENGER_ACCOUNT_UNLINK);
   }
   else if( p_obj.msg.indexOf( botCmdConstants.KEY_MESSENGER_LINK_BUTTON )!==-1 )
   {
      m_msgrInst.showAccountLinkButton(p_obj.sender_id, genMessages.MSG_MESSENGER_ACCOUNT_LINK, m_fbInst.APP_CLIENT_LOGIN_URL );
   }
   else if( p_obj.msg.indexOf( botCmdConstants.KEY_MESSENGER_USER_INFO )!==-1 )
   {
      m_msgrInst.getMessengerUserInfoByMessengerId
      (
         p_obj.sender_id
         , function(p_returnValue)
         {
            m_msgrInst.sendText( p_obj.sender_id, p_returnValue );
         }
      );
   }
   //=========================================================================
   // CRON
   else if( p_obj.msg.indexOf( botCmdConstants.KEY_CRON_START )!==-1 )
   {
      m_currSchedulerMessengerId = p_obj.sender_id;
      m_msgrInst.sendText( p_obj.sender_id, "starting scheduler" );
      m_schedulerInst.start();
   }
   else if( p_obj.msg.indexOf( botCmdConstants.KEY_CRON_STOP )!==-1 )
   {
      m_currSchedulerMessengerId = p_obj.sender_id;
      m_msgrInst.sendText( p_obj.sender_id, "stopping scheduler" );
      m_schedulerInst.stop();
   }
   else if( p_obj.msg.indexOf( botCmdConstants.KEY_CRON_RESET )!==-1 )
   {
      m_msgrInst.sendText( p_obj.sender_id, "resetting scheduler time" );
      m_schedulerInst.reset();
   }
   //=========================================================================
   // BOT API
   else if( p_obj.msg.indexOf( botCmdConstants.KEY_BOT )!==-1 ){
      botRandomResponse( p_obj );
   }else if( p_obj.msg.indexOf( botCmdConstants.KEY_BOT_USER_EXISTING )!==-1 ){
      botCheckIfUserExists(p_obj);
   }else if( p_obj.msg.indexOf( botCmdConstants.KEY_BOT_USER_REGISTER )!==-1 ){
      botRegisterNewUser(p_obj);
   }else if( p_obj.msg.indexOf( botCmdConstants.KEY_BOT_USER_UPDATE_TIMESTAMP )!==-1 ){
      botUpdateUserTimestamp(p_obj);
   }else if( p_obj.msg.indexOf( botCmdConstants.KEY_BOT_MESSENGER_IDS )!==-1 ){
      botGetAllMessengerUserIds(p_obj);
   }else if( p_obj.msg.indexOf( botCmdConstants.KEY_BOT_USER_DELETE )!==-1 ){
      botDeleteUser(p_obj);
   }
   //=========================================================================
   // MISC
   else if( p_obj.msg.indexOf( botCmdConstants.KEY_DATE_NOW )!==-1 )
   {
      m_msgrInst.sendText(p_obj.sender_id, m_restApiInst.getCurrentDate() );
   }
   else if( p_obj.msg.indexOf( botCmdConstants.KEY_HELP )!==-1 )
   {
      printHelp( p_obj );
   }

   else
   {
      //m_msgrInst.sendText( p_obj.sender_id, genMessages.MSG_NO_COMMAND );
      if( m_dialogFlowInst!=null )
      {
         m_dialogFlowInst.getResponseFromQuery
         ( 
            p_obj,
            function(p_response){
               m_msgrInst.sendText( p_obj.sender_id, p_response );
            }
         );
      }
      else
      {
         printHelp( p_obj );
      }
   }
};



module.exports =
{
   set12u12RestApi         :  m_funcSet12u12RestApi
   , setMessenger          :  m_funcSetMessenger
   , setFacebook           :  m_funcSetFacebook
   , setDialogFlow         :  m_funcSetDialogFlow
   , setScheduler          :  m_funcSetScheduler
   , setChatbotDbApi       :  m_funcSetChatbotDbApi
   , onMsgrMsgReceived     :  m_funcMessengerMessageReceived
};