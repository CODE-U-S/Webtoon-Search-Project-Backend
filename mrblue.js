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
app.get('/', async (req, res) => {
  const url = 'https://www.mrblue.com/webtoon/mon#list';

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
    listItems.each((index, element) => {
      // 현재 요소에서 필요한 정보 추출
      const imgElement = $(element).find('.img');
      const href = imgElement.find('a').attr('href');
      const dataOriginal = imgElement.find('img').attr('data-original');

      const txtBoxElement = $(element).find('.txt-box');
      const title = txtBoxElement.find('.tit a').attr('title');
      const genre = txtBoxElement.find('.name span a').eq(0).text();
      const author = txtBoxElement.find('.name a').eq(1).text();

      // 결과 배열에 추가
      resultList.push({
        href,
        dataOriginal,
        title,
        genre,
        author,
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