'use strict';

const constants = require('constants');
const fs = require('fs');
const ssh2 = require('ssh2');
const OPEN_MODE = ssh2.SFTP_OPEN_MODE;
const STATUS_CODE = ssh2.SFTP_STATUS_CODE;
const path = require('path');
let debug = require('debug')('test: sftpServer');
const DEBUG_NOOP = function(msg) {};

const fixturesdir = `${process.cwd()}/node_modules/ssh2/test/fixtures`;
const HOST_KEY_RSA = fs.readFileSync(`${fixturesdir}/ssh_host_rsa_key`);


exports.sftpServer = (opts, fn) => {
  const port = opts.port || 4000;
  debug = opts.debug? debug : DEBUG_NOOP;
  const listing = opts.listing || [];
  return new ssh2.Server({
    hostKeys: [{ key: HOST_KEY_RSA }],
    privateKey: HOST_KEY_RSA
  }, client => {
    debug('Client Connected');
    client.on('authentication', ctx => {
      if (ctx.method === 'password' && ctx.username === 'foo' && ctx.password === 'bar') ctx.accept();
      else ctx.reject();
    });

    client.on('ready', () => {
      debug('Client authenticated');
      client.on('session', (accept, reject) => {
        const session = accept();
        session.on('sftp', (accept, reject) => {
          debug('Client SFTP session');
          let openFiles = {};
          let handleCount = 0;
          const sftpStream = accept();
          let calledReadDir = false;
          sftpStream.on('OPENDIR', (reqid, path) => {
            debug(path);
            const handle = Buffer.from(path);
            debug(handle);
            sftpStream.handle(reqid, handle);
          });
          sftpStream.on('OPEN', (reqid, filename, flags, attrs) => {
            debug('Open');
            const handle = Buffer.alloc(4);
            openFiles[handleCount] = true;
            handle.writeUInt32BE(handleCount++, 0, true);
            sftpStream.handle(reqid, handle);
            debug('Opening file for read');
          });
          sftpStream.on('WRITE', (reqid, handle, offset, data) => {
            if (handle.length !== 4 || !openFiles[handle.readUInt32BE(0, true)])
              return sftpStream.status(reqid, STATUS_CODE.FAILURE);
            sftpStream.status(reqid, STATUS_CODE.OK);
            const inspected = require('util').inspect(data);
            debug('Write to file at offset %d: %s', offset, inspected);
          });
          sftpStream.on('READ', (reqid, handle, offset, length) => {
            if (handle.length !== 4 || !openFiles[handle.readUInt32BE(0, true)])
              return sftpStream.status(reqid, STATUS_CODE.FAILURE);
            let state = {};
            if (state.read)
              sftpStream.status(reqid, STATUS_CODE.EOF);
            else {
              debug(state);
              state.read = true;
              sftpStream.data(reqid, 'bar');
              debug('Read from file at offset %d, length %d', offset, length);
            }
          });
          sftpStream.on('READDIR', (reqid, handle) => {
            debug('trying to list');
            debug(calledReadDir);
            debug(handle);
            debug(handle.toString());
            const path = handle.toString();
            if (!calledReadDir) {
              calledReadDir = true;
              iterateFixture(listing, path, list => {
                sftpStream.name(reqid, list);
              });
            }
            else sftpStream.status(reqid, STATUS_CODE.EOF);
          });
          sftpStream.on('REALPATH', (reqid, path) => {
            const name = [{
              filename: '/tmp/foo.txt',
              longname: '-rwxrwxrwx 1 foo foo 3 Dec 8 2009 foo.txt',
              attrs: {}
            }];
            sftpStream.name(reqid, name);
          });
          sftpStream.on('STAT', onSTAT);
          sftpStream.on('LSTAT', onSTAT);
          sftpStream.on('CLOSE', (reqid, handle) => {
            sftpStream.status(reqid, STATUS_CODE.OK);
            debug('Closing file');
          });
          sftpStream.on('REMOVE', (reqid, path) => {
            sftpStream.status(reqid, STATUS_CODE.OK);
          });
          sftpStream.on('RENAME', (reqid, oldPath, newPath) => {
            sftpStream.status(reqid, STATUS_CODE.OK);
          });

          function onSTAT(reqid, path) {
            let mode = constants.S_IFREG; // Regular file
            mode |= constants.S_IRWXU; // read, write, execute for user
            mode |= constants.S_IRWXG; // read, write, execute for group
            mode |= constants.S_IRWXO; // read, write, execute for other
            sftpStream.attrs(reqid, {
              mode: mode,
              uid: 0,
              gid: 0,
              size: 3,
              atime: Date.now(),
              mtime: Date.now()
            });
          }

          function iterateFixture(fixtures, path, fn) {
            var list = fixtures.filter(fixture => {
              debug(`2 ${path}`);
              debug('2.5 %o', fixture);
              const keys = Object.keys(fixture);
              debug(`3 ${Object.getOwnPropertyNames(fixture)}`);
              debug('4 %o', fixture[`${path}`]);
              if (fixture.hasOwnProperty(path)) {
                debug('dubg');
                const contents = fixture[`${path}`];
                debug(contents);
                return fn(contents);
              }
              fn({});
            });
          }
        });
      });
    });

    client.on('end', () => {
      debug('Client disconnected');
    });

    client.on('close', () => {
      debug('Connection closed');
    });
    client.on('error', err => {
      debug('server error:', err);
    });
  }).listen(opts.port, '127.0.0.1', function() {
    debug('Listening on port ' + this.address().port);
    fn();
  });
};