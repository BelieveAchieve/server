module.exports = {
  moderateMessage: (data, callback) => {

    const MESSAGE = data.content

    // EMAIL_REGEX checks for standard and complex email formats
    // Ex: yay-hoo@yahoo.hello.com
    const EMAIL_REGEX = /(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g

    // PHONE_REGEX checks for 7/10 digit phone numbers with/out parenthesis
    const PHONE_REGEX = /(\(?\d{3}\)?[\-\. ]?)?\d{3}[\-\. ]?\d{4}/g

    // .test returns a boolean
    // true if there's a match and false if none
    if (EMAIL_REGEX.test(MESSAGE) || PHONE_REGEX.test(MESSAGE)) {
      callback(null, false)
    } else {
      callback(null, true)
    }
  }
}
