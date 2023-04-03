/**
*
*
*        CUSTOM 12U12 BODY MAP HANDLER MODULE
*
*
*
*  This module is in-charge of handling all body map callback methods
*  e.g.
*  convertion of date format to another
*
*
*  @author  Jan Windelle Manalaysay
*  @date    2018/08/20
*  @email   jan.manalaysay@12u12.com
*
**/

'use strict';

const URL_PARAM_INDICATOR        = "?";
const URL_PARAMS_SEPARATOR       = "&";
const URL_PARAMS_VALUE_SEPARATOR = "=";
const MSG_SYMPTOM_CONFIRM_FORMAT = "You have %s on %s %s?";
const MSG_SEVERITY_SELECT        = "Please select severity of your %s";
const MSG_SHOW_BODYMAP_WEBSITE   = "Would you like to tell us if you have a symptom?";

const USR_RESPONSE_YES           =  "Yes";
const USR_RESPONSE_NO            =  "No";

const PayloadKeys                = require('../constants/PayloadKeys');
const UrlParamNames              = require('../../constants/urlParamNames');
const BodyMapUrlParamNames       = require('../constants/BodyMapParamNames');
const MessageConstants           = require('../../constants/general-messages');
const PageStatusCodes            = require('../../constants/page-status-codes');

var jsUtil                       = require('util');
var m_app, m_request;
var m_restApi                    = require('../restapi');
var m_msgrInst                   = require('../../messenger/messenger');
var utils                        = require('../../utils');

//==========================================================
//    STRUCTURES
const StructConfirmPromptPayload=
{
   title:""
   ,payload:""
};

var StructBodyMapObject={};
   StructBodyMapObject[BodyMapUrlParamNames.NAME_SIDE_ID]="";
   StructBodyMapObject[BodyMapUrlParamNames.NAME_BODYPART_ID]="";
   StructBodyMapObject[BodyMapUrlParamNames.NAME_SYMPTOM_ID]="";
   StructBodyMapObject[BodyMapUrlParamNames.NAME_SEVERITY_ID]="";

//==========================================================
//    PRIVATE METHODS
function log(p_string)
{
   // put in a separate function
   // so that maybe in the future
   // when there is a switch for
   // debug mode, it can handle
   // wether to show the log or not'
   console.log("12u12 Body Map Callback Handler module::" + p_string);
}

function showConfirmPrompt(p_messengerId, p_headerTitle, p_yesStructConfirmPromptPayload, p_noStructConfirmPromptPayload)
{
   log( "showConfirmPrompt(), p_messengerId="+p_messengerId );
   var _sQuickReplyTxt = require('../../messenger/structures/MessengerQuickReplyTypeStructures').StuctText;

   var _yes = Object.assign({},_sQuickReplyTxt);
      _yes.title=p_yesStructConfirmPromptPayload.title;
      _yes.payload=p_yesStructConfirmPromptPayload.payload;

   var _no = Object.assign({},_sQuickReplyTxt);
      _no.title=p_noStructConfirmPromptPayload.title;
      _no.payload=p_noStructConfirmPromptPayload.payload;

   m_msgrInst.sendQuickReplies(p_messengerId,p_headerTitle,[_yes,_no]);
}

function showScales(p_messengerId, p_payloadValue)
{
   log("showScales(), p_payloadValue:" + p_payloadValue);
   if( p_payloadValue.indexOf(URL_PARAM_INDICATOR)!==-1 ){
      var _payloadParamPair = p_payloadValue.split(URL_PARAM_INDICATOR);
      var _structBodyMapObject = Object.create(StructBodyMapObject);
      _structBodyMapObject = JSON.parse(_payloadParamPair[1]);

      var _symptomName = _structBodyMapObject[BodyMapUrlParamNames.NAME_SYMPTOM_ID];
      var _bodyPartName = _structBodyMapObject[BodyMapUrlParamNames.NAME_BODYPART_ID]

      var p_headerTitle = jsUtil.format(MSG_SEVERITY_SELECT, _symptomName);
      m_restApi.getBodyPartInfoByPartName
      ( 
         _bodyPartName
         , function(p_pageStatus, p_dat){
            log("showScales(), p_body:" + p_dat);
            for( var i=0; i<p_dat.symptoms.length; i++ ){
               if( _symptomName===p_dat.symptoms[i].name )
               {
                  /*for( var j=0; j<p_dat.symptoms[i].scale.length; j++ ){
                     m_msgrInst.sendText( p_messengerId, p_dat.symptoms[i].scale[j].label );
                  }*/
                  var _sQuickReplyTxt = require('../../messenger/structures/MessengerQuickReplyTypeStructures').StuctText;
                  var _arr=[];
                  for( var j=0; j<p_dat.symptoms[i].scale.length; j++ )
                  {
                     var _currScale = p_dat.symptoms[i].scale[j];

                     var _obj = Object.assign({},_sQuickReplyTxt);
                        _obj.title=_currScale.label;
                        _structBodyMapObject[BodyMapUrlParamNames.NAME_SEVERITY_ID]=_currScale.value;
                        _obj.payload=PayloadKeys.KEY_BODYMAP_SEVERITY
                           +URL_PARAM_INDICATOR+JSON.stringify(_structBodyMapObject);
                        // TODO:
                        // pick an image depending of type of severity
                        _obj.image_url="";
                     _arr.push( _obj );
                  }
                  m_msgrInst.sendQuickReplies(p_messengerId,p_headerTitle,_arr);
                  break;
               }
            }
         }
      );

   }
}

function askToShowBodyMapWebsite(p_messengerId){
   var _yesPayloadObj = Object.assign({},StructConfirmPromptPayload);
      _yesPayloadObj.title=USR_RESPONSE_YES;
      _yesPayloadObj.payload=PayloadKeys.KEY_BODYMAP_WEBSITE_YES;

   var _noPayloadObj = Object.assign({},StructConfirmPromptPayload);
      _noPayloadObj.title=USR_RESPONSE_NO;
      _noPayloadObj.payload=PayloadKeys.KEY_BODYMAP_WEBSITE_NO;
   
   showConfirmPrompt(p_messengerId, MSG_SHOW_BODYMAP_WEBSITE, _yesPayloadObj, _noPayloadObj);
}

function sendUserBodySymptom(p_messengerId, p_payloadValue){
   askToShowBodyMapWebsite(p_messengerId);
}

//==========================================================
//    PUBLIC METHODS
var m_funcSetMessenger = function(p_messengerInst){
   m_msgrInst = p_messengerInst;
};

var m_funcSetRestApi = function(p_restApi){
   m_restApi = p_restApi;
};

/**
 * This will handle all requests coming from the 12u12 Body Map Website
 * @param {Object} p_req   Express Request
 * @param {Object} p_res   Express Response or Reference Window/WebView
 */
var m_funcHandleOnBodyMapCallback = function(p_req, p_res)
{
   //log( "m_funcOnBodyMapCallback(), p_req.query:" + JSON.stringify(p_req.query) );
   utils.getPromisedUrlSafeDecryptedString( p_req.query[UrlParamNames.NAME_MESSENGER_ID] )
   .then(function(r_decryptedMid)
   {
      m_msgrInst.getPromiseUserInfoByMessengerId(r_decryptedMid)
      .then(function(r_structUsr)
      {
         if(r_structUsr.error!==undefined){
            p_res.status(PageStatusCodes.STATUS_ERROR).send(MessageConstants.MSG_PAGE_STATUS_ERROR);
         }else{
            var _sidePart="", _bodypart, _symptom;
            if( p_req.query[BodyMapUrlParamNames.NAME_SIDE_ID]!==undefined )
               _sidePart = p_req.query[BodyMapUrlParamNames.NAME_SIDE_ID].toString();
            _bodypart = p_req.query[BodyMapUrlParamNames.NAME_BODYPART_ID];
            _symptom = p_req.query[BodyMapUrlParamNames.NAME_SYMPTOM_ID];

            var _obj = Object.assign({},StructBodyMapObject);
               _obj[BodyMapUrlParamNames.NAME_SIDE_ID]=_sidePart;
               _obj[BodyMapUrlParamNames.NAME_BODYPART_ID]=_bodypart;
               _obj[BodyMapUrlParamNames.NAME_SYMPTOM_ID]=_symptom;

            var _yesPayloadObj = Object.assign({},StructConfirmPromptPayload);
               _yesPayloadObj.title=USR_RESPONSE_YES;
               _yesPayloadObj.payload=PayloadKeys.KEY_BODYMAP_YES
                  +URL_PARAM_INDICATOR+JSON.stringify(_obj);

            var _noPayloadObj = Object.assign({},StructConfirmPromptPayload);
               _noPayloadObj.title=USR_RESPONSE_NO;
               _noPayloadObj.payload=PayloadKeys.KEY_BODYMAP_NO;

            if( _bodypart!==undefined && _symptom!==undefined ){
               var _title = jsUtil.format(MSG_SYMPTOM_CONFIRM_FORMAT, _symptom, _sidePart, _bodypart);
               //log("m_funcOnBodyMapCallback(), _title:" + _title);
               showConfirmPrompt(r_decryptedMid, _title, _yesPayloadObj, _noPayloadObj);
            }
            p_res.redirect( m_msgrInst.getCloseWebViewRedirectUrl() );
         }
      });
   })
   .catch(function(err){
      p_res.status(PageStatusCodes.STATUS_ERROR).send(MessageConstants.MSG_PAGE_STATUS_ERROR);
   });
};

var m_funcHandleOnMessengerQuickReplyPayload = function(p_msgrSenderId, p_payloadValue)
{
   if( p_payloadValue.indexOf(PayloadKeys.KEY_BODYMAP_YES)!==-1 ){
      showScales(p_msgrSenderId, p_payloadValue);
   }else if( p_payloadValue.indexOf(PayloadKeys.KEY_BODYMAP_NO)!==-1 ){
      askToShowBodyMapWebsite(p_msgrSenderId);
   }else if( p_payloadValue.indexOf(PayloadKeys.KEY_BODYMAP_SEVERITY)!==-1 ){
      sendUserBodySymptom(p_msgrSenderId, p_payloadValue);
   }else if( p_payloadValue.indexOf(PayloadKeys.KEY_BODYMAP_WEBSITE_YES)!==-1 ){
      utils.getPromisedUrlSafeEncryptedString(p_msgrSenderId)
      .then(function(r_dat)
      {
         m_msgrInst.showUrlButton
         (
            p_msgrSenderId
            , require('../../constants/button-names').BTN_BODY_MAP
            , require('../../constants/urls').URL_BODY_MAP
               + require('../../constants/urlParams').PARAM_MESSENGER_ID
               + r_dat
         );
      });
   }else{
      log("m_funcHandleOnMessengerQuickReplyPayload(), no handler for payload value:" + p_payloadValue);
   }
};



module.exports={
   setMessenger                         :  m_funcSetMessenger
   , setRestApi                           :  m_funcSetRestApi
   , OnBodyMapCallback                    :  m_funcHandleOnBodyMapCallback
   , handleMessengerQuickReplyPayload     :  m_funcHandleOnMessengerQuickReplyPayload
};