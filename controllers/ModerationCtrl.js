module.exports = {
  moderateMessage: (data, callback) => {

    const MESSAGE = data.content

    // EMAIL_REGEX checks for standard and complex email formats
    // Ex: yay-hoo@yahoo.hello.com
    const EMAIL_REGEX = /(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/gi

    // PHONE_REGEX checks for 7/10 digit phone numbers with/out parenthesis
    const PHONE_REGEX = /(\(?\d{3}\)?[\-\. ]?)?\d{3}[\-\. ]?\d{4}/g

    // PROFANITY_REGEX - Google's list of common bad words
    const PROFANITY_REGEX =  /(4r5e|5h1t|5hit|a55|anal|ass-fucker|assfucker|assfukka|a_s_s|b!tch|b00bs|b17ch|b1tch|ballbag|ballsack|beastial|beastiality|bellend|bestial|bestiality|blow job|blowjob|blowjobs|boiolas|bollock|bollok|booooooobs|buceta|bugger|bunny fucker|buttmuch|buttplug|c0ck|c0cksucker|carpet muncher|cawk|chink|cipa|cl1t|clit|clitoris|clits|cnut|cock|cock-sucker|cockface|cockhead|cockmunch|cockmuncher|cocks|cocksuck|cocksucked|cocksucker|cocksucking|cocksucks|cocksuka|cocksukka|cok|cokmuncher|coksucka|coon|cox|crap|cumshot|cunilingus|cunillingus|cunnilingus|cunt|cuntlick|cuntlicker|cuntlicking|cunts|cyalis|cyberfuc|cyberfuck|cyberfucked|cyberfucker|cyberfuckers|cyberfucking|dink|dinks|dirsa|dlck|dog-fucker|donkeyribber|doosh|duche|dyke|ejaculate|ejaculated|ejaculates|ejaculating|ejaculatings|ejaculation|ejakulate|f u c k|f u c k e r|f4nny|fag|fagging|faggitt|faggot|faggs|fagot|fagots|fags|fannyflaps|fannyfucker|fanyy|fatass|felching|fellate|fellatio|fingerfuck|fingerfucked|fingerfucker|fingerfuckers|fingerfucking|fingerfucks|fistfuck|fistfucked|fistfucker|fistfuckers|fistfucking|fistfuckings|fistfucks|flange|fucka|fucked|fucker|fuckers|fuckhead|fuckheads|fuckin|fucking|fuckings|fuckingshitmotherfucker|fuckme|fucks|fuckwhit|fuckwit|fudge packer|fudgepacker|fuk|fuker|fukker|fukkin|fuks|fukwhit|fukwit|fux|fux0r|f_u_c_k|gangbang|gangbanged|gangbangs|goatse|hardcoresex|heshe|hoar|hoare|hoer|hore|horniest|horny|hotsex|jack-off|jackoff|jap|jerk-off|m45terbate|ma5terb8|ma5terbate|masochist|master-bate|masterb8|masterbat*|masterbat3|masterbate|masterbation|masterbations|masturbate|mo-fo|mof0|mofo|mothafuck|mothafucka|mothafuckas|mothafuckaz|mothafucked|mothafucker|mothafuckers|mothafuckin|mothafucking|mothafuckings|mothafucks|mother fucker|motherfuck|motherfucked|motherfucker|motherfuckers|motherfuckin|motherfucking|motherfuckings|motherfuckka|motherfucks|muff|muthafecker|muthafuckker|mutherfucker|n1gga|n1gger|nazi|nigg3r|nigg4h|nigga|niggah|niggas|niggaz|nigger|niggers|nob jokey|nobjocky|nobjokey|nutsack|p0rn|pawn|pecker|penis|penisfucker|phonesex|phuck|phuk|phuked|phuking|phukked|phukking|phuks|phuq|pigfucker|pimpis|pissflaps|rimming|s hit|s.o.b.|sadist|schlong|skank|slut|sluts|smegma|spac|spunk|s_h_i_t|t1tt1e5|t1tties|teets|teez|testical|testicle|tit|titfuck|tits|titt|tittie5|tittiefucker|titties|tittyfuck|tittywank|titwank|tosser|tw4t|twat|twathead|twatty|twunt|twunter|v14gra|v1gra|w00se|xrated|xxx)/gi

    // .test returns a boolean
    // true if there's a match and false if none
    if (EMAIL_REGEX.test(MESSAGE) || PHONE_REGEX.test(MESSAGE) || PROFANITY_REGEX.test(MESSAGE)) {
      callback(null, false)
    } else {
      callback(null, true)
    }
  }
}
