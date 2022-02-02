# express-long-polling
A long polling example


`ECONNREFUSED`


`server8.js`

```sh
npm run start
curl http://localhost:8080/fib/42
curl http://localhost:8080/fib/43
kill -s SIGTERM $(lsof -i :8080)
```
