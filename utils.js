/**
*
*
*        COMMONG UTILITIES MODULE
*
*
*
*  This module is in-charge of common methods that would be used
*  throughout the whole project
*  e.g.
*  convertion of date format to another
*
*
*  @author  Jan Windelle Manalaysay
*  @date    2018/05/30
*  @email   jan.manalaysay@12u12.com
*
**/

'use strict';

var https                        = require('https');
var fs                           = require('fs');
var request                      = require('request');

const googleSpeechAudioFormats   =  require('./google/constants/googleSpeechAudioFormats');

const pageStatusConstants        = require('./constants/page-status-codes');

const messengerLocales           = require('./messenger/constants/MessengerLocales');
const googleLocales              = require('./google/constants/googleLanguageCodes');

const CONFIGS                    = require('./configs');

var CryptoJS                     = require( 'crypto-js' );

//==========================================================
//    FFMPEG
// NOTE:
// before being able to use the 'fluent-ffmpeg' module
// https://github.com/fluent-ffmpeg/node-fluent-ffmpeg
// you need to have an ffmpeg binary working on your server
//
// for AWS Beanstalk
// References:
// https://stackoverflow.com/questions/46718891/enabling-libmp3lame-for-ffmpeg-on-elastic-beanstalk
// https://gist.github.com/watanabeyu/bd5c2c41daca508e1449ffb6f5d82a69
// https://serverfault.com/questions/929292/path-for-installed-ffmpeg-on-elastic-beanstalk
// installation of ffmpeg in an instance can be done once
// 
// create a file named 'ffmpeg.config' under the .ebextensions on your root project dir.
// if .ebextensions folder is not existing, then create one.
//
// beware AWS EB configs are tab sensitive, to be sure, just use spaces.
// in your 'ffmpeg.config', paste the following codes:
/*
packages:
  yum:
    ImageMagick: []
    ImageMagick-devel: []
commands:
  01-wget:
    command: "wget -O /tmp/ffmpeg.tar.xz https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-64bit-static.tar.xz"
  02-mkdir:
    command: "if [ ! -d /opt/ffmpeg ] ; then mkdir -p /opt/ffmpeg; fi"
  03-tar:
    command: "tar xvf /tmp/ffmpeg.tar.xz -C /opt/ffmpeg --strip 1"
  04-ln:
    command: "if [[ ! -f /usr/bin/ffmpeg ]] ; then ln -s /opt/ffmpeg/ffmpeg /usr/bin/ffmpeg; fi"
  05-ln:
    command: "if [[ ! -f /usr/bin/ffprobe ]] ; then ln -s /opt/ffmpeg/ffprobe /usr/bin/ffprobe; fi"
  06-pecl:
    command: "if [ `pecl list | grep imagick` ] ; then pecl install -f imagick; fi"
*/
//
// after installation of ffmpeg
// either you use environment variables named
// FFMPEG_PATH
// w/c pertains to the ffmpeg exe, usually in './bin/ffmpeg/ffmpeg' in AWS EB
// and
// FFPROBE_PATH
// w/c pertains to the ffprobe exe, usually in './bin/ffmpeg/ffprobe' in AWS EB
// or
// you can use the commands as such:
/*
var Cffmpeg                = require('fluent-ffmpeg');
var ffmpegCmd              = new Cffmpeg();
   ffmpegCmd.setFfmpegPath('./bin/ffmpeg/ffmpeg');
   ffmpegCmd.setFfprobePath('./bin/ffmpeg/ffprobe');
*/
var Cffmpeg                      = require('fluent-ffmpeg');

//==========================================================
//    Structs
const StructHttpsGetHeader=
{
   "last-modified": "Wed, 04 Jul 2018 07:34:46 GMT",
   "content-type": "video/mp4",
   "x-fb-config-version-olb-prod": "325",
   "content-disposition": "attachment; filename=audioclip-1530689684000-640.mp4",
   "expires": "Wed, 18 Jul 2018 07:34:47 GMT",
   "cache-control": "max-age=1209600, no-transform",
   "x-fb-config-version-elb-prod": "325",
   "date": "Wed, 04 Jul 2018 07:34:47 GMT",
   "x-fb-edge-debug": "HU0I9bCyEb0dwJUbsXwcZxo_UMy-eBJUxvg7A68yYXvAdogzuo9ShEAgfMR8yDIF_olNAwisU7fdNRoySyotUA",
   "connection": "close",
   "content-length": "11256"
};
const StructFFProbe=
{
	"streams": [{
		"index": 0,
		"codec_name": "aac",
		"codec_long_name": "AAC (Advanced Audio Coding)",
		"profile": "LC",
		"codec_type": "audio",
		"codec_time_base": "1/48000",
		"codec_tag_string": "mp4a",
		"codec_tag": "0x6134706d",
		"sample_fmt": "fltp",
		"sample_rate": 48000,
		"channels": 2,
		"channel_layout": "stereo",
		"bits_per_sample": 0,
		"id": "N/A",
		"r_frame_rate": "0/0",
		"avg_frame_rate": "0/0",
		"time_base": "1/48000",
		"start_pts": 0,
		"start_time": 0,
		"duration_ts": 180240,
		"duration": 3.755,
		"bit_rate": 128681,
		"max_bit_rate": 128681,
		"bits_per_raw_sample": "N/A",
		"nb_frames": 178,
		"nb_read_frames": "N/A",
		"nb_read_packets": "N/A",
		"tags": {
			"language": "und",
			"handler_name": "SoundHandler"
		},
		"disposition": {
			"default": 1,
			"dub": 0,
			"original": 0,
			"comment": 0,
			"lyrics": 0,
			"karaoke": 0,
			"forced": 0,
			"hearing_impaired": 0,
			"visual_impaired": 0,
			"clean_effects": 0,
			"attached_pic": 0,
			"timed_thumbnails": 0
		}
	}],
	"format": {
		"filename": "audioclip-1531813265000-3798.mp4",
		"nb_streams": 1,
		"nb_programs": 0,
		"format_name": "mov,mp4,m4a,3gp,3g2,mj2",
		"format_long_name": "QuickTime / MOV",
		"start_time": 0,
		"duration": 3.798,
		"size": 62535,
		"bit_rate": 131721,
		"probe_score": 100,
		"tags": {
			"major_brand": "isom",
			"minor_version": "512",
			"compatible_brands": "isomiso2mp41",
			"encoder": "Lavf56.40.101"
		}
	},
	"chapters": []
};
//==========================================================
//    PRIVATE METHODS
function log(p_string)
{
   // put in a separate function
   // so that maybe in the future
   // when there is a switch for
   // debug mode, it can handle
   // wether to show the log or not'
   console.log("common utilities module::" + p_string);
}

//==========================================================
//    PUBLIC METHODS
//==========================================================
/**
 * Converts Facebook's gender string value to a number for 12u12 required value ( 0|1|2=undef|male|female )
 * @param {String} p_genderString   Facebook Permission Gender Value ( male|female )
 */
var m_funcGetGenderNumberFromString = function(p_genderString)
{
   var _genderNumber=0;
   if(p_genderString==="male"){
      _genderNumber = 1;
   }else if(p_genderString==="female"){
      _genderNumber = 2;
   }


   return _genderNumber;
};

var m_funcGetMatchedCountryCity = function( p_facebookLocationName, p_12u12CountryCityArray )
{
   var _matchedCountryCity="";
   // split the facebook name first
   var _arr = p_facebookLocationName.split(",");
   /*for(var i=0; i<_arr.length; i++){
      log( "m_funcGetMatchedCountryCity(), _arr["+i+"]:" + _arr[i] );
   }*/
   for(var i=0; i<p_12u12CountryCityArray.length; i++){
      if( p_12u12CountryCityArray[i].indexOf(_arr[0]) !== -1 ){
         log( "m_funcGetMatchedCountryCity(), Found a matching Country City:" + p_12u12CountryCityArray[i] );
         _matchedCountryCity = p_12u12CountryCityArray[i];
         break;
      }
   }


   return _matchedCountryCity;
};

var m_funcGetYearFromFacebookBirthdate = function(p_fbBirthDate)
{
   var _arr = p_fbBirthDate.split('/');
   return _arr[2];
};

var m_funcGetMonthFromFacebookBirthdate = function(p_fbBirthDate)
{
   var _arr = p_fbBirthDate.split('/');
   return parseInt(_arr[0]);
};

var m_funcGetMonthNameFromFacebookBirthdate = function(p_fbBirthDate)
{
   var _arr = p_fbBirthDate.split('/');
   var _monthName = "January";

   switch( parseInt(_arr[0]) )
   {
      case 2:
      {
         _monthName = "February";
         break;
      }
      case 3:
      {
         _monthName = "March";
         break;
      }
      case 4:
      {
         _monthName = "April";
         break;
      }
      case 5:
      {
         _monthName = "May";
         break;
      }
      case 6:
      {
         _monthName = "June";
         break;
      }
      case 7:
      {
         _monthName = "July";
         break;
      }
      case 8:
      {
         _monthName = "August";
         break;
      }
      case 9:
      {
         _monthName = "September";
         break;
      }
      case 10:
      {
         _monthName = "October";
         break;
      }
      case 11:
      {
         _monthName = "November";
         break;
      }
      case 12:
      {
         _monthName = "December";
         break;
      }
   }


   return _monthName;
};

var m_funcGetCurrentTimestamp = function(){
   return Date.now();
};

var m_funcGetCurrentTimestampWithOffset = function(p_offset){
   return m_funcGetCurrentTimestamp() + p_offset;
};

/**
 * Downloads a file from a URL using stream and saves it locally
 * 
 * @param {String} p_url https url of file of where to download from
 * @param {String} p_fileName name of file to be saved in local
 * @param {Function} p_callback ( StructHttpsGetHeader or null )
 */
var m_funcDownloadFileFromUrl = function(p_url, p_fileName, p_callback)
{
   log( "m_funcDownloadFileFromUrl(), downloading file from Url " + p_url + " with a filename of " + p_fileName );

   var _file = fs.createWriteStream( p_fileName );
   
   var _req =  https.get
   (
      p_url
      , function( r_res ){

         log( "m_funcDownloadFileFromUrl(), Header:" + JSON.stringify(r_res.headers) );

         if( r_res.statusCode!==pageStatusConstants.STATUS_OK ){
            log( "m_funcDownloadFileFromUrl(), Page Status Error:" + r_res.statusCode );
            p_callback( null );
         }

         r_res.pipe(_file);

         _file.on('finish',function(){
            //_file.close(p_callback);
            _file.close();
            p_callback( r_res.headers );
         });
      }
   );
   
   _req.on('error',function(p_err){
      log( "m_funcDownloadFileFromUrl(), Request Error:" + p_err );
      fs.unlink(p_fileName);
      p_callback( null );
   });

   _file.on('error',function(p_err){
      log( "m_funcDownloadFileFromUrl(), File Error:" + p_err );
      fs.unlink(p_fileName);
      p_callback( null );
   });
};

/**
 * Downloads the file and automatically creates a local file
 * 
 * @param {String} p_url 
 * @param {Function} p_callback ( StructHttpsGetHeader or null )
 */
// TODO:
// try, https://stackoverflow.com/questions/14552638/read-remote-file-with-node-js-http-get
var m_funcDownloadFileFromMessengerUrl = function(p_url, p_callback)
{
   log( "m_funcDownloadFileFromMessengerUrl(), downloading file from Url " + p_url );
   var _req =  https.get
   (
      p_url
      , function( r_res )
      {
         log( "m_funcDownloadFileFromMessengerUrl(), Header:" + JSON.stringify(r_res.headers) );

         var _fileName = r_res.headers["content-disposition"].split('=')[1];

         log( "m_funcDownloadFileFromMessengerUrl(), creating a local file named " + _fileName );

         var _file = fs.createWriteStream( _fileName );

         if( r_res.statusCode!==pageStatusConstants.STATUS_OK ){
            log( "m_funcDownloadFileFromMessengerUrl(), Page Status Error:" + r_res.statusCode );
            p_callback( null );
         }

         r_res.pipe(_file);

         _file.on('finish',function(){
            //_file.close(p_callback);
            _file.close();
            p_callback( r_res.headers );
         });

         _file.on('error',function(){
            _file.close();
            fs.unlink(_fileName);
            p_callback( null );
         });
      }
   );
};

/**
 * @param {String} p_url
 * @returns {StructHttpsGetHeader}
 */
var m_funcPromiseDownloadFileFromMessengerUrl = function(p_url)
{
   log("m_funcPromiseDownloadFileFromMessengerUrl(), p_url:" + p_url);
   return new Promise
   (
      function( funcResolve, funcReject )
      {
         https.get
         (
            p_url
            , function( r_res )
            {
               var _fileName = r_res.headers["content-disposition"].split('=')[1];
               var _file = fs.createWriteStream( _fileName );
               if( r_res.statusCode!==pageStatusConstants.STATUS_OK ){
                  log( "m_funcPromiseDownloadFileFromMessengerUrl(), Status Code:" + r_res.statusCode );
                  funcReject( r_res.statusCode );
               }
               r_res.pipe(_file);
               _file.on('finish',function(){
                  _file.close();
                  funcResolve( r_res.headers );
               });
               _file.on('error',function(err){
                  log( "m_funcPromiseDownloadFileFromMessengerUrl(), Error:" + err );
                  _file.close();
                  fs.unlink(_fileName);
                  funcReject( err );
               });
            }
         );
      }
   );
};

/**
 * @param {String} p_url The URL provided by Messenger to fetch the file
 * @param {Function} p_callback ( Buffer or null )
 */
var m_funcDownloadBufferFromUrl = function(p_url, p_callback)
{
   log( "m_funcDownloadBufferFromUrl(), downloading file from Url " + p_url );
   try
   {
      var _req =  https.get
      (
         p_url
         , function( r_res )
         {
            var _data = [];

            r_res.on( 'data', function(r_chunk){
               _data.push(r_chunk);
            }).on('end',function(){
               //var _buffer = Buffer.concat(_data);
               var _buffer = Buffer.concat(_data).toString('binary');
               //log( "m_funcDownloadBufferFromUrl(), Data:" + _data.toString() );
               p_callback( _data );
            });
            r_res.on('error',function(r_err){
               log( "m_funcDownloadBufferFromUrl, Error:" + r_err );
            });
         }
      );
   }
   catch(err)
   {
      log( "m_funcDownloadBufferFromUrl(), Error:" + err );
      p_callback( null );
   }
};

/**
 * @param {String} p_fileName 
 * @param {Function} p_callback ( Buffer Data or null )
 */
var m_funcReadFile = function(p_fileName, p_callback)
{
   fs.readFile
   (
      p_fileName
      , function( r_err, r_data ){
         if(!r_err){
            //log( "m_funcReadFile(), Data:" + JSON.stringify(r_data) );
            log( "m_funcReadFile(), Success Reading File" );
            p_callback( r_data );
         }else{
            log( "m_funcReadFile(), Error:" + r_err );
            p_callback( null );
         }
      }
   );
};

/**
 * @param {String} p_fileName
 * @returns {Buffer} Buffer Data
 */
var m_funcPromiseReadFile = function(p_fileName)
{
   return new Promise
   (
      function(funcResolve, funcReject)
      {
         fs.readFile
         (
            p_fileName
            , function( r_err, r_dat )
            {
               if(!r_err){
                  log( "m_funcPromiseReadFile(), Success Reading File" );
                  funcResolve( r_dat );
               }else{
                  log( "m_funcPromiseReadFile(), Error:" + r_err );
                  funcReject( r_err );
               }
            }
         );
      }
   );
};

/**
 * Just reads a file from a URL and returns the Buffer Data
 * @param {*} p_fileUrl 
 * @param {Function} p_callback ( Data or null )
 */
var m_funcReadFileFromUrl = function( p_fileUrl, p_callback )
{
   https.get(p_fileUrl)
   .on('response', function(p_res)
   {
      var _data = [];
      p_res.on('data', function(p_chunk){
         //_data.push(p_chunk);
         _data.concat( p_chunk );
      });
      p_res.on('end',function(){
         p_callback( _data );
      });
   })
   .on( 'error', function(p_err){
      log( 'm_funcReadFileFromUrl(), Error:' + p_err );
   });
};

var m_funcDoesFileExists = function(p_fileName, p_callback)
{
   fs.exists( p_fileName, p_callback );
};

var m_funcDeleteFile = function(p_fileName)
{
   fs.unlink
   ( 
      p_fileName
      , function(r_err){
         if(r_err){
            log( "m_funcDeleteFile(), Failed deleting local file " + p_fileName );
         }else{
            log( "m_funcDeleteFile(), Success deleting local file " + p_fileName );
         }
      } 
   );
};

/**
 * 
 * @param {*} p_url 
 * @param {Function} p_callback ( Data or null )
 */
var m_funcGetJSONResponseFromUrl = function(p_url, p_callback)
{
   var _params={
      url:p_url
      ,json:true
   };
   request
   (
      _params
      , function( r_err, r_res, r_body ){
         if(!r_err){
            if( r_res.statusCode==pageStatusConstants.STATUS_OK ){
               log( "m_funcGetJSONResponseFromUrl(), Body:" + JSON.stringify(r_body) );
               p_callback( r_body );
            }else{
               log( "m_funcGetJSONResponseFromUrl(), Page Status Code:" + r_res.statusCode );
               p_callback( null );
            }
         }else{
            log( "m_funcGetJSONResponseFromUrl(), Error:" + r_err );
            p_callback( null );
         }
      }
   );
};

/**
 * Returns the extension name of file without the '.'
 * @param {String} p_string
 */
var m_funcGetPromisedFileExtensionNameFromString = function(p_string)
{
   return new Promise
   (
      function( resolve, reject )
      {
         var _idx = p_string.lastIndexOf('.');
         log( "m_funcGetPromisedFileExtensionNameFromUrl(), found last index of '.'@" + _idx );
         if( _idx>=0 ){
            resolve( p_string.substring( _idx+1, _idx+4 ) );
         }else{
            reject("URL does not have an extension name at end of String");
         }
      }
   );
};

/**
 * @param {String} p_localFilename 
 * @param {Function} p_callback ( StructFFProbe or null )
 */
var m_funcGetAudioFileInfoFromLocalFile = function(p_localFilename, p_callback)
{
   Cffmpeg.ffprobe
   (
      p_localFilename
      , function( r_err, r_dat ){
         if( !r_err ){
            p_callback( r_dat );
         }else{
            log( "m_funcGetAudioFileInfoFromLocalFile(), Error:" + r_err );
            p_callback(null);
         }
      }
   );
};

/**
 * @param {String} p_localFilename
 * @returns {StructFFProbe}
 */
var m_funcPromiseAudioFileInfoFromLocalFile = function(p_localFilename)
{
   log("m_funcPromiseAudioFileInfoFromLocalFile(), p_localFilename:" + p_localFilename);
   return new Promise
   (
      function(funcResolve, funcReject)
      {
         Cffmpeg.ffprobe
         (
            p_localFilename
            , function( r_err, r_dat ){
               if( !r_err ){
                  log("m_funcPromiseAudioFileInfoFromLocalFile(), r_dat:");
                  funcResolve( r_dat );
               }else{
                  log("m_funcPromiseAudioFileInfoFromLocalFile(), Error:" + r_err);
                  funcReject( r_err );
               }
            }
         );
      }
   );
};

// https://cloud.google.com/speech-to-text/docs/encoding
/**
 * Will convert the provided local audio file with the same name in flac format
 * 
 * @param {String} p_localFilename 
 * @param {Function} p_callback ( Converted Audio Local File name or null )
 */
var m_funcConvertAudioLocalFileToFlac = function(p_localFilename, p_callback)
{
   var _toFlac = p_localFilename.split('.')[0]+"."+googleSpeechAudioFormats.AUD_FLA;
   Cffmpeg(p_localFilename)
      .toFormat(googleSpeechAudioFormats.AUD_FLA)
      .audioChannels(1)
      .audioFrequency(16000)
      .on('end',function(){
         p_callback( _toFlac );
      })
      .on('error',function(err){
         log( "m_funcConvertAudioLocalFileToFlac(), Error:" + err );
         p_callback(null);
      })
      .save( _toFlac );
};

/**
 * @param {String} p_localFilename 
 * @returns {String} the fla converted local file name
 */
var m_funcPromiseConvertAudioLocalFileToFlac = function(p_localFilename)
{
   log("m_funcPromiseConvertAudioLocalFileToFlac(), p_localFilename:" + p_localFilename);
   return new Promise
   (
      function(funcResolve, funcReject)
      {
         var _toFlac = p_localFilename.split('.')[0]+"."+googleSpeechAudioFormats.AUD_FLA;
         Cffmpeg(p_localFilename)
         .toFormat(googleSpeechAudioFormats.AUD_FLA)
         .audioChannels(1)
         .audioFrequency(16000)
         .on('end',function(){
            log("m_funcPromiseConvertAudioLocalFileToFlac(), finished converting to flac");
            funcResolve( _toFlac );
         })
         .on('error',function(err){
            log("m_funcPromiseConvertAudioLocalFileToFlac(), Error:" + err);
            funcReject( err );
         })
         .save( _toFlac );
      }
   );
};

/**
 * @param {String} p_messengerLocaleCode
 * @returns {String} Google Locale code 
 */
var m_funcPromiseConvertedMessengerToGoogleLocale = function(p_messengerLocaleCode)
{
   log("m_funcPromiseConvertedMessengerToGoogleLocale(), p_messengerLocaleCode:" + p_messengerLocaleCode);
   return new Promise
   (
      function(funcResolve, funcReject)
      {
         switch( p_messengerLocaleCode )
         {
            case messengerLocales.ENG_US:
            case messengerLocales.DEF:
            {
               funcResolve(googleLocales.LANG_US_EN);
               break;
            }

            case messengerLocales.CHI_CH:
            {
               funcResolve(googleLocales.LANG_CH_CHINA);
               break;
            }

            default:
            {
               funcReject( null );
               break;
            }
         }
      }
   );
};

var m_funcGetUrlSafeEncryptedString = function(p_stringToEncrypt){
   return encodeURIComponent(CryptoJS.AES.encrypt( p_stringToEncrypt, CONFIGS.ENCRYPTION_KEY));
}

var m_funcGetPromisedUrlSafeEncryptedString = function(p_stringToEncrypt)
{
   return new Promise
   (
      function(resolve, reject)
      {
         try
         {
            log( "m_funcGetPromisedUrlSafeEncryptedString(), p_stringToEncrypt:" + p_stringToEncrypt );
            var _encrypted = CryptoJS.AES.encrypt( p_stringToEncrypt, CONFIGS.ENCRYPTION_KEY);
            log( "m_funcGetPromisedUrlSafeEncryptedString(), _encrypted:" + _encrypted );
            var _urlEncoded = encodeURIComponent(_encrypted);
            log( "m_funcGetPromisedUrlSafeEncryptedString(), _urlEncoded:" + _urlEncoded );
            resolve(_urlEncoded);
         }
         catch(err)
         {
            log( "m_funcGetPromisedUrlSafeEncryptedString(), Error:" + err );
            reject(err);
         }
      }
   );
};

var m_funcGetUrlSafeDecryptedString = function(p_stringToDecrypt){
   var _bytes = CryptoJS.AES.decrypt( decodeURIComponent( p_stringToDecrypt ), CONFIGS.ENCRYPTION_KEY );
   return _bytes.toString( CryptoJS.enc.Utf8 );
}

var m_funcGetPromisedUrlSafeDecryptedString = function(p_stringToDecrypt)
{
   return new Promise
   (
      function(resolve, reject)
      {
         try
         {
            var _urlDecoded = decodeURIComponent( p_stringToDecrypt );
            log( "m_funcGetPromisedUrlSafeDecryptedString(), _urlDecoded:" + _urlDecoded );
            var _bytes = CryptoJS.AES.decrypt( _urlDecoded, CONFIGS.ENCRYPTION_KEY );
            log( "m_funcGetPromisedUrlSafeDecryptedString(), _bytes:" + _bytes );
            var _finalStr = _bytes.toString( CryptoJS.enc.Utf8 );
            log( "m_funcGetPromisedUrlSafeDecryptedString(), _finalStr:" + _finalStr );
            resolve( _finalStr );
         }
         catch(err)
         {
            log( "m_funcGetPromisedUrlSafeDecryptedString(), Error:" + err );
            reject(err);
         }
      }
   );
};


module.exports=
{
   getGenderNumberFromString                 :  m_funcGetGenderNumberFromString
   , getCurrentTimestamp                     :  m_funcGetCurrentTimestamp
   , getCurrentTimestampWithOffset           :  m_funcGetCurrentTimestampWithOffset
   , getMatchedCountryCity                   :  m_funcGetMatchedCountryCity
   , getYearFromFacebookBirthdate            :  m_funcGetYearFromFacebookBirthdate
   , getMonthFromFacebookBirthdate           :  m_funcGetMonthFromFacebookBirthdate
   , getMonthNameFromFacebookBirthdate       :  m_funcGetMonthNameFromFacebookBirthdate
   , downloadFileFromUrl                     :  m_funcDownloadFileFromUrl
   , downloadFileFromMessengerUrl            :  m_funcDownloadFileFromMessengerUrl
   , promiseDownloadFileFromMessengerUrl     :  m_funcPromiseDownloadFileFromMessengerUrl
   , downloadBufferFromUrl                   :  m_funcDownloadBufferFromUrl
   , readFile                                :  m_funcReadFile
   , promiseReadFile                         :  m_funcPromiseReadFile
   , readFileFromUrl                         :  m_funcReadFileFromUrl
   , doesFileExists                          :  m_funcDoesFileExists
   , deleteFile                              :  m_funcDeleteFile
   , getJSONResponseFromUrl                  :  m_funcGetJSONResponseFromUrl
   , getPromisedExtensionNameFromString      :  m_funcGetPromisedFileExtensionNameFromString
   , getAudioInfoFromLocalFile               :  m_funcGetAudioFileInfoFromLocalFile
   , promiseAudioInfoFromLocalFile           :  m_funcPromiseAudioFileInfoFromLocalFile
   , convertAudioLocalFileToFlac             :  m_funcConvertAudioLocalFileToFlac
   , promiseConvertAudioLocalFileToFlac      :  m_funcPromiseConvertAudioLocalFileToFlac
   , promiseConvertedMessengerToGoogleLocale :  m_funcPromiseConvertedMessengerToGoogleLocale
   , getEncryptedUrlSafeString               :  m_funcGetUrlSafeEncryptedString
   , getPromisedUrlSafeEncryptedString       :  m_funcGetPromisedUrlSafeEncryptedString
   , getDecryptedUrlSafeString               :  m_funcGetUrlSafeDecryptedString
   , getPromisedUrlSafeDecryptedString       :  m_funcGetPromisedUrlSafeDecryptedString
};