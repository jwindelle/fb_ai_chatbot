/**
*        PAYLOADS MAP
*        This Constant Map is put here because it is customizable
*        Thus, 12u12 is responsible for setting it up
*
*        Values here are used to get the value of a certain payload key
*        example usage is if you set Messenger Payload Values then
*        it would need to send a keyword that matches with one of Google DialogFlow's Intent keyword word/phrase
*
*
*        @author   Jan Windelle Manalaysay
*        @date     2018/07/26
*        @email    jan.manalaysay@12u12.com
**/

const PayloadKeys = require('./PayloadKeys');

module.exports=
{
   [PayloadKeys.KEY_DIALOGFLOW_YES]              :  "yes"
   , [PayloadKeys.KEY_DIALOGFLOW_NO]             :  "no"
};