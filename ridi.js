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
    const webtoonList = $('.fig-pxcu15.ekd5yyf0 li');

    // 결과를 저장할 배열
    const resultList = [];

    // 각 웹툰 요소에 대해 반복
    let sequence = 1;
    for (let i = 0; i < webtoonList.length; i++) {
      const element = webtoonList[i];
      // 현재 요소에서 필요한 정보 추출
      const titleElement = $(element).find('.fig-lk4798 .fig-3h0c1x div:first-child a'); // 제목 요소 선택
      const title = titleElement.text(); // 제목 텍스트 가져오기
      const href = 'https://ridibooks.com' + titleElement.attr('href'); // href 값에 앞에 URL을 추가

      // 작가 정보 추출
      const authorsElement = $(element).find('.fig-lk4798 .fig-3h0c1x div:last-child p:first-child a');
      const author = authorsElement.map((index, el) => $(el).text()).get().join(', '); // 작가들을 쉼표로 구분하여 문자열로 변환

      try {
        // 상세 페이지 HTML 가져오기
        const detailHtml = await fetchHTML(href);
        const $detail = cheerio.load(detailHtml);

        // "19세 미만 구독불가"가 포함된 요소는 무시
        const isRestricted = $detail('[aria-label="19세 미만 구독불가"]').length > 0;
        if (isRestricted) {
          continue; // 현재 반복 중단
        }

        // 이미지 URL 추출
        const thumbnailImage = $detail('.thumbnail_image');
        const imgTag = thumbnailImage.find('.thumbnail');
        const imageUrl = imgTag.attr('data-src');
        
        // 장르 정보 추출
        const genreElement = $detail('.header_info_wrap .info_category_wrap a:last-child');
        const genre = genreElement.text();

        // 결과 배열에 추가
        resultList.push({
          Sequence: sequence++, // Sequence 값 증가
          href,
          imageUrl,
          title,
          genre,
          author,
          service: "ridi"
        });
      } catch (error) {
        console.error('Error fetching detail page:', error);
        // 상세 페이지를 가져오는 도중 오류가 발생하면 해당 웹툰은 건너뜁니다.
        continue;
      }
    }

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