'use strict';

var uuid = require('uuid');
var pwd = require('couch-pwd');
var ms = require('ms');
var moment = require('moment');
var Sequelize = require('sequelize');
var merge = require('merge');

/**
 * Adapter constructor function
 *
 * @example
   var Adapter = require('lockit-sql-adapter');
   var config = require('./config.js');
   var adapter = new Adapter(config);
 *
 * @param {Object} config
 * @constructor
 */
var Adapter = module.exports = function(config) {

  if (!(this instanceof Adapter)) {return new Adapter(config); }

  this.config = config;

  this.includeForgotPassword = config.includeForgotPassword ? config.includeForgotPassword : false;
  this.includeLogin = config.includeLogin ? config.includeLogin : false;
  this.includeSignup = config.includeSignup ? config.includeSignup : false;

  this.idField = config.idField ? config.idField : '_id';
  this.emailField = config.emailField ? config.emailField : 'email';
  this.nameField = config.nameField ? config.nameField : 'name';

  // create connection string
  var sqlConfig = merge({storage: config.db.name}, config.db.options);
  var uri = config.db.name,
      username = config.db.username ? config.db.username : null,
      password = config.db.password ? config.db.password : null,
      userModelName = config.modelName ? config.modelName : 'User',
      sqlConfig = {
        storage: config.db.name
      }
  ;
  if (!config.db.ignoreUrl) {
    uri = config.db.url + config.db.name;
  }
  var sequelize = new Sequelize(uri, username, password, sqlConfig);

  var userDef = {
    // signup
    derived_key: Sequelize.STRING,
    salt: Sequelize.STRING
    //emailVerificationTimestamp: Sequelize.DATE,
    //emailVerified: Sequelize.BOOLEAN
  };

  // make id like CouchDB and MongoDB
  userDef[this.idField] = {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
  };
  userDef[this.nameField] = Sequelize.STRING;
  userDef[this.emailField] = Sequelize.STRING;

  if (this.includeLogin) {
    userDef.failedLoginAttempts = Sequelize.INTEGER;
    userDef.accountLocked = Sequelize.BOOLEAN;
    userDef.accountLockedUntil = Sequelize.DATE;
    userDef.previousLoginTime = Sequelize.DATE;
    userDef.previousLoginIp = Sequelize.STRING;
    userDef.currentLoginTime = Sequelize.DATE;
    userDef.currentLoginIp = Sequelize.STRING;
  }

  if (this.includeSignup) {
    userDef.signupToken = Sequelize.STRING;
    userDef.signupTimestamp = Sequelize.DATE;
    userDef.signupTokenExpires = Sequelize.DATE;
    userDef.emailVerificationTimestamp = Sequelize.DATE;
    userDef.emailVerified = Sequelize.BOOLEAN;
  }

  if (this.includeForgotPassword) {
    userDef.pwdResetToken = Sequelize.STRING;
    userDef.pwdResetTokenExpires = Sequelize.DATE;
  }

  this.User = sequelize.define(userModelName, userDef, {
    tableName: config.db.collection,   // this will define the table's name
    timestamps: false                 // this will deactivate the timestamp columns
  });

  this.User.sequelize.sync({})
    .then(function() {
      // you can now use User to create new instances
    })
    .error(function(err) {
      throw (err);
    });

};


/**
 * Create a new user and save it to db.
 *
 * @example
   adapter.save('john', 'john@email.com', 'secret', function(err, user) {
     if (err) console.log(err);
     console.log(user);
     // {
     //   _id: 1,
     //   name: 'john',
     //   email: 'john@email.com',
     //   derived_key: 'c4c7a83f7b3936437798316d4c7b8c7b731a55dc',
     //   salt: 'ff449a4980a58a80c4ed80bddd34b8c9',
     //   signupToken: '13eefbe7-6bc8-43f5-b27f-0bf0ca98b8db',
     //   signupTimestamp: Fri Apr 11 2014 21:37:47 GMT+0200 (CEST),
     //   signupTokenExpires: Sat Apr 12 2014 21:37:47 GMT+0200 (CEST),
     //   failedLoginAttempts: 0,
     //   emailVerificationTimestamp: null,
     //   emailVerified: null,
     //   pwdResetToken: null,
     //   pwdResetTokenExpires: null,
     //   accountLocked: null,
     //   accountLockedUntil: null,
     //   previousLoginTime: null,
     //   previousLoginIp: null,
     //   currentLoginTime: null,
     //   currentLoginIp: null
     // }
   });
 *
 * @param {String} name - User name
 * @param {String} email - User email
 * @param {String} pw - Plain text password
 * @param {Function} done - Callback function having `err` and `user` as arguments
 */
Adapter.prototype.save = function(name, email, pw, done) {
  var that = this;
  var now = moment().toDate();
  var timespan = ms(that.config.signup.tokenExpiration);
  var future = moment().add(timespan, 'ms').toDate();
  var emailField = this.emailField,
      nameField = this.nameField
  ;
  var includeLogin = this.includeLogin,
      includeSignup = this.includeSignup
  ;
  // create hashed password
  pwd.hash(pw, function(err, salt, hash) {
    if (err) {return done(err); }
    var buildDef = {
      salt: salt,
      derived_key: hash
    };
    buildDef[emailField] = email;
    buildDef[nameField] = name;
    if (includeLogin) {
      buildDef.failedLoginAttempts = 0;
    }
    if (includeSignup) {
      buildDef.signupToken = uuid.v4();
      buildDef.signupTimestamp = now;
      buildDef.signupTokenExpires = future;
    }

    var user = that.User.build(buildDef);

    var whereClause = {};
    whereClause[emailField] = email;

    // save user to db
    user.save()
      .then(function() {
        // find user to return it in callback
        that.User.find({ where: whereClause })
          .then(function(foundUser) {
            done(null, foundUser.dataValues);
          })
          .error(function(findErr) {
            done(findErr);
          });
      })
      .error(function(saveErr) {
        done(saveErr);
      });
  });
};

/**
 * Find a user in db.
 *
 * @example
   adapter.find('name', 'john', function(err, user) {
     if (err) console.log(err);
     console.log(user);
     // {
     //   _id: 1,
     //   name: 'john',
     //   email: 'john@email.com',
     //   derived_key: '75b43d8393715cbf476ee55b12f888246d7f7015',
     //   salt: 'f39f9a5104e5ae61347dced750b63b16',
     //   signupToken: '6c93c6f8-06b6-4c6d-be58-1e89e8590d0f',
     //   signupTimestamp: Fri Apr 11 2014 21:39:28 GMT+0200 (CEST),
     //   signupTokenExpires: Sat Apr 12 2014 21:39:28 GMT+0200 (CEST),
     //   failedLoginAttempts: 0,
     //   emailVerificationTimestamp: null,
     //   emailVerified: null,
     //   pwdResetToken: null,
     //   pwdResetTokenExpires: null,
     //   accountLocked: null,
     //   accountLockedUntil: null,
     //   previousLoginTime: null,
     //   previousLoginIp: null,
     //   currentLoginTime: null,
     //   currentLoginIp: null
     // }
   });
 *
 * @param {String} match - The key to look for. Can be `'name'`, `'email'` or `'signupToken'`
 * @param {String} query - The corresponding value for `match`
 * @param {Function} done - Callback function having `err` and `user` as arguments
 */
Adapter.prototype.find = function(match, query, done) {
  var qry = {};
  qry[match] = query;
  this.User.find({ where: qry })
    .then(function(user) {
      // create empty object in case no user is found
      user = user || {};
      done(null, user.dataValues);
    })
    .error(function(err) {
      done(err);
    });
};

/**
 * Update an already existing user in db.
 *
 * @example
   // get a user from db first
   adapter.find('name', 'john', function(err, user) {
     if (err) console.log(err);

     // add some new properties to our existing user
     user.firstOldKey = 'and some value';
     user.secondOldKey = true;

     // save updated user to db
     adapter.update(user, function(err, user) {
       if (err) console.log(err);
       // ...
     });
   });
 *
 * @param {Object} user - User object with `user.id`
 * @param {Function} done - Callback function having `err` and `user` as arguments
 */
Adapter.prototype.update = function(user, done) {
  var that = this;
  var idClause = {};
  idClause[this.idField] = user[this.idField];
  that.User.update(user, {where: idClause})
    .then(function() {
      that.User.findById(user.id)
        .then(function(foundUser) {
          done(null, foundUser.dataValues);
        })
        .error(function(err) {
          done(err);
        });
    })
    .error(function(err) {
      done(err);
    });
};

/**
 * Remove an existing user from db.
 *
 * @example
   adapter.remove('john', function(err, res) {
     if (err) console.log(err);
     console.log(res);
     // true
   });
 *
 * @param {String} name - Username
 * @param {Function} done - Callback function having `err` and `res` arguments
 */
Adapter.prototype.remove = function(name, done) {
  var clause = {};
  clause[this.nameField] = name;
  that.User.update(user, {where: clause})
  this.User.find({ where: {name: name} })
    .then(function(user) {
      if (!user) {return done(new Error('lockit - Cannot find user "' + name + '"')); }
      user.destroy()
        .then(function() {
          done(null, true);
        })
        .error(function(err) {
          done(err);
        });
    })
    .error(function(err) {
      done(err);
    });
};
