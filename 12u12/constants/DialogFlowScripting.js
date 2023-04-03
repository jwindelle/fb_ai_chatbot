/**
*        GOOGLE DIALOGFLOW CUSTOM SCRIPTING
*        This Constant is put here because it is customizable
*        Thus, 12u12 is responsible for setting it up
*
*        FORMATS:
*        ACTION_NAME#EVENT_NAME.PARAM_NAME=PARAM_VAL
*
*        @author   Jan Windelle Manalaysay
*        @date     2018/07/24
*        @email    jan.manalaysay@12u12.com
**/

module.exports =
{
   /**
    * separator for an action and an event
    */
   ACTION_EVENT_SEPARATOR           :  "#"
   /**
    * separator for an event and a parameter
    */
   , EVENT_PARAM_SEPARATOR          :  "."
   /**
    * The variable that would be fetched from the Intent Text Response
    * example usage:
    * Intent Text Response : "You've eaten $query?"
    * let's say the user inputted "an apple"
    * then the system will reply to the user with
    * "You've eaten an apple"
    */
   , INTENT_USER_QUERY_VARIABLE     :  "$query"
};