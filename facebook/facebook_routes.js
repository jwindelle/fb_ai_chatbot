/**
 * FACEBOOK ROUTES MODULE
 * This module is used mainly for handling the facebook application relalated functionalities
 * 
*  @author  Jan Windelle Manalaysay
*  @date    2018/02/05
*  @email   jan.manalaysay@12u12.com
*
*  REFERENCES:
*  https://developers.facebook.com/docs/messenger-platform/send-messages/buttons
*  https://scotch.io/tutorials/easy-node-authentication-facebook#creating-our-facebook-application
*
*  user json format sample:
   {
      "id": "164232557702161",
      "displayName": "Peter Dev",
      "name": {
         "familyName": "Dev",
         "givenName": "Peter"
      },
      "address":[<USER_ADDRESS>]
      "email":["<USER_EMAIL/S>"]
      "gender": "male",
      "photos": [{
         "value": "https://scontent.xx.fbcdn.net/v/t1.0-1/c15.0.50.50/p50x50/10354686_10150004552801856_220367501106153455_n.jpg?oh=3f6c91428fc256182541f697d6bb84d3&oe=5B3B0A2F"
      }],
      "provider": "facebook",
      "_raw": "{\"id\":\"164232557702161\",\"name\":\"Peter Dev\",\"last_name\":\"Dev\",\"first_name\":\"Peter\",\"picture\":{\"data\":{\"height\":50,\"is_silhouette\":true,\"url\":\"https:\\/\\/scontent.xx.fbcdn.net\\/v\\/t1.0-1\\/c15.0.50.50\\/p50x50\\/10354686_10150004552801856_220367501106153455_n.jpg?oh=3f6c91428fc256182541f697d6bb84d3&oe=5B3B0A2F\",\"width\":50}},\"gender\":\"male\",\"birthday\":\"01\\/01\\/1970\"}",
      "_json": {
         "id": "164232557702161",
         "name": "Peter Dev",
         "last_name": "Dev",
         "first_name": "Peter",
         "picture": {
            "data": {
               "height": 50,
               "is_silhouette": true,
               "url": "https://scontent.xx.fbcdn.net/v/t1.0-1/c15.0.50.50/p50x50/10354686_10150004552801856_220367501106153455_n.jpg?oh=3f6c91428fc256182541f697d6bb84d3&oe=5B3B0A2F",
               "width": 50
            }
         },
         "gender": "male",
         "birthday": "01/01/1970"
      }
   }
*/

/*jslint devel: true */
/*global
alert, confirm, console, prompt, process, require, arguments, log
*/
/*jslint white: true */
/*jslint node: true */
/* jshint node: true */

// TODO:
// solve the problem when multiple users are using the account linking at the same time



'use strict';

var urlConstants                    = require('../constants/urls');
var urlParamNameConstants           = require('../constants/urlParamNames');

const APP_CLIENT_ID                 = process.env.FB_APP_CLIENT_ID;
const APP_CLIENT_SECRET             = process.env.FB_APP_CLIENT_SECRET;

//const APP_CLIENT_CALLBACK_URL     = 'https://fb-webhook.12u12.com/facebook/login/callback';
const APP_CLIENT_CALLBACK_URL       = urlConstants.URL_SERVER_BASE+'/facebook/login/callback';

const M_APP_CLIENT_LOGIN_URL        = urlConstants.URL_SERVER_BASE+"/facebook/authorize";
const M_APP_CLIENT_SIGNUP_W_FB_URL  = urlConstants.URL_SERVER_BASE+"/facebook/login";

const ROUTE_FB_LOGIN_HOME           = "/facebook";
const ROUTE_FB_LOGIN_DIR            = "/login";
const ROUTE_FB_LOGOUT_DIR           = "/logout";
const ROUTE_FB_LOGIN_URI            = ROUTE_FB_LOGIN_HOME+ROUTE_FB_LOGIN_DIR;
const ROUTE_FB_LOGOUT_URI           = ROUTE_FB_LOGIN_HOME+ROUTE_FB_LOGOUT_DIR;
const ROUTE_FB_REDIRECT_URI         = ROUTE_FB_LOGIN_HOME+ROUTE_FB_LOGIN_DIR+"/callback";// this is the page set in app settings in Facebook
const ROUTE_FB_AUTHORIZE_URI        = ROUTE_FB_LOGIN_HOME+"/authorize";

const ABS_ROUTE_BASE_URL            = urlConstants.URL_SERVER_BASE;
const ABS_ROUTE_REDIRECT_LOGIN_URI  = ABS_ROUTE_BASE_URL+ROUTE_FB_LOGIN_HOME+ROUTE_FB_LOGIN_DIR;

// https://developers.facebook.com/tools/explorer/
const FACEBOOK_GRAPH_API_BASE_URL                  = "https://graph.facebook.com";
const FACEBOOK_GRAPH_API_VER                       = "/v3.0";
const FACEBOOK_GRAPH_API_NODE_ME                   = "/me";
const FACEBOOK_GRAPH_API_NODE_OAUTH_ACCESS_TOKEN   = "/oauth/access_token";

//const FIELDS_PASSPORT_PARAM = ['id', 'displayName', 'name', 'photos', 'email', 'gender', 'address'];
//const FIELDS_FB_PERMISSIONS = ['email','birthday'];

// these are all the permissions that would be asked from the user
// please refer to the site for reference
// https://developers.facebook.com/docs/facebook-login/permissions/
const FIELDS_FB_PERMISSIONS      = ['email','user_birthday', 'user_location', 'user_gender'];

// these are the name of the fields that would be included in the user data that would be returned after asking the permission
// please refer to the site for reference
// https://developers.facebook.com/docs/graph-api/reference/v2.5/user
//const FIELDS_PASSPORT_PARAM      = ['id', 'displayName', 'name', 'photos', 'email', 'gender', 'birthday', 'location'];
const FIELDS_PASSPORT_PARAM      = ['id', 'name', 'email', 'gender', 'birthday', 'location', 'last_name', 'first_name'];

const SESSION_KEY_SECRET         = '12u12';

var pageStatusCodes              = require('../constants/page-status-codes');
var frontEnd                     = require('../12u12/frontend');
var utils                        = require("../utils");

var m_request; // a Request Module Instance
var m_response = null;
var m_messenger;

var m_arrTokens = [];
var m_arrRedirectUris = [];
var m_arrMessengerIds = [];

var m_12u12RestApiInst;

// https://developers.facebook.com/docs/facebook-login/access-tokens/#apptokens
// this will be used for inspecting when retrieving user access tokens
var m_appAccessToken;

//==========================================================
//    STRUCTURES
// in the future, you might need to add Messenger's Account Linking
// redirect Uri and Token for verification of a user being logged in in Messenger
const m_StructLoginReturn=
{
   isSuccessful   :  false
   , messenger_id :  ""
   , facebook_user:  {}
};

//==========================================================
//    CALLBACK VARIABLES
var m_cfOnLogin;
var m_cfOnAuthorize=null;

//==========================================================
//    PRIVATE METHODS
function log(p_string)
{
   // put in a separate function
   // so that maybe in the future
   // when there is a switch for
   // debug mode, it can handle
   // wether to show the log or not'
   console.log("facebook/facebook_routes module::" + p_string);
}

function handleAccountLinking(p_request, p_req, p_res)
{
   log( "handleAccountLinking()" );
   var _user = p_req.user;
   var _accountLinkingToken            = m_arrTokens.shift();
   var _accountLinkingRedirectURI      = m_arrRedirectUris.shift();
   var _messengerId                    = m_arrMessengerIds.shift();

   m_messenger.sendText( _messengerId, "Processing Account Linking for " + _messengerId );

   if(_accountLinkingToken!==undefined)
   {
      log("p_app.get() ROUTE_FB_LOGIN_HOME, m_messenger.accountLinkingToken=" + _accountLinkingToken);

      var _accountLinkingUri = m_messenger.getAccountLinkingUri() + _accountLinkingToken;
      log("p_app.get() ROUTE_FB_LOGIN_HOME, _accountLinkingUri=" + _accountLinkingUri);

      p_request
      (
         _accountLinkingUri
         , function(p__err, p__req, p__res)
         {
            if(!p__err)
            {
               var _res = JSON.parse(p__res);
               _user.userid = _res.recipient;
               _user.pageid = _res.id;

               if(m_cfOnLogin!==undefined)
               {
                  m_cfOnLogin(_user);
               }
               // will be using fetched facebook ID as the authorization code
               // so that it will be the one to be set as a key when
               // linking the messenger ID with the facebook ID
               var _redirectSuccess = _accountLinkingRedirectURI 
                                    + "&authorization_code=" 
                                    + _user.id;
               //p_res.render('profile', { user: _user, redirectURI:_redirectSuccess  });

               
               log("p_app.get() ROUTE_FB_LOGIN_HOME, User:" + JSON.stringify(_user) );

               //p_res.redirect( frontEnd.URL+frontEnd.URL_ENDPOINT_SIGNUP+JSON.stringify(_newUser) );
            }
            else
            {
               p_res.render('profile', { user: _user, redirectURI: undefined });
            }
         }
      );
   }
   else
   {
      p_res.render('profile', { user: _user, redirectURI: undefined });
   }
}

/**
 * Reference:
 * https://developers.facebook.com/docs/facebook-login/access-tokens/#apptokens
 */
function getAppAccessToken()
{
   log( "getAppAccessToken()" );
   var _getUrl=
      FACEBOOK_GRAPH_API_BASE_URL
      + FACEBOOK_GRAPH_API_NODE_OAUTH_ACCESS_TOKEN
      + "?client_id=" + APP_CLIENT_ID
      + "&client_secret=" + APP_CLIENT_SECRET
      + "&grant_type=client_credentials";
   m_request
   (
      _getUrl
      , function(p_err, p_req, p_res)
      {
         if(!p_err){
            var _res = JSON.parse(p_res);
            m_appAccessToken = _res.access_token;
         }else{
            log("m_funcInitialize(), Error:" + p_err);
         }
      }
   );
}

function getPromiseUserInfoFromAccessToken(p_accessToken)
{
   log( "getPromiseUserInfoFromAccessToken()" );
   return new Promise
   (
      function(p_resolve, p_reject)
      {
         var _getUrl= FACEBOOK_GRAPH_API_BASE_URL 
            + FACEBOOK_GRAPH_API_VER
            + FACEBOOK_GRAPH_API_NODE_ME;
         m_request
         (
            {
               method: 'GET'
               , uri: _getUrl
               , qs : 
               {
                  //fields : "name,address,birthday,age_range,email,location,last_name,first_name"
                  fields : FIELDS_PASSPORT_PARAM.join(',')
                  , access_token: p_accessToken
               }
            }
            , function(p_err, p_req, p_res)
            {
               if(!p_err){
                  var _res = JSON.parse(p_res);
                  log("getPromiseUserInfoFromAccessToken() Response:" + JSON.stringify( _res ) );
                  p_resolve( _res );
               }else{
                  log("getPromiseUserInfoFromAccessToken() Error:" + p_err);
                  p_reject( null );
               }
            }
         );
      }
   );
}

// reference:
// https://developers.facebook.com/docs/facebook-login/manually-build-a-login-flow#confirm
/**
 * This is used to inspect the validity of a retrieved user access token
 * The user access token usually contains the permitted fields an FB user accepted
 * for a specific Application e.g. in facebook login
 * @param {String} p_accessToken 
 * @param {String} p_msgrId 
 */
function inspectAccessToken(p_accessToken, p_msgrId )
{
   m_messenger.sendText(p_msgrId,"Access Token:"+p_accessToken+"|App Access Token:"+m_appAccessToken);

   var _getUrl=
      FACEBOOK_GRAPH_API_BASE_URL
      + "/debug_token?"
      + "input_token=" + p_accessToken
      + "&access_token=" + m_appAccessToken;
   m_request
   (
      _getUrl
      , function(p_err, p_req, p_res)
      {
         if(!p_err){
            var _res = JSON.parse(p_res);
            log("inspectAccessToken() Response:" + JSON.stringify( _res )  );
            //m_messenger.sendText(p_msgrId,"Response:"+JSON.stringify( _res )  );
         }else{
            log("inspectAccessToken() Error:" + p_err);
            //m_messenger.sendText(p_msgrId,"Error:"+p_err);
         }
      }
   );
}

function getPromiseAccessTokenFromCode(p_code)
{
   log( "getPromiseAccessTokenFromCode()" );
   return new Promise
   (
      function(p_resolve, p_reject)
      {
         var _getUrl=
            FACEBOOK_GRAPH_API_BASE_URL
            + FACEBOOK_GRAPH_API_VER
            + FACEBOOK_GRAPH_API_NODE_OAUTH_ACCESS_TOKEN
            + "?client_id=" + APP_CLIENT_ID
            + "&redirect_uri=" + ABS_ROUTE_REDIRECT_LOGIN_URI
            + "&client_secret=" + APP_CLIENT_SECRET
            + "&code=" + p_code;
         m_request
         (
            _getUrl
            , function(p_err, p_req, p_res)
            {
               if(!p_err){
                  var _res = JSON.parse(p_res);
                  log("getPromiseAccessTokenFromCode(), Response:" + JSON.stringify( _res ) );
                  p_resolve( _res.access_token );
               }else{
                  log("getPromiseAccessTokenFromCode(), Error:" + p_err);
                  p_reject( null );
               }
            }
         );
      }
   );
}

// TODO:
// handle errors in process
// Facebook Manual login flow Reference:
// https://developers.facebook.com/docs/facebook-login/manually-build-a-login-flow#confirm
/**
 * This is where things will be processed after user is finished with the facebook login dialog
 * @param {Express Module Method Callback Request Parameter} p_req 
 * @param {Express Module Method Callback Response Parameter} p_res 
 * @param {Express Module Method Callback Next Parameter} p_next 
 */
function handleLogin(p_req, p_view, p_next)
{
   log( "handleLogin()" );
   log("p_app.get::ROUTE_FB_LOGIN_URI, Query:" + JSON.stringify(p_req.query) );
   var _mid = p_req.query.state;// refer to ROUTE_FB_AUTHORIZE_URI app method handler for this
   var _code = p_req.query.code;

   log( "handleLogin(), Code:" + _code );
   getPromiseAccessTokenFromCode(_code)
   .then(function(p_accessToken){
      log( "handleLogin(), Access Token:" + p_accessToken );
      return getPromiseUserInfoFromAccessToken(p_accessToken);
   })
   .then(function(p_user){
      log( "handleLogin(), Code:" + _code );
      var _retObj = Object.create(m_StructLoginReturn);
      if(p_user!=null){
         _retObj.messenger_id=_mid;
         _retObj.facebook_user = p_user;
         _retObj.isSuccessful=true;
      }
      if(m_cfOnLogin!==undefined){
         m_cfOnLogin( p_view, _retObj );
      }
   });

   //p_res.render('exit', { closeWebViewURI: m_messenger.getCloseWebViewUrl() } );
}

// Facebook Manual login flow Reference:
// https://developers.facebook.com/docs/facebook-login/manually-build-a-login-flow#login
/**
 * This is where the process goes first for authorizing user to use the app.
 * If the user is using it for the first time, then a facebook login will appear
 * , if not then it will just proceed with the redirect Uri provided
 * @param {Express Module Method Callback Request Parameter} p_req 
 * @param {View} p_view 
 */
function handleAuthorization(p_req, p_view)
{
   log( "handleAuthorization(), messenger ID:" + p_req.query[urlParamNameConstants.NAME_MESSENGER_ID] );
   if( m_cfOnAuthorize!==null ){
      m_cfOnAuthorize( p_view, p_req.query[urlParamNameConstants.NAME_MESSENGER_ID] );
   }
}

//==========================================================
//    PUBLIC METHODS
var m_funcInitialize = function (p_app, p_request)
{
   log( "m_funcInitialize()" );
   m_request = p_request;

   var passport = require('passport');
   var Strategy = require('passport-facebook').Strategy;

   getAppAccessToken();

   //p_app.use(require('express-session')({ secret: '12u12' }));
   p_app.use(passport.initialize());
   p_app.use(passport.session());

   //==================================================================================
   // METHODS
   // reference for manual logging in Facebook
   // https://developers.facebook.com/docs/facebook-login/manually-build-a-login-flow
   p_app.get
   (
      ROUTE_FB_REDIRECT_URI
      , function(p_err, p_req, p_res){
         //p_res.render('home', { user: null } );
         p_res.redirect(ROUTE_FB_LOGIN_HOME);
      }
   );

   // This is where the process goes first for authorizing user to use the app
   p_app.get(ROUTE_FB_AUTHORIZE_URI, handleAuthorization);

   p_app.get(ROUTE_FB_LOGIN_URI, handleLogin);

   // once a user, has accepted the permissions
   // information can now be fetched from the user depending on the accepted permissions
   p_app.get
   (
      ROUTE_FB_LOGIN_HOME
      , function (p_req, p_res)
      {
         log("p_app.get::ROUTE_FB_LOGIN_HOME, Query:" + JSON.stringify(p_req.query) );
         handleAccountLinking(p_request, p_req, p_res);
      }
   );

   p_app.get
   (
      ROUTE_FB_LOGOUT_URI
      , function (p_req, p_res) {
         p_req.logout();
         p_res.redirect(ROUTE_FB_LOGIN_HOME);
      }
   );
};

var m_funcSetMessenger = function(p_messenger)
{
   m_messenger = p_messenger;
};

var m_funcSet12u12RestApi = function(p_12u12RestApiInst)
{
   m_12u12RestApiInst = p_12u12RestApiInst;
};

/**
 * @param {Function} p_callbackFunction CallbackFunction( Window/WebView, StructLoginReturn Object )
 */
var m_funcRegisterOnLoginCallback = function(p_callbackFunction)
{
   m_cfOnLogin = p_callbackFunction;
};

// Facebook Manual login flow Reference:
// https://developers.facebook.com/docs/facebook-login/manually-build-a-login-flow#login
/**
 * This is where the process goes first for authorizing user to use the app.
 * If the user is using it for the first time, then a facebook login will appear
 * , if not then it will just proceed with the redirect Uri provided
 * @param {View} p_view This is the reference of the current view
 * @param {String} p_messengerId 
 */
var m_funcAuthorize = function(p_view, p_messengerId)
{
   log( "m_funcAuthorize(), p_messengerId:" + p_messengerId );
   var _url = 
      "https://www.facebook.com"
      + FACEBOOK_GRAPH_API_VER
      + "/dialog/oauth"
      + "?client_id="+APP_CLIENT_ID
      + "&redirect_uri="+ABS_ROUTE_REDIRECT_LOGIN_URI
      + "&scope="+FIELDS_FB_PERMISSIONS
      + "&state="+p_messengerId;

   p_view.redirect( _url );
};

/**
 * This Initiates the registered Redirect URI you have stated on your Facebook Application
 * 
 * @param {Function} p_callbackFunction   CallbackFunction( Window/WebView, Messenger ID )
 */
var m_funcRegisterOnAuthorizeCallback = function(p_callbackFunction){
   m_cfOnAuthorize = p_callbackFunction;
};

module.exports =
{
   /**
    * This is used for Messenger Account Linking Button
    */
   APP_CLIENT_LOGIN_URL             :  M_APP_CLIENT_LOGIN_URL
   , APP_CLIENT_SIGNUP_WITH_FB_URL  :  M_APP_CLIENT_SIGNUP_W_FB_URL
   , StructLoginReturn              :  m_StructLoginReturn
   , initialize                     :  m_funcInitialize
   , authorize                      :  m_funcAuthorize
   , setMessenger                   :  m_funcSetMessenger
   , set12u12RestApi                :  m_funcSet12u12RestApi
   , registerOnLoginCallback        :  m_funcRegisterOnLoginCallback
   , registerOnAuthorizeCallback    :  m_funcRegisterOnAuthorizeCallback
};