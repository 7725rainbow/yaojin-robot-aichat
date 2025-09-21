// api/douban-movie.ts

import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { load } from 'cheerio';

interface Movie {
  title: string;
  url: string;
  score: string;
  pic: string;
}

const DOUBAN_URL = 'https://movie.douban.com/chart';
// Read the cookie securely from the environment variable
const DOUBAN_COOKIE = process.env.DOUBAN_COOKIE;

export default async function handler(request: VercelRequest, response: VercelResponse) {
  // Return an error if the environment variable isn't set
  if (!DOUBAN_COOKIE) {
    return response.status(500).json({ error: 'DOUBAN_COOKIE environment variable is not configured.' });
  }

  try {
    const { data } = await axios.get(DOUBAN_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
        'Cookie': DOUBAN_COOKIE, // Use the secure variable
      },
    });

    const $ = load(data);
    const movies: Movie[] = [];

    $('div.article div.indent table').each((i, element) => {
      const title = $(element).find('div.pl2 a').text().trim().split('/')[0].trim();
      const url = $(element).find('div.pl2 a').attr('href') || '';
      const score = $(element).find('.rating_nums').text().trim();
      const pic = $(element).find('.pl2 a img').attr('src') || '';

      if (title && url) {
        movies.push({
          title,
          url,
          score,
          pic,
        });
      }
    });

    response.status(200).json(movies);

  } catch (error: unknown) {
    console.error('Error fetching or parsing Douban data:', error);
    let errorMessage = 'Failed to fetch Douban movie data.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    response.status(500).json({ error: errorMessage });
  }
}
