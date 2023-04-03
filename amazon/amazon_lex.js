/**
*
*
*        AMAZON LEX MODULE
*
*  This module will handle all Amazon Lex related service
*  https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/LexRuntime.html
*  https://docs.aws.amazon.com/lex/latest/dg/API_Operations_Amazon_Lex_Model_Building_Service.html
*
*  @author  Jan Windelle Manalaysay
*  @date    2018/06/27
*  @email   jan.manalaysay@12u12.com
*
*/

/*jslint devel: true */
/*global
alert, confirm, console, prompt, process, require, arguments, log
*/
/*jslint indent: false */
/*jslint white: true */
/*jslint node: true */

'use strict';

const regionConstants                  = require('./AmazonRegions');

var CAWS                               = require('aws-sdk');
   CAWS.config.update(regionConstants.REG_US_EAST_1);
   // us-east-1 are one of the regions where Lex can be used

// https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/LexRuntime.html
// this is used for the posting text or audio
var awsLexRuntime                      = new CAWS.LexRuntime();

// this is used for configuring a bot
// https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/LexModelBuildingService.html
var awsLexModelBuilding                = new CAWS.LexModelBuildingService();

//====================================================================
// CONSTANTS
//====================================================================
var msgConstants                       = require('../constants/general-messages');
//const BOT_ALIAS                        = "BookTrip";
//const BOT_NAME                         = "BookTrip";
const BOT_ALIAS                        = "FoodPrompt";
const BOT_NAME                         = "FoodPrompt";

//====================================================================
// STRUCTS
//====================================================================
// https://docs.aws.amazon.com/lex/latest/dg/API_runtime_PostContent.html
const m_StructPostContent = {
   botAlias: BOT_ALIAS, /* required */
   botName: BOT_NAME, /* required */
   contentType: 'STRING_VALUE', /* required */
   inputStream: '',//new Buffer('...') || 'STRING_VALUE' || streamObject, /* required */
   userId: 'STRING_VALUE', /* required */
   accept: 'STRING_VALUE',
   requestAttributes: 'any', /* This value will be JSON encoded on your behalf with JSON.stringify() */
   sessionAttributes: 'any' /* This value will be JSON encoded on your behalf with JSON.stringify() */
};
const m_StructPostContentResponse={};


//https://docs.aws.amazon.com/lex/latest/dg/API_runtime_PostText.html
const StructPostText = {
   botAlias: BOT_ALIAS,  //STRING_VALUE required
   botName: BOT_NAME, //STRING_VALUE required
   inputText: '', //STRING_VALUE required
   userId: '' //STRING_VALUE required
   /*, requestAttributes: {
     '': ''// '<String>': 'STRING_VALUE', N
   },
   sessionAttributes: {
     '': '' // '<String>': 'STRING_VALUE', N
   }*/
};

// https://docs.aws.amazon.com/lex/latest/dg/API_PutSlotType.html
const StructPutSlotType=
{
   name: 'STRING_VALUE' //required
   //, checksum: 'STRING_VALUE'
   //, createVersion: 'true || false'
   //, description: 'STRING_VALUE'
   /*, enumerationValues: 
   [
     {
       value: 'STRING_VALUE', //required
       synonyms: [
         'STRING_VALUE',
         'N_STRING_VALUE'
       ]
     }
     ,{
      value: 'N_STRING_VALUE', //required
      synonyms: [
        'STRING_VALUE',
        'N_STRING_VALUE'
      ]
    }
   ]*/
   //,valueSelectionStrategy: 'ORIGINAL_VALUE | TOP_RESOLUTION'
};

//====================================================================
// PRIVATE METHODS
//====================================================================
function log(p_string)
{
   console.log("amazon lex module::" + p_string);
}

//====================================================================
// PUBLIC METHODS
//====================================================================
// Reference:
// https://docs.aws.amazon.com/lex/latest/dg/API_runtime_PostText.html
/**
 * Sends user input (text-only) to Amazon Lex
 * @param {String} p_uniqueId a unique ID to be used as an identifier to whom a conversation is for
 * @param {String} p_msg 
 * @param {Function} p_callback CallbackFunction( Bot Response )
 */
var m_funcPostTextOnly = function(p_uniqueId, p_msg, p_callback)
{
   var _params = Object.create( StructPostText );
      _params.userId = p_uniqueId;
      _params.inputText = p_msg;
      _params.sessionAttributes={ x:"1",y:"2",z:"3" };
   awsLexRuntime.postText
   (
      _params
      , function(r_err, r_data){
         if(!r_err){
            //p_callback( r_data.message );
            p_callback( JSON.stringify(r_data) );
            log( "m_funcPostTextOnly(), Returned Value:" + JSON.stringify(r_data) );
         }else{
            p_callback( msgConstants.MSG_PAGE_STATUS_ERROR );
            log( "m_funcPostTextOnly(), Error:" + r_err );
         }
      }
   );
};

/**
 * Sends user input (text or speech) to Amazon Lex
 * @param {StructPostContent} p_structPostContentObject 
 * @param {*} p_callback CallbackFunction( TODO )
 */
var m_funcPostContent = function(p_structPostContentObject, p_callback){};

/**
 * Creates a custom slot type or replaces an existing custom slot type
 */
var m_funcPutSlotType = function(p_callback)
{
   var _params = Object.create( StructPutSlotType );
      _params.name = "FoodType";
      _params.enumerationValues=
      [
         {
            value:"Mango"
            ,synonyms:
            [
               "Mangoes"
               ,"mango"
               ,"mangoes"
            ]
         }
      ];
   awsLexModelBuilding.putSlotType
   (
      _params
      , function(r_err, r_data){
         if(!r_err){
            log( "m_funcPutSlotType(), Returned Value:" + JSON.stringify(r_data) );
            p_callback( JSON.stringify(r_data) );
         }else{
            log( "m_funcPutSlotType(), Error:" + r_err );
            p_callback( r_err );
         }
      }
   );
};



module.exports=
{
   StructPostContent                :  m_StructPostContent
   , postTextOnly                   :  m_funcPostTextOnly
   , postContent                    :  m_funcPostContent
   , putSlotType                    :  m_funcPutSlotType
};