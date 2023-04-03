/**
*
*
*        FACEBOOK MESSENGER MODULE
*
*
*
*  This module is in-charge of all messenger chatbot functionalities
*
*  Please refer to the documentation from here for messenger profile APIs
*  https://developers.facebook.com/docs/messenger-platform/reference/messenger-profile-api
*
*  for using the get started button, refer here:
*  https://developers.facebook.com/docs/messenger-platform/reference/messenger-profile-api/get-started-button
*
*  @author  Jan Windelle Manalaysay
*  @date    2018/02/09
*  @email   jan.manalaysay@12u12.com
*
*  Sent JSON formats of messages sent:
*
   // TEXT format
   [{
      "id":"930551490430908"
      ,"time":1515400458656
      ,"messaging":
         [{
            "sender":{"id":"1680787885293683"}
            ,"recipient":{"id":"930551490430908"}
            ,"timestamp":1515400458342
            ,"message":
               {
                  "mid":"mid.$cAAMUrGH8eJdnBi04Zlg1OfuD3MGe"
                  ,"seq":590
                  ,"text":"+"
               }
         }]
   }]
	
   // IMAGE format
   [{
      "id":"930551490430908"
      ,"time":1515400474051
      ,"messaging":
         [{
            "sender":{"id":"1680787885293683"}
            ,"recipient":{"id":"930551490430908"}
            ,"timestamp":1515400473746
            ,"message":
            {
               "mid":"mid.$cAAMUrGH8eJdnBi10klg1OglgstRG"
               ,"seq":596
               ,"attachments":
               [{
                  "type":"image"
                  ,"payload":{"url":"https://scontent-ort2-2.xx.fbcdn.net/v/t34.0-12/26694011_146409046151179_1266355967_n.jpg?_nc_ad=z-m&_nc_cid=0&oh=965d0db98acf4c876be8d7d215b5025c&oe=5A54DED8"}
               }]
            }
         }]
   }]

   // MESSENGER PROFILE 'GET STARTED' format:
   [{
      "id":"930551490430908"
      ,"time":1518178011699
      ,"messaging":
         [{
            "recipient":{"id":"930551490430908"}
            ,"timestamp":1518178011699
            ,"sender":{"id":"1680787885293683"}
            ,"postback":{"payload":"start","title":"Get Started"}
         }]
   }]

   // MESSENGER ACCOUNT LINKING EVENT format:
   [{
      "recipient": {
         "id": "930551490430908"
      },
      "timestamp": 1520569982046,
      "sender": {
         "id": "1680787885293683"
      },
      "account_linking": {
         "authorization_code": "164232557702161",
         "status": "linked"
      }
   }]
**/

'use strict';

var pageStatusCodes                          = require("../constants/page-status-codes");
var urlConstants                             = require('../constants/urls');
var msgConstants                             = require('../constants/general-messages');
const localeCodes                            = require('./constants/MessengerLocales');
const attachmentTypes                        = require('./constants/MessengerAttachmentTypes');
const postbackEvents                         = require('./constants/MessengerPostbackEvents');
const senderActions                          = require('./constants/MessengerSenderActions');
const templateTypes                          = require('./constants/MessengerTemplateTypes');

const ROUTE_DIR_NAME                         = "/chatbot";

const PAGE_TOKEN                             = process.env.FB_MESSENGER_PAGE_TOKEN;
const VERIFY_TOKEN                           = process.env.FB_MESSENGER_VERIFY_TOKEN;

// https://graph.facebook.com/v2.6/me/messages
const API_URL                                = process.env.FB_MESSENGER_API_URL;

// reference for account linking
// https://developers.facebook.com/docs/messenger-platform/identity/account-linking
const API_BASE_URL                           = "https://graph.facebook.com/";
const API_VERSION                            = "v2.6/";
const API_PROCESS_ME                         = "me";

// https://developers.facebook.com/docs/messenger-platform/reference/messenger-profile-api
const API_PROFILE                            = "messenger_profile";

const API_FIELDS                             = "first_name,last_name,profile_pic,locale,timezone,gender";

const HUB_JSON_KEY_NAME_TOKEN                = "hub.verify_token";
const HUB_JSON_KEY_NAME_CHALLENGE            = "hub.challenge";

const MSG_KEY_NAME_IS_ECHO                   = "is_echo";

const IS_ECHO                                = false;

const EVT_ACCOUNT_LINKING_STATUS_LINKED      = "linked";
const EVT_ACCOUNT_LINKING_STATUS_UNLINKED    = "unlinked";

var m_request;

//==========================================================
//    STRUCTURES
const StructAccountLinked =
{
   sender_id: ""
   , timestamp: ""
   , facebook_id: ""
};

// TODO:
// Move this outside of this
// for this is not a Messenger Specified Object
const StructMessageObject=
{
   sender_id: ""
   , timestamp: 0 
   , msg: ""   // text | audio URL | image URL
};

// https://developers.facebook.com/docs/messenger-platform/identity/user-profile
const StructUserProfile=
{
   first_name: "",
   last_name: "",
   profile_pic: "",
   locale: localeCodes.ENG_US,
   timezone: 0, // -24 to 24
   gender: "male|female|custom"
};

const StructQuickReplyMessageObject=
{
   text:""
   , quick_replies:[]
};

const StructTemplateGenericMessageObject=
{
   attachment:
   {
      type:"template"
      ,payload:
      {
         template_type:templateTypes.TYPE_GENERIC
         ,elements:[] // enter the elements here
      }
   }
};

//==========================================================
//    CALLBACK METHODS
var m_cfOnMessageReceived;
var m_cfOnQuickReplyReceived;
var m_cfOnImageReceived;
var m_cfOnAudioReceived;
var m_cfOnGetStarted;
var m_cfOnAccountLinked;
var m_cfOnAccountUnlinked;
var m_cfOnCustomPostbackPayload;

//==========================================================
//    PRIVATE METHODS
function log(p_string)
{
   // put in a separate function
   // so that maybe in the future
   // when there is a switch for
   // debug mode, it can handle
   // wether to show the log or not'
   //console.log("messenger module::" + p_string);
}

function processPostRequest(p_postData)
{
   m_request
   (
      {
         uri: API_URL
         , qs: { access_token: PAGE_TOKEN }
         , method: 'POST'
         , json: p_postData
      }
      , function (p_err, p_res, p_body)
      {
         if (!p_err && p_res.statusCode == pageStatusCodes.STATUS_OK)
         {
            var _recipientId = p_body.recipient_id;
            var _msgId = p_body.message_id;
            log("processPostRequest(), SUCCESS");
         } else {
            log("processPostRequest(), FAILED");
         }
      }
   );
}

// https://developers.facebook.com/docs/messenger-platform/send-messages/sender-actions
/**
 * Sends Sender Action Request
 * @param {String} p_recipientId 
 * @param {Object} p_senderActionObj 
 */
function sendSenderActionRequest(p_recipientId, p_senderActionObj)
{
   var _senderActionObj = {};
      _senderActionObj.recipient = p_recipientId;
      _senderActionObj.sender_action = p_senderActionObj;

   processPostRequest( _senderActionObj );
}

/**
* Sends Message Request to a Messenger User
* @param p_recipientId     Messenger Page Scoped Id of User (PSID)
* @param p_messageObject   Structure of a Message Object
**/
function sendRequest(p_recipientId, p_messageObject)
{
   log
   (
      "sendRequest(), "
      + p_recipientId
      + "|"
      + JSON.stringify(p_messageObject)
   );

   var _arrMsgData = {};
      _arrMsgData.recipient = { id: p_recipientId };
      _arrMsgData.message = p_messageObject;

   log( "sendRequest(), Message Object:" + JSON.stringify(_arrMsgData) );
   processPostRequest( _arrMsgData );

   /*m_request
   (
      {
         uri: API_URL
         , qs: { access_token: PAGE_TOKEN }
         , method: 'POST'
         , json: _arrMsgData
      }
      , function (p_err, p_res, p_body)
      {
         if (!p_err && p_res.statusCode == pageStatusCodes.STATUS_OK)
         {
            var _recipientId = p_body.recipient_id;
            var _msgId = p_body.message_id;
            log("sendRequest(), SUCCESS");
         } else {
            log("sendRequest(), FAILED");
         }
      }
   );*/
}

/**
* a reference method for preparing the response with messenger's correct format
**/
function processResponse(p_recipientId, p_msg, p_imgUrl)
{
   var _msgObj;

   if (p_imgUrl !== undefined && p_msg !== undefined)
   {
      // use generic template to send a text and image
      _msgObj =
      {
         attachment:
         {
            type: "template"
            , payload:
            {
               template_type: "generic"
               , elements:
               [{
                  title: p_msg
                  , image_url: p_imgUrl
                  , subtitle: p_msg
               }]
            }
         }
      };
   } 
   else
   {
      // send a picture
      if (p_imgUrl !== undefined)
      {
         _msgObj =
         {
            attachment:
            {
               type: attachmentTypes.TYP_IMG
               , payload: { url: p_imgUrl }
            }
         };
      }
      // others
      else 
      {
         // send a plain text
         _msgObj = { text: p_msg };
      }
   }


   sendRequest(p_recipientId, _msgObj);
}

/**
* method for checking
* fb webhook messaging event object sent
* is a text, image, audio or etc...
**/
/*function processMessage(p_msg)
{
   log("processMessage(), p_msg=" + JSON.stringify(p_msg));

   var _obj;

   if (p_msg.message.text !== undefined)//message is text
   {
      if(p_msg.message.quick_reply!==undefined){
         _obj =
         {
            sender_id: p_msg.sender.id
            , timestamp: p_msg.timestamp
            , msg: p_msg.message.quick_reply
         };
         if(m_cfOnQuickReplyReceived!==undefined){
            m_cfOnQuickReplyReceived(_obj);
         }
      }else{
         _obj =
         {
            sender_id: p_msg.sender.id
            , timestamp: p_msg.timestamp
            , msg: p_msg.message.text
         };
         if(m_cfOnMessageReceived!==undefined){
            m_cfOnMessageReceived(_obj);
         }
      }
   }
   else if( p_msg.message.attachments !== undefined)//message has media attachments
   {
      for(var i=0; i<p_msg.message.attachments.length; i++)
      {
         if(p_msg.message.attachments[i].type===attachmentTypes.TYP_IMG)
         {
            _obj =
            {
               sender_id: p_msg.sender.id
               , timestamp: p_msg.timestamp
               , msg: p_msg.message.attachments[i].payload.url
            };
            if(m_cfOnImageReceived!==undefined){
               m_cfOnImageReceived(_obj);
            }
         }
         else if(p_msg.message.attachments[i].type===attachmentTypes.TYP_AUD)
         {
            _obj =
            {
               sender_id: p_msg.sender.id
               , timestamp: p_msg.timestamp
               , msg: p_msg.message.attachments[i].payload.url
            };
            if(m_cfOnAudioReceived!==undefined){
               m_cfOnAudioReceived(_obj);
            }
         }
         else
         {
            log("ERROR! no handler yet for type '" 
            + p_msg.message.attachments[i].type + "'" );
         }
      }
   }
   else
   {
      log("processMessage() ERROR! no handler for this object" );
   }
}*/
function processMessage(p_msg)
{
   log("processMessage(), p_msg=" + JSON.stringify(p_msg));

   var _obj = Object.create(StructMessageObject);
      _obj.sender_id=p_msg.sender.id;
      _obj.timestamp=p_msg.timestamp;

   if (p_msg.message.text !== undefined)//message is text
   {
      if(p_msg.message.quick_reply!==undefined){
         _obj.msg=p_msg.message.quick_reply.payload;
         if(m_cfOnQuickReplyReceived!==undefined){
            m_cfOnQuickReplyReceived(_obj);
         }
      }else{
         _obj.msg=p_msg.message.text;
         if(m_cfOnMessageReceived!==undefined){
            m_cfOnMessageReceived(_obj);
         }
      }
   }
   else if( p_msg.message.attachments !== undefined)//message has media attachments
   {
      for(var i=0; i<p_msg.message.attachments.length; i++)
      {
         if(p_msg.message.attachments[i].type===attachmentTypes.TYP_IMG)
         {
            _obj.msg=p_msg.message.attachments[i].payload.url;
            if(m_cfOnImageReceived!==undefined){
               m_cfOnImageReceived(_obj);
            }
         }
         else if(p_msg.message.attachments[i].type===attachmentTypes.TYP_AUD)
         {
            _obj.msg=p_msg.message.attachments[i].payload.url;
            if(m_cfOnAudioReceived!==undefined){
               m_cfOnAudioReceived(_obj);
            }
         }
         else
         {
            log("ERROR! no handler yet for type '" 
            + p_msg.message.attachments[i].type + "'" );
         }
      }
   }
   else
   {
      log("processMessage() ERROR! no handler for this object" );
   }
}

/**
* method for processing Messenger profile postback
* @param p_postback message object
**/
function processPostback(p_postback)
{
   //log("processPostback(), p_postback=" + JSON.stringify(p_postback));
   var _obj = Object.create(StructMessageObject)
      _obj.sender_id = p_postback.sender.id;
      _obj.timestamp = p_postback.timestamp;
      _obj.msg = p_postback.postback;

   if( p_postback.postback.title===postbackEvents.EVT_GET_STARTED )
   {
      if(m_cfOnGetStarted!==undefined)
         m_cfOnGetStarted(_obj);
   }
   else if( p_postback.postback.title!==postbackEvents.EVT_GET_STARTED )
   {
      if( m_cfOnCustomPostbackPayload!==undefined ){
         m_cfOnCustomPostbackPayload( p_postback.postback.payload, _obj);
      }
   }
   else
   {
      log("processMessage() ERROR! no handler yet for postback event " + JSON.stringify(p_postback) );
   }
}

/**
* method for processing Messenger account linked event
* @param p_obj  message object
**/
function processAccountLinked(p_obj)
{
   log("processAccountLinking(), p_obj=" + JSON.stringify(p_obj) );
   /*var _obj =
   {
      sender_id: p_obj.sender.id
      , timestamp: p_obj.timestamp
      , facebook_id: p_obj.account_linking.authorization_code
   };*/
   var _obj = Object.create(StructAccountLinked);
      _obj.sender_id=p_obj.sender.id;
      _obj.timestamp=p_obj.timestamp;
      _obj.facebook_id=p_obj.account_linking.authorization_code;

   if(m_cfOnAccountLinked)
   {
      m_cfOnAccountLinked(_obj);
   }
}

/**
* method for processing Messenger account unlinked event
* @param p_obj  message object
**/
function processAccountUnlinked(p_obj)
{
   log("processAccountUnlinked(), p_obj=" + JSON.stringify(p_obj) );
   var _obj =
   {
      sender_id: p_obj.sender.id
      , timestamp: p_obj.timestamp
   };
   if(m_cfOnAccountUnlinked)
   {
      m_cfOnAccountUnlinked(_obj);
   }
}

/**
* handles event passed from messenger
**/
function handleEvent(p_evt)
{
   log("handleEvent(), p_evt=" + JSON.stringify(p_evt));

   if (IS_ECHO)
   {
      if (p_evt[0].message !== undefined)
      {
         m_funcSendText
         (
            p_evt[0].sender.id
            , p_evt[0].message.text
         );
      }
   }
   else
   {
      if (p_evt[0].message !== undefined)
      {
         if (p_evt[0].message[MSG_KEY_NAME_IS_ECHO] !== true)
         {
            processMessage(p_evt[0]);
         }
      }
      else if(p_evt[0].postback !== undefined)
      {
         processPostback(p_evt[0]);
      }
      else if(p_evt[0].account_linking !== undefined)
      {
         if(p_evt[0].account_linking.status===EVT_ACCOUNT_LINKING_STATUS_LINKED)
         {
            processAccountLinked(p_evt[0]);
         }
         else if(p_evt[0].account_linking.status===EVT_ACCOUNT_LINKING_STATUS_UNLINKED)
         {
            processAccountUnlinked(p_evt[0]);
         }
      }
      else
      {
         log("handleEvent() ERROR! no handler for event " + JSON.stringify(p_evt));
      }
   }
}

function handleStandbyEvent(p_evt)
{
   log("handleStandbyEvent(), p_evt=" + JSON.stringify(p_evt));
}

//==========================================================
//    PUBLIC METHODS
var m_funcRegisterOnMessageReceivedCallback = function (p_callbackFunction)
{
   m_cfOnMessageReceived = p_callbackFunction;
};

/**
 * @returns {Function} CallbackFunction( StructMessageObject ), StructMessageObject.msg=<PAYLOAD_VALUE_PASSED>
 */
var m_funcRegisterOnQuickReplyReceivedCallback = function(p_callbackFunction)
{
   m_cfOnQuickReplyReceived = p_callbackFunction;
};

/**
 * @param {Function} p_callbackFunction CallbackFunction( StructMessageObject )
 */
var m_funcRegisterOnImageReceivedCallback = function (p_callbackFunction)
{
   m_cfOnImageReceived = p_callbackFunction;
};

/**
 * @param {Function} p_callbackFunction CallbackFunction( StructMessageObject )
 */
var m_funcRegisterOnAudioReceivedCallback = function(p_callbackFunction)
{
   m_cfOnAudioReceived = p_callbackFunction;
};

var m_funcRegisterGetStartedCallback = function(p_callbackFunction)
{
   m_cfOnGetStarted = p_callbackFunction;
};

/**
 * @param {*} p_callbackFunction Function( StructAccountLinked ) 
 */
var m_funcOnAccountLinkedCallback = function(p_callbackFunction)
{
   m_cfOnAccountLinked = p_callbackFunction;
};

var m_funcOnAccountUnlinkedCallback = function(p_callbackFunction)
{
   m_cfOnAccountUnlinked = p_callbackFunction;
};

var m_funcSendText = function (p_recipientId, p_msg)
{
   sendRequest(p_recipientId, { text: p_msg });
};

/**
 * @param {Function} p_callbackFunction
 * @returns {Function} CallbackFunction( Payload Value, StructMessageObject )
 */
var m_funcRegisterOnCustomPostbackPayloadCallback = function(p_callbackFunction)
{
   m_cfOnCustomPostbackPayload = p_callbackFunction;
};

/**
 * TODO:
 * organize the parameter as to make one all params in one object
 * 
 * A general method for replying to user
 * @param p_recipientId    the FB user's FB user's messenger scoped ID
 * @param p_msgObject      the message object to be sent in format:
 *                         {
 *                            text:[VALUE]
 *                            ,imageUrl:[VALUE]
 *                         }
 */
var m_funcReply = function(p_recipientId, p_msgObject)
{
   processResponse(p_recipientId, p_msgObject.text, p_msgObject.imageUrl);
};

/**
 * Creates a URL button in Messenger chat box
 * @param {String} p_recipientId the messenger scoped ID of user
 * @param {String} p_buttonName button name
 * @param {String} p_stringUrl URL to go to when button is clicked
 */
var m_funcShowUrlButton = function(p_recipientId, p_buttonName, p_stringUrl)
{
   log
   (
      "m_funcShowUrlButton(), p_recipientId=" + p_recipientId 
      + "|p_buttonName=" + p_buttonName
      + "|p_stringUrl=" + p_stringUrl
   );
   var _msgObj =
   {
      attachment:
      {
         type: "template"
         , payload:
         {
            template_type: "button"
            , text: p_buttonName
            , buttons:
               [
                  {
                     type: "web_url"
                     , url: p_stringUrl
                     , title: p_buttonName
                  }
               ]
         }
      }
   };

   sendRequest(p_recipientId, _msgObj);
};

/**
 * Creates a URL button in Messenger chat box
 * @param {"Messenger_User_ID"} p_recipientId the messenger scoped ID of user
 * @param {String} p_buttonName button name
 * @param {String} p_stringUrl URL to go to when button is clicked
 */
var m_funcShowAccountLinkButton = function(p_recipientId, p_buttonName, p_stringUrl)
{
   var _msgObj =
   {
      attachment:
      {
         type: "template"
         , payload:
         {
            template_type: "button"
            , text: p_buttonName
            , buttons:
               [
                  {
                     type: "account_link"
                     , url: p_stringUrl
                  }
               ]
         }
      }
   };

   sendRequest(p_recipientId, _msgObj);
};

var m_funcShowAccountUnlinkButton = function(p_recipientId, p_buttonName)
{
   var _msgObj =
   {
      attachment:
      {
         type: "template"
         , payload:
         {
            template_type: "button"
            , text: p_buttonName
            , buttons:
               [
                  {
                     type: "account_unlink"
                  }
               ]
         }
      }
   };

   sendRequest(p_recipientId, _msgObj);
};

var m_funcGetAccountLinkingUri = function()
{
   return API_BASE_URL + API_VERSION
      + "me?access_token=" + PAGE_TOKEN 
      + "&fields=recipient&account_linking_token=";
};

/**
 * Initializer method for Module
 * 
 * @param p_app        the application context
 * @param p_request    the request variable
 */
var m_funcInitialize = function (p_app, p_request)
{
   m_request = p_request;

   /**
   * this is needed for the initial setup of the chatbot
   **/
   p_app.get
   (
      ROUTE_DIR_NAME
      , function (p_req, p_res)
      {
         log("get(), p_req.body=" + JSON.stringify(p_req.body));
         if (p_req.query[HUB_JSON_KEY_NAME_TOKEN] === VERIFY_TOKEN)
         {
            p_res.status(pageStatusCodes.STATUS_OK).send(p_req.query[HUB_JSON_KEY_NAME_CHALLENGE]);
         }
         else
         {
            p_res.sendStatus(pageStatusCodes.STATUS_FORBIDDEN);
         }
      }
   );

   /**
   * this is where all messages from different users goes in
   * once the chatbot had been already been setup properly
   **/
   p_app.post
   (
      ROUTE_DIR_NAME
      , function (p_req, p_res) 
      {
         log("post(), p_req.body=" + JSON.stringify(p_req.body));
         var _body = p_req.body;

         if (_body.object === 'page')
         {
            var _entries = p_req.body.entry;
            for (var _entry in _entries)
            {
               if (_entries[_entry].messaging !== undefined)
               {
                  handleEvent(_entries[_entry].messaging);
               } else {
                  //handleEvent(_entries[_entry].standby);
                  handleStandbyEvent(_entries[_entry].standby);
               }
            }

            p_res.sendStatus(pageStatusCodes.STATUS_OK);
         }
         else
         {
            p_res.sendStatus(pageStatusCodes.STATUS_ERROR);
         }
      }
   )
};

// Reference:
// https://developers.facebook.com/docs/messenger-platform/identity/user-profile
/**
 * Gets the Messenger User Info (If they had been allowed to be displayed by the user)
 * @param {String} p_messengerId 
 * @param p_callbackFunction ( StructUserInfo or null )
 */
var m_funcGetMessengerUserInfoByMessengerId = function(p_messengerId, p_callbackFunction)
{
   log( "m_funcGetMessengerUserInfoByMessengerId(), p_messengerId=" + p_messengerId );

   var _url = API_BASE_URL + API_VERSION
      +p_messengerId
      +"?fields=" + API_FIELDS
      + "&access_token=" + PAGE_TOKEN;

   log("m_funcGetUserInfoByMessengerId(), _url=" + _url);

   m_request
   (
      _url
      , function (p_err, p_res, p_body)
      {
         if( !p_err ){
            p_callbackFunction(JSON.parse(p_body));
         }else{
            log( "m_funcGetMessengerUserInfoByMessengerId(), Error:" + p_err );
            p_callbackFunction(null);
         }
      }
   );
};
// Reference:
// https://developers.facebook.com/docs/messenger-platform/identity/user-profile
/**
 * The promise version of getting Messenger User's info by messenger ID
 * @param {String} p_messengerId
 * @returns {Object} StructUserProfile
 */
var m_funcGetPromisedMessengerUserInfoByMessengerId = function(p_messengerId)
{
   return new Promise
   (
      function(p_resolve, p_reject)
      {
         var _url = API_BASE_URL + API_VERSION
            + p_messengerId
            + "?fields=" + API_FIELDS
            + "&access_token=" + PAGE_TOKEN;
         m_request
         (
            _url
            , function (p_err, p_res, p_body)
            {
               if(!p_err){
                  p_resolve( JSON.parse(p_body) );
               }else{
                  p_reject( p_err );
               }
            }
         );
      }
   )
};

// NOTE:
// This only works on Android. On iOS, the text and image will be displayed, but the browser will not close automatically.
// based on here, https://developers.facebook.com/docs/messenger-platform/webview#close
/**
 * Will return a URL that when you redirect to that URL, it will close the Messenger Initiated WebView/Window
 */
var m_funcGetCloseWebViewRedirectUrl = function()
{
   return "https://www.messenger.com/closeWindow"
      + "?image_url=" + urlConstants.URL_MESSENGER_CLOSE_WEBVIEW
      + "&display_text=" + msgConstants.MSG_MESSENGER_CLOSE_WEBVIEW;
};

// https://developers.facebook.com/docs/messenger-platform/send-messages/sender-actions
/**
 * shows an ellipsis text in the chatbox
 * like copying the behavior of someone is typing
 * @param {Boolean} p_isTyping 
 */
var m_funcSetIsTyping = function(p_messengerId, p_isTyping)
{
   sendSenderActionRequest
   (
      p_messengerId
      , (p_isTyping)?senderActions.ACT_TYPING_ON:senderActions.ACT_TYPING_OFF 
   );
};
/**
 * shows an ellipsis text in the chatbox
 * like copying the behavior of someone is typing
 * @param {Boolean} p_isTyping 
 */
var m_funcPromiseSetIsTyping = function(p_messengerId, p_isTyping)
{
   return new Promise
   (
      function(p_resolve, p_reject)
      {
         try
         {
            m_funcSetIsTyping(p_messengerId, p_isTyping);
            p_resolve(1);
         }
         catch(err)
         {
            p_reject(0);
         }
      }
   );
}

// https://developers.facebook.com/docs/messenger-platform/send-messages/quick-replies/
/**
 * Used when you want to send multiple Quick Replies
 * For constructing of Quick Reply Objects, please refer to
 * messenger/structures/MessengerQuickReplyTypeStructures.js
 * 
 * @param {String} p_messengerId
 * @param {String} p_headerTitle
 * @param {Array} p_arrQuickReplyTypeStructures An Array composed of 'messenger/structures/MessengerQuickReplyTypeStructures.js'
 */
var m_funcSendQuickReplies = function(p_messengerId, p_headerTitle, p_arrQuickReplyTypeStructures)
{
   var _msgObj = Object.create( StructQuickReplyMessageObject );
      _msgObj.text=p_headerTitle;
      _msgObj.quick_replies=p_arrQuickReplyTypeStructures;

   log( "m_funcSendQuickReply(), Message Object:" + JSON.stringify(_msgObj) );
   sendRequest( p_messengerId, _msgObj );
};

// https://developers.facebook.com/docs/messenger-platform/send-messages/template/generic
/**
 * Used when you want to send a single element of a generic template
 * or more to create a carousel of elements
 * 
 * @param {String} p_messengerId
 * @param {Array} p_structGenericTemplatePayloadElement An Array composed of 'messenger/structures/MessengerTemplatePayloadElementStructure.js'
 */
var m_funcSendGenericTemplates = function(p_messengerId, p_structGenericTemplatePayloadElement)
{
   var _msgObj = Object.assign({},StructTemplateGenericMessageObject);
      _msgObj.attachment.payload.elements=p_structGenericTemplatePayloadElement;

   log( "m_funcSendGenericTemplates(), Message Object:" + JSON.stringify(_msgObj) );
   sendRequest( p_messengerId, _msgObj );
};



module.exports =
{
   StructMessageObject                       :  StructMessageObject
   , sendText                                :  m_funcSendText
   , reply                                   :  m_funcReply
   , registerOnMessageReceivedCallback       :  m_funcRegisterOnMessageReceivedCallback
   , registerOnQuickReplyReceivedCallback    :  m_funcRegisterOnQuickReplyReceivedCallback
   , registerOnImageReceivedCallback         :  m_funcRegisterOnImageReceivedCallback
   , registerOnAudioReceivedCallback         :  m_funcRegisterOnAudioReceivedCallback
   , registerOnGetStartedCallback            :  m_funcRegisterGetStartedCallback
   , registerOnAccountLinkedCallback         :  m_funcOnAccountLinkedCallback
   , registerOnAccountUnlinkedCallback       :  m_funcOnAccountUnlinkedCallback
   , registerOnCustomPostbackPayloadCallback :  m_funcRegisterOnCustomPostbackPayloadCallback
   , initialize                              :  m_funcInitialize
   , getMessengerUserInfoByMessengerId       :  m_funcGetMessengerUserInfoByMessengerId
   , getPromiseUserInfoByMessengerId         :  m_funcGetPromisedMessengerUserInfoByMessengerId
   , showUrlButton                           :  m_funcShowUrlButton
   , showAccountLinkButton                   :  m_funcShowAccountLinkButton
   , showAccountUnlinkButton                 :  m_funcShowAccountUnlinkButton
   , getAccountLinkingUri                    :  m_funcGetAccountLinkingUri
   , getCloseWebViewRedirectUrl              :  m_funcGetCloseWebViewRedirectUrl
   , setIsTyping                             :  m_funcSetIsTyping
   , promiseSetIsTyping                      :  m_funcPromiseSetIsTyping
   , sendQuickReplies                        :  m_funcSendQuickReplies
   , sendGenericTemplates                    :  m_funcSendGenericTemplates
};