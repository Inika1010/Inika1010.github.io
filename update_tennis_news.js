const LOCAL_JSON_URL = '/static/tennis_news.json';
const NEWS_CONTAINER_ID = 'news-list';

async function displayLocalNews() {
    const newsListElement = document.getElementById(NEWS_CONTAINER_ID);
    newsListElement.innerHTML = '<p>Loading latest tennis news...</p>';

    try {
        const response = await fetch(LOCAL_JSON_URL);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}. Make sure your Node.js script is running, the JSON file exists, and your web server is configured to serve the /static/ directory.`);
        }

        const articles = await response.json();

        if (articles.length === 0) {
            newsListElement.innerHTML = '<p>No tennis news available at this time.</p>';
            return;
        }

        let newsHtml = '';
        articles.forEach(article => {
            newsHtml += `
                <div class="news-item">
                    <h3><a href="${article.link}" target="_blank" rel="noopener noreferrer">${article.title}</a></h3>
                    <p>${article.description}</p>
                    <small>${article.pubDate_formatted}</small>
                </div>
            `;
        });

        newsListElement.innerHTML = newsHtml;

    } catch (error) {
        console.error("Error loading local tennis news:", error);
        newsListElement.innerHTML = `<p>Failed to load tennis news. Please check your browser's console for errors. (Error: ${error.message})</p>`;
    }
}

displayLocalNews(); // Call the function to display news when this script executes