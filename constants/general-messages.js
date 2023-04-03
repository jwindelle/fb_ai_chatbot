/**
*
*
*        GENERAL MESSAGES
*
*
* @author   Jan Windelle Manalaysay
* @date     2018/04/20
* @email    jan.manalaysay@12u12.com
**/

const userConstants = require('./users');

const M_MSG_MESSENGER_CLOSE_WEBVIEW = "Closing of Webview only works on Android and Browsers."
   + " On iOS, the text and image will be displayed, but the browser will not close automatically."
   + "Please refer to https://developers.facebook.com/docs/messenger-platform/webview#close";

const M_ERROR_AUDIO_MAX_DURATION = "Can only process up until " 
   + userConstants.AUDIO_MAX_SECONDS_DURATION.toString()
   + " seconds of Audio";

module.exports =
{
   MSG_NO_COMMAND                               :  "No command for that"
   , MSG_MESSENGER_ACCOUNT_LINK                 :  "account link"
   , MSG_MESSENGER_ACCOUNT_UNLINK               :  "account unlink"
   , MSG_MESSENGER_ACCOUNT_LINKED               :  "You're account is linked with 12u12"
   , MSG_MESSENGER_ACCOUNT_UNLINKED             :  "You're account is unlined with 12u12"
   , MSG_NOTIFICATION                           :  "Hey, have you eaten already?"
   , MSG_PAGE_STATUS_ERROR                      :  "Oops, something went wrong. Please close window and retry process"
   , MSG_MESSENGER_GET_STARTED                  :  "Welcome"
   , MSG_SIGNUP_FINISHED                        :  "Thank you for registering with 12u12"
   , MSG_GREETING_EXISTING_USER                 :  "Welcome back"
   , MSG_MESSENGER_CLOSE_WEBVIEW                :  M_MSG_MESSENGER_CLOSE_WEBVIEW
   , MSG_FACEBOOK_LOGIN_ALREADY                 :  "You're already registered with 12u12"
   , MSG_DIALOGFLOW_FOOD_INTENT_START           :  process.env.GOOGLE_DF_INTENT_FOOD_START
   , MSG_DIALOGFLOW_SYMPTOM_INTENT_START        :  process.env.GOOGLE_DF_INTENT_SYMPTOM_START
   , MSG_DIALOGFLOW_SYMPTOM_CHECK_INTENT_START  :  process.env.GOOGLE_DF_INTENT_SYMPTOM_CHECK
   , MSG_CRON_USER_STARTED                      :  "You turned on the notification"
   , MSG_CRON_USER_STOPPED                      :  "You turned off the notification"
   , MSG_PROCESS_ERROR                          :  "Please try again or report problem to the Administrator"
   , MSG_ERROR_USER_AUDIO_MAX_DURATION          :  M_ERROR_AUDIO_MAX_DURATION
   , MSG_ERROR_ACCOUNT                          :  "Please create an account first to be able to use this feature"
   , MSG_CONVERSATION_HANDLER_NOTIFY_USER       :  "PING"
};