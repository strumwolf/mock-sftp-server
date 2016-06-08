# Description
**mock-sftp-server** uses [ssh2's](https://www.npmjs.com/package/ssh2) server functionality to make a test sftp server for unit testing. This module will not act like and should only be used to test against.

This is a work in progress and not all sftp functionlity has been added to the wrapper.

# Usage
```javascript
const sftp = require('../sftpServer');

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
const port = 4000

sftp.sftpServer({ listing, debug, port }, done);
```

## listing
listing is an array that contains objects that have a directory path as its keys. Each key then contains an array of with file objects. This is what would be returned by a `readdir` from a client.

Defaults to an empty array.

## debug
This is true or false. If true, you will need to include the DEBUG env var when running your applications as the Debug modules is used to output debug logs. I am may make an update to allow the user to choose to use the Debug module or console.log, in the future.

Defaults to false.

## port
This is your desired port of the mock server.

Defaults to `port 4000`.

## Current server functionality
As of now, you can only run `connect`, `fastGet`, `fastPut`, `readdir`, `unlink`, `rename` and `end` from your client to the mock server.

`fastGet`, `fastPut`, `readdir`, `unlink`, `rename` requires you to get the `sftp` method from the client.

```javascript
conn.sftp((err, sftp) => {
  if (err) throw err;
  sftp.readdir('/foo', (err, list) => {
    if (err) throw err;
    console.dir(list);
    conn.end();
  });
});
```

# License
MIT License

Copyright (c) 2016 Brian Kurtz
Based on ssh2 - Copyright Brian White. All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.