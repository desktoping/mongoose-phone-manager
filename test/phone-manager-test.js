'use strict';

var mocha = require('mocha'),
    should = require('should'),
    mongoose = require('mongoose'),
    schema = mongoose.Schema(),
    phoneManagerPlugin = require('../lib/phone-manager.js');

    mongoose.connect('mongodb://localhost/mongoose-phone-manager');
    schema.plugin(phoneManagerPlugin);

describe('Mongoose Email Address Manager', function(){

  var User = mongoose.model('user', schema),
      user;

  beforeEach(function (done) {
    user = new User({
      phone_numbers: [{
        phone_number: "+44 1865 722180",
        typeOfPhone : "Home"
      }]
    });
    user.save(function (err, doc) {
      if (err) return done(err);
      done();
    });
  });

  context('Should follow international phone number formatting, E164', function () {

    it('should pass if valid', function () {
      user.phone_numbers.push({phone_number: "+44 1865 221230", typeOfPhone: "Home"});
      user.save(function (err) {
        should(err).not.exists;
      });
    });

    it('should fail otherwise', function () {
      user.phone_numbers.push({phone_number: "23412332211", typeOfPhone: "Home"});
      user.save(function (err) {
        should(err).exists;
      });
    });

  });

  context('Plugin methods', function () {

    it('should add phone', function () {
      user.addPhone("+44 1865 123456", "Home", function (err, phone) {
        should(err).not.exists;
        phone.should.be.equal("+44 1865 123456");
      });
    });

    it('should remove phone', function (done) {
      user.removePhone('+44 1865 722180', function (err, user) {
        if (err) return done(err);
        should.not.exist(user.phone_numbers);
        done();
      });
    });

    it('should find phone', function () {
      user.findPhone("+44 1865 722180", function (err, phone) {
        phone.phone_number.should.be.equal("+44 1865 722180");
        phone.typeOfPhone.should.be.equal("Home");
        should(err).not.exists;
      });
    });

    it('should get primary phone', function () {
      var phone = user.phone;
      phone.should.be.equal("+44 1865 722180");
    });

  });

});
