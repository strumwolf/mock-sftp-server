'use strict';

const assert = require('assert');
const expect = require('chai').expect;
const SFTP = require('../sftpServer');
const Client = require('ssh2');

const connOpts = {
  host: '127.0.0.1',
  port: 4000,
  username: 'foo',
  password: 'bar',
  debug: false
};

const listing = [
  {
    '/foo': [
      { filename: 'bar', attrs: {} },
      { filename: 'not.afile', attrs: {} }
    ]
  },
  {
    '/bar': [
      { filename: 'foo', attrs: {} }
    ]
  }
];
const debug = false;
const port = 4000;

describe('Mock SFTP Server', () => {
  const client = new Client();
  let sftp;

  before(done => {
    SFTP.sftpServer({ listing, debug, port }, done);
  });

  after(done => {
    client.end();
    done();
  });

  describe('Connection to mock server', () => {
    let error, connected = false;
    before(done => {
      client.connect(connOpts);

      client.on('error', err => {
        error = err;
        return done();
      });

      client.on('ready', () => {
        client.sftp((err, sftpConn) => {
          if (err) {
            error = err;
            return done();
          }
          if (!sftpConn) {
            error = new Error('No SFTP');
            return done();
          }
          connected = true;
          sftp = sftpConn;
          done();
        });
      });
    });

    it('should connect without error', done => {
      expect(error).to.not.exist;
      done();
    });

    it('should be connected', done => {
      expect(connected).to.be.true;
      done();
    });

  });

  describe('fastGet', () => {
    it('should download a file without error', done => {
      sftp.fastGet('/foo', 'bar', err => {
        expect(err).to.not.exist;
        done();
      });
    });
  });

  describe('fastPut', () => {
    it('should uploade file without error', done => {
      sftp.fastPut(`${process.cwd()}/test/fixtures/bar`, '/foo', err => {
        expect(err).to.not.exist;
        done();
      });
    });
  });

  describe('readdir', () => {
    let error, results;
    before(done => {
      sftp.readdir('/foo', (err, list) => {
        error = err;
        results = list;
        done();
      });
    });

    it('should read a directory without issue', done => {
      expect(error).to.not.exist;
      done();
    });

    it('should return results', done => {
      expect(results).to.exist;
      done();
    });
  });

  describe('unlink', () => {
    it('should remove a remote file without error', done => {
      sftp.unlink('/foo/bar', err => {
        expect(err).to.not.exist;
        done();
      });
    });
  });

  describe('rename', () => {
    it('should rename a remote file without error', done => {
      sftp.rename('/kung/bar', '/kung/foo', err => {
        expect(err).to.not.exist;
        done();
      });
    });
  });
});