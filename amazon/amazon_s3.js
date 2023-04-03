/**
*
*
*        AMAZON S3 MODULE
*
*  This module will handle all Amazon S3 related service
*  https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html
*
*  Refer to this for comparisons between upload and put methods
*  https://stackoverflow.com/questions/38442512/difference-between-upload-and-putobject-for-uploading-a-file-to-s3
*  
*  UPLOAD:
*  Manages multipart uploads for objects larger than 15MB.
*  Correctly opens files in binary mode to avoid encoding issues.
*  Uses multiple threads for uploading parts of large objects in parallel.
*
*  PUT:
*  For smaller objects
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
const config                           = require('../configs');

var CAWS                               = require('aws-sdk');
   CAWS.config.update(regionConstants.REG_US_EAST_2);

var s3                                 = new CAWS.S3();

//====================================================================
// STRUCTS
//====================================================================
const StructUploadObject=
{
   Bucket   :  '' //(String) Name of the bucket to which the PUT operation was initiated.
   ,Key     :  '' //(String) Object key for which the PUT operation was initiated.
   //,Body    :  '' //(Buffer, Typed Array, Blob, String, ReadableStream) Object data.
};

const StructPutObject=
{
   Bucket         :  'BUCKET_NAME'
   , Key          :  'S3_FILE_NAME'
   //, Body         :  'BUFFER'
};

const StructUploadResponse={
   ETag:'SOME_ID'
   ,Location:'URL_OF_FILE_IN_S3'
   ,key:'FILE_NAME_IN_S3'
   ,Key:'FILE_NAME_IN_S3'
   ,Bucket:'BUCKET_NAME_OF_FILE_IN_S3'
};

const StructDeleteObject={
   Bucket:'S3_BUCKET_NAME'
   , Key:'S3_FILE_NAME'
};

//====================================================================
// PRIVATE METHODS
//====================================================================
function log(p_string)
{
   console.log("amazon s3 module::" + p_string);
}

//====================================================================
// PUBLIC METHODS
//====================================================================

/**
 * @param {*} p_obj 
 * @param {Function} p_callback ( Error, Data )
 */
var m_funcUploadObject = function(p_obj, p_callback)
{
   s3.upload
   (
      p_obj
      , p_callback
   );
};

// https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#upload-property
/**
 * 
 * @param {*} p_bucketName 
 * @param {*} p_fileName 
 * @param {*} p_bufferData 
 * @param {Function} p_callback ( StructUploadResponse or null )
 */
var m_funcUploadFile = function(p_bucketName, p_fileName, p_bufferData, p_callback)
{
   var _params = Object.create( StructUploadObject );
      _params.Bucket=p_bucketName;
      _params.Key=p_fileName;
      _params.Body=p_bufferData;
   
   s3.upload
   (
      _params
      , function(p_err, p_data){
         if(!p_err){
            log( "m_funcUploadFile(), Success Reading File:" + JSON.stringify(p_data) );
            p_callback( p_data );
         }else{
            log( "m_funcUploadFile(), Reading File Error:" + p_err );
            p_callback( null );
         }
      }
   );
};

// https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property
/**
 * @param {StructPutObject} p_obj 
 * @param {Function} p_callback ( Error, Data )
 */
var m_funcPutObject = function(p_structPutObject, p_callback)
{
   s3.putObject
   (
      p_obj
      , p_callback
   );
};

// https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#deleteObject-property
/**
 * 
 * @param {String} p_bucketName 
 * @param {String} p_fileName 
 */
var m_funcDeleteFile = function(p_bucketName, p_fileName){
   var _params = Object.create( StructDeleteObject );
      _params.Bucket=p_bucketName;
      _params.Key=p_fileName;

   s3.deleteObject
   (
      _params
      , function( r_err, r_dat ){
         if( r_err ){
            log( "m_funcDeleteFile(), Error:" + r_err );
         }
      }
   );
};



module.exports=
{
   uploadObject         :  m_funcUploadObject
   , uploadFile         :  m_funcUploadFile
   , putObject          :  m_funcPutObject
   , deleteFile         :  m_funcDeleteFile
};