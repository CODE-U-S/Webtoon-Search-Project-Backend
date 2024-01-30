const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const port = 3000;

// 웹 페이지에서 HTML을 가져오는 함수
async function fetchHTML(url) {
  const { data } = await axios.get(url);
  return data;
}

app.get('/:day', async (req, res) => {
  // 클라이언트에서 전달된 요일(day) 파라미터
  const day = req.params.day;

  // 요일에 따른 애니툰 웹툰 목록 페이지 URL
  const dayToUrl = {
    'mon': 'https://ridibooks.com/group-tab/2491/1',
    'tue': 'https://ridibooks.com/group-tab/2491/2',
    'wed': 'https://ridibooks.com/group-tab/2491/3',
    'thr': 'https://ridibooks.com/group-tab/2491/4',
    'fri': 'https://ridibooks.com/group-tab/2491/5',
    'sat': 'https://ridibooks.com/group-tab/2491/6',
    'sun': 'https://ridibooks.com/group-tab/2491/7'
  };

  // 지정된 요일에 해당하는 URL 가져오기
  const url = dayToUrl[day];

  try {
    // HTML 가져오기
    const html = await fetchHTML(url);

    // Cheerio를 사용하여 HTML 파싱
    const $ = cheerio.load(html);

    // 웹툰 목록을 담고 있는 요소 선택
    const webtoonList = $('.fig-1rhwzqu');

    // 결과를 저장할 배열
    const resultList = [];

    // 각 웹툰 요소에 대해 반복
    let sequence = 1;
    webtoonList.each((index, element) => {
      // 현재 요소에서 필요한 정보 추출
      const imgTag = $(element).find('img'); // 이미지 요소 선택
      const alt = imgTag.attr('alt'); // alt 속성 가져오기
      const src = imgTag.attr('src'); // src 속성 가져오기

      // 결과 배열에 추가
      resultList.push({
        Sequence: sequence++, // Sequence 값 증가
        alt,
        src
      });
    });

    // 추출한 정보를 응답
    res.json(resultList);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// 서버 시작
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
