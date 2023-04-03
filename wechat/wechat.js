/**
*
*
*        WECHAT MODULE
*
*
*
*  This module is in-charge of all wechat chatbot functionalities
*
*
*  @author  Jan Windelle Manalaysay
*  @date    2018/10/12
*  @email   jan.manalaysay@12u12.com
*
*
**/

'use strict';

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
   console.log("wechat module::" + p_string);
}

//==========================================================
//    PUBLIC METHODS
var m_funcInitialize = function(){
   log("m_funcInitialize() called");
}


module.exports={
   initialize : m_funcInitialize
}