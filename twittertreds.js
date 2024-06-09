const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

// Replace these with your actual keys
const BEARER_TOKEN = 'AAAAAAAAAAAAAAAAAAAAAJnOuAEAAAAAdMj6FBrNmOTQujKV1YlTwN5aKpo%3DnI3aA2Yypda3I6DrJKhdWP6x9t5mwP1EgAZWZf0QCaf70ntjuK';

const fetchTrendingTopics = async () => {
  try {
    const response = await axios.get('https://api.twitter.com/2/tweets/search/recent', {
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`
      },
      params: {
        'query': 'politics',
        'tweet.fields': 'created_at'
      }
    });

    const data = response.data;

    console.log(data);

    // Save data to a JSON file
    // fs.writeFileSync('trending_politics.json', JSON.stringify(data, null, 2));
    console.log('Trending topics saved to trending_politics.json');
  } catch (error) {
    console.error('Error fetching trending topics:', error);
  }
};

fetchTrendingTopics();