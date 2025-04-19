// background.js
chrome.action.onClicked.addListener(async (tab) => {
  // Execute the content script in the active tab
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: () => {
      // Check if interface exists
      const container = document.getElementById('copyButtonContainer');
      
      if (container) {
        // Toggle visibility if it exists
        if (container.style.display === 'none') {
          container.style.display = 'block';
        } else {
          container.style.display = 'none';
        }
      } else {
        // Call the insertInterface function that's defined in content.js
        if (typeof window.insertInterface === 'function') {
          window.insertInterface();
        } else {
          console.error("insertInterface function not found");
        }
      }
    }
  });
});
