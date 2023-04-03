/**
*        MESSENGER QUICK REPLY TYPE STRUCTURES
*        https://developers.facebook.com/docs/messenger-platform/send-messages/quick-replies/#sending
*
*        @author   Jan Windelle Manalaysay
*        @date     2018/07/25
*        @email    jan.manalaysay@12u12.com
**/

module.exports=
{
   // https://developers.facebook.com/docs/messenger-platform/send-messages/quick-replies/#text
   StuctText:
   {
      content_type   :  "text"
      , title        :  ""
      , image_url    :  ""
      , payload      :  ""
   }
   // https://developers.facebook.com/docs/messenger-platform/send-messages/quick-replies/#locations
   , StructLocation:{content_type:"location"}
   // https://developers.facebook.com/docs/messenger-platform/send-messages/quick-replies/#phone
   , StructPhone:{content_type:"user_phone_number"}
   // https://developers.facebook.com/docs/messenger-platform/send-messages/quick-replies/#email
   , StructEmail:{content_type:"user_email"}
};