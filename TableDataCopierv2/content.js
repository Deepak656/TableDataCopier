// content.js
console.log("Table Data Copier Extension loaded");

let allData = new Set(); // Changed to Set for automatic duplicate handling
let totalRowsCopied = 0;
let processedData = {
    pincodes: {},
    dates: {}
};

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

    // Add analytics buttons
    const analyticsWrapper = document.createElement("div");
    analyticsWrapper.style.cssText = `
        padding: 5px;
        display: flex;
        gap: 5px;
        border-top: 1px solid #eee;
    `;

    const dateButton = document.createElement("button");
    dateButton.id = 'dateButton';
    dateButton.innerHTML = '📅 Date Report';
    dateButton.style.cssText = `
        flex: 1;
        padding: 5px 10px;
        background: #FF9800;
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-size: 12px;
    `;
    dateButton.addEventListener('click', showDateReport);

    const pincodeButton = document.createElement("button");
    pincodeButton.id = 'pincodeButton';
    pincodeButton.innerHTML = '📍 PIN Report';
    pincodeButton.style.cssText = `
        flex: 1;
        padding: 5px 10px;
        background: #9C27B0;
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-size: 12px;
    `;
    pincodeButton.addEventListener('click', showPincodeReport);

    buttonWrapper.appendChild(copyButton);
    buttonWrapper.appendChild(getDataButton);
    buttonWrapper.appendChild(clearButton);
    analyticsWrapper.appendChild(dateButton);
    analyticsWrapper.appendChild(pincodeButton);
    
    buttonContainer.appendChild(buttonWrapper);
    buttonContainer.appendChild(analyticsWrapper);
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

        // Process the data for analytics
        processData();

        showNotification(`✓ Added ${newRowsCount} unique rows (Total: ${totalRowsCopied})`);
    } catch (error) {
        console.error("Error copying data:", error);
        showNotification("Error copying data");
    }
}

function processData() {
    // Reset processed data
    processedData = {
        pincodes: {},
        dates: {}
    };

    // Process each row
    Array.from(allData).forEach(rowString => {
        const row = JSON.parse(rowString);
        const rowText = row.join(' ');
        
        // Extract PIN code (6 digit number in address field)
        const pincodeMatch = rowText.match(/Bihar (\d{6})/);
        if (pincodeMatch && pincodeMatch[1]) {
            const pincode = pincodeMatch[1];
            processedData.pincodes[pincode] = (processedData.pincodes[pincode] || 0) + 1;
        }
        
        // Extract date (format: DD-MMM-YYYY)
        const dateMatch = rowText.match(/(\d{2}-[A-Za-z]{3}-\d{4})/);
        if (dateMatch && dateMatch[1]) {
            const date = dateMatch[1];
            processedData.dates[date] = (processedData.dates[date] || 0) + 1;
        }
    });
    
    console.log("Processed data:", processedData);
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
    processedData = {
        pincodes: {},
        dates: {}
    };
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

function showPincodeReport() {
    if (Object.keys(processedData.pincodes).length === 0) {
        showNotification("No PIN code data available");
        return;
    }
    
    showReport("PIN Code Report", processedData.pincodes, "PIN Code", "Order Count");
}

function showDateReport() {
    if (Object.keys(processedData.dates).length === 0) {
        showNotification("No date data available");
        return;
    }
    
    showReport("Date-wise Order Report", processedData.dates, "Date", "Order Count");
}

function showReport(title, data, col1, col2) {
    // Remove any existing report
    const existingReport = document.getElementById('dataReportPanel');
    if (existingReport) {
        existingReport.remove();
    }
    
    // Create report panel
    const reportPanel = document.createElement("div");
    reportPanel.id = 'dataReportPanel';
    reportPanel.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 10000000;
        background: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        width: 400px;
        max-height: 500px;
        display: flex;
        flex-direction: column;
    `;
    
    // Create header
    const header = document.createElement("div");
    header.style.cssText = `
        padding: 10px;
        background: #2196F3;
        color: white;
        font-weight: bold;
        border-radius: 4px 4px 0 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;
    header.innerHTML = `<span>${title}</span>`;
    
    // Close button
    const closeButton = document.createElement("button");
    closeButton.innerHTML = "×";
    closeButton.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0 5px;
    `;
    closeButton.addEventListener('click', () => reportPanel.remove());
    header.appendChild(closeButton);
    
    // Table container with scrolling
    const tableContainer = document.createElement("div");
    tableContainer.style.cssText = `
        padding: 10px;
        overflow-y: auto;
        max-height: 400px;
    `;
    
    // Create table
    const table = document.createElement("table");
    table.style.cssText = `
        width: 100%;
        border-collapse: collapse;
    `;
    
    // Table header
    const tableHeader = document.createElement("thead");
    tableHeader.innerHTML = `
        <tr>
            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd; background: #f5f5f5;">${col1}</th>
            <th style="padding: 8px; text-align: right; border-bottom: 2px solid #ddd; background: #f5f5f5;">${col2}</th>
        </tr>
    `;
    table.appendChild(tableHeader);
    
    // Table body
    const tableBody = document.createElement("tbody");
    
    // Sort data by count (descending)
    const sortedData = Object.entries(data).sort((a, b) => b[1] - a[1]);
    
    // Add rows
    sortedData.forEach(([key, value]) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">${key}</td>
            <td style="padding: 8px; text-align: right; border-bottom: 1px solid #ddd;">${value}</td>
        `;
        tableBody.appendChild(row);
    });
    
    table.appendChild(tableBody);
    tableContainer.appendChild(table);
    
    // Footer with copy button
    const footer = document.createElement("div");
    footer.style.cssText = `
        padding: 10px;
        border-top: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;
    
    const totalCount = Object.values(data).reduce((sum, count) => sum + count, 0);
    const totalText = document.createElement("div");
    totalText.textContent = `Total: ${totalCount} orders`;
    totalText.style.cssText = `
        font-size: 12px;
        color: #666;
    `;
    
    const copyReportButton = document.createElement("button");
    copyReportButton.textContent = "Copy Report";
    copyReportButton.style.cssText = `
        padding: 5px 10px;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-size: 12px;
    `;
    copyReportButton.addEventListener('click', () => {
        const reportText = sortedData.map(([key, value]) => `${key}\t${value}`).join('\n');
        navigator.clipboard.writeText(reportText).then(() => {
            showNotification("Report copied to clipboard");
        }).catch(err => {
            console.error("Failed to copy report:", err);
            showNotification("Failed to copy report");
        });
    });
    
    footer.appendChild(totalText);
    footer.appendChild(copyReportButton);
    
    // Assemble panel
    reportPanel.appendChild(header);
    reportPanel.appendChild(tableContainer);
    reportPanel.appendChild(footer);
    
    // Add to page
    document.body.appendChild(reportPanel);
    makeDraggable(reportPanel);
}

console.log("Table Data Copier Extension initialized");