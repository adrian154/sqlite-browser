let selectedDb = null,
    selectedDbElement = null,
    selectedDbConsole = null;

const makeRow = query => {
    const row = document.createElement("tr");
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

fetch("/databases").then(resp => resp.json()).then(databases => {
    
    for(const dbName of databases) {

        // add console
        const dbConsole = consoleTemplate.content.cloneNode(true).querySelector("table");
        dbConsole.style.display = "none";
        consoleContainer.append(dbConsole);

        // remember past queryes
        const history = [];
        let historyIndex = 0;

        // console logic
        const input = dbConsole.querySelector("input"), 
              inputRow = dbConsole.querySelector(".input-row");

        dbConsole.querySelector("form").addEventListener("submit", event => {
            
            event.preventDefault();

            const query = input.value;

            // save history and clear input
            history[0] = input.value;
            history.unshift("");
            input.value = "";

            // add row representing the query
            // we do this before actually invoking the query in case an error occurs or the query takes a long time to complete
            dbConsole.querySelector("tbody").insertBefore(makeRow(query), inputRow);
            consoleContainer.scrollTop = consoleContainer.scrollHeight;

            fetch(`/exec?db=${encodeURIComponent(dbName)}&query=${encodeURIComponent(query)}`, {
                method: "POST"
            }).then(resp => resp.json()).then(resp => {

                const row = document.createElement("tr");
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
                } else if(resp.changes) {
                    result.classList.add("changes");
                    result.append(`${resp.changes} ${resp.changes == 1 ? "row" : "rows"} changed`);
                } else {
                    console.log(resp);
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