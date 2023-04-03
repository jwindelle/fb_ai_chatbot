/**
*
*
*        12U12 REST API MODULE
*        refer to the link below for reference
*        https://docs.google.com/document/d/1x4TBLVOEWw-W1nVVHeVm3uuH_5CjDCXrQZ3t267vmzM/edit#heading=h.u2x5ll2fw3c8
*
*
*
* @author   Jan Windelle Manalaysay
* @date     2018/02/26
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

//==========================================================
//    STRUCTS
// these objects can be copied but can't be modified because they are just guides
// , but fields can be added or removed as the API requires

// https://docs.google.com/document/d/1x4TBLVOEWw-W1nVVHeVm3uuH_5CjDCXrQZ3t267vmzM/edit#heading=h.8crefg35ixou
const StructNewUser=
{
   email       :  ""
   ,mobile     :  ""
   ,password   :  ""
   ,first_name :  ""
   ,last_name  :  ""
   ,nick_name  :  ""
   ,address    :  ""
   ,gender     :  0
   ,birthday   :  0//User’s birth month and year only. (milliseconds)
   ,locale     :  ""
};

const StructSubUser=
{
   first_name  :  ""
   ,last_name  :  ""
   ,gender     :  0
   ,address    :  ""
   ,ethnicity  :  ""
   ,birthday   :  0//User’s birth month and year only. (milliseconds)
};

//==========================================================
//    MEMBERS
var urlConstants                             = require('../constants/urls');
const RestApiEndpoints                       = require('./constants/RestApiEndPoints');

const REST_API_URL                           = urlConstants.URL_REST_API_BASE;
const REST_API_VER                           = RestApiEndpoints.VERSION;
const REST_API_USER                          = RestApiEndpoints.USERS;
const REST_API_SEC_AUTH                      = "/security/authenticate/";

const REST_API_LOOKUP_COUNTRY_CITY           = "/lookup/countrycity";

const M_DEFAULT_YEAR_STRING                  = "1970";
const M_DEFAULT_MONTH_NUMBER_STRING          = "1";

var m_request;

var pageStatusCodes                          = require("../constants/page-status-codes");


//==========================================================
//    PRIVATE METHODS METHODS
function log(p_string)
{
   console.log("12u12rest module::" + p_string);
}

//==========================================================
//    PUBLIC METHODS
/**
 * This will return a formatted current date
 * that is accepted in API
 */
var m_funcGetCurrentDate = function()
{
   var _date = new Date();

   var _month = _date.getMonth()+1;
   var _m = (_month<10?"0"+_month:_month);

   var _day = _date.getDate();
   var _d = (_day<10?"0"+_day:_day);


   return _date.getFullYear()+"-"+_m+"-"+_d;
};

/**
 * @param {'callback function'} p_callback
 * functionWithArrayofObjectsParam
([
   {
      "_id":"5a8d016f2b3597021b2ac661"
      ,"userid":null
      ,"email":"jan.manasalay@12u12.com"
      ,"password":"bfXygdRe8N1o/hdccNGW98qapsDXXnCUPhuYumm35z0="
      ,"salt":"urPyvRXvKtQEid46Miqzjrzb8ieIkT"
      ,"first_name":"Jan"
      ,"last_name":"Manasalay"
      ,"nick_name":"Jan.M"
      ,"address":"Asia Jaya
      , Selangor","mobile":"01624413326"
      ,"gender":1,"birthday":"1987-10-01"
      ,"type":["1"]
      ,"locale":"en"
      ,"status":1
      ,"recent_ms":null
      ,"joined":"2018-02-21T05:19:39.549+0000"
   }
   ,{n number of users data}
])
 */
var m_funcGetUsers = function(p_callback)
{
   m_request
   (
      REST_API_URL+REST_API_VER+REST_API_USER
      , function(p_err, p_res, p_body)
      {
         if(!p_err && p_res.statusCode===pageStatusCodes.STATUS_OK){
            p_callback(p_body);
         }else{
            log("Get Users ERROR! " + p_err);
            log("Get Users ERROR! status code : " + p_res.statusCode );
            log("Get Users ERROR! body : " + p_body);
            p_callback(pageStatusCodes.STATUS_ERROR);
         }
      }
   );
};

// Reference:
// https://docs.google.com/document/d/1x4TBLVOEWw-W1nVVHeVm3uuH_5CjDCXrQZ3t267vmzM/edit#heading=h.8crefg35ixou
/**
 * @param {StructNewUser} p_object 
 * @param {Function} p_callback  CallbackFunction( Page Status Code, Returned Body )
 */
var m_funcRegisterUser = function(p_object, p_callback)
{
   m_request
   (
      {
         headers  : {'content-type':'application/json'}
         , uri    : REST_API_URL+REST_API_VER+REST_API_USER
         , method : 'POST'
         , json   : p_object
      }
      , function (p_err, p_res, p_body)
      {
         if (!p_err){
            log("m_funcRegisterUser(), Registered User:" + JSON.stringify(p_body) );
            p_callback(p_res.statusCode, p_body);
         }else{
            log("m_funcRegisterUser(), Registered User Error:" + p_err );
            log("m_funcRegisterUser(), Registered User Error Body:" + JSON.stringify(p_body) );
            p_callback(pageStatusCodes.STATUS_ERROR, p_err);
         }
      }
   );
};

// Reference:
// https://docs.google.com/document/d/1x4TBLVOEWw-W1nVVHeVm3uuH_5CjDCXrQZ3t267vmzM/edit#heading=h.910cgln3xuv9
/**
 * Returns an Authentication Token
 * @param {String} p_email 
 * @param {String} p_password 
 * @param {Function} p_callback 
 */
var m_funcAuthenticateUser = function(p_email, p_password, p_callback)
{
   m_request
   (
      {
         headers  : 
         {
            'content-type' :  'application/json'
            ,'email'       :  p_email
            ,'password'    :  p_password
         }
         , uri    : REST_API_URL+REST_API_VER+REST_API_SEC_AUTH
         , method : 'GET'
      }
      , function (p_err, p_res, p_body)
      {
         if (!p_err){
            log( "m_funcAuthenticateUser(), Success Authentication Status:" + JSON.stringify(p_body) );
            p_callback(p_res.statusCode, JSON.parse(p_body) );
         }else{
            log( "m_funcAuthenticateUser() Authentication Error:" + p_err );
            log( "m_funcAuthenticateUser() Authentication Body:" + JSON.stringify(p_body) );
            p_callback(pageStatusCodes.STATUS_ERROR, p_err);
         }
      }
   );
};

// Reference:
// https://docs.google.com/document/d/1x4TBLVOEWw-W1nVVHeVm3uuH_5CjDCXrQZ3t267vmzM/edit#heading=h.tbl7h5jfrae
/**
 * @param {String} p_userId   12u12 User's ID
 * @param {String} p_authToken 
 * @param {Object String} p_object 
 * @param {*} p_callback 
 */
var m_funcUpdateUser = function(p_userId, p_authToken, p_object, p_callback)
{
   m_request
   (
      {
         headers  : 
         {
            'content-type' :  'application/json'
            ,'token'       :  p_authToken
         }
         , uri    : REST_API_URL+REST_API_VER+REST_API_USER+p_userId
         , method : 'PUT'
         , json   : p_object
      }
      , function (p_err, p_res, p_body)
      {
         if (!p_err){
            log("m_funcUpdateUser(), Success Updated User:" + JSON.stringify(p_body) );
            p_callback(p_res.statusCode, p_body);
         }else{
            log("m_funcUpdateUser(), Updated User Error:" + p_err );
            log("m_funcUpdateUser(), Updated User Error Body:" + JSON.stringify(p_body) );
            p_callback(pageStatusCodes.STATUS_ERROR, p_err);
         }
      }
   );
};

/**
 * @param {String} p_userId   this is the user ID from the system, which is shown when you
 * register a new user or when you fetch the list of users 
 * @param {"callback function"} p_callback
 * functionWithPassedParam
 ({
   "_id":"5a99488678fedd2e44b9a910"
   ,"userid":1680787885293683
   ,"email":"tester_1519995009879@domain.com"
   ,"password":"qDMX+CxnrUTXONG4R+u+84Ci6zInvpgfK8jCKIDhGtY="
   ,"salt":"gHLTRo0nXpXqFuBeyCoXdNDdTFSm8S"
   ,"first_name":"f1"
   ,"last_name":"l1"
   ,"nick_name":"n1"
   ,"address":"a1"
   ,"mobile":"1"
   ,"gender":1
   ,"birthday":"2018-03-02"
   ,"type":["1"]
   ,"locale":"en"
   ,"status":1
   ,"recent_ms":1519995009879
   ,"joined":"2018-03-02T12:50:09.935+0000"
 })
 */
var m_funcGetUserById = function(p_strUserId, p_callback)
{
   m_request
   (
      REST_API_URL+REST_API_VER+REST_API_USER+p_strUserId
      , function(p_err, p_res, p_body)
      {
         if(!p_err && p_res.statusCode===pageStatusCodes.STATUS_OK){
            var _parsedBody = JSON.parse(p_body);
            p_callback(_parsedBody);
         }else{
            log("Get User By ID " + p_strUserId + " ERROR! " + p_err);
            log("Get User By ID " + p_strUserId + " ERROR! status code : " + p_res.statusCode );
            log("Get User By ID " + p_strUserId + " ERROR! body : " + p_body);
            p_callback(pageStatusCodes.STATUS_ERROR);
         }
      }
   );
};

/**
 * @param {String} p_userId   this is the user ID from the system, which is shown when you
 * register a new user or when you fetch the list of users 
 * @param {"callback function"} p_callback function(PAGE_RETURN_STATUS)
 */
var m_funcDeleteUserById = function(p_strUserId, p_authToken, p_callback)
{
   m_request
   (
      {
         headers  : {
            'content-type':'application/json'
            ,'token':p_authToken
         }
         , uri      : REST_API_URL+REST_API_VER+REST_API_USER
         , method : 'PUT'
         , json   : {id:p_strUserId}
      }
      , function (p_err, p_res, p_body)
      {
         if (!p_err && p_res.statusCode === pageStatusCodes.STATUS_OK)
         {
            p_callback(pageStatusCodes.STATUS_OK);
         } else {
            log("Delete User " + p_strUserId + " ERROR! " + p_err);
            log("Delete User " + p_strUserId + " ERROR! status code : " + p_res.statusCode );
            log("Delete User " + p_strUserId + " ERROR! body : " + p_body);

            //p_callback(pageStatusCodes.STATUS_ERROR);
            p_callback(pageStatusCodes.STATUS_ERROR);
         }
      }
   );
};

var m_funcGetValidatedEmail = function(p_email)
{
   log("m_funcGetValidatedEmail, p_email=" + p_email);
   if( p_email===undefined || p_email==="" )
   {
      p_email = Date.now().toString()+"@12u12.com";
   }

   log("m_funcGetValidatedEmail, returning p_email=" + p_email);
   return p_email;
};

/**
 * @returns 0|1|2 == unknown|male|female 
 */
var m_funcGetValidatedGender = function(m_gender)
{
   log("m_funcGetValidatedGender, m_gender=" + m_gender);
   var _gender = 0;

   if( m_gender!==undefined )
   {
      try
      {
         var i = parseInt(m_gender);
         if( i<0 || i>2 ){_gender = 0;}
      }
      catch(p_err){}
   }

   log("m_funcGetValidatedGender, returning m_gender=" + m_gender);
   return _gender;
};

var m_funcGetValidatedBirthday = function(p_birthday)
{
   log("m_funcGetValidatedBirthday, p_birthday=" + p_birthday);
   var _birthday = p_birthday;

   if(p_birthday!==undefined)
   {
      if(p_birthday.indexOf("/")>-1)
      {
         var _arr = p_birthday.split("/");
         if(_arr.length===3)
         {
            _birthday = _arr[2]+"-"+_arr[0]+"-"+_arr[1];
         }
      }
      else
      {
         // TODO:
         // handle other formats of birthday here
         _birthday = "2018-12-12";
      }
   }

   log("m_funcGetValidatedBirthday, returning p_birthday=" + p_birthday);


   return _birthday;
};

/**
 * @param {'request module instance'} p_request 
 */
var m_funcInitialize = function(p_app, p_request)
{
   m_request = p_request;
};

var m_funcGetCountryCityList = function(p_callback)
{
   log( "m_funcGetCountryCityList(), URI:" + REST_API_URL+REST_API_VER+REST_API_LOOKUP_COUNTRY_CITY );
   m_request
   (
      {
         headers  : { 'content-type':'application/json'}
         , uri    : REST_API_URL+REST_API_VER+REST_API_LOOKUP_COUNTRY_CITY
         , method : 'GET'
      }
      , function (p_err, p_res, p_body)
      {
         if (p_res.statusCode === pageStatusCodes.STATUS_OK)
         {
            log( "m_funcGetCountryCityList(), Success fetching country city list" );
            var _parsedData = JSON.parse(p_body);
            p_callback(p_res.statusCode, _parsedData.countries_cities);
            //log( "m_funcGetCountryCityList()," + JSON.stringify(p_body) );
         } else {
            log("m_funcGetCountryCityList() ERROR! " + p_err);
            log("m_funcGetCountryCityList() ERROR! status code : " + p_res.statusCode );
            log("m_funcGetCountryCityList() ERROR! body : " + p_body);

            p_callback(p_res.statusCode, p_body);
         }
      }
   );
};


// Reference:
// https://docs.google.com/document/d/1KYm8wRP6WmwAhtVDSGg1GomYcPl1jGVjpGz_ZgSGoT8/edit#heading=h.p2bbvpv7yvk2
/**
 * Retrieves the body part Info by body part name
 * @param {String} p_bodyPartName 
 * @param {Function} p_callback ( Page Status Code, Body )
 */
var m_funcGetBodyPartInfoByPartName = function(p_bodyPartName, p_callback)
{
   log("m_funcGetBodyPartInfoByPartName()");
   m_request
   (
      {
         headers  : { 'content-type':'application/json'}
         , uri    : REST_API_URL+REST_API_VER+RestApiEndpoints.BODYPARTS+p_bodyPartName
         , method : 'GET'
      }
      , function (p_err, p_res, p_body)
      {
         if (p_res.statusCode === pageStatusCodes.STATUS_OK)
         {
            log("m_funcGetBodyPartInfoByPart(), body:" + p_body);
            var _parsedData = JSON.parse(p_body);
            p_callback(p_res.statusCode, _parsedData);
         } else {
            log("m_funcGetBodyPartInfoByPart(), Error:" + p_err);
            p_callback(p_res.statusCode, p_body);
         }
      }
   );
};

// Reference:
// https://docs.google.com/document/d/1I9CNyGj6Mh5fMt82IbzCrLieAGYWfLQUFfcPFwJI_8I/edit#heading=h.jos9ced7dzww
/**
 * @param {String} p_symptomName 
 * @param {Function} p_callback ( Page Status Code, Symptom ID )
 */
var m_funcGetSymptomIdByName = function(p_symptomName, p_callback){
   log("m_funcGetSymptomIdByName(), p_symptomName:" + p_symptomName);
   m_request
   (
      {
         headers  : { 'content-type':'application/json'}
         , uri    : REST_API_URL+REST_API_VER +RestApiEndpoints.SYMPTOMS
         , method : 'GET'
      }
      , function (p_err, p_res, p_body)
      {
         if (p_res.statusCode === pageStatusCodes.STATUS_OK)
         {
            var _parsedData = JSON.parse(p_body);
            //log("m_funcGetSymptomIdByName(), _parsedData:" + JSON.stringify(_parsedData) );
            var _id;
            for( var i=0; i<_parsedData.length; i++ )
            {
               //log("m_funcGetSymptomIdByName(), _parsedData["+i+"].url_name:" + _parsedData[i].url_name );
               if( _parsedData[i].url_name===p_symptomName ){
                  _id = _parsedData[i]._id;
                  break;
               }
            }
            p_callback(p_res.statusCode, _id );
         } else {
            log("m_funcGetSymptomIdByName(), Error:" + p_err);
            p_callback(p_res.statusCode, p_body);
         }
      }
   );
};

// https://docs.google.com/document/d/1iqZUtrpPMU8jE4fzBaSuWWx2-cTy1_aD7wJmlhYL584/edit#heading=h.f116mnchx47f
/**
 * @param {String} p_foodName 
 * @param {Function} p_callback refer to URL for response format
 */
var m_funcSearchFoodByKeyword = function(p_foodName, p_callback)
{
   log("m_funcSearchFoodByKeyword(), p_foodName:" + p_foodName);
   m_request
   (
      {
         headers  : { 'content-type':'application/json'}
         , uri    : REST_API_URL+REST_API_VER +RestApiEndpoints.FOOD_GENERAL_SEARCH+p_foodName+"/"
         , method : 'GET'
      }
      , function (p_err, p_res, p_body)
      {
         if (p_res.statusCode === pageStatusCodes.STATUS_OK)
         {
            //log("m_funcSearchFoodByKeyword(), Body:" + JSON.stringify(p_body));
            p_callback(JSON.parse(p_body));
         } else {
            log("m_funcSearchFoodByKeyword(), Error:" + p_err);
            p_callback(undefined);
         }
      }
   );
};


module.exports =
{
   DEFAULT_YEAR_STRING                 :  M_DEFAULT_YEAR_STRING
   , DEFAULT_MONTH_NUMBER_STRING       :  M_DEFAULT_MONTH_NUMBER_STRING
   , StructNewUser                     :  StructNewUser
   , initialize                        :  m_funcInitialize
   , getCurrentDate                    :  m_funcGetCurrentDate
   , getUsers                          :  m_funcGetUsers
   , authenticateUser                  :  m_funcAuthenticateUser
   , registerUser                      :  m_funcRegisterUser
   , updateUser                        :  m_funcUpdateUser
   , getUserById                       :  m_funcGetUserById
   , deleteUserById                    :  m_funcDeleteUserById
   , getValidateEmail                  :  m_funcGetValidatedEmail
   , getValidatedGender                :  m_funcGetValidatedGender
   , getValidatedBirthday              :  m_funcGetValidatedBirthday
   , getCountryCityList                :  m_funcGetCountryCityList
   , getBodyPartInfoByPartName         :  m_funcGetBodyPartInfoByPartName
   , getSymptomIdByName                :  m_funcGetSymptomIdByName
   , searchFoodByKeyword               :  m_funcSearchFoodByKeyword
};