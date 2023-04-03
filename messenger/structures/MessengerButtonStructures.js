/**
*        MESSENGER BUTTON STRUCTURES
*        https://developers.facebook.com/docs/messenger-platform/send-messages/buttons
*
*        @author   Jan Windelle Manalaysay
*        @date     2018/07/27
*        @email    jan.manalaysay@12u12.com
**/

module.exports=
{
   StructPostbackPayload:
   {
      type:"postback"
      ,title:"BUTTON_TITLE"
      ,payload:"BUTTON_POSTBACK_PAYLOAD"
   }
   , 
   StructUrl:
   {
      type:"web_url"
      , url:"BUTTON_URL_TO_OPEN"
      , title:"BUTTON_TITLE"
   }
};