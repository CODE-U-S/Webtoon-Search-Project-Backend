// app.js
const express = require('express');
const bodyParser = require('body-parser');
const anyRouter = require('./routes/any');
const mrblueRouter = require('./routes/mrblue');
const ridiRouter = require('./routes/ridi'); 

const userRouter = require('./endpoints/user');
const workRouter = require('./endpoints/work');

const app = express();
const port = 3000;

// body-parser를 사용하여 JSON 형식의 요청 본문 파싱
app.use(bodyParser.json());

// any.js의 라우터를 등록
app.use('/any', anyRouter);

// mrblue.js의 라우터를 등록
app.use('/mrblue', mrblueRouter);

// ridi.js의 라우터를 등록
app.use('/ridi', ridiRouter)

// user.js의 라우터를 등록
app.use('/user', userRouter);

// work.js의 라우터를 등록
app.use('/toon', workRouter);

// 서버 시작
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
