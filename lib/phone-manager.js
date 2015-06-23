'use strict';

export default function mobileManagerPlugin (schema, options) {

  const phoneNumberRegExInternational = /^\+(?:[0-9] ?){6,14}[0-9]$/;

  schema.add({
    phone_numbers [{
      phone_number: String,
      primary: {type: Boolean, default: false},
      type: String
    }]
  });

  schema.pre('save', function (next) {
    if (!this.phone && this.phone_numbers.length > 0) 
    return this.phone_numbers[0].primary = true;
    next();
  });

  schema.virtual('phone').get(function () {
    return this.getPrimaryPhoneNumber();
  });

  schema.methods.getPrimaryPhoneNumber = function () {
    this.phone_numbers.forEach(function (phone) {
      if (phone.primary == true) return phone.phone_number;
    });
  };

  schema.methods.setPrimaryPhone = function (phoneNumberToSet) {
    return new Promise((resolve, reject) => {
      const currentPrimaryNumber = this.getPrimaryPhoneNumber();
      const newPrimary = this.findPhone(phoneNumberToSet);
      if (currentPrimaryNumber && newPrimary) {
        this.phone_numbers.forEach( function (phone) {
          if (phone.phone_number == currentPrimaryNumber) phone.primary = false;
        });
        newPrimary.primary = true;
        this.save((err, phone) => {
          if (err) return reject('TODO make this use the error handler');
          return resolve(phone);
        }); 
      }
    });
  };

  schema.methods.removePhone = function (phoneNumberToRemove) {
    return new Promise((resolve, reject) => {
      this.phone_numbers.pull({phone_number: phoneNumberToRemove});
      this.save((err, phone) => {
        if (err) return reject('TODO make this use the error handler');
        return resolve(phone);
      });
    });
  };

  schema.methods.addPhone = function (phoneNumberToAdd, typeOfPhone) {
    return new Promise((resolve, reject) => {
      this.phone_numbers.push({phone_number: phoneNumberToAdd, type: typeOfPhone});
      this.save((err, phone) => {
        if (err) return reject('TODO make this use the error handler');
        return resolve(phone);
      });
    });
  };

  schema.methods.findPhone = function (phoneNumberToFind) {
    this.phone_numbers.forEach(function (phone) {
      if (phone.phone_number == phoneNumberToFind) return phone;
    });
  };

  schema.path('phone_numbers').schema.path('phone_number').validate( function (phone) {
    return phoneNumberRegExInternational.test(phone);
  }, 'Invalid phone number');

};