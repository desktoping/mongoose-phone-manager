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
    return this.getPrimaryPhoneNumber(function (err, phone) {
      if (err) return null
      return phone.phone_number;
    });
  });

  schema.methods.getPrimaryPhoneNumber = function (callback) {
    this.phone_numbers.forEach(function (phone) {
      if (phone.primary == true) return callback(null, phone);
      return callback('TODO make this use the error handler');
    });
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
