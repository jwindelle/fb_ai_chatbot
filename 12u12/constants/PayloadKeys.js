/**
*        PAYLOAD KEYS
*        This Constant is put here because it is customizable
*        Thus, 12u12 is responsible for setting it up
*
*        Values here are used to pass values from one module to another
*        example usage is if you set Messenger Payload Values then
*        it would need to send a keyword that matches with one of Google DialogFlow's Intent keyword word/phrase
*        Values can be viewed on the PayloadsMap.js file
*
*
*        @author   Jan Windelle Manalaysay
*        @date     2018/07/26
*        @email    jan.manalaysay@12u12.com
**/

module.exports=
{
   KEY_DIALOGFLOW_YES                  :  "dialogflow_yes"
   ,KEY_DIALOGFLOW_NO                  :  "dialogflow_no"
   ,KEY_BODYMAP                        :  "bodymap"
   ,KEY_BODYMAP_YES                    :  "bodymap_yes"
   ,KEY_BODYMAP_NO                     :  "bodymap_no"
   ,KEY_BODYMAP_SEVERITY               :  "bodymap_severity"
   ,KEY_BODYMAP_WEBSITE_YES            :  "bodymap_website_yes"
   ,KEY_BODYMAP_WEBSITE_NO             :  "bodymap_website_no"
   ,KEY_CONVERSATION_FLOW              :  "conversation_flow"
   ,KEY_CONVERSATION_FLOW_YES          :  "conversation_flow_yes"
   ,KEY_CONVERSATION_FLOW_NO           :  "conversation_flow_no"
};