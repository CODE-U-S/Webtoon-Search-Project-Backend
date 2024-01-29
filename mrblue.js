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

// API 엔드포인트
app.get('/:day', async (req, res) => {
  // 클라이언트에서 전달된 요일(day) 파라미터
  const day = req.params.day;

  // 각 요일에 대한 URL 매핑
  const dayToUrl = {
    'new': 'https://www.mrblue.com/webtoon/new#list',
    'mon': 'https://www.mrblue.com/webtoon/mon#list',
    'tue': 'https://www.mrblue.com/webtoon/tue#list',
    'wed': 'https://www.mrblue.com/webtoon/wed#list',
    'thu': 'https://www.mrblue.com/webtoon/thu#list',
    'fri': 'https://www.mrblue.com/webtoon/fri#list',
    'sat': 'https://www.mrblue.com/webtoon/sat#list',
    'sun': 'https://www.mrblue.com/webtoon/sun#list',
    'tenday': 'https://www.mrblue.com/webtoon/tenday#list',
  };

  // 지정된 요일에 해당하는 URL 가져오기
  const url = dayToUrl[day];

  try {
    // HTML 가져오기
    const html = await fetchHTML(url);

    // Cheerio를 사용하여 HTML 파싱
    const $ = cheerio.load(html);

    // "list-box" 클래스를 가진 li 요소 찾기
    const listItems = $('li');

    // 결과를 저장할 배열
    const resultList = [];

    // 각 li 요소에 대해 반복
    let sequence = 1;
    listItems.each((index, element) => {
      // "img adultmark" 클래스를 가진 li는 무시
      if ($(element).find('.img.adultmark').length === 0) {
        // 현재 요소에서 필요한 정보 추출
        const imgElement = $(element).find('.img');
        const href = "https://www.mrblue.com" + imgElement.find('a').attr('href');
        const imageUrl = imgElement.find('img').attr('data-original');

        const txtBoxElement = $(element).find('.txt-box');
        const title = txtBoxElement.find('.tit a').attr('title');

        // genre가 없는 경우 무시
        const genreElement = txtBoxElement.find('.name span a').eq(0);
        if (!genreElement.length) {
          return; // genre가 없으면 반복 중단
        }
        const genre = genreElement.text();

        const author = txtBoxElement.find('.name a').eq(1).text();

        const service = "mrblue";

        // 결과 배열에 추가
        resultList.push({
          Sequence: sequence++, // Sequence 값 증가
          href,
          imageUrl,
          title,
          genre,
          author,
          service,
        });
      }
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
