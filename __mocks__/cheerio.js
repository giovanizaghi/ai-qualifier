// Create the cheerio object with load method
const cheerio = {
  load: jest.fn((html) => {
    // Extract title from the HTML for more realistic mocking
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : 'Mock Title';
    
    // Create a function that acts like the $ selector
    const $ = jest.fn((selector) => {
      // Handle element objects (when called with $(elem))
      if (typeof selector === 'object' && selector.textContent) {
        return { text: () => selector.textContent };
      }
      
      if (selector === 'title') {
        return { text: () => title };
      }
      if (selector === 'meta[name="description"]') {
        return { attr: (name) => name === 'content' ? 'Mock description' : undefined };
      }
      if (selector === 'meta[property="og:description"]') {
        return { attr: (name) => name === 'content' ? 'Mock description' : undefined };
      }
      if (selector === 'meta[name="keywords"]') {
        return { attr: (name) => name === 'content' ? 'mock,keywords,test' : undefined };
      }
      if (selector === 'h1, h2, h3') {
        return { 
          each: function(callback) {
            const headings = ['Mock Heading 1', 'Mock Heading 2'];
            headings.forEach((heading, index) => {
              const elem = { textContent: heading };
              callback(index, elem);
            });
          }
        };
      }
      if (selector === 'p, li') {
        return { 
          each: function(callback) {
            const content = ['This is a mock paragraph with sufficient length', 'Another paragraph for testing purposes'];
            content.forEach((text, index) => {
              const elem = { textContent: text };
              callback(index, elem);
            });
          }
        };
      }
      if (selector === 'script, style, nav, footer, header') {
        return { remove: () => $ };
      }
      if (selector === 'script, style, noscript') {
        return { remove: () => $ };
      }
      // Default to main element that has text content
      return { 
        text: () => 'Mock content here with sufficient length to pass validation tests and provide meaningful content for analysis. This is a comprehensive text that should meet all requirements for content validation in our domain scraping functionality.',
        length: 1
      };
    });
    
    // Add methods directly to the $ function
    $.remove = jest.fn(() => $);
    $.text = jest.fn(() => 'Mock content here with sufficient length to pass validation tests and provide meaningful content for analysis. This is a comprehensive text that should meet all requirements for content validation in our domain scraping functionality.');
    
    return $;
  })
};

// Export as both named export (for import * as cheerio) and default export
module.exports = cheerio;
module.exports.default = cheerio;
module.exports.load = cheerio.load;