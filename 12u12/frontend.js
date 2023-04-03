/**
*
*
*        12U12 FRONTEND MODULE
*
*
*
* @author   Jan Windelle Manalaysay
* @date     2018/05/31
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

var urlConstants                                = require('../constants/urls');
var utils                                       = require('../utils');

//==========================================================
//    CONSTANTS
const M_DIR_SIGNUP                              = "/signup";
const M_DIR_LOGIN                               = "/login";

const M_URL_LOGIN_ENDPOINT                      = M_DIR_LOGIN;
const M_URL_SIGNUP_ENDPOINT                     = M_DIR_SIGNUP;
const M_URL_SIGNUP_PARAM_FORM                   = "formInitial=";
const M_URL_SIGNUP_PARAM_REDIRECT_URL           = "redirectUrl=";

const M_URL_SIGNUP_PARAM_PAYLOAD_NAME           = "payload1"; // MessengerID|FacebookID encrypted string pair
const M_URL_SIGNUP_FINISHED_PARAM_PAYLOAD_NAME  = "payload2"; // UserID|Email encrypted string pair

const M_ROUTE_SIGNUP_FINISHED                   = M_DIR_SIGNUP+"/finished"; //handler after user signsup
const M_URL_SIGNUP_FINISHED_CALLBACK            = urlConstants.URL_SERVER_BASE+M_ROUTE_SIGNUP_FINISHED;

const M_ROUTE_LOGIN_FINISHED                    = M_DIR_LOGIN+"/finished"; // handler after login in frontend
const M_URL_LOGIN_FINISHED_CALLBACK             = urlConstants.URL_SERVER_BASE+M_ROUTE_LOGIN_FINISHED;

const PAYLOAD_VALUES_SEPARATOR                  = "|";

//==========================================================
//    CALLBACK FUNCTIONS
var m_cfOnSignupFinished=null;

//==========================================================
//    STRUCTS
// this is a reference
// and should not be modified in any way in this project
// unless, a new field must be added
const m_StructNewUser=
{
   first_name        :""
   ,last_name        :""
   ,email            :""
   ,password         :""
   ,passwordConfirm  :""
   ,birthMonth       :""
   ,birthYear        :""
   ,gender           :""
   ,address          :""
   ,ethnicity        :""
   ,userid           :""
   //,redirectUrl      :""
};

//==========================================================
//    PRIVATE METHODS
function log(p_string)
{
   // put in a separate function
   // so that maybe in the future
   // when there is a switch for
   // debug mode, it can handle
   // wether to show the log or not'
   console.log("frontend module::" + p_string);
}

// This 2 methods are for a custom kind of encrypting and decrypting of the
// messenger and facebook ID pairs
// because these values would be passed to the frontend upon signup of a new user
// then will be returned back by the frontend with additional data
// from the signed up user
function getPromisedEncryptedMessengerAndFacebookIdPair(p_messengerId, p_facebookId){
   return utils.getPromisedUrlSafeEncryptedString( p_messengerId+PAYLOAD_VALUES_SEPARATOR+p_facebookId );
}
function getPromisedDecryptedMessengerAndFacebookIdPair(p_messengerId, p_facebookId){
   return utils.getPromisedUrlSafeDecryptedString( p_messengerId+PAYLOAD_VALUES_SEPARATOR+p_facebookId );
}

//==========================================================
//    PUBLIC METHODS
// TODO:
// have the frontend fixed the problem of the value for the key becoming blank when redirected
var m_funcInitialize = function(p_app, p_request)
{
   p_app.get
   (
      M_ROUTE_LOGIN_FINISHED
      , function( p_req, p_res )
      {
         log("m_functionInitialize()::M_ROUTE_LOGIN_FINISHED: Query:" + JSON.stringify(p_req.query) );
      }
   );

   p_app.get
   (
      M_ROUTE_SIGNUP_FINISHED,
      function(p_req, p_res)
      {
         //log("m_funcInitialize(), M_ROUTE_SIGNUP_FINISHED, Query:" + JSON.stringify(p_req.query) );

         var _mid,_fbid,_uid,_email;

         utils.getPromisedUrlSafeDecryptedString(p_req.query[M_URL_SIGNUP_PARAM_PAYLOAD_NAME])
         .then(function(r_decryptedMessengerAndFacebookIdPair){
            log("m_funcInitialize(), r_decryptedMessengerAndFacebookIdPair:" + r_decryptedMessengerAndFacebookIdPair );
            var _arrPayload = r_decryptedMessengerAndFacebookIdPair.split(PAYLOAD_VALUES_SEPARATOR);
            _mid=_arrPayload[0];
            log("m_funcInitialize(), _mid:" + _mid );
            _fbid=_arrPayload[1];
            log("m_funcInitialize(), _fbid:" + _fbid );
            return utils.getPromisedUrlSafeDecryptedString(p_req.query[M_URL_SIGNUP_FINISHED_PARAM_PAYLOAD_NAME]);
         })
         .then(function(r_decryptedPayloadFromFrontEnd){
            log("m_funcInitialize(), r_decryptedPayloadFromFrontEnd:" + r_decryptedPayloadFromFrontEnd );
            var _arrPayload = r_decryptedPayloadFromFrontEnd.split(PAYLOAD_VALUES_SEPARATOR);
            _uid=_arrPayload[0];
            log("m_funcInitialize(), _uid:" + _uid );
            _email=_arrPayload[1];
            log("m_funcInitialize(), _email:" + _email );

            if( m_cfOnSignupFinished!==null ){
               m_cfOnSignupFinished( p_res, _mid, _fbid, _uid, _email );
            }
         });
      }
   );
};

/**
 * A standby method for moving the signing up functionality
 */
var m_funcSignupNewUser = function(){};

/**
 * Registers a callback function after signing up a new user to 12u12
 * @param {Function} p_callbackFunction CallbackFunction( View, Messenger ID, Facebook ID, 12u12 User ID, user email )
 */
var m_funcRegisterOnSignupFinishedCallbackFunction = function(p_callbackFunction){
   m_cfOnSignupFinished = p_callbackFunction;
};

/**
 * Does return a custom format of an encrypted string of the messenger and facebook ID
 */
var m_funcGetPromisedEncryptedMessengerAndFacebookIdPair = function(p_messengerId, p_facebookUser)
{
   return getPromisedEncryptedMessengerAndFacebookIdPair(p_messengerId, p_facebookUser);
};



module.exports =
{
   URL_LOGIN_ENDPOINT                                 :  M_URL_LOGIN_ENDPOINT
   , URL_SIGNUP_ENDPOINT                              :  M_URL_SIGNUP_ENDPOINT
   , URL_SIGNUP_PARAM_FORM                            :  M_URL_SIGNUP_PARAM_FORM
   , URL_SIGNUP_PARAM_REDIRECT_URL                    :  M_URL_SIGNUP_PARAM_REDIRECT_URL
   , URL_SIGNUP_FINISHED_CALLBACK                     :  M_URL_SIGNUP_FINISHED_CALLBACK
   , URL_LOGIN_FINISHED_CALLBACK                      :  M_URL_LOGIN_FINISHED_CALLBACK
   , URL_SIGNUP_PARAM_PAYLOAD_NAME                    :  M_URL_SIGNUP_PARAM_PAYLOAD_NAME
   ,
   /**
    * This is a value that needs to be returned back to server */ 
   URL_LOGIN_PARAM_PAYLOAD_NAME                     :  M_URL_SIGNUP_PARAM_PAYLOAD_NAME
   , StructNewUser                                    :  m_StructNewUser
   , initialize                                       :  m_funcInitialize
   , signupNewUser                                    :  m_funcSignupNewUser
   , registerOnSignupFinishedCallbackFunction         :  m_funcRegisterOnSignupFinishedCallbackFunction
   , getPromisedEncryptedMessengerAndFacebookIdPair   :  m_funcGetPromisedEncryptedMessengerAndFacebookIdPair
};