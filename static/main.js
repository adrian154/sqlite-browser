const TRUNCATE_VALUE_LENGTH = 200;

let selectedDb = null,
    selectedDbElement = null,
    selectedDbConsole = null;

const makeRow = query => {
    const row = document.createElement("tr");
    row.classList.add("console-row");
    const prompt = document.createElement("td");
    prompt.textContent = ">";
    const queryCell = document.createElement("td");
    queryCell.textContent = query;
    row.append(prompt, queryCell);
    return row;
};

// elements
const consoleContainer = document.getElementById("console"),
      consoleTemplate = document.getElementById("console-template"),
      dbList = document.getElementById("database-list"),
      placeholder = document.getElementById("placeholder");

const buildTable = rows => {

    // create table
    const table = document.createElement("table");
    table.classList.add("results-table");
    
    // add columns to header
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    for(const col in rows[0]) {
        const th = document.createElement("th");
        th.textContent = col;
        headerRow.append(th);
    }
    thead.append(headerRow);

    // add responses to body
    const tbody = document.createElement("tbody");
    for(const row of rows) {
        const tr = document.createElement("tr");
        for(const col in row) {
            const td = document.createElement("td");
            const value = String(row[col]);
            if(value == null) {
                td.classList.add("changes");
                td.textContent = "null";
            } else if(value.length < TRUNCATE_VALUE_LENGTH) {
                td.textContent = value;
            } else {
                
                const truncatedValue = value.slice(0, TRUNCATE_VALUE_LENGTH) + "\u2026";
                const showMoreText = `show more (${value.length})`;
                const textNode = document.createTextNode(truncatedValue);

                let truncated = true;
                const showFullButton = document.createElement("a");
                showFullButton.classList.add("show-more");
                showFullButton.textContent = showMoreText;
                showFullButton.addEventListener("click", () => {
                    if(truncated = !truncated) {
                        textNode.textContent = truncatedValue;
                        showFullButton.textContent = showMoreText;
                    } else {
                        textNode.textContent = value;
                        showFullButton.textContent = "show less";
                    }
                });

                td.append(textNode, " ", showFullButton);

            }
            tr.append(td);
        }
        tbody.append(tr);
    }

    table.append(thead, tbody);
    return table;

};

fetch("/databases").then(resp => resp.json()).then(databases => {
    
    for(const dbName of databases) {

        // add console
        const dbConsole = consoleTemplate.content.cloneNode(true).querySelector("table");
        dbConsole.style.display = "none";
        consoleContainer.append(dbConsole);

        // remember past queries
        const history = [];
        let historyIndex = 0;

        // console logic
        const input = dbConsole.querySelector("input"), 
              inputRow = dbConsole.querySelector(".input-row");

        dbConsole.querySelector("form").addEventListener("submit", event => {
            
            event.preventDefault();

            const query = input.value;
            if(query.trim().length == 0) {
                return;
            }

            // save history and clear input
            history[0] = input.value;
            history.unshift("");
            historyIndex = 0;
            input.value = "";

            // add row representing the query
            // we do this before actually invoking the query in case an error occurs or the query takes a long time to complete
            dbConsole.querySelector("tbody").insertBefore(makeRow(query), inputRow);
            consoleContainer.scrollTop = consoleContainer.scrollHeight;

            fetch(`/exec?db=${encodeURIComponent(dbName)}&query=${encodeURIComponent(query)}`, {
                method: "POST"
            }).then(resp => resp.json()).then(resp => {

                const row = document.createElement("tr");
                row.classList.add("console-row");
                const empty = document.createElement("td");
                row.append(empty);

                const result = document.createElement("td");
                if(resp.error) {
                    result.classList.add("error");
                    if(resp.code) {
                        const code = document.createElement("b");
                        code.textContent = resp.code;
                        result.append(code, " ");
                    }
                    result.append(resp.error);
                } else if("changes" in resp) {
                    result.classList.add("changes");
                    result.append(`${resp.changes} ${resp.changes == 1 ? "row" : "rows"} changed`);
                } else {
                    if(resp.data.length > 0) {
                        const container = document.createElement("div");
                        container.style.width = "95%";
                        container.style.overflowX = "auto";
                        container.style.maxHeight = "90vh";
                        const table = buildTable(resp.data);
                        container.append(table);
                        result.append(container);
                    } else {
                        result.classList.add("changes");
                        result.append("no rows returned");
                    }
                }

                row.append(result);
                dbConsole.querySelector("tbody").insertBefore(row, inputRow);
                consoleContainer.scrollTop = consoleContainer.scrollHeight;

            });
        });

        // handle history
        input.addEventListener("keydown", event => {

            if(event.key === "ArrowUp" && historyIndex + 1 < history.length) {
                if(historyIndex == 0) {
                    history[0] = input.value;
                }
                historyIndex++;
                input.value = history[historyIndex];
                event.preventDefault();
            } else if(event.key === "ArrowDown" && historyIndex - 1 >= 0) {
                historyIndex--;
                input.value = history[historyIndex];
                event.preventDefault();
            }

        });

        // add database to database list
        const p = document.createElement("p");
        p.textContent = dbName;
        p.addEventListener("click", () => {

            // update db menu
            if(selectedDbElement) {
                selectedDbElement.classList.remove("selected");
            }
            p.classList.add("selected");
            selectedDb = dbName;
            selectedDbElement = p;

            // show console
            if(selectedDbConsole) {
                selectedDbConsole.style.display = "none";
            }
            
            selectedDbConsole = dbConsole;
            dbConsole.style.display = "";
            placeholder.style.display = "none";

        });
        dbList.append(p);

    }

}).catch(err => alert(err.message));