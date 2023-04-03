/**
*        MESSENGER TEMPLATE PAYLOAD ELEMENT STRUCTURE
*        https://developers.facebook.com/docs/messenger-platform/reference/template/generic/#elements
*
*        @author   Jan Windelle Manalaysay
*        @date     2018/07/27
*        @email    jan.manalaysay@12u12.com
**/

module.exports=
{
   title:""
   , subtitle:""//Optional
   , image_url:""//Optional
   , default_action://Optional//https://developers.facebook.com/docs/messenger-platform/reference/buttons/url
   {
      type:"web_url"
      , url:""
      , webview_height_ratio:""
   }
   , buttons:[]//Optional //MessengerTemplatePayloadElementButtonStructures.js
};