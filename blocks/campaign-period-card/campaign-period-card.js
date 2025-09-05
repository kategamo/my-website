/**
 * Campaign Period Card Block
 * Displays campaign duration information in a visually prominent, centered format
 */

/**
 * Formats a date string to Japanese format with day of week
 * @param {string} dateStr - Date string in various formats
 * @returns {string} Formatted Japanese date
 */
function formatJapaneseDate(dateStr) {
  if (!dateStr) return '';
  
  try {
    // Handle various date formats
    let date;
    if (dateStr.includes('年') && dateStr.includes('月')) {
      // Already in Japanese format, return as-is
      return dateStr.trim();
    } else {
      // Parse ISO date or other formats
      date = new Date(dateStr);
    }
    
    if (isNaN(date.getTime())) {
      // If parsing fails, return original string
      return dateStr.trim();
    }
    
    // Format to Japanese with day of week
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
      locale: 'ja-JP'
    };
    
    const formatter = new Intl.DateTimeFormat('ja-JP', options);
    const parts = formatter.formatToParts(date);
    
    // Construct Japanese format: YYYY年MM月DD日（曜日）
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    const weekday = parts.find(p => p.type === 'weekday')?.value;
    
    return `${year}年${month}月${day}日（${weekday}）`;
  } catch (error) {
    console.warn('Date formatting error:', error);
    return dateStr.trim();
  }
}

/**
 * Creates ISO datetime attribute for time element
 * @param {string} startDate - Start date string
 * @param {string} endDate - End date string
 * @returns {string} ISO datetime range
 */
function createDateTimeAttribute(startDate, endDate) {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      return `${start.toISOString().split('T')[0]}/${end.toISOString().split('T')[0]}`;
    }
  } catch (error) {
    console.warn('DateTime attribute creation error:', error);
  }
  return '';
}

/**
 * Parses the block content and extracts campaign period data
 * @param {Element} block - The block element
 * @returns {Object} Parsed campaign data
 */
function parseBlockContent(block) {
  const data = {
    label: '',
    dates: '',
    startDate: '',
    endDate: '',
    linkUrl: '',
    backgroundColor: ''
  };
  
  // Parse table structure from authored content
  const rows = [...block.children];
  
  rows.forEach((row, index) => {

      const value = row.textContent.trim();
      switch (index) {
        case 0:
          data.label = value;
          break;
        case 1:
          data.startDate = value;
          break;
        case 2:
          data.endDate = value;
          break;
        case 3:
          data.linkUrl = value;
          break;
        case 4:
          data.backgroundColor = value;
          break;
      }
    
  });
  
  // If dates field is provided, use it; otherwise construct from start/end dates
  if (data.startDate && data.endDate) {
    const formattedStart = formatJapaneseDate(data.startDate);
    const formattedEnd = formatJapaneseDate(data.endDate);
    data.dates = `${formattedStart}～${formattedEnd}`;
  }
  
  return data;
}

/**
 * Decorates the campaign period card block
 * @param {Element} block - The block element
 */
export default function decorate(block) {
  // Parse the authored content
  const campaignData = parseBlockContent(block);
  
  // Clear the block content
  block.textContent = '';
  
  // Create the card structure
  const container = document.createElement('div');
  container.className = 'campaign-period-card-container';
  
  const content = document.createElement('div');
  content.className = 'campaign-period-card-content';
  
  // Create label element
  if (campaignData.label) {
    const label = document.createElement('div');
    label.className = 'campaign-period-card-label';
    label.innerHTML = `<span>${campaignData.label}</span>`;
    content.appendChild(label);
  }
  
  // Create dates element with semantic time markup
  if (campaignData.dates) {
    const datesDiv = document.createElement('div');
    datesDiv.className = 'campaign-period-card-dates';
    
    const timeElement = document.createElement('time');
    timeElement.textContent = campaignData.dates;
    
    // Add datetime attribute if we can parse the dates
    if (campaignData.startDate && campaignData.endDate) {
      const datetime = createDateTimeAttribute(campaignData.startDate, campaignData.endDate);
      if (datetime) {
        timeElement.setAttribute('datetime', datetime);
      }
    }
    
    datesDiv.appendChild(timeElement);
    content.appendChild(datesDiv);
  }
  
  container.appendChild(content);
  block.appendChild(container);
  
  // Apply custom background color if specified
  if (campaignData.backgroundColor) {
    container.style.setProperty('--card-background', campaignData.backgroundColor);
  }
  
  // Add click handler if link URL is provided
  if (campaignData.linkUrl) {
    block.setAttribute('data-link', campaignData.linkUrl);
    block.style.cursor = 'pointer';
    block.setAttribute('role', 'button');
    block.setAttribute('tabindex', '0');
    
    // Click handler
    const handleClick = () => {
      if (campaignData.linkUrl.startsWith('http') || campaignData.linkUrl.startsWith('//')) {
        window.open(campaignData.linkUrl, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = campaignData.linkUrl;
      }
    };
    
    // Mouse click
    block.addEventListener('click', handleClick);
    
    // Keyboard support
    block.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    });
    
    // Add ARIA label for accessibility
    block.setAttribute('aria-label', `${campaignData.label}: ${campaignData.dates}. クリックして詳細を見る`);
  }
  
  // Add analytics tracking
  if (window.adobeDataLayer) {
    // Track block impression
    window.adobeDataLayer.push({
      event: 'campaign-period-card-view',
      campaignLabel: campaignData.label,
      campaignDates: campaignData.dates
    });
    
    // Track clicks if clickable
    if (campaignData.linkUrl) {
      block.addEventListener('click', () => {
        window.adobeDataLayer.push({
          event: 'campaign-period-card-click',
          campaignLabel: campaignData.label,
          campaignDates: campaignData.dates,
          linkUrl: campaignData.linkUrl
        });
      });
    }
  }
}
