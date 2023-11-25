const parseDOMToJSON = () => {
    // Extract images
    const images = Array.from(document.querySelectorAll("img")).map(img => ({
        alt: img.alt,
        src: img.src,
        width: img.width,
        height: img.height
    }));

    // Function to extract message content
    const extractMessageContent = (message) => {
        const textContent = Array.from(message.querySelectorAll("p, li, div")).map(element => element.textContent).join(" ");
        const messageImages = Array.from(message.querySelectorAll("img")).map(img => ({
            alt: img.alt,
            src: img.src,
            width: img.width,
            height: img.height
        }));

        return { textContent, messageImages };
    };

    // Extract messages
    const messages = Array.from(document.querySelectorAll("div[data-message-id]")).map(message => ({
        authorRole: message.getAttribute("data-message-author-role"),
        messageId: message.getAttribute("data-message-id"),
        content: extractMessageContent(message)
    }));

    return {
        images,
        messages,
        rawHTML: document.documentElement.outerHTML
    };
}



const downloadJSON = (jsonData) => {
    // Send the JSON data back to the background script for download
    chrome.runtime.sendMessage({ message: "download_json_data", data: jsonData });
};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.message === "parse_dom" || request.message === "trigger_download") {
        const result = parseDOMToJSON();
        sendResponse(result);

        if (request.message === "trigger_download") {
            // Trigger download
            const resultStr = JSON.stringify(result, null, 2);
            const blob = new Blob([resultStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);

            // Creating a temporary link to trigger download
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = "extracted_data.json";
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(url);
        }
    }
});