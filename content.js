// content.js
console.log("Table Data Copier Extension loaded");

let allData = new Set(); // Changed to Set for automatic duplicate handling
let totalRowsCopied = 0;

// Make insertInterface globally accessible
window.insertInterface = function() {
    console.log("Inserting interface");
    
    const existingButtons = document.querySelectorAll('#copyButtonContainer');
    existingButtons.forEach(button => button.remove());

    const buttonContainer = document.createElement("div");
    buttonContainer.id = 'copyButtonContainer';
    buttonContainer.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 9999999;
        background: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        width: 200px;
    `;

    const statsDiv = document.createElement("div");
    statsDiv.id = 'statsCounter';
    statsDiv.style.cssText = `
        padding: 5px 10px;
        border-top: 1px solid #eee;
        font-size: 12px;
        color: #666;
        text-align: center;
    `;
    statsDiv.textContent = `Unique Rows: ${allData.size}`;

    const buttonWrapper = document.createElement("div");
    buttonWrapper.style.cssText = `
        padding: 5px;
        display: flex;
        gap: 5px;
    `;

    const copyButton = document.createElement("button");
    copyButton.id = 'copyButton';
    copyButton.innerHTML = '📋 Copy';
    copyButton.style.cssText = `
        flex: 1;
        padding: 5px 10px;
        background: #1976D2;
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-size: 12px;
    `;
    copyButton.addEventListener('click', copyTableData);

    const getDataButton = document.createElement("button");
    getDataButton.id = 'getDataButton';
    getDataButton.innerHTML = '📥 Get Data';
    getDataButton.style.cssText = `
        flex: 1;
        padding: 5px 10px;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-size: 12px;
    `;
    getDataButton.addEventListener('click', getAllData);

    const clearButton = document.createElement("button");
    clearButton.id = 'clearButton';
    clearButton.innerHTML = '🗑️ Clear';
    clearButton.style.cssText = `
        flex: 1;
        padding: 5px 10px;
        background: #f44336;
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-size: 12px;
    `;
    clearButton.addEventListener('click', clearData);

    buttonWrapper.appendChild(copyButton);
    buttonWrapper.appendChild(getDataButton);
    buttonWrapper.appendChild(clearButton);
    buttonContainer.appendChild(buttonWrapper);
    buttonContainer.appendChild(statsDiv);
    
    document.body.appendChild(buttonContainer);
    makeDraggable(buttonContainer);
    
    console.log("Buttons inserted");
};

function makeDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const dragHandle = document.createElement("div");
    dragHandle.style.cssText = `
        padding: 5px;
        cursor: move;
        background: #1565C0;
        color: white;
        font-size: 12px;
        border-radius: 4px 4px 0 0;
        margin-bottom: 5px;
        text-align: center;
    `;
    dragHandle.textContent = "≡ Drag to move";
    
    element.insertBefore(dragHandle, element.firstChild);
    dragHandle.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        // Remove right positioning to allow free movement
        element.style.right = 'auto';
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
        
        // Ensure the element stays within viewport bounds
        const maxX = window.innerWidth - element.offsetWidth;
        const maxY = window.innerHeight - element.offsetHeight;
        
        if (parseInt(element.style.left) < 0) element.style.left = "0px";
        if (parseInt(element.style.top) < 0) element.style.top = "0px";
        if (parseInt(element.style.left) > maxX) element.style.left = maxX + "px";
        if (parseInt(element.style.top) > maxY) element.style.top = maxY + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

function formatCellValue(value) {
    // Check if the value is a number and has more than 15 digits
    if (!isNaN(value) && value.replace(/[^\d]/g, '').length >= 15) {
        return `'${value}`; // Add single quote prefix
    }
    return value;
}

function copyTableData() {
    console.log("Copy function triggered");
    try {
        const rows = document.querySelectorAll("tr.jqgrow");
        console.log("Found rows:", rows.length);

        if (!rows.length) {
            showNotification("No table data found");
            return;
        }

        // Get the maximum number of columns across all rows
        const maxColumns = Math.max(...Array.from(rows).map(row => 
            row.querySelectorAll("td[role='gridcell']").length
        ));

        let newRowsCount = 0;
        const prevSize = allData.size;

        Array.from(rows).forEach(row => {
            const cells = row.querySelectorAll("td[role='gridcell']");
            const rowData = new Array(maxColumns).fill(''); // Initialize with empty strings
            
            Array.from(cells).forEach((cell, index) => {
                if (cell.style.display !== "none") {
                    rowData[index] = formatCellValue(cell.textContent.trim());
                }
            });
            
            // Convert row data to string for Set storage and comparison
            const rowString = JSON.stringify(rowData);
            allData.add(rowString);
        });

        newRowsCount = allData.size - prevSize;
        totalRowsCopied = allData.size;
        
        const statsDiv = document.getElementById('statsCounter');
        if (statsDiv) {
            statsDiv.textContent = `Unique Rows: ${totalRowsCopied}`;
        }

        showNotification(`✓ Added ${newRowsCount} unique rows (Total: ${totalRowsCopied})`);
    } catch (error) {
        console.error("Error copying data:", error);
        showNotification("Error copying data");
    }
}

function getAllData() {
    if (allData.size === 0) {
        showNotification("No data to copy");
        return;
    }

    const formattedData = Array.from(allData)
        .map(rowString => {
            const row = JSON.parse(rowString);
            return row.map(cell => {
                const cleanedCell = (cell || '').toString().trim().replace(/[\n\r]+/g, ' ');
                return cleanedCell;
            }).join("\t");
        })
        .join("\n");

    navigator.clipboard.writeText(formattedData).then(() => {
        showNotification(`✓ ${totalRowsCopied} unique rows copied to clipboard`);
    }).catch(err => {
        console.error("Clipboard write failed:", err);
        showNotification("Failed to copy data");
    });
}

function clearData() {
    allData.clear();
    totalRowsCopied = 0;
    const statsDiv = document.getElementById('statsCounter');
    if (statsDiv) {
        statsDiv.textContent = `Unique Rows: 0`;
    }
    showNotification("Data cleared");
}

function showNotification(message) {
    console.log("Notification:", message);
    const notification = document.createElement("div");
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 10px 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        border-radius: 4px;
        z-index: 10000000;
        font-family: -apple-system, system-ui, sans-serif;
        font-size: 14px;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
}

// Remove the automatic insertion functions that were here before
// setTimeout(forceInsertButtons, 1000);
// setInterval(() => {
//     if (!document.querySelector('#copyButtonContainer')) {
//         forceInsertButtons();
//     }
// }, 5000);

console.log("Table Data Copier Extension initialized");
