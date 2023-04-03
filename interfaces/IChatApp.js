/**
*
*
*        CHAT APP INTERFACE MODULE
*
*        This module will interface all communications with a Chat Application
*
*        @author   Jan Windelle Manalaysay
*        @date     2018/10/12
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

const ChatAppTypes = require('../constants/ChatAppTypes');

var m_chatApp;

//==========================================================
//    CALLBACK METHODS
var m_cfOnMessageReceived;
var m_cfOnQuickReplyReceived;
var m_cfOnImageReceived;
var m_cfOnAudioReceived;
var m_cfOnGetStarted;

//==========================================================
//    PRIVATE METHODS
function log(p_string)
{
   // put in a separate function
   // so that maybe in the future
   // when there is a switch for
   // debug mode, it can handle
   // wether to show the log or not'
   console.log("IChatApp module::" + p_string);
}

//==========================================================
//    PUBLIC METHODS

var m_funcInitialize = function(){};

/**
 * 
 * @param {'../constants/ChatAppTypes.js'} p_chatAppType
 */
var m_funcSetChatApplication = function(p_chatAppType)
{
   switch( p_chatAppType )
   {
      default:
      case ChatAppTypes.TYPE_MESSENGER:
      {
         m_chatApp = require('../messenger/messenger');
         break;
      }

      case ChatAppTypes.TYPE_WECHAT:
      {
         m_chatApp = require('../wechat/wechat');
      }
   }
};

/**
 * 
 * @param {'../12u12/structures/12u12MessageObjectStructure.js'} p_msgObj
 */
var m_funcSendText = function(p_msgObj)
{
   let _msgObj = require('../12u12/structures/12u12MessageObjectStructure');
      _msgObj.sender_id=p_msgObj.sender_id;
      _msgObj.timestamp=p_msgObj.timestamp;
      _msgObj.msg=p_msgObj.msg;
   m_chatApp.sendText( _msgObj );
};


module.exports={
   initialize                          :  m_funcInitialize,
   setChatApplication                  :  m_funcSetChatApplication,
   sendText                            :  m_funcSendText
}