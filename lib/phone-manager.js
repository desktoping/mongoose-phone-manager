'use strict';

var phoneManagerPlugin = function (schema) {

  var phoneNumberRegExInternational = /^\+(?:[0-9] ?){6,14}[0-9]$/;

  schema.add({
    phone_numbers: [{
      phone_number: String,
      primary: {type: Boolean, default: false},
      typeOfPhone: String
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
    var newPrimary = this.findPhone(phoneNumberToSet);
    if (currentPrimaryNumber && newPrimary) {
      this.phone_numbers.forEach( function (phone) {
        if (phone.phone_number == currentPrimaryNumber) phone.primary = false;
      });
      newPrimary.primary = true;
      this.save(function (err, phone) {
        if (err) return callback('TODO make this use the error handler');
        return callback(null, phone);
      }); 
    }
  };

  schema.methods.removePhone = function (phoneNumberToRemove, callback) {
    this.phone_numbers.forEach(function (phone) {
      if (phone.phone_number === phoneNumberToRemove) {
        phone.remove();
        this.save(function (err) {
          if (err) return callback(err);
          return callback(null, this);
        });
      }
    }.bind(this));
  };

  schema.methods.addPhone = function (phoneNumberToAdd, inputTypeOfPhone, callback) {
    this.phone_numbers.push({phone_number: phoneNumberToAdd, typeOfPhone: inputTypeOfPhone});
    this.save(function (err) {
      if (err) return callback('TODO make this use the error handler');
      return callback(null, phoneNumberToAdd);
    });
  };

  schema.methods.findPhone = function (phoneNumberToFind, callback) {
    this.phone_numbers.forEach(function (phone) {
      if (phone.phone_number == phoneNumberToFind) return callback(null,phone);
      callback('TODO make this use the error handler');
    });
  };

  schema.path('phone_numbers').schema.paths.phone_number.validate( function (phone) {
    return phoneNumberRegExInternational.test(phone);
  }, 'Invalid phone number');

};

exports = module.exports = phoneManagerPlugin;
