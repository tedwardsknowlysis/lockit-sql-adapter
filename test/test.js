'use strict';

var should = require('should');
var config = require('./config.js');

// run the same tests for postgres, mysql and sqlite
Object.keys(config.dbs).forEach(function(obj) {

  var conf = {
    db: config.dbs[obj],
    signup: config.signup
  };

  var adapter = require('../index.js')(conf);

  // start the tests
  describe(obj + ' adapter for lockit', function() {

    // needed later for test 'find user by signup token'
    var _tmp_signupToken = '';

    it('should create a new user', function(done) {
      adapter.save('john', 'john@email.com', 'secret', function(err, res) {
        if (err) {console.log(err); }
        res.should.have.property('signupToken');
        res.signupToken.should.match(/[0-9a-f]{22}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
        res.should.have.property('failedLoginAttempts');
        res.failedLoginAttempts.should.equal(0);
        _tmp_signupToken = res.signupToken;
        res.email.should.equal('john@email.com');
        done();
      });
    });

    it('should find a user by name', function(done) {
      adapter.find('name', 'john', function(err, res) {
        if (err) {console.log(err); }
        res.name.should.equal('john');
        res.email.should.equal('john@email.com');
        done();
      });
    });

    it('should return undefined when no user is found', function(done) {
      adapter.find('name', 'jim', function(err, res) {
        if (err) {console.log(err); }
        should.not.exist(err);
        should.not.exist(res);
        done();
      });
    });

    it('should find a user by email', function(done) {
      adapter.find('email', 'john@email.com', function(err, res) {
        if (err) {console.log(err); }
        res.name.should.equal('john');
        res.email.should.equal('john@email.com');
        done();
      });
    });

    it('should find a user by signup token', function(done) {
      adapter.find('signupToken', _tmp_signupToken, function(err, res) {
        if (err) {console.log(err); }
        res.name.should.equal('john');
        res.email.should.equal('john@email.com');
        done();
      });
    });

    it('should update an existing user', function(done) {
      adapter.find('name', 'john', function(err, doc) {
        if (err) {console.log(err); }
        doc.signupToken = 'works';
        doc.accountLocked = true;
        adapter.update(doc, function(updateErr, res) {
          if (updateErr) {console.log(updateErr); }
          res.signupToken.should.equal('works');
          res.accountLocked.should.be.true;
          done();
        });
      });
    });

    it('should remove a user', function(done) {
      adapter.save('jeff', 'jeff@email.com', 'secret', function(err) {
        if (err) {console.log(err); }
        adapter.remove('jeff', function(removeErr, res) {
          if (removeErr) {console.log(removeErr); }
          res.should.be.true;
          done();
        });
      });
    });

    it('should return an error when remove cannot find a user', function(done) {
      adapter.remove('steve', function(err) {
        err.message.should.equal('lockit - Cannot find user "steve"');
        done();
      });
    });

  });

  // remove users db
  after(function(done) {
    adapter.remove('john', done);
  });
});
