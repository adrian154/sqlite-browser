fetch("/databases").then(resp => resp.json()).then(databases => {
    
    // add database list to sidebar

}).catch(err => alert(err.message));