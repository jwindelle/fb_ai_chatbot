/*
*  Starting Point
*
*  @author  Jan Windelle Manalaysay
*  @email   jan.manalaysay@12u12.com
*  @date    2017/12/20
*
*  NOTE:
*  keep in mind that even when requiring a file within the same dir
*  the directory reference should still start with './'
*
*  TODO:
*  #GOOGLE DIALOGFLOW
*  1. handle the Fulfillment Webhook functions elsewhere
*  2. think if its much better to create a callback function when detecting intent of a query? detecting intent of an event?
*
*  #MESSENGER
*  1. handle the Postback Payload handler function elsewhere
*
*  #FRONTEND
*  1. refactor code for signup of new user
*
*  #DIALOGFLOW
*  create a handler module
*/

'use strict';

// Additionals are added to the console.log method
// so that a timestamp will be included with it
var log = console.log;
//console.log = function (){log.apply(console, [Date.now()].concat(arguments));};
console.log = function (){log.apply(console, [new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')].concat(arguments));};


const PORT                                         = process.env.PORT || 5000;

var express                                        =  require('express');
var request                                        =  require('request');
var bodyParser                                     =  require('body-parser');

const pageStatusCodes                              =  require("./constants/page-status-codes");
const CommandKeys                                  =  require("./constants/keyword-commands");
const msgConstants                                 =  require("./constants/general-messages");
const urlConstants                                 =  require("./constants/urls");
const urlParamNames                                =  require("./constants/urlParamNames");
const urlParamConstants                            =  require('./constants/urlParams');
const userConstants                                =  require('./constants/users');
const buttonNameConstants                          =  require('./constants/button-names');

// 12u12 Customizable Constants
const DialogflowCustomActions                      =  require('./12u12/constants/DialogFlowActions');
const DialogflowCustomEvents                       =  require('./12u12/constants/DialogFlowEvents');
const DialogflowCustomParameters                   =  require('./12u12/constants/DialogFlowParams');
const DialogflowCustomScripting                    =  require('./12u12/constants/DialogFlowScripting');
const MessengerPostbackPayloads                    =  require('./12u12/constants/MessengerPostbackPayloadValues');
const PayloadKeys                                  =  require('./12u12/constants/PayloadKeys');
const PayloadMap                                   =  require('./12u12/constants/PayloadsMap');
const MessengerQuickReplyButtonNames               =  require('./12u12/constants/MessengerQuickReplyButtonNames');

var app                    = express();
   app.use(bodyParser.urlencoded({ extended: false }));
   app.use(bodyParser.json());

var restApi                = require('./12u12/restapi');
   restApi.initialize(app, request);

var frontEnd               = require('./12u12/frontend');
   frontEnd.initialize(app, request);

var bodyMap                = require('./12u12/body-map-route');
   bodyMap.initialize(app, request);

var messenger              = require('./messenger/messenger');
   messenger.initialize(app, request);

var fb_login               = require('./facebook/facebook_routes');
   fb_login.initialize(app,request);
   fb_login.setMessenger(messenger);
   fb_login.set12u12RestApi(restApi);

var scheduler              = require('./scheduler');

var utilsApi               = require('./12u12/utilities_api');
   utilsApi.initialize(app,request);

var dialogFlow             = require('./google/dialogflow');
   dialogFlow.setMessenger(messenger);
   dialogFlow.initialize( app, request );
var transcriber            = require('./google/google-cloud-speech');

var chatbotDbApi           = require('./12u12/chatbot-db-api');

var botTest                = require('./bot-test');
   botTest.setMessenger(messenger);
   botTest.set12u12RestApi(restApi);
   botTest.setFacebook(fb_login);
   botTest.setDialogFlow( dialogFlow );
   botTest.setScheduler(scheduler);
   botTest.setChatbotDbApi(chatbotDbApi);

// 12u12 Custom handlers
var customBodyMapHandler   = require('./12u12/handlers/BodyMapHandler');
   customBodyMapHandler.setRestApi(restApi);
   customBodyMapHandler.setMessenger(messenger);
const conversationHandler  = require('./12u12/handlers/ConversationFlow');
   conversationHandler.setMessenger(messenger);

var utils                  = require( './utils' );

//==========================================================
//    VARIABLES
var isSignupDummy=false;
var m_arrCachedCountryCityList = null;
//==========================================================
//#region COMMON FUNCTIONS
function updateCountryCityList(){
   restApi.getCountryCityList(function(p_statusCode, p_list){
      if(p_statusCode!==pageStatusCodes.STATUS_ERROR){
         m_arrCachedCountryCityList = p_list;
      }
   });
}
/** 
 * @param {Number} p_iToggleValue ( 1 is On and 0 is Off )
 */
function setNotification(p_messengerId, p_iToggleValue){
   chatbotDbApi.setNotification(
      p_messengerId
      , p_iToggleValue
      , function(r_iRetVal){
         if(r_iRetVal===1){
            var _msg = (p_iToggleValue==1)?msgConstants.MSG_CRON_USER_STARTED:msgConstants.MSG_CRON_USER_STOPPED;
            messenger.sendText( p_messengerId, _msg );
         }else{
            messenger.sendText( p_messengerId, msgConstants.MSG_ERROR_ACCOUNT );
            showMessengerLoginButton( p_messengerId );
         }
      }
   );
}
function showBowelMovement(p_messengerId, p_headerTitle)
{
   log( "showBowelMovement(), p_messengerId="+p_messengerId );
   var _sQuickReplyTxt = require('./messenger/structures/MessengerQuickReplyTypeStructures').StuctText;
   var _arr=[];
   for(var i=0; i<7; i++ )
   {
      var _numberString = (i+1).toString();
      var _obj = Object.assign({},_sQuickReplyTxt);
         _obj.title=_numberString;
         _obj.payload=_numberString;
         _obj.image_url=urlConstants.URL_IMAGES_BASE+"/poop_"+_numberString+".jpg";
      _arr.push( _obj );
   }
   messenger.sendQuickReplies(p_messengerId,p_headerTitle,_arr);
}
//#endregion COMMON FUNCTIONS
//==========================================================
//#region CHATBOT DB API
function registerNewUser(p_tutuId, p_userEmail, p_messengerId, p_facebookId){
   messenger.getMessengerUserInfoByMessengerId(p_messengerId, function( r_userInfo ){
      if( r_userInfo!==null )
      {
         var _newUsr = Object.create(chatbotDbApi.StructUser);
            _newUsr.user_id=p_tutuId;
            _newUsr.email=p_userEmail;
            _newUsr.messenger_id=p_messengerId;
            _newUsr.facebook_id=p_facebookId;
            _newUsr.offset_timestamp=utils.getCurrentTimestampWithOffset( userConstants.TIMESTAMP_OFFSET );
            _newUsr.locale = r_userInfo.locale;
            _newUsr.timezone = r_userInfo.timezone;
            _newUsr.last_name = r_userInfo.last_name;
            _newUsr.first_name = r_userInfo.first_name;
         
         chatbotDbApi.addNewUser(_newUsr, function(p_iRetVal){
            messenger.sendText( p_messengerId, msgConstants.MSG_SIGNUP_FINISHED );
         });
      }
   });
}
//#endregion CHATBOT DB API
//==========================================================
//#region FRONTEND
function signupNewUser(p_res, p_facebookUser, p_messengerUser)
{
   // check gender
   var _genderNum="0";
   if(p_facebookUser.gender!=null){
      _genderNum = utils.getGenderNumberFromString( p_facebookUser.gender );
   }
   // find the matched fb location from 12u12's addresses
   var _location="";
   if( p_facebookUser.location!=null && m_arrCachedCountryCityList!=null){
      _location = utils.getMatchedCountryCity(p_facebookUser.location.name, m_arrCachedCountryCityList);
   }
   // check email
   var _email="";
   if( p_facebookUser.emails!=null ){
      if(p_facebookUser.emails.length>0){
         _email = p_facebookUser.emails[0].value;
      }
   }else{//dummy data
      if(isSignupDummy){
         _email = p_messengerUser.id+"@"+utils.getCurrentTimestamp().toString()+".com";
      }
   }
   // check birthday
   var _birthYr      =  restApi.DEFAULT_YEAR_STRING;
   var _birthMonth   =  restApi.DEFAULT_MONTH_NUMBER_STRING;
   if( p_facebookUser.birthday!=null ){
      _birthYr = utils.getYearFromFacebookBirthdate(p_facebookUser.birthday);
      // TODO:
      // convert to number string
      _birthMonth = utils.getMonthFromFacebookBirthdate(p_facebookUser.birthday);
   }

   // redirecting by URL encoding the whole json object string
   var _newUser=Object.create(frontEnd.StructNewUser);
      _newUser.first_name=p_facebookUser.first_name;
      _newUser.last_name=p_facebookUser.last_name;
      _newUser.email=_email;
      _newUser.birthMonth=_birthMonth.toString();
      _newUser.birthYear=_birthYr;
      _newUser.gender=_genderNum.toString();
      _newUser.address=_location;
      _newUser.userid=p_messengerUser.id.toString();

   if(isSignupDummy){
      _newUser.password="Test123!";
      _newUser.passwordConfirm="Test123!";
   }

   var _json, _encryptedMidAndFbidPair;
   utils.getPromisedUrlSafeEncryptedString(JSON.stringify(_newUser))
   .then(function(r_encryptedJSON){
      _json = r_encryptedJSON;
      //return utils.getPromisedUrlSafeEncryptedString( p_messengerUser.id+"|"+p_facebookUser.id );
      return frontEnd.getPromisedEncryptedMessengerAndFacebookIdPair(p_messengerUser.id,p_facebookUser.id);
   })
   .then(function(r_encryptedMidAndFbidPair){
      //messenger.sendText( p_messengerUser.id, r_encryptedMidAndFbidPair );
      return utils.getPromisedUrlSafeEncryptedString(
         frontEnd.URL_SIGNUP_FINISHED_CALLBACK
         +"?"+frontEnd.URL_SIGNUP_PARAM_PAYLOAD_NAME+"="+r_encryptedMidAndFbidPair
      );
   })
   .then(function(r_encryptedRedirectUrl){
      var _finalUrl = urlConstants.URL_FRONTEND_BASE+frontEnd.URL_SIGNUP_ENDPOINT
         +"?"+frontEnd.URL_SIGNUP_PARAM_FORM
         +_json
         +"&"+frontEnd.URL_SIGNUP_PARAM_REDIRECT_URL
         +r_encryptedRedirectUrl;

      //messenger.sendText( p_messengerUser.id, _finalUrl );

      p_res.redirect(_finalUrl);
   });
}
function onSignupFinished(p_view, p_messengerId, p_facebookId, p_tutuId, p_userEmail)
{
   //log( "onSignupFinished(), p_messengerId="+p_messengerId+"&p_facebookId="+p_facebookId+"&p_tutuId="+p_tutuId+"&p_userEmail=" +p_userEmail );
   messenger.getPromiseUserInfoByMessengerId(p_messengerId)
   .then(function(r_structUsr){
      if(r_structUsr.error!==undefined){
         p_view.status(pageStatusCodes.STATUS_ERROR).send(msgConstants.MSG_PAGE_STATUS_ERROR);
      }else{
         registerNewUser(p_tutuId,p_userEmail,p_messengerId,p_facebookId);
         p_view.redirect( messenger.getCloseWebViewRedirectUrl() );
      }
   })
}
frontEnd.registerOnSignupFinishedCallbackFunction( onSignupFinished );
//#endregion FRONTEND
//==========================================================
//#region FACEBOOK
function onFacebookAuthorize(p_view, p_messengerId)
{
   log( "onFacebookAuthorize()" );
   chatbotDbApi.getUserByMessengerId(p_messengerId, function(p_user)
   {
      if(p_user===null){
         fb_login.authorize(p_view, p_messengerId);
      }else{
         messenger.sendText( p_messengerId, msgConstants.MSG_FACEBOOK_LOGIN_ALREADY );
         p_view.redirect( messenger.getCloseWebViewRedirectUrl() );
      }
   });
}
function onFacebookLogin(p_view, p_returnedObj)
{
   log( "onFacebookLogin()" );
   if(p_returnedObj.isSuccessful)
   {
      messenger.getPromiseUserInfoByMessengerId(p_returnedObj.messenger_id)
      .then(function(p_messengerUser){
         //messenger.sendText( p_returnedObj.messenger_id, "Facebook User:" + JSON.stringify(p_returnedObj.facebook_user) );
         //messenger.sendText( p_returnedObj.messenger_id, "Messenger User:" + JSON.stringify(p_messengerUser) );
         signupNewUser( p_view, p_returnedObj.facebook_user, p_messengerUser );
      });
   }else{messenger.sendText( p_returnedObj.messenger_id, msgConstants.MSG_PROCESS_ERROR );}
}
fb_login.registerOnLoginCallback(onFacebookLogin);// this is triggered when a request to fb_login.APP_CLIENT_LOGIN_URL is done
fb_login.registerOnAuthorizeCallback(onFacebookAuthorize);
//#endregion FACEBOOK
//==========================================================
//#region GOOGLE DIALOGFLOW
function handleQueryFromMessenger(p_obj){
   dialogFlow.getResponseFromQuery(p_obj, function(r_botResponse, r_messengerId){
      if(r_messengerId!==null){
         messenger.sendText( r_messengerId, r_botResponse );
      }else{
         messenger.sendText( p_obj.sender_id, r_botResponse );
      }
   });
}
function showConfirmYesNo(p_messengerId, p_headerTitle)
{
   log( "showConfirmYesNo(), p_messengerId="+p_messengerId );
   var _sQuickReplyTxt = require('./messenger/structures/MessengerQuickReplyTypeStructures').StuctText;

   var _yes = Object.assign({},_sQuickReplyTxt);
      _yes.title=MessengerQuickReplyButtonNames.BTN_DIALOGFLOW_FOOD_START_YES;
      _yes.payload=PayloadKeys.KEY_DIALOGFLOW_YES;

   var _no = Object.assign({},_sQuickReplyTxt);
      _no.title=MessengerQuickReplyButtonNames.BTN_DIALOGFLOW_FOOD_START_NO;
      _no.payload=PayloadKeys.KEY_DIALOGFLOW_NO;

   messenger.sendQuickReplies(p_messengerId,p_headerTitle,[_yes,_no]);
}
function onWebhookFulfillment(p_structFulfillmentObj, p_res)
{
   // TODO:
   // just be wary of error handling
   //log( "onWebhookFulfillment(), Response Status:" + p_res.status.code );
   log( "onWebhookFulfillment(), p_structFulfillmentObj:" + JSON.stringify(p_structFulfillmentObj) );

   var _params = {};
   if(p_structFulfillmentObj.queryResult.action!==undefined)
   {
      var _followUpEvtObj = {
         name:""
         , languageCode:p_structFulfillmentObj.queryResult.languageCode
         , parameters:{}
      };
      if( p_structFulfillmentObj.queryResult.action.indexOf(DialogflowCustomScripting.ACTION_EVENT_SEPARATOR)!==-1 )
      {
         // process Dialogflow Intent custom Actions here with an Event target
         // See "./12u12/constants/DialogFlowScripting.js" for syntax reference
         var _actEvtPair=p_structFulfillmentObj.queryResult.action.split(DialogflowCustomScripting.ACTION_EVENT_SEPARATOR);
         if( _actEvtPair[1].indexOf(DialogflowCustomScripting.EVENT_PARAM_SEPARATOR)!==-1 )
         {
            var _evtParamPair = _actEvtPair[1].split(DialogflowCustomScripting.EVENT_PARAM_SEPARATOR);
            _followUpEvtObj.name=_evtParamPair[0];
            var _parameter = {};
            _parameter[_evtParamPair[1]]=p_structFulfillmentObj.queryResult.parameters[_evtParamPair[1]];
            _followUpEvtObj.parameters=_parameter;
            _params.followupEventInput=_followUpEvtObj;
            log( "onWebhookFulfillment(), followupEventInput:" + JSON.stringify(_params) );
            p_res.json( _params );
         }
         else
         {
            _followUpEvtObj.name=_actEvtPair[1];
            _params.followupEventInput=_followUpEvtObj;
            log( "onWebhookFulfillment(), followupEventInput:" + JSON.stringify(_params) );
            p_res.json( _params );
         }
      }
      else // handle Dialogflow Intent custom Actions here without Event targets
      {
         switch(p_structFulfillmentObj.queryResult.action)
         {
            case DialogflowCustomActions.ACT_FOOD_START:
            {
               dialogFlow.getMessengerIdFromFulfillmentRequest
               (
                  p_structFulfillmentObj
                  , function( r_msgrId ){
                     showConfirmYesNo(r_msgrId,p_structFulfillmentObj.queryResult.fulfillmentText);
                  }
               );
               p_res.end();
               break;
            }
            default:
            {
               log( p_structFulfillmentObj.queryResult.action+" has no handler" );
               _params = {fulfillmentText:p_structFulfillmentObj.queryResult.fulfillmentText };
               p_res.json( _params );
               break;
            }
         }
      }
   }
   else
   {
      _params = {fulfillmentText:p_structFulfillmentObj.queryResult.fulfillmentText};
      p_res.json( _params );
   }
}
dialogFlow.registerWebhookFulfillmentCallback( onWebhookFulfillment );
//#endregion GOOGLE DIALOGFLOW
//==========================================================
//#region CRON
function notifyUser(p_messengerId)
{
   var _msgObj = Object.create( messenger.StructMessageObject );
      _msgObj.sender_id=p_messengerId;
      _msgObj.msg=msgConstants.MSG_DIALOGFLOW_FOOD_INTENT_START;
   //handleQueryFromMessenger( _msgObj );
   conversationHandler.handleMessages(_msgObj.sender_id, msgConstants.MSG_CONVERSATION_HANDLER_NOTIFY_USER);
}
function updateUserOffsetTimestamp(p_userInfo)
{
   var _offsetTimestamp=utils.getCurrentTimestampWithOffset(userConstants.TIMESTAMP_OFFSET);
   chatbotDbApi.updateOffsetTimestampByMessengerId
   (
      p_userInfo.messenger_id
      , _offsetTimestamp
      , function(p_iRetVal){
         if(p_iRetVal==1){
            notifyUser(p_userInfo.messenger_id);
         }
      }
   );
}
function checkUserForNotification(p_userInfo)
{
   if( p_userInfo!==null ){
      if( utils.getCurrentTimestamp()>=p_userInfo.offset_timestamp && p_userInfo.notification==1 ){
         updateUserOffsetTimestamp(p_userInfo);
      }
   }
}
function handleRetrievedMessengerIds(p_arrMessengerIds)
{
   if(p_arrMessengerIds!==null){
      for(var i=0; i<p_arrMessengerIds.length; i++){
         chatbotDbApi.getUserByMessengerId
         (
            p_arrMessengerIds[i].messenger_id
            , checkUserForNotification
         );
      }
   }
}
function handlePerTick(p_timeSinceStarted){
   chatbotDbApi.getAllMessengerIds(handleRetrievedMessengerIds);
}
scheduler.registerOnUpdateCallbackFunction(handlePerTick);
//#endregion CRON
//==========================================================
//#region MESSENGER
function showMessengerLoginButton(p_messengerId){
   var _url = fb_login.APP_CLIENT_LOGIN_URL+urlParamConstants.PARAM_MESSENGER_ID+p_messengerId;
   messenger.showAccountLinkButton(p_messengerId, buttonNameConstants.BTN_LOG_IN , _url);
}
function onMessengerGetStarted(p_obj)
{
   console.log( "Server::onMessengerGetStarted(), p_obj:" + JSON.stringify(p_obj) );
   //updateCountryCityList();
   messenger.getPromiseUserInfoByMessengerId(p_obj.sender_id)
   .then(function(r_msgrUserInfo)
   {
      console.log( "Server::onMessengerGetStarted(), msgr user:" + JSON.stringify(r_msgrUserInfo) );
      chatbotDbApi.getUserByMessengerId(p_obj.sender_id, function(p_chatbotUserInfo)
      {
         console.log( "Server::onMessengerGetStarted(), p_chatbotUserInfo:" + JSON.stringify(p_chatbotUserInfo) );
         if(p_chatbotUserInfo===null){
            showMessengerLoginButton( p_obj.sender_id );
         }else{
            messenger.sendText( p_obj.sender_id, msgConstants.MSG_GREETING_EXISTING_USER + " " + p_chatbotUserInfo.first_name );
         }
      });
   });
}
function onImageReceived(p_obj)
{
   messenger.sendText( p_obj.sender_id, "Image URL:" + p_obj.msg );
   utilsApi.process
   (
      utilsApi.PROCESS_ID_TEST
      , "OK"
      , function(p_retVal){
         if( p_retVal!==pageStatusCodes.STATUS_ERROR ){
            messenger.sendText(p_obj.sender_id, msgConstants.MSG_PROCESS_ERROR);
         }else{
            messenger.sendText(p_obj.sender_id, p_retVal);
         }
      }
   );
}
function onAudioReceived(p_obj)
{
   console.log("server::onAudioReceived:" + JSON.stringify(p_obj) );
   messenger.setIsTyping( p_obj.sender_id, true );
   messenger.sendText( p_obj.sender_id, "please wait..." );

   var _localFileName='';
   var _convertedFileName='';
   var _samplingRate=0;
   var _localeCode='';

   // get user info account first
   // chatbotDbApi.promiseUserInfoByMessengerId( p_obj.sender_id );

   utils.promiseDownloadFileFromMessengerUrl(p_obj.msg)
   .then(function(r_structHttpsHeader){ // download file from Messenger
      _localFileName = r_structHttpsHeader["content-disposition"].split('=')[1];
      console.log("server::onAudioReceived(), Succesfully downloaded " + _localFileName + " from Messenger");
      return utils.promiseAudioInfoFromLocalFile( _localFileName );
   }).then(function(r_audioInfo){ // check if duration of audio is acceptable
      if( r_audioInfo.format.duration>userConstants.AUDIO_MAX_SECONDS_DURATION ){
         console.log("server::onAudioReceived(), Error: Audio Duration is more than allowed");
         utils.deleteFile( _localFileName );
         return Promise.reject( msgConstants.MSG_ERROR_USER_AUDIO_MAX_DURATION );
      }else{
         //messenger.sendText( p_obj.sender_id, "Audio Info:" + JSON.stringify(r_audioInfo) );
         console.log("server::onAudioReceived(), Audio Info:" + JSON.stringify(r_audioInfo) );
         return utils.promiseConvertAudioLocalFileToFlac( _localFileName );
      }
   }).then(function(r_convertedFlacFile){ // convert downloaded audio file to flac format
      utils.deleteFile( _localFileName );
      return utils.promiseAudioInfoFromLocalFile( r_convertedFlacFile );
   }).then(function(r_convertedFlacFileInfo){ // get the flac converted audio file info
      //messenger.sendText( p_obj.sender_id, "Converted Audio Info:" + JSON.stringify(r_convertedFlacFileInfo) );
      console.log("server::onAudioReceived(), Converted Audio Info:" + JSON.stringify(r_convertedFlacFileInfo) );
      _convertedFileName = r_convertedFlacFileInfo.format.filename;
      _samplingRate = parseInt(r_convertedFlacFileInfo.streams[0].sample_rate);


      // TODO:
      // be sure that user already has a registered account in chat application
      // before proceeding with any voice convertion functionality
      /*
      return chatbotDbApi.promiseUserInfoByMessengerId( p_obj.sender_id );
   }).then(function(r_structUserInfo){
      messenger.sendText( p_obj.sender_id, "User Info:" + JSON.stringify(r_structUserInfo) );
      return utils.promiseConvertedMessengerToGoogleLocale( r_structUserInfo.locale );
      */


      // temp fix for the commendted code above
      return messenger.getPromiseUserInfoByMessengerId( p_obj.sender_id );
   }).then(function(r_structMessengerUserInfo){
      //messenger.sendText( p_obj.sender_id, "User Info:" + JSON.stringify(r_structMessengerUserInfo) );
      return utils.promiseConvertedMessengerToGoogleLocale( r_structMessengerUserInfo.locale );


   }).then(function(r_googleLocaleCode){
      //messenger.sendText( p_obj.sender_id, "Google Locale Code:" + r_googleLocaleCode );
      _localeCode = r_googleLocaleCode;
      console.log("server::onAudioReceived(), Reading local converted Audio File" );
      return utils.promiseReadFile( _convertedFileName );
   }).then(function(r_bufferData){ // send to Google Speech for transcribing
      if( r_bufferData===undefined || r_bufferData===null || r_bufferData==="" ){
         messenger.sendText( p_obj.sender_id, "No Bufferdata read from converted file" );
      }
      console.log("server::onAudioReceived(), Send to Google for Transcribing" );
      return transcriber.promiseTranscribe(r_bufferData, _samplingRate, _localeCode);
   }).then(function(r_res){ // iterate all the Google Speech's transcribed response
      //messenger.sendText( p_obj.sender_id, "Google Cloud to Speech Response:" + JSON.stringify(r_res) );
      log("onAudioReceived(), Google Cloud to Speech Response:" + JSON.stringify(r_res) );
      utils.deleteFile( _convertedFileName );
      var _txt='';
      
      if( r_res[0].results.length>0 )
      {
         /*for(var j=0; r_res[i].results.length; j++){
            for(var k=0; k<r_res[i].results[j].alternatives.length; k++){
               _txt = r_res[i].results[j].alternatives[k].transcript;
               messenger.sendText( p_obj.sender_id, "You said '" + _txt + "'" );
               log("onAudioReceived(), You said:" + _txt );
               conversationHandler.handleMessages(p_obj.sender_id, _txt);
            }
         }*/
         messenger.sendText( p_obj.sender_id, "You said '" + r_res[0].results[0].alternatives[0].transcript + "'" );
         log("onAudioReceived(), You said:" + r_res[0].results[0].alternatives[0].transcript );
         conversationHandler.handleMessages(p_obj.sender_id, r_res[0].results[0].alternatives[0].transcript);
      }
      else
      {
         //conversationHandler.handleTranscribedAudio(p_obj.sender_id, _txt);
         messenger.sendText( p_obj.sender_id, "we didn't get that. can you repeat what you said." );
      }
   })
   .catch(function(r_err){
      log("onAudioReceived(), Error:" + JSON.stringify(r_err) );
      //messenger.sendText( p_obj.sender_id, JSON.stringify(r_err) );
      //messenger.sendText( p_obj.sender_id, msgConstants.MSG_PROCESS_ERROR );
   });
   messenger.setIsTyping( p_obj.sender_id, false );
}
function onMessengerPostbackPayload(p_payloadVal, p_obj)
{
   switch( p_payloadVal )
   {
      case MessengerPostbackPayloads.VAL_NOTIF_ON:
      {
         setNotification( p_obj.sender_id, 1 );
         break;
      }
      case MessengerPostbackPayloads.VAL_NOTIF_OFF:
      {
         setNotification( p_obj.sender_id, 0 );
         break;
      }
      case MessengerPostbackPayloads.VAL_BODYMAP_FRONT_BODY_SUBPARTS:
      {
         var _sTemplateElementButton = require('./messenger/structures/MessengerButtonStructures');
         var _sTemplateElement = require('./messenger/structures/MessengerTemplatePayloadElementStructure');
         var _btn = Object.assign({},_sTemplateElementButton.StructPostbackPayload);
            _btn.title="Parts...";
            _btn.payload=MessengerPostbackPayloads.VAL_BODYMAP_FRONT_HEAD_SUBPARTS;
         var _elem = Object.create( _sTemplateElement );
            _elem.title="Front Body";
            _elem.image_url=urlConstants.URL_IMAGES_BASE+"/front_head.jpg";
            _elem.buttons=[_btn];
         messenger.sendGenericTemplates( p_obj.sender_id, [_elem] );
         break;
      }
      case MessengerPostbackPayloads.VAL_BODYMAP_BACK_BODY_SUBPARTS:
      {
         messenger.sendText( p_obj.sender_id, "Show Back Body Subparts" );
         break;
      }
      case MessengerPostbackPayloads.VAL_BODYMAP_FRONT_HEAD_SUBPARTS:
      {
         messenger.sendText( p_obj.sender_id, "Show Front Head Subparts" );
         break;
      }
      default:
      {
         log( "onMessengerPostbackPayload(), No handler for this Messenger Postback Payload:" + p_payloadVal );
         break;
      }
   }
}
function onMessengerQuickReplyReceived(p_obj)
{
   if( p_obj.msg.indexOf(PayloadKeys.KEY_BODYMAP)!==-1 ){
      customBodyMapHandler.handleMessengerQuickReplyPayload(p_obj.sender_id, p_obj.msg);
   }else if( p_obj.msg.indexOf(PayloadKeys.KEY_CONVERSATION_FLOW)!==-1 ){
      conversationHandler.handleQuickReplies( p_obj.sender_id, p_obj.msg );
   }else{
      //messenger.sendText( p_obj.sender_id, "Received Payload Value:" + p_obj.msg );
      log( "onMessengerQuickReplyReceived(), p_obj=" + JSON.stringify(p_obj) );
      switch( p_obj.msg )
      {
         case PayloadKeys.KEY_DIALOGFLOW_YES:
         {
            var _obj = Object.assign({},p_obj);
               _obj.msg=PayloadMap[PayloadKeys.KEY_DIALOGFLOW_YES];
            handleQueryFromMessenger(_obj);
            break;
         }
         case PayloadKeys.KEY_DIALOGFLOW_NO:
         {
            var _obj = Object.assign({},p_obj);
               _obj.msg=PayloadMap[PayloadKeys.KEY_DIALOGFLOW_NO];
            handleQueryFromMessenger(_obj);
            break;
         }
         default:
         {
            // for other payloads that are not for Google DialogFlow
            messenger.sendText( p_obj.sender_id, "Messenger Quick Reply " + p_obj.msg );
            break;
         }
      };
   }
}
function onMessageReceived(p_obj)
{
   log("Server::onMessageReceived(), p_obj:" + JSON.stringify(p_obj) );
   if( p_obj.msg.indexOf(CommandKeys.KEY_TEST)!==-1 ){
      // this is for testing if the Server can still process requests
      // if the server replied, then there's no critical errors
      messenger.sendText( p_obj.sender_id, "Test Success" );
   }

   // send a Sample Quick Reply Buttons
   else if( p_obj.msg.indexOf(CommandKeys.KEY_BOWEL)!==-1 ){
      showBowelMovement(p_obj.sender_id, "How is your bowel movement today?");
   }

   else if( p_obj.msg.indexOf(CommandKeys.KEY_LOGIN)!==-1 ){
      var _json, _encryptedMidAndFbidPair;

      frontEnd.getPromisedEncryptedMessengerAndFacebookIdPair(p_obj.sender_id,null)
      .then(function(r_encryptedMidAndFbidPair)
      {
         messenger.sendText( p_obj.sender_id, r_encryptedMidAndFbidPair );
         return utils.getPromisedUrlSafeEncryptedString(
            frontEnd.URL_LOGIN_FINISHED_CALLBACK
            +"?"+frontEnd.URL_LOGIN_PARAM_PAYLOAD_NAME+"="+r_encryptedMidAndFbidPair
         );
      })
      .then(function(r_encryptedRedirectUrl)
      {
         var _finalUrl = urlConstants.URL_FRONTEND_BASE
            +"?"+frontEnd.URL_SIGNUP_PARAM_REDIRECT_URL
            +r_encryptedRedirectUrl;

         messenger.sendText( p_obj.sender_id, _finalUrl );
         messenger.showAccountLinkButton(p_obj.sender_id, buttonNameConstants.BTN_LOG_IN , _finalUrl);
      });
   }

   // send a Sample Messenger Generic Template
   // Carousel type
   else if( p_obj.msg.indexOf(CommandKeys.KEY_MSGR_CAROUSEL)!==-1 )
   {
      messenger.sendText( p_obj.sender_id, "Showing a body map part" );

      var _sTemplateElementButton = require('./messenger/structures/MessengerButtonStructures');
      var _sTemplateElement = require('./messenger/structures/MessengerTemplatePayloadElementStructure');

      // Front Body Part
      var _elemFrontBodyBtn = Object.assign({},_sTemplateElementButton.StructPostbackPayload);
         _elemFrontBodyBtn.title="Parts...";
         _elemFrontBodyBtn.payload=MessengerPostbackPayloads.VAL_BODYMAP_FRONT_BODY_SUBPARTS;
      var _elemFrontBody = Object.create( _sTemplateElement );
         _elemFrontBody.title="Front Body";
         _elemFrontBody.image_url=urlConstants.URL_IMAGES_BASE+"/body_part_front_body.jpg";
         _elemFrontBody.buttons=[_elemFrontBodyBtn];

      // Back Body Part
      var _elemBackBodyBtn = Object.assign({},_sTemplateElementButton.StructPostbackPayload);
         _elemBackBodyBtn.title="Parts...";
         _elemBackBodyBtn.payload=MessengerPostbackPayloads.VAL_BODYMAP_BACK_BODY_SUBPARTS;
      var _elemBackBody = Object.create( _sTemplateElement );
         _elemBackBody.title="Back Body";
         _elemBackBody.image_url=urlConstants.URL_IMAGES_BASE+"/body_part_back_body.jpg";
         _elemBackBody.buttons=[_elemBackBodyBtn];

      messenger.sendGenericTemplates( p_obj.sender_id, [_elemFrontBody,_elemBackBody] );
   }

   // body map
   // this is for testing purposes only
   else if( p_obj.msg.indexOf(CommandKeys.KEY_BODY_MAP)!==-1 )
   {
      utils.getPromisedUrlSafeEncryptedString(p_obj.sender_id)
      .then(function(r_encryptedString)
      {
         log( "onMessageReceived(), r_encryptedString:" + r_encryptedString );
         messenger.showUrlButton
         (
            p_obj.sender_id
            , "The Body Map"
            , urlConstants.URL_BODY_MAP + urlParamConstants.PARAM_MESSENGER_ID + r_encryptedString
         );
      });
   }

   // any unmatched texts inputted by the user in the chatbot will go here
   // For Google DialogFlow
   else
   {
      //handleQueryFromMessenger(p_obj);
      conversationHandler.handleMessages(p_obj.sender_id, p_obj.msg);
   }
}
// uncomment the line below if you want to test bot functionalities
// messenger.registerOnMessageReceivedCallback(botTest.onMsgrMsgReceived);
messenger.registerOnMessageReceivedCallback(onMessageReceived);
messenger.registerOnQuickReplyReceivedCallback(onMessengerQuickReplyReceived);
messenger.registerOnImageReceivedCallback(onImageReceived);
messenger.registerOnAudioReceivedCallback(onAudioReceived)
messenger.registerOnGetStartedCallback(onMessengerGetStarted);
messenger.registerOnCustomPostbackPayloadCallback(onMessengerPostbackPayload);
//#endregion MESSENGER
//==========================================================
//#region BODY MAP
bodyMap.registerOnSymptomSendCallbackFunction(customBodyMapHandler.OnBodyMapCallback);
//#endregion BODY MAP
//==========================================================
//    EXPRESS
app.listen(PORT);
scheduler.start();