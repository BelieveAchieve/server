module.exports = router => {
  router.route('/moderate/message').post((req, res) => {
    // Removed ModerationCtrl's moderateMessage() request, response callback
    // No longer using cleanspeak, and will be implementing our own moderation logic
  })
}
