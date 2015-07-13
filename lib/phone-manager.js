'use strict';

var phoneManagerPlugin = function (schema) {

  var phoneNumberRegExInternational = /^\+(?:[0-9] ?){6,14}[0-9]$/;

  schema.add({
    phone_numbers: [{
      phone_number: String,
      primary: {type: Boolean, default: false},
      phone_type: String,
      verification: {
        verification_code: String,
        verification_expiration: String,
        verified: {type: Boolean, default: false}
      }
    }]
  });

  schema.pre('save', function (next) {
    if (!this.phone && this.phone_numbers.length > 0) 
    this.phone_numbers[0].primary = true;
    next();
  });

  schema.virtual('phone').get(function () {
    var phoneNumber = this.getPrimaryPhoneNumber();
    return phoneNumber ? phoneNumber.phone_number : null;
  });

  schema.methods.getPrimaryPhoneNumber = function () {
    var phoneNumber = null;
    this.phone_numbers.forEach(function (phone) {
      if (phone.primary === true) {
        phoneNumber = phone;
      }
    });
    return phoneNumber;
  };

  schema.methods.setPrimaryPhone = function (phoneNumberToSet, callback) {
    var currentPrimaryNumber = this.getPrimaryPhoneNumber();
    var newPrimary;
    this.findPhone(phoneNumberToSet, function (err, phone) {
       if (err) return callback(err);
       newPrimary = phone;
    });
    if ((currentPrimaryNumber && newPrimary) && (currentPrimaryNumber !== newPrimary)) {
      this.phone_numbers.forEach( function (phones) {
        if (phones.phone_number == currentPrimaryNumber.phone_number) phones.primary = false;
      });
      newPrimary.primary = true;
      this.save(function (err) {
        if (err) return callback(err);
        return callback(null, newPrimary);
      }); 
    } else return callback('Cannot set primary phone');
  };

  schema.methods.removePhone = function (phoneNumberToRemove, callback) {
    this.phone_numbers.forEach(function (phone) {
      if (phone.phone_number === phoneNumberToRemove) {
        phone.remove();
        this.save(function (err) {
          if (err) return callback(err);
          return callback(null, this);
        }.bind(this));
      }
    }.bind(this));
  };

  schema.methods.addPhone = function (phoneNumberToAdd, inputphone_type, callback) {
    this.phone_numbers.push({phone_number: phoneNumberToAdd, phone_type: inputphone_type});
    this.save(function (err) {
      if (err) return callback(err);
      return callback(null, phoneNumberToAdd);
    });
  };

  schema.methods.phoneExist = function (phoneNumberToFind) {
    var found = 0;
    this.phone_numbers.forEach(function (phone) {
      if (phone.phone_number === phoneNumberToFind) found = 1;
    });
    if (found === 1) return true;
    return false;
  };

  schema.methods.findPhone = function (phoneNumberToFind, callback) {
    var found = 0;
    this.phone_numbers.forEach(function (phone) {
      if (phone.phone_number === phoneNumberToFind) {
        found = 1;
        return callback(null, phone);
      } 
    });
    if (found === 0) return callback('Cannot find phone');
  };

  schema.path('phone_numbers').schema.paths.phone_number.validate( function (phone) {
    return phoneNumberRegExInternational.test(phone);
  }, 'Invalid phone number');

  schema.methods.startPhoneVerification = function (phoneNumberToVerify, callback) {
    var phone;
    this.findPhone(phoneNumberToVerify, function (err, phoneNumber) {
      if (err) return callback(err);
      return phone = phoneNumber;
    });
    if (!phone.verification.verification_code && !phone.verification.verification_expiration) {
      phone.verification.verification_code = this.generateRandomCode(function (err, randomCode) {
        if (err) return callback('Error in generating verification code');
        return randomCode;
      });
      phone.verification.verification_expiration = new Date().getTime() + 86400000;
      phone.markModified('verification.verification_expiration');
      phone.save(function (err) {
        if (err) return callback(err);
        return callback(null, phone);
      });
    } else return callback('Cannot start verification twice');
  };

  schema.methods.generateRandomCode = function (callback) {
    var randomCode = Math.floor(Math.random() * (99999999 - 10000000)) + 10000000;
    if (randomCode) return callback(null, randomCode);
    return callback('Error in generating verification code'); 
  };

  schema.methods.verifyPhone = function (phoneNumberToVerify, verificationCode, callback) {
    var phone;
    this.findPhone(phoneNumberToVerify, function (err, phoneNumber) {
      if (err) return callback(err);
      phone = phoneNumber;
    });
    if (!!phone.verification.verification_code &&
        phone.verification.verification_expiration >= new Date().getTime()) {
      if (phone.verification.verification_code === verificationCode) {
        phone.verification.verified = true;
        phone.save(function (err) {
          if (err) return callback(err);
          return callback(null, phone);
        });
      } else return callback('Invalid verification code');
    } else return callback('Start verification first');
  };

};

exports = module.exports = phoneManagerPlugin;
