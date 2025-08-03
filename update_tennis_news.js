// update_tennis_news.js

// --- Import necessary modules ---
// 'require' is how Node.js imports modules/libraries.
const fetch = require('node-fetch');      // This brings in the 'node-fetch' library for making web requests.
const Parser = require('rss-parser');      // This brings in the 'rss-parser' library for parsing RSS XML.
const fs = require('fs').promises;         // This is Node.js's built-in File System module, used for reading/writing files.
                                           // We use '.promises' for the asynchronous promise-based versions of file operations.
const path = require('path');              // This is Node.js's built-in Path module, used for handling file paths correctly
                                           // across different operating systems (Windows uses '\', Linux/macOS use '/').

// --- Configuration Variables ---
// These are settings you can easily change.
const RSS_FEED_URL = 'https://www.espn.com/espn/rss/tennis/news'; // The specific ESPN Tennis RSS feed URL.
// OUTPUT_JSON_FILE defines where the processed news will be saved.
// path.join() combines parts of a path securely.
// __dirname is a Node.js global variable that gives you the absolute path to the directory
// where the current script (update_tennis_news.js) is located.
// So, it builds a path like: /Users/yourname/my_tennis_website/static/tennis_news.json
const OUTPUT_JSON_FILE = path.join(__dirname, 'static', 'tennis_news.json');
const NUM_ARTICLES = 10; // The maximum number of news articles you want to save in the JSON file.

// --- Core Functions ---
// These are the building blocks of your script's logic.

/**
 * Asynchronously fetches and parses an RSS feed from a given URL.
 * It uses the 'rss-parser' library which simplifies the process of getting the feed.
 * @param {string} url - The URL of the RSS feed (e.g., the ESPN tennis feed).
 * @returns {Promise<object|null>} A Promise that resolves to the parsed feed object, or null if an error occurs.
 */
async function fetchAndParseFeed(url) {
    const parser = new Parser(); // Create a new instance of the RSS parser.
    try {
        // Log a message to the console indicating that the script is starting to fetch.
        // This is useful for monitoring when the cron job runs.
        console.log(`[${new Date().toLocaleString()}] Attempting to fetch RSS feed from: ${url}`);

        // The 'rss-parser' 'parseURL' method handles both the HTTP request (using node-fetch internally)
        // and the XML parsing. It returns a structured JavaScript object.
        const feed = await parser.parseURL(url);

        console.log(`[${new Date().toLocaleString()}] Successfully fetched and parsed feed.`);
        return feed; // Return the JavaScript object representing the parsed feed.
    } catch (error) {
        // If anything goes wrong (e.g., network error, invalid URL, parsing error),
        // log the error message to the console.
        console.error(`[${new Date().toLocaleString()}] Error fetching or parsing RSS feed: ${error.message}`);
        return null; // Return null to indicate that the operation failed.
    }
}

/**
 * Processes the raw feed items (articles) extracted by rss-parser.
 * It selects specific fields (title, link, description, date) and formats them.
 * It also applies the NUM_ARTICLES limit.
 * @param {object} feed - The parsed feed object, which should contain a 'feed.items' array.
 * @returns {Array<object>} An array of neatly structured article objects, ready for saving.
 */
function processFeedItems(feed) {
    const articles = []; // Initialize an empty array to store our processed articles.
    // Check if the feed object exists and if it contains an 'items' array (the news articles).
    if (feed && feed.items) {
        // Loop through the items. Math.min ensures we don't go beyond NUM_ARTICLES or the actual
        // number of items available in the feed.
        for (let i = 0; i < Math.min(feed.items.length, NUM_ARTICLES); i++) {
            const item = feed.items[i]; // Get the current article item from the feed.
            const article = {
                // Extract data from the item. Use '||' (OR operator) for graceful fallback
                // if a field is missing (e.g., if a title isn't provided, use 'No Title').
                title: item.title || 'No Title',
                link: item.link || '#', // Use '#' as a placeholder link if missing
                // rss-parser typically puts the short description/excerpt in 'contentSnippet'.
                // Fallback to 'description' or an empty string if both are missing.
                description: item.contentSnippet || item.description || '',
                published: item.pubDate || new Date().toISOString(), // Raw publication date string
                // Format the date for better display on the frontend.
                // 'toLocaleString()' converts the date object to a human-readable string based on the locale.
                // 'en-US' locale is specified, and options for detailed formatting are given.
                pubDate_formatted: new Date(item.pubDate || new Date()).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',   // e.g., "Jan"
                    day: 'numeric',   // e.g., "01"
                    hour: 'numeric',  // e.g., "3"
                    minute: 'numeric',// e.g., "05"
                    hour12: true      // Use 12-hour clock (AM/PM)
                })
            };
            articles.push(article); // Add the newly created article object to our list.
        }
    }
    console.log(`[${new Date().toLocaleString()}] Processed ${articles.length} articles.`);
    return articles; // Return the array of processed articles.
}

/**
 * Asynchronously saves an array of article objects to a JSON file on the local file system.
 * @param {Array<object>} articles - The array of article objects to be saved.
 * @param {string} filepath - The full path where the JSON file should be saved (e.g., 'static/tennis_news.json').
 */
async function saveNewsToJson(articles, filepath) {
    // Before writing the file, ensure the directory (e.g., 'static') exists.
    // 'recursive: true' means if 'static' also needed a parent folder created, it would do that.
    await fs.mkdir(path.dirname(filepath), { recursive: true });
    try {
        // fs.writeFile writes data to a file.
        // JSON.stringify converts the JavaScript array into a JSON string.
        // null, 4 makes the JSON output 'pretty-printed' (indented by 4 spaces), which is good for readability.
        await fs.writeFile(filepath, JSON.stringify(articles, null, 4), 'utf-8');
        console.log(`[${new Date().toLocaleString()}] Successfully saved ${articles.length} news articles to ${filepath}`);
    } catch (error) {
        // Log any errors that occur during the file writing process.
        console.error(`[${new Date().toLocaleString()}] Error saving JSON file: ${error.message}`);
    }
}

// --- Main Execution Logic ---
// This is the primary function that runs when the script is executed.

/**
 * The main asynchronous function that orchestrates the entire process:
 * 1. Fetches the RSS feed.
 * 2. Processes the individual news items.
 * 3. Saves the processed items into a JSON file.
 */
async function main() {
    console.log(`[${new Date().toLocaleString()}] Starting ESPN Tennis News update process...`);

    // Call the function to fetch and parse the feed. 'await' waits for the Promise to resolve.
    const feed = await fetchAndParseFeed(RSS_FEED_URL);

    // If the feed was successfully fetched (not null), then proceed to process and save.
    if (feed) {
        const articles = processFeedItems(feed); // Process the articles from the feed.
        await saveNewsToJson(articles, OUTPUT_JSON_FILE); // Save the processed articles to the JSON file.
    } else {
        // If fetching failed, log a message indicating no update was performed.
        console.log(`[${new Date().toLocaleString()}] Failed to fetch or parse feed. No update performed.`);
    }
    console.log(`[${new Date().toLocaleString()}] ESPN Tennis News update process finished.`);
}

// This conditional statement ensures that the 'main()' function is called only when
// this script file ('update_tennis_news.js') is executed directly using 'node update_tennis_news.js'.
// It prevents 'main()' from running if this file were to be 'required' (imported) by another script.
if (require.main === module) {
    main();
}