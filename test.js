const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/genie-chart', async (req, res) => {
  try {
    const html = await axios.get('https://www.genie.co.kr/chart/top200');
    const $ = cheerio.load(html.data);

    const ulList = [];
    const bodyList = $('tr.list');

    bodyList.each((i, element) => {
      ulList.push({
        rank: i + 1,
        title: $(element).find('td.info a.title').text().replace(/\s/g, ''),
        artist: $(element).find('td.info a.artist').text().replace(/\s/g, ''),
      });
    });

    res.json(ulList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
