module.exports = {
  isCertified: function(certifications) {
    let isCertified = false

    for (const subject in certifications) {
      if (certifications[subject].passed) {
        isCertified = true
        break
      }
    }

    return isCertified
  }
}
