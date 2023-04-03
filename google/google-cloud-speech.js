/**
*
*
*        GOOGLE DIALOGFLOW MODULE
*
*  This module will handle all dialogflow related functionalities
*
*  https://dialogflow.com/docs/sdks
*  DOCS:https://dialogflow.com/docs/reference/api-v2/rpc
*  SRC:https://github.com/dialogflow/dialogflow-nodejs-client-v2
*
*  @author  Jan Windelle Manalaysay
*  @date    2018/07/04
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

const configs = require('../configs');
const languageCodes = require('./constants/googleLanguageCodes');
const audioFormats = require('./constants/googleSpeechAudioFormats');

var CSpeech = require('@google-cloud/speech');
var client = new CSpeech.SpeechClient();

const StructRecognizeResponse=
[{
	"results": [{
		"alternatives": [{
			"words": [],
			"transcript": "knock knock",
			"confidence": 0.968192994594574
		}]
	}]
}];

//====================================================================
// PRIVATE METHODS
//====================================================================
function log(p_string)
{
   console.log("google cloud speech module::" + p_string);
}

//====================================================================
// PUBLIC METHODS
/**
 * @param {Buffer} p_bufferData 
 * @param {Function} p_callback ( Data or null )
 */
var m_funcGetTextFromAudioBufferData = function(p_bufferData, p_callback)
{
   var _audioBytes = p_bufferData.toString('base64');
   //log( "m_funcGetTextFromAudioBufferData(), Buffer Data to base 64 String:" + _audioBytes );

   // https://cloud.google.com/nodejs/docs/reference/speech/1.5.x/google.cloud.speech.v1#.RecognitionAudio
   var _audio={
      content:_audioBytes
   };

   // https://cloud.google.com/nodejs/docs/reference/speech/1.5.x/google.cloud.speech.v1#.RecognitionConfig
   var _config={
      encoding:audioFormats.AUD_FLA.toUpperCase()
      , sampleRateHertz:44100
      , languageCode:languageCodes.LANG_US_EN
   };

   var _req={
      audio:_audio
      ,config:_config
   };

   client.recognize(_req)
   .then(function(r_dat){
      log( "m_funcGetTextFromAudioBufferData(), Data:" + JSON.stringify(r_dat) );
      p_callback( r_dat );
   })
   .catch(function(r_err){
      log( "m_funcGetTextFromAudioBufferData(), Error:" + r_err );
      p_callback( r_err );
   });
};

/**
 * @param {Buffer} p_bufferData 
 * @param {Number} p_iSampleRateHertz 
 * @param {Function} p_callback ( StructRecognizeResponse or null )
 */
var m_funcTranscribe = function(p_bufferData, p_iSampleRateHertz, p_localeCode, p_callback)
{
   var _audioBytes = p_bufferData.toString('base64');
   //log( "m_funcGetTextFromAudioBufferData(), Buffer Data to base 64 String:" + _audioBytes );

   // https://cloud.google.com/nodejs/docs/reference/speech/1.5.x/google.cloud.speech.v1#.RecognitionAudio
   var _audio={
      content:_audioBytes
   };

   // https://cloud.google.com/nodejs/docs/reference/speech/1.5.x/google.cloud.speech.v1#.RecognitionConfig
   var _config={
      encoding:audioFormats.AUD_FLA.toUpperCase()
      , sampleRateHertz:p_iSampleRateHertz
      , languageCode:p_localeCode // https://cloud.google.com/speech-to-text/docs/languages
   };

   var _req={
      audio:_audio
      ,config:_config
   };

   client.recognize(_req)
   .then(function(r_dat){
      log( "m_funcTranscribe(), Data:" + JSON.stringify(r_dat) );
      p_callback( r_dat );
   })
   .catch(function(r_err){
      log( "m_funcTranscribe(), Error:" + r_err );
      p_callback( null );
   });
};

/**
 * @param {Buffer} p_bufferData 
 * @param {Number} p_iSampleRateHertz
 * @param {String} p_localeCode './google/constants/googleLanguageCodes'
 * @returns {Object} StructRecognizeResponse
 */
var m_funcPromiseTranscribe = function(p_bufferData, p_iSampleRateHertz, p_localeCode)
{
   log( "m_funcPromiseTranscribe(), p_localeCode=" + p_localeCode );
   return new Promise
   (
      function(funcResolve, funcReject)
      {
         var _audioBytes = p_bufferData.toString('base64');
         var _audio={
            content:_audioBytes
         };
         var _config={
            encoding:audioFormats.AUD_FLA.toUpperCase()
            , sampleRateHertz:p_iSampleRateHertz
            , languageCode:p_localeCode // https://cloud.google.com/speech-to-text/docs/languages
         };
         var _req={
            audio:_audio
            ,config:_config
         };
         client.recognize(_req)
         .then(function(r_dat){
            log( "m_funcPromiseTranscribe(), Data:" + JSON.stringify(r_dat) );
            funcResolve( r_dat );
         })
         .catch(function(r_err){
            log( "m_funcPromiseTranscribe(), Error:" + r_err );
            funcReject( r_err );
         });
      }
   )
};



module.exports=
{
   getTextFromAudioBufferData : m_funcGetTextFromAudioBufferData
   , transcribe               : m_funcTranscribe
   , promiseTranscribe        : m_funcPromiseTranscribe
};