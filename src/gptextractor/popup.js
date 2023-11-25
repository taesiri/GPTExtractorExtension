document.getElementById('parseButton').addEventListener('click', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const activeTab = tabs[0];
      chrome.tabs.sendMessage(activeTab.id, {"message": "parse_dom"}, function(response) {
          const resultStr = JSON.stringify(response, null, 2);
          document.getElementById('result').textContent = resultStr;

          // Create a Blob and generate a URL for it
          const blob = new Blob([resultStr], { type: "application/json" });
          const url = URL.createObjectURL(blob);

          const downloadLink = document.getElementById('downloadLink');
          downloadLink.href = url;
          downloadLink.style.display = 'block';
      });
  });
});
