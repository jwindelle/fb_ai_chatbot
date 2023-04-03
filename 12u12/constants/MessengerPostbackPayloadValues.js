/**
*        MESSENGER PERSISTENT MENUS
*        This Constant is put here because it is customizable
*        Thus, 12u12 is responsible for setting it up
*
*        These are customizable payload values when creating
*        Persistent Menus
*
*        References:
*        https://developers.facebook.com/docs/messenger-platform/send-messages/persistent-menu
*
*        @author   Jan Windelle Manalaysay
*        @date     2018/07/24
*        @email    jan.manalaysay@12u12.com
**/

// This is the current menu added to the Persistent Menus
// modify this if you need to modify the menus
/*
{
  "persistent_menu":[
    {
      "locale":"default",
      "composer_input_disabled": false,
      "call_to_actions":[
        {
          "title":"Notifications",
          "type":"nested",
          "call_to_actions":[
            {
              "title":"On",
              "type":"postback",
              "payload":"NOTIF_ON"
            },
            {
              "title":"Off",
              "type":"postback",
              "payload":"NOTIF_OFF"
            }
          ]
        }
      ]
    }
  ]
}
*/

module.exports =
{
   VAL_NOTIF_ON                              :  'NOTIF_ON'
   , VAL_NOTIF_OFF                           :  'NOTIF_OFF'
   , VAL_BODYMAP_FRONT_BODY_SUBPARTS         :  "FRONT_BODY_SUBPART"
   , VAL_BODYMAP_BACK_BODY_SUBPARTS          :  "BACK_BODY_SUBPART"
   , VAL_BODYMAP_FRONT_HEAD_SUBPARTS         :  "FRONT_HEAD_SUBPART"
};