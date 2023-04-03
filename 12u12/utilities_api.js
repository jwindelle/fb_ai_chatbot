/**
*
*
*        12U12 UTILITIES API MODULE
*
*
*
* @author   Jan Windelle Manalaysay
* @date     2018/02/27
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

const urlConstants            = require( '../constants/urls' );

const API_URL                 = urlConstants.URL_TOOLS_API_BASE;
const URL_PARAM_ID            = process.env.UTILS_API_PARAM_ID;
const URL_PARAM_TOKEN         = process.env.UTILS_API_PARAM_TOKEN;
const URL_PARAM_BARCODE_IMAGE = process.env.UTILS_API_PARAM_BARCODE_IMAGE;

const API_PROCESS_TEST        = 0;
const API_PROCESS_BARCODE     = 1;

var pageStatusCodes           = require("../constants/page-status-codes");
var m_request;

function log(p_string)
{
   console.log("12u12utils module::" + p_string);
}

/**
 * handles a test Utils API call
 * @param {String} p_param    a sample parameter
 * @param {Function} p_callback ( String or Page Error Number )
 */
function handleProcessTest(p_param, p_callback)
{
   log("handleProcessTest, p_param=" + p_param + "|p_callback=" + p_callback);
   var _apiUrl
      = API_URL
      + "?" + URL_PARAM_ID + "="
      + "passed_param:"
      + "&" + URL_PARAM_TOKEN + "="
      + p_param;

   m_request
   (
      _apiUrl
      , function(p_err, p_res, p_body)
      {
         if (!p_err && p_res.statusCode === pageStatusCodes.STATUS_OK){
            p_callback(p_body);
         }else{
            log(p_err);
            p_callback(pageStatusCodes.STATUS_ERROR);
         }
      }
   );
}

/**
 * handles the process for barcode reading
 * @param p_param    an image URL
 * @param p_callback function that will be called after process
 */
function handleProcessBarcodeRead(p_param, p_callback)
{
   var _apiUrl
      = API_URL
      + "?" + URL_PARAM_BARCODE_IMAGE + "="
      + p_param;

   m_request
   (
      _apiUrl
      , function(p_err, p_res, p_body)
      {
         if(!p_err && p_res.statusCode===pageStatusCodes.STATUS_OK){
            p_callback(p_body);
         }else{
            p_callback(pageStatusCodes.STATUS_ERROR);
         }
      }
   );
}

//==========================================================
//    PUBLIC METHODS
var m_funcInitialize = function(p_app, p_request)
{
   m_request = p_request;
};

/**
 * 
 * @param {'utilities constants'} p_processId   e.g. utilities.API_PROCESS_TEST
 * ,utilities.API_PROCESS_BARCODE, etc.
 * @param {*} p_param 
 * @param {Function} p_callback (String or Page Status Number)
 */
var m_funcProcess = function(p_processId, p_param, p_callback)
{
   log("m_funcProcess, p_processId=" + p_processId + "|p_param=" + "|p_callback=" + p_callback);

   switch(parseInt(p_processId))
   {
      case API_PROCESS_TEST:
      {
         handleProcessTest(p_param, p_callback);
         break;
      }

      case API_PROCESS_BARCODE:
      {
         handleProcessBarcodeRead(p_param, p_callback);
         break;
      }

      default:
      {
         p_callback("No API call selected");
         break;
      }
   }
};

module.exports =
{
   /**
    * This is a sample process that if the request returns back
    * the passed argument, then that means that the connection with
    * server is successful
    */
   PROCESS_ID_TEST : API_PROCESS_TEST
   /**
    * This will return the barcode string of the sent image
    */
   , PROCESS_ID_BARCODE : API_PROCESS_BARCODE
   , initialize : m_funcInitialize
   , process : m_funcProcess
};