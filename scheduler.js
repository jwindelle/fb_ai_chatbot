/**
*
*
*        SCHEDULER MODULE
*
*
*
*  This module is used like a timer
*  Reference:
*  https://github.com/kelektiv/node-cron
*
*
*  @author  Jan Windelle Manalaysay
*  @date    2018/05/12
*  @email   jan.manalaysay@12u12.com
*
**/

'use strict';

var CCron                     = require('cron').CronJob;

//==========================================================
//    CONSTANT VARIABLES
// if you're going to change this,
// please change also the value returned by the 'm_currTimeSinceStarted'
//const M_TIMER_INTERVAL        = '*/1 * * * * *'; // 1 sec
const M_TIMER_INTERVAL        = '0 */1 * * * *'; // 1 min

//==========================================================
//    CALLBACK VARIABLES
var m_cfOnUpdate=null;

//==========================================================
//    VARIABLES
var m_isRunning=false;
var m_currTimeSinceStarted=0;
var m_job=new CCron
(
   M_TIMER_INTERVAL
   , function()
   {
      m_currTimeSinceStarted++;
      m_cfOnUpdate(m_currTimeSinceStarted);
   }
   , null
   , false
);

//==========================================================
//    PRIVATE METHODS
function log(p_string)
{
   // put in a separate function
   // so that maybe in the future
   // when there is a switch for
   // debug mode, it can handle
   // wether to show the log or not'
   console.log("scheduler module::" + p_string);
}

//==========================================================
//    PUBLIC METHODS
/**
 * @param {Function} p_callbackFunction CallbackFunction( time measurement since started )
 */
var m_funcRegisterOnUpdateCallbackFunction = function(p_callbackFunction)
{
   m_cfOnUpdate = p_callbackFunction;
};

var m_funcStart = function()
{
   if( m_cfOnUpdate!=null && !m_isRunning ){
      m_job.start();
      m_isRunning=true;
   }
};

var m_funcStop = function(){
   if(m_isRunning){
      m_job.stop();
      m_isRunning=false;
   }
};

/**
 * Resets the current time
 */
var m_funcReset = function()
{
   m_currTimeSinceStarted = 0;
};

module.exports=
{
   isRunning                           :  m_isRunning
   , start                             :  m_funcStart
   , stop                              :  m_funcStop
   , reset                             :  m_funcReset
   , registerOnUpdateCallbackFunction  :  m_funcRegisterOnUpdateCallbackFunction
};