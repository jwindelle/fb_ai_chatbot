/**
*
*
*        AMAZON TRANSCRIBE MODULE
*
*  This module will handle all Amazon Transcribe related service
*  https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/TranscribeService.html#startTranscriptionJob-property
*
*  @author  Jan Windelle Manalaysay
*  @date    2018/07/02
*  @email   jan.manalaysay@12u12.com
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
   CAWS.config.update(regionConstants.REG_US_EAST_2);

var transcribeService                  = new CAWS.TranscribeService();

var StructStartTranscriptionJob = 
{
   LanguageCode: 'en-US', // required 'en-US | es-US'
   Media: { 
     MediaFileUri: 'STRING_VALUE' // required
   },
   MediaFormat: '', // required 'mp3 | mp4 | wav | flac'
   TranscriptionJobName: 'STRING_VALUE' // required
   //,MediaSampleRateHertz: 0,
   //Settings: {
     //MaxSpeakerLabels: 0,
     //ShowSpeakerLabels: true || false,
     //VocabularyName: 'STRING_VALUE'
   //}
};
const StructStartTranscriptionResponse=
{
   TranscriptionJob: 
   {
      TranscriptionJobName: "1529112960543652_1530598010094.mp4",
      TranscriptionJobStatus: "AMAZON_TRANSCRIBE_STATUS",
      LanguageCode: "en-US",
      MediaFormat: "mp4",
      Media: {
         MediaFileUri: "https://12u12-audios.s3.us-east-2.amazonaws.com/1529112960543652_1530598010094.mp4"
      },
      CreationTime: "2018-07-03T06:06:50.554Z"
   }
};

const StructGetTranscriptionResponse=
{
   TranscriptionJob: 
   {
      TranscriptionJobName: "1529112960543652_1530606750966.mp4",
      TranscriptionJobStatus: "COMPLETED",
      LanguageCode: "en-US",
      MediaSampleRateHertz: 48000,
      MediaFormat: "mp4",
      Media: {
         MediaFileUri: "https://12u12-audios.s3.us-east-2.amazonaws.com/1529112960543652_1530606750966.mp4"
      },
      Transcript: {
         TranscriptFileUri: "https://s3.us-east-2.amazonaws.com/aws-transcribe-us-east-2-prod/820254302876/1529112960543652_1530606750966.mp4/asrOutput.json?X-Amz-Security-Token=FQoDYXdzEFkaDPqAIPRCiZH4863GJSK3A%2BC7VIi4CzI5gG1Gn2z5lZe86bUBW0aJrx4rqPVkZp383LgfJJrAsytCp%2FsXYQluStUtco%2B2nsg3kLycpb9b5AyAkWS1DR3PN7WHdc8osIEZ3Qw1i4oaD%2Fr%2B4tcU7of7hp6JTa%2FvaY2RDiMV1uKADyTCJ8Ddo2yBLRFYT%2BvR73swOpK%2FpLE99BMo5onD2xlbzCvkIx8JF14E1G%2BK7ScDzQBbmPPVcmGHguM90J%2F7w41lQTUacPn%2FzoRpI6i6dxL2HAT4%2F1buoCcs8WZKZVLs7yG29o9CSLjK1nRFuFFj%2BX7FvGCCZzlH%2BT%2BdSwiOJvTbvgjGC2%2BhY86DDfMoraU56VpVcNGx%2BEIsI6DlC%2F5nHea28V8UoLiYlwlcNkAv1niWdFWb2bMVjY70RM%2Fr5%2Fo%2FEW9zKZwGK1gI69RnqrKB9oEqa7brZp1Rv74mJugZDbLgSF59c%2Bwrlx7eGZ98TesI6CEPbfNqypIcPQapNR2vRcgna%2FoswLwsizz97Qun7%2Bm%2BfsAoJeJudJJECqscjn%2Fi0W8lOU7u4W4Ei5zkGJtO6nacPFcHumWgt9POZxjKqcH0Yna1wlAnr%2Bgo4dbs2QU%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20180703T083408Z&X-Amz-SignedHeaders=host&X-Amz-Expires=899&X-Amz-Credential=ASIAI7YHPDPOAFNL3LXQ%2F20180703%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Signature=558bc42137e694f2daeaf04a1197abf8527a3ed155c49376afc10275f70c892c"
      },
      CreationTime: "2018-07-03T08:32:31.357Z",
      CompletionTime: "2018-07-03T08:33:32.511Z"
   }
};

const StructTranscriptCompletedResponse=
{
   jobName: "1529112960543652_1530606750966.mp4",
   accountId: "820254302876",
   results: 
   {
      transcripts: 
      [
         {
            transcript: ""
         }
      ],
      items: []
   },
   status: "COMPLETED"
};

//====================================================================
// PRIVATE METHODS
//====================================================================
function log(p_string)
{
   console.log("amazon transcribe module::" + p_string);
}

//====================================================================
// PUBLIC METHODS
//====================================================================
/*var m_funcStartTranscriptionJob = function(p_callback)
{
   var _params = 
   {
      LanguageCode: 'en-US',
      Media: { 
         MediaFileUri: 'https://s3.us-east-2.amazonaws.com/12u12-audios/hello.mp4'
      },
      MediaFormat: 'mp4',
      TranscriptionJobName: 'Hello'
   };

   log( "m_funcStartTranscriptionJob(), Params:" + JSON.stringify(_params) );
   
   transcribeService.startTranscriptionJob
   (
      _params
      , function(r_err, r_data){
         if(!r_err){
            log( "m_funcStartTranscriptionJob(), Data:" + JSON.stringify(r_data) );
            p_callback( JSON.stringify(r_data) );
         }else{
            log( "m_funcStartTranscriptionJob(), Error:" + r_err );
            p_callback( r_err );
         }
      }
   );
};*/

/**
 * 
 * @param {*} p_jobName 
 * @param {*} p_S3FileUrl 
 * @param {*} p_mediaFormat 
 * @param {Function} p_callback ( Data or null )
 */
var m_funcStartTranscriptionJob = function(p_jobName, p_S3FileUrl, p_mediaFormat, p_callback)
{
   var _params = 
   {
      LanguageCode: 'en-US',
      Media: { 
         MediaFileUri: p_S3FileUrl
      },
      MediaFormat: p_mediaFormat,
      TranscriptionJobName: p_jobName
   };

   log( "m_funcStartTranscriptionJob(), Params:" + JSON.stringify(_params) );
   
   transcribeService.startTranscriptionJob
   (
      _params
      , function(r_err, r_data){
         if(!r_err){
            log( "m_funcStartTranscriptionJob(), Data:" + JSON.stringify(r_data) );
            p_callback( r_data );
         }else{
            log( "m_funcStartTranscriptionJob(), Error:" + r_err );
            p_callback( null );
         }
      }
   );
};

/**
 * 
 * @param {*} p_transcriptionJobName 
 * @param {*} p_callback ( Data? or null )
 */
var m_funcGetTranscriptionJob = function(p_transcriptionJobName, p_callback)
{
   transcribeService.getTranscriptionJob
   (
      { TranscriptionJobName : p_transcriptionJobName }
      , function(r_err, r_data){
         if(!r_err){
            log( "m_funcGetTranscriptionJob(), Data:" + JSON.stringify(r_data) );
            p_callback( r_data );
         }else{
            log( "m_funcGetTranscriptionJob(), Error:" + r_err );
            p_callback( null );
         }
      }
   );
};


module.exports=
{
   startTranscriptionJob      :  m_funcStartTranscriptionJob
   , getTranscriptionJob      :  m_funcGetTranscriptionJob
};