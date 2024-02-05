const express = require('express');
const anyRouter = require('./routes/any');
const mrblueRouter = require('./routes/mrblue');
const ridiRouter = require('./routes/ridi'); 

const app = express();
const port = 3000;

// any.js의 라우터를 등록
app.use('/any', anyRouter);

// mrblue.js의 라우터를 등록
app.use('/mrblue', mrblueRouter);

// ridi.js의 라우터를 등록
app.use('/ridi', ridiRouter)


// 서버 시작
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
