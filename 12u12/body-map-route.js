/**
*
*
*        12U12 BODY MAP ROUTE MODULE
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

const M_ROUTE              = "/bodymap";
var cbOnSymptomSent        = null;

//==========================================================
//    PRIVATE METHODS
function log(p_string)
{
   // put in a separate function
   // so that maybe in the future
   // when there is a switch for
   // debug mode, it can handle
   // wether to show the log or not'
   console.log("body-map route module::" + p_string);
}

//==========================================================
//    PUBLIC METHODS
// TODO:
// have the frontend fixed the problem of the value for the key becoming blank when redirected
var m_funcInitialize = function(p_app, p_request)
{
   p_app.get
   (
      M_ROUTE,
      function(p_req, p_res)
      {
         log( "initialize(), Request Query:" + JSON.stringify(p_req.query) );
         if( cbOnSymptomSent!=null ){
            cbOnSymptomSent( p_req, p_res );
         }
      }
   );
};

var m_funcRegisterOnSymptomSentCallbackFunction = function( p_callbackFunction )
{
   cbOnSymptomSent = p_callbackFunction;
};


module.exports =
{
   initialize                                   :  m_funcInitialize
   , registerOnSymptomSendCallbackFunction      :  m_funcRegisterOnSymptomSentCallbackFunction
};