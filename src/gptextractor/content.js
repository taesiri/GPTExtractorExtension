const parseDOMToJSON = async () => {

    // Helper function to convert image to Base64
    const toBase64 = async (url) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error('Error converting image to Base64:', error);
            return null; // Return null or some default value
        }
    };


    // Extract images with Base64 conversion
    const images = await Promise.all(
        Array.from(document.querySelectorAll("img")).map(async (img) => ({
            alt: img.alt,
            src: await toBase64(img.src),
            width: img.width,
            height: img.height
        }))
    );


    // Function to extract message content
    const extractMessageContent = async (message) => {
        const textContent = Array.from(message.querySelectorAll("p, li, div")).map(element => element.textContent).join(" ");

        const messageImages = await Promise.all(
            Array.from(message.querySelectorAll("img")).map(async (img) => ({
                alt: img.alt,
                src: await toBase64(img.src),  // Convert each image src to Base64
                width: img.width,
                height: img.height
            }))
        );

        return { textContent, messageImages };
    };

    // Extract messages
    const messages = await Promise.all(
        Array.from(document.querySelectorAll("div[data-message-id]")).map(async (message) => ({
            authorRole: message.getAttribute("data-message-author-role"),
            messageId: message.getAttribute("data-message-id"),
            content: await extractMessageContent(message)  // Await the async function
        }))
    );

    return {
        messages,
        rawHTML: document.documentElement.outerHTML
    };
}



const downloadJSON = (jsonData) => {
    // Send the JSON data back to the background script for download
    chrome.runtime.sendMessage({ message: "download_json_data", data: jsonData });
};


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    // Check if the incoming request is to parse DOM or trigger download
    if (request.message === "parse_dom" || request.message === "trigger_download") {
        parseDOMToJSON().then(result => {
            sendResponse(result);

            if (request.message === "trigger_download") {
                // If the message is to trigger download, then process the result for download
                const resultStr = JSON.stringify(result, null, 2);
                const blob = new Blob([resultStr], { type: "application/json" });
                const url = URL.createObjectURL(blob);

                // Create a temporary link to trigger download
                const downloadLink = document.createElement('a');
                downloadLink.href = url;
                downloadLink.download = "extracted_data.json";
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
                URL.revokeObjectURL(url);
            }
        });

        return true; // Indicates an asynchronous response will be sent
    }
});
