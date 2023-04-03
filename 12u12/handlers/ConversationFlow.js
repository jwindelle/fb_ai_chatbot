/**
*
*
*        12U12 CONVERSATION FLOW MODULE
*
*        This module will handle all custom handling of responses
*        for different kinds of user inputs
*        e.g. Text and Transcribed Audio sent
*
*
*        @author   Jan Windelle Manalaysay
*        @date     2018/10/08
*        @email    jan.manalaysay@12u12.com
*
*
**/

/*jslint devel: true */
/*global
alert, confirm, console, prompt, process, require, arguments, log
*/
/*jslint indent: false */
/*jslint white: true */
/*jslint node: true */

'use strict';

const USER_Y = "y";
const USER_N = "n";
const USER_YES = "yes";
const USER_NO  = "no";
const USER_CHOICE_NONE = "none";

const m_StringSeparators=Object.freeze({
   BLANK          :  " "
   , COMMA        :  ","
   , UNDERSCORE   :  "_" // used for separating payload keys to payload values
});
const m_States=Object.freeze({
   START:"START"
   , FOOD_INPUT:"FOOD_INPUT"
   , FOOD_INPUT_STAGE_SEARCH : "FOOD_INPUT_STAGE_SEARCH"
   , FOOD_INPUT_STATE_CHOOSE : "FOOD_INPUT_STATE_CHOOSE"
   , FOOD_INPUT_CONFIRM : "FOOD_INPUT_CONFIRM"
   , FOOD_CONFIRMED : "FOOD_CONFIRMED"
});
const StructFoodEntry=
{
   food_name : ""
   , measurement : ""
   , unit : 0
};
const StructUserInfo=
{
   state:""
   , food_input:[]
   , food_choices:[]
   , food_input_confirmed:[]
};

const MessageConstants     = require('../../constants/general-messages');
const PayloadKeys          =  require('../constants/PayloadKeys');

var m_msgr                 = require('../../messenger/messenger');
var m_restApi              = require('../restapi');

var m_usersMap             = new Map();

//==========================================================
//    PRIVATE METHODS
function log(p_string)
{
   // put in a separate function
   // so that maybe in the future
   // when there is a switch for
   // debug mode, it can handle
   // wether to show the log or not'
   console.log("conversation flow module::" + p_string);
}

function initUserState(p_msgrUserId)
{
   var _struct = Object.assign({},StructUserInfo);
      _struct.state = m_States.START;
   log("initUserState(), _struct=" + JSON.stringify(_struct));
   m_usersMap.set(p_msgrUserId, _struct);
}
function resetUserState(p_msgrUserId)
{
   m_usersMap.delete(p_msgrUserId);
}

function createQuickRepliesText(p_msgrUserId, p_title, p_arr)
{
   var _sQuickReplyTxt = require('../../messenger/structures/MessengerQuickReplyTypeStructures').StuctText;
   var _arr=[];
   for( var i=0; i<p_arr.length; i++ )
   {
      var _obj = Object.assign({}, _sQuickReplyTxt);
         _obj.title=_arr[j];
         _obj.payload=
            PayloadKeys.KEY_CONVERSATION_FLOW
            +m_StringSeparators.UNDERSCORE
            +j.toString();
      _arr.push(_obj);
   }
   m_msgr.sendQuickReplies( p_msgrUserId, p_title, _arr);
}

function listSuggestedFoodsByFoodName(p_msgrUserId, p_foodName)
{
   var _title = "will suggest food/s based on " + p_foodName;
   //m_msgr.sendText( p_msgrUserId, _title );

   m_restApi.searchFoodByKeyword(p_foodName, function(r_arr)
   {
      if( r_arr!==undefined )
      {
         //_arr.push(USER_CHOICE_NONE);
         //m_msgr.sendText( p_msgrUserId, "[0] : " + _arr[0] );
         var _arr=[USER_CHOICE_NONE];

         for(var i=0; i<r_arr.length; i++)
         {
            //m_msgr.sendText( p_msgrUserId, "["+(i+1)+"] : " + r_arr[i].recipe );
            _arr.push(r_arr[i].recipe);
         }

         _arr.push(p_foodName);
         //m_msgr.sendText( p_msgrUserId, "["+_arr.length+"] : " + p_foodName );

         var _struct = m_usersMap.get(p_msgrUserId);
            _struct.food_choices = _arr;
            _struct.state = m_States.FOOD_INPUT_STATE_CHOOSE;

         m_usersMap.set( p_msgrUserId, _struct );

         for( var j=0; j<_arr.length; j++ ){
            m_msgr.sendText( p_msgrUserId, "["+j+"] : " + _arr[j] );
         }

         // Messenger Quick Replies
         //createQuickRepliesText(p_msgrUserId, _title, _arr);
         // Messenger Quick Replies
      }
      else
      {
         handleUserStateFoodInputStageSearch( p_msgrUserId );
      }
   });
}

function trace(p_msgrUserId)
{
   var _struct = m_usersMap.get(p_msgrUserId);
   console.log( "ConversationFlow::trace(), state:" + _struct.state );
   //m_msgr.sendText( p_msgrUserId, "state:" + _struct.state );
   console.log( "ConversationFlow::trace(), food input" + _struct.food_input.length );
   //m_msgr.sendText( p_msgrUserId, "food inputs length:" + _struct.food_input.length );
}

//====================================================
// MESSENGER CUSTOM FUNCTIONS
function createMessengerQuickReplyYesNo(p_msgrUserId, p_title)
{
   var _sQuickReplyTxt = require('../../messenger/structures/MessengerQuickReplyTypeStructures').StuctText;
   var _yes = Object.assign({},_sQuickReplyTxt);
      _yes.title=USER_YES;
      _yes.payload=PayloadKeys.KEY_CONVERSATION_FLOW_YES;
   var _no = Object.assign({},_sQuickReplyTxt);
      _no.title=USER_NO;
      _no.payload=PayloadKeys.KEY_CONVERSATION_FLOW_NO;
   m_msgr.sendQuickReplies(p_msgrUserId,p_title,[_yes,_no]);
}

//====================================================
// STATE DEFAULT
function handleUserStateDefault(p_msgrUserId, p_msg)
{
   log( "handleUserStateDefault(), p_msgrUserId:" + p_msgrUserId + "|p_msg:" + p_msg );
   initUserState(p_msgrUserId);
   //m_msgr.sendText(p_msgrUserId, "Hi. Have you eaten already?("+USER_Y+")("+USER_N+")");
   createMessengerQuickReplyYesNo(p_msgrUserId, "Hi. Have you eaten already?");
}
//====================================================
// STATE START
function handleUserStateStart(p_msgrUserId, p_msg)
{
   console.log("ConversationFlow::handleUserStateStart(), p_msg:" + p_msg);
   p_msg = p_msg.toUpperCase();
   if( p_msg===USER_YES.toUpperCase() || p_msg===USER_Y.toUpperCase() ){
      m_msgr.sendText( p_msgrUserId, "That's nice. so what did you have?" );
      var _struct = m_usersMap.get(p_msgrUserId);
         _struct.state = m_States.FOOD_INPUT;
      m_usersMap.set( p_msgrUserId, _struct );
   }else if( p_msg===USER_NO.toUpperCase() || p_msg===USER_N.toUpperCase() ){
      m_msgr.sendText( p_msgrUserId, "OK then, I'll just message you again later :-)" );
      resetUserState(p_msgrUserId);
   }else{
      handleUserStateDefault(p_msgrUserId, p_msg);
   }
}
//====================================================
// STATE FOOD INPUT
/**
 * This handles user input
 * @param {String} p_msgrUserId
 * @param {String} p_msg 
 */
function handleUserStateFoodInput(p_msgrUserId, p_msg)
{
   var _arr = [];
   var _struct = m_usersMap.get( p_msgrUserId );

   if( p_msg.indexOf(m_StringSeparators.COMMA)!==-1 ){
      _arr = p_msg.split(m_StringSeparators.COMMA);
      _struct.food_input = _arr;
      _struct.state = m_States.FOOD_INPUT_STAGE_SEARCH;
      m_usersMap.set(p_msgrUserId, _struct);
      //m_msgr.sendText( p_msgrUserId, "Split User Input:" + _struct.food_input.join(",") );
      handleUserStateFoodInputStageSearch( p_msgrUserId );
   }else{
      if( p_msg.indexOf(m_StringSeparators.BLANK)!==-1 ){
         _arr = p_msg.split(m_StringSeparators.BLANK);
      }else{
         _arr[0] = p_msg;
      }
      _struct.food_input = _arr;
      _struct.state = m_States.FOOD_INPUT_STAGE_SEARCH;
      m_usersMap.set(p_msgrUserId, _struct);
      //m_msgr.sendText( p_msgrUserId, "Split User Input:" + _struct.food_input.join(",") );
      handleUserStateFoodInputStageSearch( p_msgrUserId );
   }
}
// STAGE SEARCH
/**
 * This handles checking of each inputted word from the handleUserStateFoodInput function
 * @param {String} p_msgrUserId 
 */
function handleUserStateFoodInputStageSearch(p_msgrUserId)
{
   var _struct = m_usersMap.get(p_msgrUserId);
   if( _struct.food_input.length>0 )
   {
      //var _foodName = _struct.food_input.pop();
      var _foodName = _struct.food_input.shift();
      //m_msgr.sendText( p_msgrUserId, "_foodName:" + _foodName );
      m_usersMap.set( p_msgrUserId, _struct );
      trace(p_msgrUserId);
      listSuggestedFoodsByFoodName(p_msgrUserId, _foodName);
   }
   else
   {
      m_msgr.sendText( p_msgrUserId, "chosen:"+_struct.food_input_confirmed.join(",") );
      resetUserState(p_msgrUserId);
   }
}
// STAGE CHOOSE
/**
 * This handles the chosen number of user from the suggested list
 * from the listSuggestedFoodsByFoodName function
 * @param {String} p_msgrUserId 
 * @param {String} p_msg 
 */
function handleUserStateFoodInputStageChoose(p_msgrUserId, p_msg)
{
   if( p_msg.indexOf(PayloadKeys.KEY_CONVERSATION_FLOW!==-1) ){
      // usual value would be PAYLOADKEY_PAYLOADVALUE
      p_msg = p_msg.split(m_StringSeparators.UNDERSCORE)[1];
   }

   var _struct = m_usersMap.get(p_msgrUserId);
   try{
      var i = parseInt(p_msg);
      var _chosenFoodName = _struct.food_choices[i];
      if(_chosenFoodName!==undefined)
      {
         m_msgr.sendText( p_msgrUserId, "You chose " + _chosenFoodName );
         if( i>0 )
            _struct.food_input_confirmed.push( _chosenFoodName );
         _struct.state = m_States.FOOD_INPUT_STAGE_SEARCH;
         m_usersMap.set( p_msgrUserId, _struct );
         handleUserStateFoodInputStageSearch(p_msgrUserId);
      }else{
         var _originalFoodToSearch = _struct.food_choices.pop();
         m_msgr.sendText( p_msgrUserId, "You chose none from suggested foods for " + _originalFoodToSearch );
         _struct.state = m_States.FOOD_INPUT_STAGE_SEARCH;
         m_usersMap.set( p_msgrUserId, _struct );
         listSuggestedFoodsByFoodName(p_msgrUserId, "Food name:" + _originalFoodToSearch );
      }
   }
   catch(err)
   {
      m_msgr.sendText( p_msgrUserId, "user reply input error" );
      /*var _originalFoodToSearch = _struct.food_choices.pop();
      _struct.state = m_States.FOOD_INPUT_STAGE_SEARCH;
      m_usersMap.set( p_msgrUserId, _struct );
      listSuggestedFoodsByFoodName(p_msgrUserId, "Food name:" + _originalFoodToSearch );*/
   }
}

function handleUserState(p_msgrUserId, p_msg)
{
   // TODO:
   // compare last input time
   // meaning the user has not responded for a long period of time
   // thus, it is needed that the user ID be removed from the map
   try
   {
      switch( m_usersMap.get(p_msgrUserId).state )
      {
         case m_States.START:
         {
            handleUserStateStart(p_msgrUserId, p_msg);
            break;
         }

         case m_States.FOOD_INPUT:
         {
            handleUserStateFoodInput(p_msgrUserId, p_msg);
            break;
         }

         case m_States.FOOD_INPUT_STAGE_SEARCH:
         {
            handleUserStateFoodInputStageSearch(p_msgrUserId);
            break;
         }

         case m_States.FOOD_INPUT_STATE_CHOOSE:
         {
            handleUserStateFoodInputStageChoose(p_msgrUserId, p_msg);
            break;
         }

         /*default:
         {
            handleUserStateDefault(p_msgrUserId, p_msg);
            break;
         }*/
      }
   }
   catch(err)
   {
      handleUserStateDefault(p_msgrUserId, p_msg);
   }
}
//==========================================================
//    PUBLIC METHODS
/**
 * @param {Object} p_msgrInstance Messenger Instance '../messenger/messenger'
 */
var m_funcSetMessenger = function(p_msgrInstance)
{
   m_msgr = p_msgrInstance;
};

/**
 * @param {String} p_msgrUserId Messenger User ID
 * @param {String} p_msg Messenger User Message
 */
var m_funcHandleMessages = function(p_msgrUserId, p_msg)
{
   if( m_msgr!==undefined )
   {
      if( p_msg==='RESET' )
      {
         m_msgr.sendText( p_msgrUserId, "Conversation reset" );
         resetUserState(p_msgrUserId);
      }
      else if( p_msg===MessageConstants.MSG_CONVERSATION_HANDLER_NOTIFY_USER )
      {
         if( m_usersMap.get(p_msgrUserId)!==undefined ){
            handleUserState(p_msgrUserId, p_msg);
         }
      }
      else
      {
         handleUserState(p_msgrUserId, p_msg);
      }
   }
};

/**
 * This will handle user response that used Messenger Quick Replies
 * @param {String} p_msgrUserId 
 * @param {String} p_msg 
 */
var m_funcHandleQuickReplies = function(p_msgrUserId, p_msg)
{
   console.log("ConversationFlow::m_funcHandleQuickReplies(), p_msg:" + p_msg);
   switch( p_msg )
   {
      case PayloadKeys.KEY_CONVERSATION_FLOW_YES:
      {
         console.log("ConversationFlow::m_funcHandleQuickReplies(), user said YES");
         m_funcHandleMessages( p_msgrUserId, USER_YES );
         break;
      }
      case PayloadKeys.KEY_CONVERSATION_FLOW_NO:
      {
         console.log("ConversationFlow::m_funcHandleQuickReplies(), user said NO");
         m_funcHandleMessages( p_msgrUserId, USER_NO );
         break;
      }
      default:
      {
         console.log("ConversationFlow::m_funcHandleQuickReplies(), user said " + p_msg);
         m_funcHandleMessages( p_msgrUserId, p_msg );
         break;
      }
   }
};


module.exports =
{
   States                     :  m_States
   , setMessenger             :  m_funcSetMessenger
   , handleMessages           :  m_funcHandleMessages
   , handleQuickReplies       :  m_funcHandleQuickReplies
};